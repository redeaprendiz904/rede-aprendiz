const express = require("express");
const cors = require("cors");
const path = require("path");
const session = require("express-session");

const app = express();

app.use(cors({
    origin: "http://localhost:3000",
    credentials: true
}));

app.use(express.json());

app.use(session({
    secret: "segredo123",
    resave: false,
    saveUninitialized: true
}));

// SERVIR ARQUIVOS DO FRONTEND
app.use(express.static(path.join(__dirname, "../frontend")));

// ROTA PRINCIPAL
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// CONEXÃO COM BANCO
const db = require("./config/db");

// CADASTRO
app.post("/cadastro", (req, res) => {
    const { nome, email, telefone, senha } = req.body;

    const sql = "INSERT INTO usuarios (nome, email, telefone, senha) VALUES (?, ?, ?, ?)";

    db.query(sql, [nome, email, telefone, senha], (err) => {
        if (err) {
            console.log(err);
            return res.status(500).send("Erro no cadastro");
        }
        res.sendStatus(200);
    });
});

// LOGIN
app.post("/login", (req, res) => {
    const { email, senha } = req.body;

    const sql = "SELECT * FROM usuarios WHERE email = ?";

    db.query(sql, [email], (err, result) => {
        if (err) return res.status(500).send(err);

        if (result.length > 0) {
            const usuario = result[0];

            if (senha === usuario.senha) {
                req.session.usuario = {
                    id: usuario.id,
                    nome: usuario.nome
                };

                return res.sendStatus(200);
            } else {
                return res.status(401).send("Senha incorreta");
            }
        } else {
            return res.status(404).send("Usuário não encontrado");
        }
    });
});

// USUÁRIO LOGADO
app.get("/usuario", (req, res) => {
    if (!req.session.usuario) {
        return res.status(401).send("Não autorizado");
    }

    res.json(req.session.usuario);
});

// LOGOUT
app.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/html/login.html");
});

// 

function verificarLogin(req, res, next) {
    if (!req.session.usuario) {
        return res.redirect("/html/login.html");
    }
    next();
}

app.get("/dashboard", verificarLogin, (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/html/dashboard.html"));
});

app.get("/empresas", verificarLogin, (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/html/empresas.html"));
});

app.get("/perfil", verificarLogin, (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/html/perfil.html"));
});

app.get("/perfil/dados", (req, res) => {
    if (!req.session.usuario) {
        return res.status(401).send("Não autorizado");
    }

    const sql = `
        SELECT nome, idade, telefone, escola, serie, turno,
               horario, area_interesse, cursos_concluidos,
               horas_estudo
        FROM perfil
        WHERE usuario_id = ?
        ORDER BY id DESC
        LIMIT 1
    `;

    db.query(sql, [req.session.usuario.id], (err, resultado) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Erro ao buscar perfil");
        }

        res.json(resultado[0] || null);
    });
});


// LISTAR VAGAS

app.get("/vagas", (req, res) => {
    if (!req.session.usuario) {
        return res.status(401).send("Não autorizado");
    }

    const usuario_id = req.session.usuario.id;

    const sql = `
        SELECT v.*,
            EXISTS (
                SELECT 1
                FROM candidaturas c
                WHERE c.vaga_id = v.id
                  AND c.usuario_id = ?
            ) AS ja_candidatou
        FROM vagas v
    `;

    db.query(sql, [usuario_id], (err, resultado) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Erro ao carregar vagas");
        }

        res.json(resultado);
    });
});


// CRIAR PERFIL

