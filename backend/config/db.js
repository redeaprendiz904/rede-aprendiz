// CONEXÃO COM BANCO
const mysql = require("mysql2");

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "admin",
    database: "rede_aprendiz"
});

module.exports = db;