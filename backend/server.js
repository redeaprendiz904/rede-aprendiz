const express = require("express");
const cors = require("cors");
const path = require("path");
const session = require("express-session");
const multer = require("multer");
const fs = require("fs");
const bcrypt = require("bcryptjs");

const app = express();

app.use(cors({
    origin: "http://localhost:3000",
    credentials: true
}));

app.use(express.json());

const sessionSecret = process.env.SESSION_SECRET;

if (!sessionSecret && process.env.NODE_ENV === "production") {
    throw new Error("Defina a variável de ambiente SESSION_SECRET antes de iniciar o servidor em produção.");
}

app.use(session({
    name: "redeaprendiz.sid",
    secret: sessionSecret || "rede-aprendiz-dev-secret-altere-isto",
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 1000 * 60 * 60 * 8
    }
}));

// SERVIR ARQUIVOS DO FRONTEND
app.use(express.static(path.join(__dirname, "../frontend")));

// ROTA PRINCIPAL
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// CONEXÃO COM BANCO
const db = require("./config/db");

const pastaFotos = path.join(__dirname, "uploads", "perfis");

fs.mkdirSync(pastaFotos, { recursive: true });

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const armazenamentoFotos = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, pastaFotos);
    },
    filename: (req, file, cb) => {
        const extensoesPermitidas = {
            "image/jpeg": ".jpg",
            "image/png": ".png",
            "image/webp": ".webp"
        };

        const extensao = extensoesPermitidas[file.mimetype];

        cb(null, `usuario-${req.session.usuario.id}-${Date.now()}${extensao}`);
    }
});

const uploadFoto = multer({
    storage: armazenamentoFotos,
    limits: {
        fileSize: 2 * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
        const tiposPermitidos = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        if (tiposPermitidos.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Envie uma foto JPG, PNG ou WEBP."));
        }
    }
});

// CADASTRO DE ESTUDANTE
app.post("/cadastro", async (req, res) => {
    let { nome, email, telefone, senha } = req.body || {};

    if (![nome, email, telefone, senha].every((valor) => typeof valor === "string")) {
        return res.status(400).json({ erro: "Preencha nome, e-mail, telefone e senha." });
    }

    nome = nome.trim();
    email = email.trim().toLowerCase();
    telefone = telefone.trim();

    if (!nome || nome.length > 100) {
        return res.status(400).json({ erro: "O nome é obrigatório e deve ter até 100 caracteres." });
    }
    if (email.length > 150 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ erro: "Informe um e-mail válido." });
    }
    if (!telefone || telefone.length > 20) {
        return res.status(400).json({ erro: "Informe um telefone válido com até 20 caracteres." });
    }
    if (senha.length < 8 || senha.length > 72) {
        return res.status(400).json({ erro: "A senha deve ter entre 8 e 72 caracteres." });
    }

    try {
        const senhaHash = await bcrypt.hash(senha, 12);

        db.query(
            "INSERT INTO usuarios (nome, email, telefone, senha) VALUES (?, ?, ?, ?)",
            [nome, email, telefone, senhaHash],
            (err) => {
                if (err) {
                    if (err.code === "ER_DUP_ENTRY") {
                        return res.status(409).json({ erro: "Já existe uma conta com esse e-mail." });
                    }

                    console.error("Erro ao cadastrar estudante:", err);
                    return res.status(500).json({ erro: "Não foi possível realizar o cadastro." });
                }

                return res.status(201).json({ mensagem: "Cadastro realizado com sucesso!" });
            }
        );
    } catch (erro) {
        console.error("Erro ao proteger senha do estudante:", erro);
        return res.status(500).json({ erro: "Não foi possível realizar o cadastro." });
    }
});

// LOGIN DE ESTUDANTE
app.post("/login", (req, res) => {
    let { email, senha } = req.body || {};

    if (typeof email !== "string" || typeof senha !== "string" || !email.trim() || !senha) {
        return res.status(400).json({ erro: "Informe o e-mail e a senha." });
    }

    email = email.trim().toLowerCase();

    db.query(
        "SELECT id, nome, email, senha FROM usuarios WHERE email = ? LIMIT 1",
        [email],
        async (err, resultado) => {
            if (err) {
                console.error("Erro no login do estudante:", err);
                return res.status(500).json({ erro: "Não foi possível realizar o login." });
            }

            if (resultado.length === 0) {
                return res.status(401).json({ erro: "E-mail ou senha incorretos." });
            }

            const usuario = resultado[0];
            let senhaCorreta = false;
            const senhaArmazenada = String(usuario.senha || "");
            const pareceHashBcrypt = /^\$2[aby]\$\d{2}\$/.test(senhaArmazenada);

            try {
                if (pareceHashBcrypt) {
                    senhaCorreta = await bcrypt.compare(senha, senhaArmazenada);
                } else {
                    // Compatibilidade temporária com contas antigas que tinham senha em texto puro.
                    senhaCorreta = senha === senhaArmazenada;

                    if (senhaCorreta) {
                        const novoHash = await bcrypt.hash(senha, 12);

                        db.query(
                            "UPDATE usuarios SET senha = ? WHERE id = ?",
                            [novoHash, usuario.id],
                            (erroAtualizacao) => {
                                if (erroAtualizacao) {
                                    console.error("Não foi possível atualizar o hash da senha:", erroAtualizacao);
                                }
                            }
                        );
                    }
                }
            } catch (erroSenha) {
                console.error("Erro ao verificar senha do estudante:", erroSenha);
                return res.status(500).json({ erro: "Não foi possível realizar o login." });
            }

            if (!senhaCorreta) {
                return res.status(401).json({ erro: "E-mail ou senha incorretos." });
            }

            req.session.regenerate((erroSessao) => {
                if (erroSessao) {
                    console.error("Erro ao renovar sessão do estudante:", erroSessao);
                    return res.status(500).json({ erro: "Não foi possível iniciar a sessão." });
                }

                req.session.usuario = {
                    id: usuario.id,
                    nome: usuario.nome
                };

                req.session.save((erroSalvar) => {
                    if (erroSalvar) {
                        console.error("Erro ao salvar sessão do estudante:", erroSalvar);
                        return res.status(500).json({ erro: "Não foi possível iniciar a sessão." });
                    }

                    return res.json({
                        mensagem: "Login realizado com sucesso!",
                        usuario: req.session.usuario
                    });
                });
            });
        }
    );
});


