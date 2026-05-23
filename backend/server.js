const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
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
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "rede_aprendiz"
});


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
        habilidades,
        sobre_mim
    } = req.body;

    const usuario_id = req.session.usuario.id;

    const sql = `
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
            habilidades,
            sobre_mim
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(sql, [
        usuario_id,
        nome,
        idade,
        telefone,
        escola,
        serie,
        turno,
        horario,
        area_interesse,
        habilidades,
        sobre_mim
    ], (err) => {

        if (err) {
            console.log(err);
            return res.status(500).send("Erro ao salvar perfil");
        }

        res.sendStatus(200);

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

// INICIAR SERVIDOR
app.listen(3000, () => {
    console.log("Servidor rodando em http://localhost:3000");
});