app.post("/perfil", (req, res) => {
    if (!req.session.usuario) {
        return res.status(401).send("Não autorizado");
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

    const valores = [
        nome, idade, telefone, escola, serie, turno,
        horario, area_interesse, cursos_concluidos,
        horas_estudo
    ];

    const sqlBusca = `
        SELECT id FROM perfil
        WHERE usuario_id = ?
        ORDER BY id DESC
        LIMIT 1
    `;

    db.query(sqlBusca, [usuario_id], (err, resultado) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Erro ao buscar perfil");
        }

        if (resultado.length > 0) {
            const sqlAtualiza = `
                UPDATE perfil SET
                    nome = ?, idade = ?, telefone = ?,
                    escola = ?, serie = ?, turno = ?,
                    horario = ?, area_interesse = ?,
                    cursos_concluidos = ?, horas_estudo = ?
                WHERE id = ?
            `;

            db.query(
                sqlAtualiza,
                [...valores, resultado[0].id],
                (erro) => {
                    if (erro) {
                        console.error(erro);
                        return res.status(500).send("Erro ao atualizar perfil");
                    }

                    res.json({ mensagem: "Perfil atualizado com sucesso" });
                }
            );
        } else {
            const sqlInsere = `
                INSERT INTO perfil (
                    usuario_id, nome, idade, telefone, escola,
                    serie, turno, horario, area_interesse,
                    cursos_concluidos, horas_estudo
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            db.query(
                sqlInsere,
                [usuario_id, ...valores],
                (erro) => {
                    if (erro) {
                        console.error(erro);
                        return res.status(500).send("Erro ao salvar perfil");
                    }

                    res.json({ mensagem: "Perfil criado com sucesso" });
                }
            );
        }
    });
});


// CANDIDATAR-SE
app.post("/candidatar", verificarLogin, (req, res) => {
    const vagaId = Number(req.body.vaga_id);
    const usuarioId = req.session.usuario.id;

    if (!Number.isInteger(vagaId) || vagaId < 1) {
        return res.status(400).json({
            mensagem: "Vaga inválida."
        });
    }

    db.query(
        "SELECT id FROM vagas WHERE id = ?",
        [vagaId],
        (err, vagas) => {
            if (err) {
                console.error(err);
                return res.status(500).json({
                    mensagem: "Erro ao verificar vaga."
                });
            }

            if (vagas.length === 0) {
                return res.status(404).json({
                    mensagem: "Vaga não encontrada."
                });
            }

            const sql = `
                INSERT INTO candidaturas (usuario_id, vaga_id)
                VALUES (?, ?)
                ON DUPLICATE KEY UPDATE id = id
            `;

            db.query(sql, [usuarioId, vagaId], (erro, resultado) => {
                if (erro) {
                    console.error(erro);
                    return res.status(500).json({
                        mensagem: "Erro ao registrar candidatura."
                    });
                }

                if (resultado.affectedRows === 1) {
                    return res.status(201).json({
                        mensagem: "Candidatura realizada com sucesso.",
                        jaCandidatou: true
                    });
                }

                res.status(200).json({
                    mensagem: "Você já se candidatou a esta vaga.",
                    jaCandidatou: true
                });
            });
        }
    );
});


// GRAFICO DE PERFORMANCE

app.get("/dashboard/dados", verificarLogin, (req, res) => {
    const usuarioId = req.session.usuario.id;

    const sqlPerfil = `
        SELECT *
        FROM perfil
        WHERE usuario_id = ?
        ORDER BY id DESC
        LIMIT 1
    `;

    db.query(sqlPerfil, [usuarioId], (err, perfis) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                mensagem: "Erro ao buscar perfil."
            });
        }

        const perfil = perfis[0] || null;

        const camposPerfil = [
            "nome",
            "idade",
            "telefone",
            "escola",
            "serie",
            "turno",
            "horario",
            "area_interesse"
        ];

        const preenchidos = perfil
            ? camposPerfil.filter(campo =>
                perfil[campo] !== null &&
                perfil[campo] !== undefined &&
                String(perfil[campo]).trim() !== ""
            ).length
            : 0;

        const perfilPercentual = Math.round(
            (preenchidos / camposPerfil.length) * 100
        );

        const sqlEstatisticas = `
            SELECT
                (SELECT COUNT(*) FROM vagas) AS totalVagas,
                (
                    SELECT COUNT(*)
                    FROM candidaturas
                    WHERE usuario_id = ?
                ) AS totalInscricoes
        `;

        db.query(
            sqlEstatisticas,
            [usuarioId],
            (erro, estatisticas) => {
                if (erro) {
                    console.error(erro);
                    return res.status(500).json({
                        mensagem: "Erro ao buscar indicadores."
                    });
                }

                const sqlEmpresas = `
                    SELECT id, nome, descricao, categoria
                    FROM empresas
                    ORDER BY data_cadastro DESC
                    LIMIT 5
                `;

                db.query(sqlEmpresas, (erroEmpresas, empresas) => {
                    if (erroEmpresas) {
                        console.error(erroEmpresas);
                        return res.status(500).json({
                            mensagem: "Erro ao buscar empresas."
                        });
                    }

                    const sqlEstudos = `
                        SELECT
                            DATE_FORMAT(data_estudo, '%Y-%m-%d') AS data,
                            horas
                        FROM estudo_diario
                        WHERE usuario_id = ?
                          AND data_estudo >= DATE_SUB(
                              CURDATE(), INTERVAL 6 DAY
                          )
                          AND data_estudo <= CURDATE()
                        ORDER BY data_estudo ASC
                    `;

                    db.query(
                        sqlEstudos,
                        [usuarioId],
                        (erroEstudos, estudos) => {
                            if (erroEstudos) {
                                console.error(erroEstudos);
                                return res.status(500).json({
                                    mensagem: "Erro ao buscar histórico."
                                });
                            }

                            res.json({
                                perfil: perfil,
                                cursos: Number(
                                    perfil?.cursos_concluidos || 0
                                ),
                                horasPerfil: Number(
                                    perfil?.horas_estudo || 0
                                ),
                                perfilPercentual,
                                vagas: Number(
                                    estatisticas[0].totalVagas
                                ),
                                inscricoes: Number(
                                    estatisticas[0].totalInscricoes
                                ),
                                empresasRecentes: empresas,
                                estudos
                            });
                        }
                    );
                });
            }
        );
    });
});

/* REGISTRO DE HORAS DE ESTUDO DE UM DIA */
app.post("/dashboard/estudos", verificarLogin, (req, res) => {
    const usuarioId = req.session.usuario.id;
    const { data, horas } = req.body;

    if (
        typeof data !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(data) ||
        !Number.isFinite(Number(horas)) ||
        Number(horas) < 0 ||
        Number(horas) > 24
    ) {
        return res.status(400).json({
            mensagem: "Informe uma data válida e horas entre 0 e 24."
        });
    }

    const dataInformada = new Date(`${data}T12:00:00Z`);
    const hoje = new Date();
    hoje.setUTCHours(0, 0, 0, 0);

    if (
        Number.isNaN(dataInformada.getTime()) ||
        dataInformada.toISOString().slice(0, 10) !== data ||
        data > hoje.toISOString().slice(0, 10)
    ) {
        return res.status(400).json({
            mensagem: "A data deve ser válida e não pode ser futura."
        });
    }

    const sql = `
        INSERT INTO estudo_diario (usuario_id, data_estudo, horas)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE horas = VALUES(horas)
    `;

    db.query(
        sql,
        [usuarioId, data, Number(horas)],
        err => {
            if (err) {
                console.error(err);
                return res.status(500).json({
                    mensagem: "Erro ao registrar horas de estudo."
                });
            }

            res.json({
                mensagem: "Horas de estudo registradas com sucesso."
            });
        }
    );
});



/* CADASTRAR EMPRESA */
app.post("/empresas", verificarLogin, (req, res) => {
    const { nome, descricao, categoria } = req.body;

    const categorias = [
        "ti",
        "marketing",
        "atendimento",
        "mais"
    ];

    if (
        typeof nome !== "string" ||
        typeof descricao !== "string" ||
        !nome.trim() ||
        !descricao.trim() ||
        !categorias.includes(categoria)
    ) {
        return res.status(400).json({
            mensagem: "Preencha os campos corretamente."
        });
    }

    const sql = `
        INSERT INTO empresas (nome, descricao, categoria)
        VALUES (?, ?, ?)
    `;

    db.query(
        sql,
        [nome.trim(), descricao.trim(), categoria],
        (err, resultado) => {
            if (err) {
                console.error(err);
                return res.status(500).json({
                    mensagem: "Erro ao cadastrar empresa."
                });
            }

            res.status(201).json({
                id: resultado.insertId,
                mensagem: "Empresa cadastrada com sucesso."
            });
        }
    );
});

/* LISTAR EMPRESAS */
app.get("/empresas/listar", verificarLogin, (req, res) => {
    const sql = `
        SELECT id, nome, descricao, categoria, data_cadastro
        FROM empresas
        ORDER BY data_cadastro DESC
    `;

    db.query(sql, (err, resultado) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                mensagem: "Erro ao listar empresas."
            });
        }

        res.json(resultado);
    });
});

/* LISTAR VAGAS DE UMA EMPRESA */
app.get("/empresas/:id/vagas", verificarLogin, (req, res) => {
    const empresaId = Number(req.params.id);
    const usuarioId = req.session.usuario.id;

    if (!Number.isInteger(empresaId) || empresaId < 1) {
        return res.status(400).json({
            mensagem: "ID da empresa inválido."
        });
    }

    const sql = `
        SELECT
            v.*,
            EXISTS (
                SELECT 1
                FROM candidaturas c
                WHERE c.vaga_id = v.id
                  AND c.usuario_id = ?
            ) AS ja_candidatou
        FROM vagas v
        WHERE v.empresa_id = ?
        ORDER BY v.id DESC
    `;

    db.query(sql, [usuarioId, empresaId], (err, resultado) => {
        if (err) {
            console.error("Erro ao buscar vagas da empresa:", err);

            return res.status(500).json({
                mensagem: "Erro ao buscar vagas da empresa."
            });
        }

        return res.status(200).json(resultado);
    });
});



// INICIAR SERVIDOR
app.listen(3000, () => {
    console.log("Servidor rodando em http://localhost:3000");
});