// LOGIN DE ADMINISTRADOR 
app.post("/login-admin", (req, res) => {
    let { email, senha } = req.body || {};

    if (
        typeof email !== "string" ||
        typeof senha !== "string" ||
        !email.trim() ||
        !senha
    ) {
        return res.status(400).json({
            erro: "Informe o e-mail e a senha."
        });
    }

    email = email.trim().toLowerCase();

    db.query(
        "SELECT id, nome, email, senha FROM administradores WHERE email = ? LIMIT 1",
        [email],
        async (err, resultado) => {
            if (err) {
                console.error("Erro no login do administrador:", err);
                return res.status(500).json({
                    erro: "Não foi possível realizar o login."
                });
            }

            if (resultado.length === 0) {
                return res.status(401).json({
                    erro: "E-mail ou senha incorretos."
                });
            }

            const administrador = resultado[0];
            let senhaCorreta = false;

            try {
                senhaCorreta = await bcrypt.compare(
                    senha,
                    administrador.senha
                );
            } catch (erroSenha) {
                console.error(
                    "Erro ao verificar senha do administrador:",
                    erroSenha
                );

                return res.status(500).json({
                    erro: "Não foi possível realizar o login."
                });
            }

            if (!senhaCorreta) {
                return res.status(401).json({
                    erro: "E-mail ou senha incorretos."
                });
            }

            req.session.regenerate((erroSessao) => {
                if (erroSessao) {
                    console.error(
                        "Erro ao renovar sessão administrativa:",
                        erroSessao
                    );

                    return res.status(500).json({
                        erro: "Não foi possível iniciar a sessão."
                    });
                }

                req.session.administrador = {
                    id: administrador.id,
                    nome: administrador.nome,
                    email: administrador.email
                };

                req.session.save((erroSalvar) => {
                    if (erroSalvar) {
                        console.error(
                            "Erro ao salvar sessão administrativa:",
                            erroSalvar
                        );

                        return res.status(500).json({
                            erro: "Não foi possível iniciar a sessão."
                        });
                    }

                    return res.json({
                        mensagem: "Login administrativo realizado com sucesso!",
                        administrador: req.session.administrador
                    });
                });
            });
        }
    );
});


// USUÁRIO LOGADO
app.get("/usuario", (req, res) => {
    if (!req.session.usuario) {
        return res.status(401).send("Não autorizado");
    }

    res.json(req.session.usuario);
});

// LOGOUT
app.post("/logout", (req, res) => {
    if (!req.session) {
        return res.redirect("/html/login.html");
    }

    req.session.destroy((erro) => {
        if (erro) {
            console.error("Erro ao encerrar sessão:", erro);
            return res.status(500).send("Não foi possível sair da conta.");
        }

        res.clearCookie("redeaprendiz.sid");
        return res.redirect("/html/login.html");
    });
});

// MIDDLEWARES DE AUTENTICAÇÃO
function verificarLogin(req, res, next) {
    if (!req.session.usuario) {
        return res.redirect("/html/login.html");
    }

    next();
}

function verificarLoginEmpresa(req, res, next) {
    if (!req.session.empresa) {
        return res.status(401).json({
            erro: "Você precisa entrar com uma conta empresarial."
        });
    }

    next();
}


function verificarLoginAdmin(req, res, next) {
    if (!req.session || !req.session.administrador) {
        return res.redirect("/html/login-admin.html");
    }

    next();
}

// ÁREA EXCLUSIVA DA EMPRESA
app.get("/area-empresa", (req, res) => {
    if (!req.session || !req.session.empresa) {
        return res.redirect("/html/login-empresa.html");
    }

    return res.sendFile(
        path.join(__dirname, "../frontend/html/area-empresa.html")
    );
});
app.get("/admin/estudantes", verificarLoginAdmin, (req, res) => {
    const sql = `
        SELECT id, nome, email, telefone
        FROM usuarios
        ORDER BY nome ASC
    `;

    db.query(sql, (erro, resultados) => {
        if (erro) {
            console.error("Erro ao listar estudantes:", erro);
            return res.status(500).json({
                erro: "Não foi possível carregar os estudantes."
            });
        }

        return res.json(resultados);
    });
});

app.get("/admin/empresas", verificarLoginAdmin, (req, res) => {
    const sql = `
        SELECT id, nome, descricao, categoria, email
        FROM empresas
        ORDER BY nome ASC
    `;

    db.query(sql, (erro, resultados) => {
        if (erro) {
            console.error("Erro ao listar empresas:", erro);

            return res.status(500).json({
                erro: "Não foi possível carregar as empresas."
            });
        }

        return res.json(resultados);
    });
});


app.get("/admin/vagas", verificarLoginAdmin, (req, res) => {
    const sql = `
        SELECT
            id,
            titulo,
            empresa,
            empresa_id,
            turno,
            descricao,
            requisitos,
            salario
        FROM vagas
        ORDER BY id DESC
    `;

    db.query(sql, (erro, resultados) => {
        if (erro) {
            console.error("Erro ao listar vagas:", erro);

            return res.status(500).json({
                erro: "Não foi possível carregar as vagas."
            });
        }

        return res.json(resultados);
    });
});


app.delete(
    "/admin/estudantes/:id",
    verificarLoginAdmin,
    (req, res) => {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                erro: "ID de estudante inválido."
            });
        }

        db.beginTransaction((erro) => {
            if (erro) {
                console.error("Erro ao iniciar transação:", erro);
                return res.status(500).json({
                    erro: "Não foi possível iniciar a exclusão."
                });
            }

            const executarExclusao = (sql, callback) => {
                db.query(sql, [id], (erroConsulta) => {
                    if (erroConsulta) {
                        return db.rollback(() => {
                            console.error("Erro durante exclusão:", erroConsulta);
                            res.status(500).json({
                                erro: "Não foi possível excluir os dados vinculados ao estudante."
                            });
                        });
                    }

                    callback();
                });
            };

            executarExclusao(
                "DELETE FROM candidaturas WHERE usuario_id = ?",
                () => {
                    executarExclusao(
                        "DELETE FROM perfil WHERE usuario_id = ?",
                        () => {
                            db.query(
                                "DELETE FROM usuarios WHERE id = ?",
                                [id],
                                (erroUsuario, resultado) => {
                                    if (erroUsuario || resultado.affectedRows === 0) {
                                        return db.rollback(() => {
                                            if (erroUsuario) {
                                                console.error(
                                                    "Erro ao excluir estudante:",
                                                    erroUsuario
                                                );
                                            }

                                            res.status(
                                                erroUsuario ? 500 : 404
                                            ).json({
                                                erro: erroUsuario
                                                    ? "Não foi possível excluir o estudante."
                                                    : "Estudante não encontrado."
                                            });
                                        });
                                    }

                                    db.commit((erroCommit) => {
                                        if (erroCommit) {
                                            return db.rollback(() => {
                                                console.error(
                                                    "Erro ao confirmar exclusão:",
                                                    erroCommit
                                                );
                                                res.status(500).json({
                                                    erro: "Não foi possível concluir a exclusão."
                                                });
                                            });
                                        }

                                        res.json({
                                            mensagem: "Estudante, perfil e candidaturas vinculadas excluídos com sucesso."
                                        });
                                    });
                                }
                            );
                        }
                    );
                }
            );
        });
    }
);


