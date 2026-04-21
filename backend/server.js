const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const path = require("path");
const session = require("express-session");

const app = express();

app.use(cors());
app.use(express.json());

app.use(session({
    secret: "segredo123",
    resave: false,
    saveUninitialized: true
}));

// serve todos os arquivos do frontend (css, js, html, imagens)
app.use(express.static(path.join(__dirname, "../frontend")));

// define a rota principal (index)
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/index.html"));
});
// conexão com banco
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

    db.query(sql, [nome, email, telefone, senha], (err, result) => {
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

                // salva o login na sessao
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

// USUARIO
app.get("/usuario", (req, res) => {

    if (!req.session.usuario) {
        return res.status(401).send("Não autorizado");
    }

    res.json(req.session.usuario);
});

// DASHBOARD PROTEGIDA
app.get("/dashboard", (req, res) => {

    if (!req.session.usuario) {
        return res.redirect("/html/login.html");
    }

    res.sendFile(path.join(__dirname, "../frontend/html/sidebar.html"));
});

// LOGOUT
app.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/html/login.html");
});

// inicia o servidor
app.listen(3000, () => {
    console.log("Servidor rodando em http://localhost:3000");
});