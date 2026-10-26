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

// LISTAR VAGAS
app.get("/vagas", (req, res) => {
    const sql = "SELECT * FROM vagas";

    db.query(sql, (err, result) => {
        if (err) return res.status(500).send(err);
        res.json(result);
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
            // O perfil já existe: atualiza os dados.
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
            // O perfil ainda não existe: cria um novo.
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


app.get("/perfil/dados", (req, res) => {
    if (!req.session.usuario) {
        return res.status(401).json({
            erro: "Você precisa estar logado."
        });
    }

    const sql = `
        SELECT
            nome,
            idade,
            telefone,
            escola,
            serie,
            turno,
            horario,
            area_interesse,
            cursos_concluidos,
            horas_estudo,
            habilidades,
            sobre_mim
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


// CANDIDATAR-SE
app.post("/candidatar", (req, res) => {
    if (!req.session.usuario) {
        return res.status(401).send("Não autorizado");
    }

    const { vaga_id } = req.body;
    const usuario_id = req.session.usuario.id;

    const sql = `
        INSERT INTO candidaturas (usuario_id, vaga_id)
        VALUES (?, ?)
    `;

    db.query(sql, [usuario_id, vaga_id], (err) => {
        if (err) {
            console.log(err);
            return res.status(500).send("Erro ao candidatar");
        }

        res.sendStatus(200);
    });
});

// GRAFICO DE PERFORMANCE

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
app.post("/empresas", (req, res) => {

    const { nome, descricao, categoria } = req.body;

    const sql = `
        INSERT INTO empresas
        (nome, descricao, categoria)
        VALUES (?, ?, ?)
    `;

    db.query(sql, [nome, descricao, categoria], (err) => {

        if (err) {
            console.log(err);
            return res.status(500).send("Erro ao cadastrar empresa");
        }

        res.sendStatus(200);

    });

});

// LISTAR EMPRESAS
app.get("/empresas/listar", (req, res) => {

    const sql = `
        SELECT *
        FROM empresas
        ORDER BY data_cadastro DESC
    `;

    db.query(sql, (err, resultado) => {

        if (err) {
            console.log(err);
            return res.status(500).send("Erro ao listar empresas");
        }

        res.json(resultado);

    });

});

// LISTART VAGAS DE UMA EMPRESA
app.get("/empresas/:id/vagas", (req, res) => {

    const empresa_id = req.params.id;

    const sql = `
        SELECT *
        FROM vagas
        WHERE empresa_id = ?
    `;

    db.query(sql, [empresa_id], (err, resultado) => {

        if (err) {
            console.log(err);
            return res.status(500).send(err);
        }

        res.json(resultado);

    });

});

// INICIAR SERVIDOR
app.listen(3000, () => {
    console.log("Servidor rodando em http://localhost:3000");
});