app.delete(
    "/admin/empresas/:id",
    verificarLoginAdmin,
    (req, res) => {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                erro: "ID de empresa inválido."
            });
        }

        db.beginTransaction((erro) => {
            if (erro) {
                console.error("Erro ao iniciar transação:", erro);

                return res.status(500).json({
                    erro: "Não foi possível iniciar a exclusão."
                });
            }

            
            db.query(
                "SELECT id FROM empresas WHERE id = ?",
                [id],
                (erroConsulta, empresas) => {
                    if (erroConsulta) {
                        return db.rollback(() => {
                            console.error(
                                "Erro ao consultar empresa:",
                                erroConsulta
                            );

                            res.status(500).json({
                                erro: "Não foi possível consultar a empresa."
                            });
                        });
                    }

                    if (empresas.length === 0) {
                        return db.rollback(() => {
                            res.status(404).json({
                                erro: "Empresa não encontrada."
                            });
                        });
                    }

                    // Exclui candidaturas das vagas vinculadas à empresa.
                    db.query(
                        `DELETE FROM candidaturas
                         WHERE vaga_id IN (
                             SELECT id FROM vagas WHERE empresa_id = ?
                         )`,
                        [id],
                        (erroCandidaturas, resultadoCandidaturas) => {
                            if (erroCandidaturas) {
                                return db.rollback(() => {
                                    console.error(
                                        "Erro ao excluir candidaturas:",
                                        erroCandidaturas
                                    );

                                    res.status(500).json({
                                        erro: "Não foi possível excluir as candidaturas vinculadas."
                                    });
                                });
                            }

                            // Depois, exclui as vagas da empresa.
                            db.query(
                                "DELETE FROM vagas WHERE empresa_id = ?",
                                [id],
                                (erroVagas, resultadoVagas) => {
                                    if (erroVagas) {
                                        return db.rollback(() => {
                                            console.error(
                                                "Erro ao excluir vagas:",
                                                erroVagas
                                            );

                                            res.status(500).json({
                                                erro: "Não foi possível excluir as vagas vinculadas."
                                            });
                                        });
                                    }

                                    // Por último, exclui a empresa.
                                    db.query(
                                        "DELETE FROM empresas WHERE id = ?",
                                        [id],
                                        (erroEmpresa, resultadoEmpresa) => {
                                            if (
                                                erroEmpresa ||
                                                resultadoEmpresa.affectedRows === 0
                                            ) {
                                                return db.rollback(() => {
                                                    if (erroEmpresa) {
                                                        console.error(
                                                            "Erro ao excluir empresa:",
                                                            erroEmpresa
                                                        );
                                                    }

                                                    res.status(
                                                        erroEmpresa ? 500 : 404
                                                    ).json({
                                                        erro: erroEmpresa
                                                            ? "Não foi possível excluir a empresa."
                                                            : "Empresa não encontrada."
                                                    });
                                                });
                                            }

                                            db.commit((erroCommit) => {
                                                if (erroCommit) {
                                                    return db.rollback(() => {
                                                        console.error(
                                                            "Erro ao confirmar exclusão:",
                                                            erroCommit
                                                        );

                                                        res.status(500).json({
                                                            erro: "Não foi possível concluir a exclusão."
                                                        });
                                                    });
                                                }

                                                return res.json({
                                                    mensagem:
                                                        "Empresa, vagas e candidaturas vinculadas excluídas com sucesso.",
                                                    vagasExcluidas:
                                                        resultadoVagas.affectedRows,
                                                    candidaturasExcluidas:
                                                        resultadoCandidaturas.affectedRows
                                                });
                                            });
                                        }
                                    );
                                }
                            );
                        }
                    );
                }
            );
        });
    }
);


app.delete(
    "/admin/vagas/:id",
    verificarLoginAdmin,
    (req, res) => {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                erro: "ID de vaga inválido."
            });
        }

        db.beginTransaction((erro) => {
            if (erro) {
                console.error("Erro ao iniciar transação:", erro);

                return res.status(500).json({
                    erro: "Não foi possível iniciar a exclusão."
                });
            }

            // Verifica se a vaga existe.
            db.query(
                "SELECT id FROM vagas WHERE id = ?",
                [id],
                (erroConsulta, vagas) => {
                    if (erroConsulta) {
                        return db.rollback(() => {
                            console.error(
                                "Erro ao consultar vaga:",
                                erroConsulta
                            );

                            res.status(500).json({
                                erro: "Não foi possível consultar a vaga."
                            });
                        });
                    }

                    if (vagas.length === 0) {
                        return db.rollback(() => {
                            res.status(404).json({
                                erro: "Vaga não encontrada."
                            });
                        });
                    }

                    // Exclui primeiro as candidaturas vinculadas.
                    db.query(
                        "DELETE FROM candidaturas WHERE vaga_id = ?",
                        [id],
                        (erroCandidaturas, resultadoCandidaturas) => {
                            if (erroCandidaturas) {
                                return db.rollback(() => {
                                    console.error(
                                        "Erro ao excluir candidaturas:",
                                        erroCandidaturas
                                    );

                                    res.status(500).json({
                                        erro: "Não foi possível excluir as candidaturas vinculadas."
                                    });
                                });
                            }

                            // Depois exclui a vaga.
                            db.query(
                                "DELETE FROM vagas WHERE id = ?",
                                [id],
                                (erroVaga, resultadoVaga) => {
                                    if (
                                        erroVaga ||
                                        resultadoVaga.affectedRows === 0
                                    ) {
                                        return db.rollback(() => {
                                            if (erroVaga) {
                                                console.error(
                                                    "Erro ao excluir vaga:",
                                                    erroVaga
                                                );
                                            }

                                            res.status(
                                                erroVaga ? 500 : 404
                                            ).json({
                                                erro: erroVaga
                                                    ? "Não foi possível excluir a vaga."
                                                    : "Vaga não encontrada."
                                            });
                                        });
                                    }

                                    // Confirma as exclusões.
                                    db.commit((erroCommit) => {
                                        if (erroCommit) {
                                            return db.rollback(() => {
                                                console.error(
                                                    "Erro ao confirmar exclusão:",
                                                    erroCommit
                                                );

                                                res.status(500).json({
                                                    erro: "Não foi possível concluir a exclusão."
                                                });
                                            });
                                        }

                                        return res.json({
                                            mensagem:
                                                "Vaga e candidaturas vinculadas excluídas com sucesso.",
                                            candidaturasExcluidas:
                                                resultadoCandidaturas.affectedRows
                                        });
                                    });
                                }
                            );
                        }
                    );
                }
            );
        });
    }
);


