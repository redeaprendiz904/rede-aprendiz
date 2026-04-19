const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

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

    const sql = "SELECT * FROM usuarios WHERE email = ? AND senha = ?";

    db.query(sql, [email, senha], (err, result) => {
        if (err) return res.status(500).send("Erro no servidor");

        if (result.length > 0) {
            res.sendStatus(200);
        } else {
            res.status(401).send("Login inválido");
        }
    });
});

app.listen(3000, () => {
    console.log("Servidor rodando em http://localhost:3000");
});