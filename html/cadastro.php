<?php
require "conexao.php";

$nome   = $_POST['Nome'];
$email  = $_POST['email'];
$numero = $_POST['Numero'];
$dia    = $_POST['dianascimento'];
$mes    = $_POST['mesnascimento'];
$ano    = $_POST['anonascimento'];
$senha  = $_POST['senha'];

// Converte mês em número
$meses = [
    "jan"=>1,"fev"=>2,"mar"=>3,"abr"=>4,"mai"=>5,"jun"=>6,
    "jul"=>7,"ago"=>8,"set"=>9,"out"=>10,"nov"=>11,"dez"=>12
];

$data_nascimento = "$ano-" . $meses[$mes] . "-$dia";

// Criptografa senha
$senha_hash = password_hash($senha, PASSWORD_DEFAULT);

// Verifica se email já existe
$check = $conn->prepare("SELECT id FROM usuarios WHERE email = ?");
$check->bind_param("s", $email);
$check->execute();
$check->store_result();

if ($check->num_rows > 0) {
    echo "Este e-mail já está cadastrado.";
    exit;
}

// Insere usuário
$sql = $conn->prepare(
    "INSERT INTO usuarios (nome, email, numero, data_nascimento, senha)
     VALUES (?, ?, ?, ?, ?)"
);

$sql->bind_param("sssss", $nome, $email, $numero, $data_nascimento, $senha_hash);

if ($sql->execute()) {
    header("Location: login.html");
} else {
    echo "Erro ao cadastrar.";
}
?>