// SAIR DA CONTA EMPRESARIAL 
app.post("/logout-empresa", (req, res) => {
    req.session.destroy((erro) => {
        if (erro) {
            console.error("Erro ao sair da conta empresarial:", erro);

            return res.status(500).json({
                erro: "Não foi possível sair da conta."
            });
        }

        res.clearCookie("redeaprendiz.sid");

        return res.json({
            mensagem: "Logout empresarial realizado com sucesso."
        });
    });
});

// SAIR DA CONTA ADMINISTRATIVA
app.post("/logout-admin", (req, res) => {
    if (!req.session) {
        res.clearCookie("redeaprendiz.sid");
        return res.json({ mensagem: "Sessão administrativa encerrada." });
    }

    req.session.destroy((erro) => {
        if (erro) {
            console.error("Erro ao encerrar sessão administrativa:", erro);
            return res.status(500).json({
                erro: "Não foi possível sair da conta administrativa."
            });
        }

        res.clearCookie("redeaprendiz.sid");

        return res.json({
            mensagem: "Logout administrativo realizado com sucesso."
        });
    });
});


// ROTAS DE PÁGINAS
app.get("/dashboard", verificarLogin, (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/html/dashboard.html"));
});

app.get("/empresas", verificarLogin, (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/html/empresas.html"));
});

app.get("/perfil", verificarLogin, (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/html/perfil.html"));
});

app.get("/oportunidades", verificarLogin, (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/html/vagas.html"));
});


 // LISTAR E FILTRAR VAGAS PÚBLICAS

app.get("/vagas", (req, res) => {
    const { regiao, estado, cidade } = req.query;

    let sql = `
        SELECT
            id,
            titulo,
            empresa,
            tipo_contrato AS tipo_contrato,
            turno,
            descricao,
            requisitos,
            salario,
            empresa_id,
            regiao,
            estado,
            cidade
        FROM vagas
        WHERE 1 = 1
    `;

    const parametros = [];

    // Filtrar por região
    if (typeof regiao === "string" && regiao.trim()) {
        sql += " AND regiao = ?";
        parametros.push(regiao.trim());
    }

    // Filtrar por estado
    if (typeof estado === "string" && estado.trim()) {
        sql += " AND estado = ?";
        parametros.push(estado.trim().toUpperCase());
    }

    // Filtrar por cidade
    if (typeof cidade === "string" && cidade.trim()) {
        sql += " AND cidade LIKE ?";
        parametros.push(`%${cidade.trim()}%`);
    }

    sql += " ORDER BY id DESC";

    db.query(sql, parametros, (err, resultado) => {
        if (err) {
            console.error("Erro ao listar vagas:", err);

            return res.status(500).json({
                erro: "Erro ao listar vagas."
            });
        }

        return res.json(resultado);
    });
});

