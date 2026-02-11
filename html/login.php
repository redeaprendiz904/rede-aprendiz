<?php
session_start();
require "conexao.php";

$email = $_POST['email'];
$senha = $_POST['senha'];

$sql = $conn->prepare("SELECT id, nome, senha FROM usuarios WHERE email = ?");
$sql->bind_param("s", $email);
$sql->execute();
$result = $sql->get_result();

if ($result->num_rows === 1) {
    $user = $result->fetch_assoc();

    if (password_verify($senha, $user['senha'])) {
        $_SESSION['id'] = $user['id'];
        $_SESSION['nome'] = $user['nome'];

        header("Location: painel.html");
        exit;
    }
}

echo "Email ou senha inválidos.";
?>
