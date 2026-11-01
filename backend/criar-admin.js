const bcrypt = require("bcryptjs");
const readline = require("readline");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question("Nome do administrador: ", (nome) => {
    rl.question("E-mail do administrador: ", async (email) => {
        rl.question("Senha do administrador: ", async (senha) => {
            nome = nome.trim();
            email = email.trim().toLowerCase();

            if (!nome || !email || senha.length < 8 || senha.length > 72) {
                console.log(
                    "Dados inválidos. A senha deve ter entre 8 e 72 caracteres."
                );
                rl.close();
                return;
            }

            try {
                const hash = await bcrypt.hash(senha, 12);

                console.log("\nHash gerado com sucesso:");
                console.log(hash);
                console.log("\nGuarde o hash para inserir no banco de dados.");
            } catch (erro) {
                console.error("Erro ao gerar hash:", erro.message);
            }

            rl.close();
        });
    });
});