// LISTAR CANDIDATURAS DO USUÁRIO LOGADO
app.get("/minhas-candidaturas", (req, res) => {
    if (!req.session.usuario) {
        return res.status(401).json({
            erro: "Você precisa estar logado."
        });
    }

    const sql = `
        SELECT vaga_id
        FROM candidaturas
        WHERE usuario_id = ?
    `;

    db.query(sql, [req.session.usuario.id], (err, resultados) => {
        if (err) {
            console.error("Erro ao buscar candidaturas:", err);
            return res.status(500).json({
                erro: "Não foi possível carregar as candidaturas."
            });
        }

        res.json(resultados);
    });
});
// CRIAR PERFIL
app.post("/perfil", (req, res) => {
    if (!req.session.usuario) {
        return res.status(401).json({
            erro: "Você precisa estar logado."
        });
    }

    const {
        nome,
        idade,
        telefone,
        escola,
        serie,
        turno,
        horario,
        area_interesse,
        cursos_concluidos,
        horas_estudo
    } = req.body;

    const usuario_id = req.session.usuario.id;

    const dados = [
        nome || null,
        idade || null,
        telefone || null,
        escola || null,
        serie || null,
        turno || null,
        horario || null,
        area_interesse || null,
        cursos_concluidos ?? 0,
        horas_estudo ?? 0
    ];

    const sqlBuscar = `
        SELECT id
        FROM perfil
        WHERE usuario_id = ?
        ORDER BY id DESC
        LIMIT 1
    `;

    db.query(sqlBuscar, [usuario_id], (err, resultado) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                erro: "Erro ao consultar perfil."
            });
        }

        if (resultado.length > 0) {
            const perfil_id = resultado[0].id;

            const sqlAtualizar = `
                UPDATE perfil
                SET nome = ?,
                    idade = ?,
                    telefone = ?,
                    escola = ?,
                    serie = ?,
                    turno = ?,
                    horario = ?,
                    area_interesse = ?,
                    cursos_concluidos = ?,
                    horas_estudo = ?
                WHERE id = ? AND usuario_id = ?
            `;

            db.query(
                sqlAtualizar,
                [...dados, perfil_id, usuario_id],
                (err) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).json({
                            erro: "Erro ao atualizar perfil."
                        });
                    }

                    res.json({
                        mensagem: "Perfil atualizado com sucesso!"
                    });
                }
            );
        } else {
            const sqlInserir = `
                INSERT INTO perfil (
                    usuario_id,
                    nome,
                    idade,
                    telefone,
                    escola,
                    serie,
                    turno,
                    horario,
                    area_interesse,
                    cursos_concluidos,
                    horas_estudo
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            db.query(
                sqlInserir,
                [usuario_id, ...dados],
                (err) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).json({
                            erro: "Erro ao salvar perfil."
                        });
                    }

                    res.json({
                        mensagem: "Perfil salvo com sucesso!"
                    });
                }
            );
        }
    });
});

// ENVIAR E SALVAR FOTO DO PERFIL
app.post("/perfil/foto", (req, res) => {
    if (!req.session.usuario) {
        return res.status(401).json({
            erro: "Você precisa estar logado para alterar a foto."
        });
    }

    uploadFoto.single("foto")(req, res, async (erro) => {
        if (erro) {
            return res.status(400).json({
                erro: erro.message || "Não foi possível enviar a foto."
            });
        }

        if (!req.file) {
            return res.status(400).json({
                erro: "Selecione uma foto antes de enviar."
            });
        }

        const usuarioId = req.session.usuario.id;
        const caminhoFoto = `/uploads/perfis/${req.file.filename}`;

        try {
            const [resultado] = await db.promise().execute(
                `UPDATE perfil
                 SET foto_perfil = ?
                 WHERE usuario_id = ?`,
                [caminhoFoto, usuarioId]
            );

            if (resultado.affectedRows === 0) {
                fs.unlink(req.file.path, () => {});

                return res.status(404).json({
                    erro: "Perfil não encontrado. Salve seus dados antes de alterar a foto."
                });
            }

            return res.json({
                mensagem: "Foto atualizada com sucesso!",
                foto_perfil: caminhoFoto
            });
        } catch (erroBanco) {
            console.error("Erro ao salvar foto:", erroBanco);
            fs.unlink(req.file.path, () => {});

            return res.status(500).json({
                erro: "Erro ao salvar a foto no banco de dados."
            });
        }
    });
});

// BUSCAR DADOS DO PERFIL
app.get("/perfil/dados", (req, res) => {
    if (!req.session.usuario) {
        return res.status(401).json({
            erro: "Você precisa estar logado."
        });
    }

    const sql = `
        SELECT nome, idade, telefone, escola, serie, turno,
               horario, area_interesse, cursos_concluidos,
               horas_estudo, habilidades, sobre_mim, foto_perfil
        FROM perfil
        WHERE usuario_id = ?
        ORDER BY id DESC
        LIMIT 1
    `;

    db.query(sql, [req.session.usuario.id], (err, resultado) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                erro: "Erro ao carregar perfil."
            });
        }

        res.json({
            perfil: resultado.length > 0 ? resultado[0] : null
        });
    });
});

// CANDIDATAR-SE A UMA VAGA
app.post("/candidatar", (req, res) => {
    if (!req.session.usuario) {
        return res.status(401).json({
            erro: "Você precisa estar logado."
        });
    }

    const vagaId = Number(req.body.vaga_id);
    const usuarioId = req.session.usuario.id;

    if (!Number.isInteger(vagaId) || vagaId <= 0) {
        return res.status(400).json({
            erro: "ID da vaga inválido."
        });
    }

    db.query(
        "SELECT id FROM vagas WHERE id = ?",
        [vagaId],
        (err, vagas) => {
            if (err) {
                console.error("Erro ao verificar vaga:", err);
                return res.status(500).json({
                    erro: "Erro ao verificar a vaga."
                });
            }

            if (vagas.length === 0) {
                return res.status(404).json({
                    erro: "Essa vaga não existe."
                });
            }

            db.query(
                `SELECT id
                 FROM candidaturas
                 WHERE usuario_id = ? AND vaga_id = ?
                 LIMIT 1`,
                [usuarioId, vagaId],
                (err, candidaturas) => {
                    if (err) {
                        console.error("Erro ao verificar candidatura:", err);
                        return res.status(500).json({
                            erro: "Erro ao verificar sua candidatura."
                        });
                    }

                    if (candidaturas.length > 0) {
                        return res.status(409).json({
                            erro: "Você já se candidatou a esta vaga."
                        });
                    }

                    db.query(
                        `INSERT INTO candidaturas (usuario_id, vaga_id)
                         VALUES (?, ?)`,
                        [usuarioId, vagaId],
                        (err) => {
                            if (err) {
                                console.error("Erro ao candidatar:", err);
                                return res.status(500).json({
                                    erro: "Não foi possível registrar a candidatura."
                                });
                            }

                            return res.status(201).json({
                                mensagem: "Candidatura realizada com sucesso!"
                            });
                        }
                    );
                }
            );
        }
    );
});

// DADOS DO GRÁFICO DE PERFORMANCE
app.get("/dashboard/dados", (req, res) => {
    if (!req.session.usuario) {
        return res.status(401).json({
            erro: "Não autorizado"
        });
    }

    const sql = `
        SELECT cursos_concluidos, horas_estudo
        FROM perfil
        WHERE usuario_id = ?
        ORDER BY id DESC
        LIMIT 1
    `;

    db.query(sql, [req.session.usuario.id], (err, resultado) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                erro: "Erro ao carregar dados do dashboard."
            });
        }

        res.json(resultado.length > 0 ? resultado[0] : {
            cursos_concluidos: 0,
            horas_estudo: 0
        });
    });
});

// RESUMO DO DASHBOARD
app.get("/dashboard/resumo", (req, res) => {
    if (!req.session.usuario) {
        return res.status(401).json({
            erro: "Você precisa estar logado."
        });
    }

    const usuarioId = req.session.usuario.id;

    const sql = `
        SELECT
            (SELECT COUNT(*)
             FROM vagas) AS total_vagas,

            (SELECT COUNT(*)
             FROM candidaturas
             WHERE usuario_id = ?) AS total_inscricoes,

            (SELECT COUNT(DISTINCT v.empresa_id)
             FROM vagas v
             INNER JOIN empresas e ON e.id = v.empresa_id)
             AS empresas_com_vagas,

            (SELECT cursos_concluidos
             FROM perfil
             WHERE usuario_id = ?
             ORDER BY id DESC
             LIMIT 1) AS cursos_concluidos,

            (SELECT horas_estudo
             FROM perfil
             WHERE usuario_id = ?
             ORDER BY id DESC
             LIMIT 1) AS horas_estudo
    `;

    db.query(sql, [usuarioId, usuarioId, usuarioId], (err, resultado) => {
        if (err) {
            console.error("Erro no resumo do dashboard:", err);

            return res.status(500).json({
                erro: "Não foi possível carregar o dashboard."
            });
        }

        res.json({
            ...resultado[0],
            cursos_concluidos: resultado[0].cursos_concluidos ?? 0,
            horas_estudo: resultado[0].horas_estudo ?? 0
        });
    });
});


 // CADASTRAR EMPRESA
app.post("/empresas", async (req, res) => {
    let {
        nome,
        descricao,
        categoria,
        regiao,
        estado,
        cidade,
        email,
        senha
    } = req.body || {};

    // Validar os campos como textos
    if (
        ![nome, descricao, categoria, regiao, estado, cidade, email, senha]
            .every((valor) => typeof valor === "string")
    ) {
        return res.status(400).json({
            erro: "Preencha todos os campos corretamente."
        });
    }

    // Limpar espaços e padronizar o e-mail
    nome = nome.trim();
    descricao = descricao.trim();
    categoria = categoria.trim();
    regiao = regiao.trim();
    estado = estado.trim().toUpperCase();
    cidade = cidade.trim();
    email = email.trim().toLowerCase();

    // Validar campos principais
    if (
        !nome || nome.length > 100 ||
        !descricao || descricao.length > 1000 ||
        !categoria || categoria.length > 50 ||
        !regiao || regiao.length > 30 ||
        !estado || !cidade || cidade.length > 100
    ) {
        return res.status(400).json({
            erro: "Confira os campos e a localização informada."
        });
    }

    // Validar região e estado
    const regioesPorEstado = {
        AC: "Norte",
        AP: "Norte",
        AM: "Norte",
        PA: "Norte",
        RO: "Norte",
        RR: "Norte",
        TO: "Norte",

        AL: "Nordeste",
        BA: "Nordeste",
        CE: "Nordeste",
        MA: "Nordeste",
        PB: "Nordeste",
        PE: "Nordeste",
        PI: "Nordeste",
        RN: "Nordeste",
        SE: "Nordeste",

        DF: "Centro-Oeste",
        GO: "Centro-Oeste",
        MT: "Centro-Oeste",
        MS: "Centro-Oeste",

        ES: "Sudeste",
        MG: "Sudeste",
        RJ: "Sudeste",
        SP: "Sudeste",

        PR: "Sul",
        RS: "Sul",
        SC: "Sul"
    };

    if (!/^[A-Z]{2}$/.test(estado) || !regioesPorEstado[estado]) {
        return res.status(400).json({
            erro: "Selecione um estado brasileiro válido."
        });
    }

    if (regioesPorEstado[estado] !== regiao) {
        return res.status(400).json({
            erro: "A região selecionada não corresponde ao estado."
        });
    }

    // Validar e-mail
    if (
        email.length > 100 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
        return res.status(400).json({
            erro: "Informe um e-mail válido com até 100 caracteres."
        });
    }

    // Validar senha
    if (senha.length < 8 || senha.length > 72) {
        return res.status(400).json({
            erro: "A senha deve ter entre 8 e 72 caracteres."
        });
    }

    try {
        // Verificar e-mail duplicado
        const [existentes] = await db.promise().execute(
            "SELECT id FROM empresas WHERE email = ?",
            [email]
        );

        if (existentes.length > 0) {
            return res.status(409).json({
                erro: "Já existe uma empresa cadastrada com esse e-mail."
            });
        }

        // Proteger a senha
        const senhaHash = await bcrypt.hash(senha, 12);

        // Inserir empresa com localização
        await db.promise().execute(
            `INSERT INTO empresas
                (nome, descricao, categoria, regiao, estado, cidade, email, senha)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                nome,
                descricao,
                categoria,
                regiao,
                estado,
                cidade,
                email,
                senhaHash
            ]
        );

        return res.status(201).json({
            mensagem: "Empresa cadastrada com sucesso!"
        });

    } catch (erro) {
        if (erro.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                erro: "Já existe uma empresa cadastrada com esse e-mail."
            });
        }

        console.error("Erro ao cadastrar empresa:", erro);

        return res.status(500).json({
            erro: "Não foi possível cadastrar a empresa."
        });
    }
});

 // LOGIN EMPRESARIAL
