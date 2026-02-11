<?php
$host = "localhost";
$user = "root";        // padrão do XAMPP
$pass = "";            // padrão do XAMPP
$db   = "rede_aprendiz";

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    die("Erro na conexão: " . $conn->connect_error);
}
?>