app.post("/login-empresa", async (req, res) => {
    let { email, senha } = req.body || {};

    if (
        typeof email !== "string" ||
        typeof senha !== "string" ||
        !email.trim() ||
        !senha
    ) {
        return res.status(400).json({
            erro: "Informe o e-mail e a senha."
        });
    }

    email = email.trim().toLowerCase();

    try {
        const [empresas] = await db.promise().execute(
            "SELECT id, nome, email, senha FROM empresas WHERE email = ? LIMIT 1",
            [email]
        );

        if (empresas.length === 0) {
            return res.status(401).json({
                erro: "E-mail ou senha incorretos."
            });
        }

        const empresa = empresas[0];
        const senhaCorreta = await bcrypt.compare(
            senha,
            String(empresa.senha || "")
        );

        if (!senhaCorreta) {
            return res.status(401).json({
                erro: "E-mail ou senha incorretos."
            });
        }

        req.session.regenerate((erroSessao) => {
            if (erroSessao) {
                console.error(
                    "Erro ao renovar sessão empresarial:",
                    erroSessao
                );

                return res.status(500).json({
                    erro: "Não foi possível iniciar a sessão."
                });
            }

            req.session.empresa = {
                id: empresa.id,
                nome: empresa.nome,
                email: empresa.email
            };

            req.session.save((erroSalvar) => {
                if (erroSalvar) {
                    console.error(
                        "Erro ao salvar sessão empresarial:",
                        erroSalvar
                    );

                    return res.status(500).json({
                        erro: "Não foi possível iniciar a sessão."
                    });
                }

                return res.json({
                    mensagem: "Login empresarial realizado com sucesso!",
                    empresa: req.session.empresa
                });
            });
        });
    } catch (erro) {
        console.error("Erro no login empresarial:", erro);

        return res.status(500).json({
            erro: "Não foi possível realizar o login."
        });
    }
});


// LISTAR EMPRESAS (SEM EXPOR SENHAS)
app.get("/empresas/listar", (req, res) => {
    const sql = `
        SELECT id, nome, descricao, categoria, email, data_cadastro
        FROM empresas
        ORDER BY data_cadastro DESC
    `;

    db.query(sql, (err, resultado) => {
        if (err) {
            console.error("Erro ao listar empresas:", err);
            return res.status(500).json({
                erro: "Erro ao listar empresas."
            });
        }

        res.json(resultado);
    });
});


 // LISTAR VAGAS PÚBLICAS DE UMA EMPRESA
app.get("/empresas/:id/vagas", (req, res) => {
    const empresaId = Number(req.params.id);

    if (!Number.isInteger(empresaId) || empresaId <= 0) {
        return res.status(400).json({
            erro: "ID da empresa inválido."
        });
    }

    const sql = `
        SELECT
            id,
            titulo,
            empresa,
            tipo_contrato,
            turno,
            descricao,
            requisitos,
            salario,
            regiao,
            estado,
            cidade,
            empresa_id
        FROM vagas
        WHERE empresa_id = ?
        ORDER BY id DESC
    `;

    db.query(sql, [empresaId], (err, resultado) => {
        if (err) {
            console.error("Erro ao listar vagas da empresa:", err);

            return res.status(500).json({
                erro: "Erro ao listar vagas."
            });
        }

        return res.json(resultado);
    });
});

// LISTAR VAGAS DA EMPRESA LOGADA
app.get("/empresas/minhas-vagas", verificarLoginEmpresa, async (req, res) => {
    const empresaId = req.session.empresa.id;

    try {
        const [vagas] = await db.promise().execute(
            `SELECT
                id,
                titulo,
                descricao,
                requisitos,
                tipo_contrato,
                turno,
                salario,
                regiao,
                estado,
                cidade
             FROM vagas
             WHERE empresa_id = ?
             ORDER BY id DESC`,
            [empresaId]
        );

        return res.json(vagas);

    } catch (erro) {
        console.error("Erro ao listar vagas da empresa:", erro);

        return res.status(500).json({
            erro: "Não foi possível carregar suas vagas."
        });
    }
});

// EDITAR VAGA DA EMPRESA LOGADA
app.put("/empresas/minhas-vagas/:id", verificarLoginEmpresa, async (req, res) => {
    const empresaId = req.session.empresa.id;
    const id = Number(req.params.id);

    const {
        titulo,
        descricao,
        requisitos,
        tipoContrato,
        turno,
        salario,
        regiao,
        estado,
        cidade
    } = req.body || {};

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ erro: "ID da vaga inválido." });
    }

    if (
        typeof titulo !== "string" ||
        typeof descricao !== "string" ||
        typeof requisitos !== "string" ||
        typeof tipoContrato !== "string" ||
        typeof turno !== "string" ||
        typeof regiao !== "string" ||
        typeof estado !== "string" ||
        typeof cidade !== "string"
    ) {
        return res.status(400).json({
            erro: "Preencha todos os campos obrigatórios."
        });
    }

    const dados = {
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        requisitos: requisitos.trim(),
        tipoContrato: tipoContrato.trim(),
        turno: turno.trim(),
        regiao: regiao.trim(),
        estado: estado.trim().toUpperCase(),
        cidade: cidade.trim()
    };

    if (
        !dados.titulo ||
        !dados.descricao ||
        !dados.requisitos ||
        !dados.tipoContrato ||
        !dados.turno ||
        !dados.regiao ||
        !dados.estado ||
        !dados.cidade
    ) {
        return res.status(400).json({
            erro: "Preencha todos os campos obrigatórios."
        });
    }

    if (
        dados.titulo.length > 100 ||
        dados.descricao.length > 150 ||
        dados.requisitos.length > 65535 ||
        dados.tipoContrato.length > 50 ||
        dados.turno.length > 50 ||
        dados.regiao.length > 30 ||
        dados.cidade.length > 100
    ) {
        return res.status(400).json({
            erro: "Um ou mais campos ultrapassaram o limite permitido."
        });
    }

    if (!/^[A-Z]{2}$/.test(dados.estado)) {
        return res.status(400).json({
            erro: "Informe uma sigla de estado válida, como MA ou SP."
        });
    }

    const regioesPorEstado = {
        AC: "Norte", AP: "Norte", AM: "Norte", PA: "Norte",
        RO: "Norte", RR: "Norte", TO: "Norte",

        AL: "Nordeste", BA: "Nordeste", CE: "Nordeste",
        MA: "Nordeste", PB: "Nordeste", PE: "Nordeste",
        PI: "Nordeste", RN: "Nordeste", SE: "Nordeste",

        DF: "Centro-Oeste", GO: "Centro-Oeste",
        MT: "Centro-Oeste", MS: "Centro-Oeste",

        ES: "Sudeste", MG: "Sudeste",
        RJ: "Sudeste", SP: "Sudeste",

        PR: "Sul", RS: "Sul", SC: "Sul"
    };

    if (!regioesPorEstado[dados.estado]) {
        return res.status(400).json({
            erro: "Estado inválido."
        });
    }

    if (dados.regiao !== regioesPorEstado[dados.estado]) {
        return res.status(400).json({
            erro: "A região selecionada não corresponde ao estado."
        });
    }

    let salarioFinal = null;

    if (salario !== null && salario !== undefined && salario !== "") {
        salarioFinal = Number(salario);

        if (!Number.isFinite(salarioFinal) || salarioFinal < 0) {
            return res.status(400).json({
                erro: "Informe um salário válido e não negativo."
            });
        }
    }

    try {
        const [resultado] = await db.promise().execute(
            `UPDATE vagas
             SET titulo = ?,
                 descricao = ?,
                 requisitos = ?,
                 tipo_contrato = ?,
                 turno = ?,
                 salario = ?,
                 regiao = ?,
                 estado = ?,
                 cidade = ?
             WHERE id = ? AND empresa_id = ?`,
            [
                dados.titulo,
                dados.descricao,
                dados.requisitos,
                dados.tipoContrato,
                dados.turno,
                salarioFinal,
                dados.regiao,
                dados.estado,
                dados.cidade,
                id,
                empresaId
            ]
        );

        if (resultado.affectedRows === 0) {
            const [existentes] = await db.promise().execute(
                "SELECT id FROM vagas WHERE id = ? AND empresa_id = ?",
                [id, empresaId]
            );

            if (existentes.length === 0) {
                return res.status(404).json({
                    erro: "Vaga não encontrada para esta empresa."
                });
            }
        }

        return res.json({
            mensagem: "Vaga atualizada com sucesso!"
        });
    } catch (erro) {
        console.error("Erro ao editar vaga:", erro);

        return res.status(500).json({
            erro: "Não foi possível atualizar a vaga."
        });
    }
});

 // EXCLUIR VAGA DA EMPRESA LOGADA
app.delete("/empresas/minhas-vagas/:id", verificarLoginEmpresa, async (req, res) => {
    const empresaId = req.session.empresa.id;
    const vagaId = req.params.id;

    try {
        // Confirma que a vaga pertence à empresa logada.
        const [vagas] = await db.promise().execute(
            `SELECT id
             FROM vagas
             WHERE id = ? AND empresa_id = ?`,
            [vagaId, empresaId]
        );

        if (vagas.length === 0) {
            return res.status(404).json({
                erro: "Vaga não encontrada ou não pertence à sua empresa."
            });
        }

        // Exclui as candidaturas vinculadas à vaga.
        await db.promise().execute(
            "DELETE FROM candidaturas WHERE vaga_id = ?",
            [vagaId]
        );

        // Exclui a vaga da empresa.
        const [resultado] = await db.promise().execute(
            `DELETE FROM vagas
             WHERE id = ? AND empresa_id = ?`,
            [vagaId, empresaId]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                erro: "A vaga não foi encontrada para exclusão."
            });
        }

        return res.json({
            mensagem: "Vaga excluída com sucesso!"
        });

    } catch (erro) {
        console.error("Erro ao excluir vaga:", erro);

        return res.status(500).json({
            erro: "Não foi possível excluir a vaga."
        });
    }
});



 // CADASTRAR VAGA DA EMPRESA LOGADA
app.post("/empresas/minhas-vagas", verificarLoginEmpresa, async (req, res) => {
    try {
        const empresaId = req.session.empresa.id;

        const {
            titulo,
            descricao,
            requisitos,
            tipoContrato,
            turno,
            salario,
            regiao,
            estado,
            cidade
        } = req.body;

        // Validar campos obrigatórios
        if (
            !titulo?.trim() ||
            !descricao?.trim() ||
            !requisitos?.trim() ||
            !tipoContrato?.trim() ||
            !turno?.trim() ||
            !regiao?.trim() ||
            !estado?.trim() ||
            !cidade?.trim()
        ) {
            return res.status(400).json({
                erro: "Preencha todos os campos obrigatórios, incluindo a localização."
            });
        }

        // Validar tamanho dos campos
        if (titulo.trim().length > 100) {
            return res.status(400).json({
                erro: "O título deve ter no máximo 100 caracteres."
            });
        }

        if (tipoContrato.trim().length > 50) {
            return res.status(400).json({
                erro: "O tipo de contrato deve ter no máximo 50 caracteres."
            });
        }

        if (turno.trim().length > 50) {
            return res.status(400).json({
                erro: "O turno deve ter no máximo 50 caracteres."
            });
        }

        if (descricao.trim().length > 150) {
            return res.status(400).json({
                erro: "A descrição deve ter no máximo 150 caracteres."
            });
        }

        if (regiao.trim().length > 30) {
            return res.status(400).json({
                erro: "A região deve ter no máximo 30 caracteres."
            });
        }

        if (!/^[A-Za-z]{2}$/.test(estado.trim())) {
            return res.status(400).json({
                erro: "Informe uma sigla de estado válida, como MA."
            });
        }

        if (cidade.trim().length > 100) {
            return res.status(400).json({
                erro: "A cidade deve ter no máximo 100 caracteres."
            });
        }

        // Validar salário
        const salarioValor =
            salario === "" || salario == null
                ? null
                : Number(salario);

        if (
            salarioValor !== null &&
            (!Number.isFinite(salarioValor) || salarioValor < 0)
        ) {
            return res.status(400).json({
                erro: "Informe um salário válido."
            });
        }

        // Validar região e estado
        const regioesPorEstado = {
            AC: "Norte", AP: "Norte", AM: "Norte",
            PA: "Norte", RO: "Norte", RR: "Norte",
            TO: "Norte",

            AL: "Nordeste", BA: "Nordeste", CE: "Nordeste",
            MA: "Nordeste", PB: "Nordeste", PE: "Nordeste",
            PI: "Nordeste", RN: "Nordeste", SE: "Nordeste",

            DF: "Centro-Oeste", GO: "Centro-Oeste",
            MT: "Centro-Oeste", MS: "Centro-Oeste",

            ES: "Sudeste", MG: "Sudeste",
            RJ: "Sudeste", SP: "Sudeste",

            PR: "Sul", RS: "Sul", SC: "Sul"
        };

        const estadoNormalizado = estado.trim().toUpperCase();
        const regiaoNormalizada = regiao.trim();

        if (!regioesPorEstado[estadoNormalizado]) {
            return res.status(400).json({
                erro: "Estado brasileiro inválido."
            });
        }

        if (regioesPorEstado[estadoNormalizado] !== regiaoNormalizada) {
            return res.status(400).json({
                erro: "A região informada não corresponde ao estado selecionado."
            });
        }

        // Cadastrar vaga
        const [resultado] = await db.promise().execute(
            `INSERT INTO vagas (
                titulo,
                empresa,
                tipo_contrato,
                turno,
                descricao,
                empresa_id,
                requisitos,
                salario,
                regiao,
                estado,
                cidade
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                titulo.trim(),
                req.session.empresa.nome,
                tipoContrato.trim(),
                turno.trim(),
                descricao.trim(),
                empresaId,
                requisitos.trim(),
                salarioValor,
                regiaoNormalizada,
                estadoNormalizado,
                cidade.trim()
            ]
        );

        return res.status(201).json({
            mensagem: "Vaga cadastrada com sucesso!",
            vaga_id: resultado.insertId
        });

    } catch (erro) {
        console.error("Erro ao cadastrar vaga:", erro);

        return res.status(500).json({
            erro: "Erro interno ao cadastrar a vaga."
        });
    }
});

// INICIAR SERVIDOR
app.listen(3000, () => {
    console.log("Servidor rodando em http://localhost:3000");
});