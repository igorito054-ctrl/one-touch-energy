const express = require("express");
const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");
const session = require("express-session");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const path = require("path");

const app = express();

const PORT = Number(process.env.PORT) || 3000;

app.use(express.static(__dirname));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});


/* =====================================================
   CONFIGURAÇÕES DE SEGURANÇA
   ===================================================== */

app.disable("x-powered-by");

app.use(
    helmet({
        /*
           Mantido desativado por enquanto para não quebrar
           scripts que possam estar no HTML.
        */
        contentSecurityPolicy: false
    })
);

app.use(express.json({
    limit: "20kb"
}));

/* =====================================================
   SESSÃO SEGURA
   ===================================================== */

app.use(
    session({
        name: "onetouch.sid",

        secret: process.env.SESSION_SECRET,

        resave: false,

        saveUninitialized: false,

        cookie: {
            httpOnly: true,

            secure:
                process.env.SESSION_SECURE === "true",

            sameSite: "lax",

            maxAge:
                1000 *
                60 *
                60 *
                4
        }
    })
);

app.use(express.static(__dirname));

/* =====================================================
   LIMITAÇÃO DE TENTATIVAS
   ===================================================== */

const limiteLogin =
    rateLimit({
        windowMs:
            15 * 60 * 1000,

        max: 10,

        standardHeaders: true,

        legacyHeaders: false,

        message: {
            mensagem:
                "Muitas tentativas. Aguarde alguns minutos e tente novamente."
        }
    });


const limiteCadastro =
    rateLimit({
        windowMs:
            15 * 60 * 1000,

        max: 10,

        standardHeaders: true,

        legacyHeaders: false,

        message: {
            mensagem:
                "Muitas tentativas de cadastro. Aguarde alguns minutos."
        }
    });


const limiteRecuperacao =
    rateLimit({
        windowMs:
            15 * 60 * 1000,

        max: 5,

        standardHeaders: true,

        legacyHeaders: false,

        message: {
            mensagem:
                "Muitas tentativas de recuperação. Aguarde alguns minutos."
        }
    });


/* =====================================================
   CONEXÃO COM O MYSQL
   ===================================================== */

const banco =
    mysql.createPool({

        host:
            process.env.DB_HOST,

        user:
            process.env.DB_USER,

        password:
            process.env.DB_PASSWORD,

        database:
            process.env.DB_NAME,

        waitForConnections:
            true,

        connectionLimit:
            10,

        queueLimit:
            0
    });


/* =====================================================
   FUNÇÕES AUXILIARES
   ===================================================== */

function normalizarGmail(gmail) {

    return String(
        gmail || ""
    )
        .trim()
        .toLowerCase();

}


function limparTelefone(telefone) {

    return String(
        telefone || ""
    ).replace(/\D/g, "");

}


function senhaValida(senha) {

    return (
        typeof senha === "string" &&
        senha.length >= 7 &&
        /[A-Za-z]/.test(senha) &&
        /[0-9]/.test(senha)
    );

}


/*
   Nunca enviamos a senha para o navegador.
*/

function dadosPublicos(usuario) {

    return {

        id:
            usuario.id,

        nome:
            usuario.nome,

        gmail:
            usuario.gmail,

        telefone:
            usuario.telefone,

        data_registro:
            usuario.data_registro,

        nivel:
            usuario.nivel ||
            "usuario"
    };

}


/* =====================================================
   AUTENTICAÇÃO
   ===================================================== */

function autenticar(
    req,
    res,
    next
) {

    if (!req.session.usuario) {

        return res.status(401).json({

            mensagem:
                "❌ Você precisa estar logado."

        });

    }

    next();

}


/* =====================================================
   SOMENTE ADMINISTRADOR
   ===================================================== */

function somenteAdmin(
    req,
    res,
    next
) {

    if (!req.session.usuario) {

        return res.status(401).json({

            mensagem:
                "❌ Você precisa estar logado."

        });

    }


    if (
        req.session.usuario.nivel !==
        "admin"
    ) {

        return res.status(403).json({

            mensagem:
                "❌ Acesso negado. Apenas administradores."

        });

    }

    next();

}


/* =====================================================
   TESTAR MYSQL
   ===================================================== */

async function testarBanco() {

    try {

        const conexao =
            await banco.getConnection();

        console.log(
            "================================="
        );

        console.log(
            "✅ MYSQL CONECTADO COM SUCESSO!"
        );

        console.log(
            "================================="
        );

        conexao.release();

    } catch (erro) {

        console.log(
            "================================="
        );

        console.log(
            "❌ ERRO AO CONECTAR AO MYSQL"
        );

        console.log(
            "================================="
        );

        console.log(
            erro.message
        );

    }

}

testarBanco();


/* =====================================================
   CADASTRO
   ===================================================== */

app.post(
    "/api/cadastro",
    limiteCadastro,
    async (req, res) => {

        try {

            const nome =
                String(
                    req.body.nome || ""
                ).trim();


            const gmail =
                normalizarGmail(
                    req.body.gmail
                );


            const telefone =
                limparTelefone(
                    req.body.telefone
                );


            const senha =
                req.body.senha;


            if (
                !nome ||
                !gmail ||
                !telefone ||
                !senha
            ) {

                return res.status(400).json({

                    mensagem:
                        "Preencha todos os campos."

                });

            }


            if (
                nome.length < 2 ||
                nome.length > 100
            ) {

                return res.status(400).json({

                    mensagem:
                        "❌ Nome inválido."

                });

            }


            if (
                !/^[^\s@]+@gmail\.com$/i.test(
                    gmail
                )
            ) {

                return res.status(400).json({

                    mensagem:
                        "❌ Use um endereço terminado em @gmail.com."

                });

            }


            if (
                telefone.length !== 11
            ) {

                return res.status(400).json({

                    mensagem:
                        "❌ Telefone inválido."

                });

            }


            if (
                !senhaValida(senha)
            ) {

                return res.status(400).json({

                    mensagem:
                        "❌ A senha precisa ter no mínimo 7 caracteres, uma letra e um número."

                });

            }


            /* =================================================
               VERIFICAR GMAIL
               ================================================= */

            const [
                usuariosExistentes
            ] =
                await banco.execute(

                    "SELECT id FROM usuarios WHERE gmail = ? LIMIT 1",

                    [
                        gmail
                    ]

                );


            if (
                usuariosExistentes.length >
                0
            ) {

                return res.status(409).json({

                    mensagem:
                        "❌ Este Gmail já está cadastrado."

                });

            }


            /* =================================================
               HASH DA SENHA
               ================================================= */

            const senhaCriptografada =
                await bcrypt.hash(
                    senha,
                    12
                );


            /* =================================================
               INSERIR USUÁRIO
               ================================================= */

            const [
                resultado
            ] =
                await banco.execute(

                    `INSERT INTO usuarios
                    (
                        nome,
                        gmail,
                        telefone,
                        senha,
                        nivel
                    )
                    VALUES
                    (?, ?, ?, ?, 'usuario')`,

                    [
                        nome,
                        gmail,
                        telefone,
                        senhaCriptografada
                    ]

                );


            /* =================================================
               BUSCAR USUÁRIO CRIADO
               ================================================= */

            const [
                novoUsuario
            ] =
                await banco.execute(

                    `SELECT
                        id,
                        nome,
                        gmail,
                        telefone,
                        data_registro,
                        nivel
                     FROM usuarios
                     WHERE id = ?`,

                    [
                        resultado.insertId
                    ]

                );


            return res.status(201).json({

                mensagem:
                    "✅ Conta criada com sucesso!",

                usuario:
                    dadosPublicos(
                        novoUsuario[0]
                    )

            });


        } catch (erro) {

            console.error(
                "❌ Erro no cadastro:",
                erro
            );


            if (
                erro.code ===
                "ER_DUP_ENTRY"
            ) {

                return res.status(409).json({

                    mensagem:
                        "❌ Este Gmail já está cadastrado."

                });

            }


            return res.status(500).json({

                mensagem:
                    "❌ Erro interno no servidor."

            });

        }

    }
);


/* =====================================================
   LOGIN
   ===================================================== */

app.post(
    "/api/login",
    limiteLogin,
    async (req, res) => {

        try {

            const gmail =
                normalizarGmail(
                    req.body.gmail
                );


            const senha =
                req.body.senha;


            if (
                !gmail ||
                !senha
            ) {

                return res.status(400).json({

                    mensagem:
                        "Informe Gmail e senha."

                });

            }


            const [
                usuarios
            ] =
                await banco.execute(

                    `SELECT
                        id,
                        nome,
                        gmail,
                        telefone,
                        senha,
                        data_registro,
                        nivel
                     FROM usuarios
                     WHERE gmail = ?
                     LIMIT 1`,

                    [
                        gmail
                    ]

                );


            if (
                usuarios.length === 0
            ) {

                return res.status(401).json({

                    mensagem:
                        "❌ Gmail ou senha incorretos."

                });

            }


            const usuario =
                usuarios[0];


            const senhaCorreta =
                await bcrypt.compare(
                    senha,
                    usuario.senha
                );


            if (
                !senhaCorreta
            ) {

                return res.status(401).json({

                    mensagem:
                        "❌ Gmail ou senha incorretos."

                });

            }


            /*
               Criamos a sessão no servidor.

               A senha NÃO vai para o navegador.
            */

            req.session.usuario =
                dadosPublicos(
                    usuario
                );


            return res.json({

                mensagem:
                    "✅ Login realizado com sucesso!",

                usuario:
                    req.session.usuario

            });


        } catch (erro) {

            console.error(
                "❌ Erro no login:",
                erro
            );


            return res.status(500).json({

                mensagem:
                    "❌ Erro interno no servidor."

            });

        }

    }
);


/* =====================================================
   USUÁRIO LOGADO
   ===================================================== */

app.get(
    "/api/me",
    autenticar,
    async (req, res) => {

        try {

            const [
                usuarios
            ] =
                await banco.execute(

                    `SELECT
                        id,
                        nome,
                        gmail,
                        telefone,
                        data_registro,
                        nivel
                     FROM usuarios
                     WHERE id = ?
                     LIMIT 1`,

                    [
                        req.session.usuario.id
                    ]

                );


            if (
                usuarios.length === 0
            ) {

                req.session.destroy(
                    () => {}
                );


                return res.status(401).json({

                    mensagem:
                        "❌ Usuário não encontrado."

                });

            }


            req.session.usuario =
                dadosPublicos(
                    usuarios[0]
                );


            return res.json({

                usuario:
                    req.session.usuario

            });


        } catch (erro) {

            console.error(
                "❌ Erro ao consultar usuário:",
                erro
            );


            return res.status(500).json({

                mensagem:
                    "❌ Erro interno no servidor."

            });

        }

    }
);


/* =====================================================
   LOGOUT
   ===================================================== */

app.post(
    "/api/logout",
    (req, res) => {

        req.session.destroy(
            (erro) => {

                if (erro) {

                    console.error(
                        "❌ Erro ao sair:",
                        erro
                    );


                    return res.status(500).json({

                        mensagem:
                            "❌ Não foi possível encerrar a sessão."

                    });

                }


                res.clearCookie(
                    "onetouch.sid"
                );


                return res.json({

                    mensagem:
                        "✅ Sessão encerrada."

                });

            }
        );

    }
);


/* =====================================================
   RECUPERAR SENHA
   ===================================================== */

app.post(
    "/api/recuperar",
    limiteRecuperacao,
    async (req, res) => {

        try {

            const gmail =
                normalizarGmail(
                    req.body.gmail
                );


            const telefone =
                limparTelefone(
                    req.body.telefone
                );


            if (
                !gmail ||
                telefone.length !== 11
            ) {

                return res.status(400).json({

                    mensagem:
                        "❌ Informe um Gmail e telefone válidos."

                });

            }


            const [
                usuarios
            ] =
                await banco.execute(

                    `SELECT id
                     FROM usuarios
                     WHERE gmail = ?
                     AND telefone = ?
                     LIMIT 1`,

                    [
                        gmail,
                        telefone
                    ]

                );


            if (
                usuarios.length === 0
            ) {

                return res.status(404).json({

                    mensagem:
                        "❌ Gmail ou telefone não correspondem a uma conta."

                });

            }


            /*
               Guardamos no servidor qual usuário
               está realizando a recuperação.
            */

            req.session.recuperacao = {

                usuarioId:
                    usuarios[0].id,

                criadaEm:
                    Date.now()

            };


            return res.json({

                mensagem:
                    "✅ Dados confirmados!"

            });


        } catch (erro) {

            console.error(
                "❌ Erro na recuperação:",
                erro
            );


            return res.status(500).json({

                mensagem:
                    "❌ Erro interno no servidor."

            });

        }

    }
);


/* =====================================================
   NOVA SENHA
   ===================================================== */

app.put(
    "/api/nova-senha",
    limiteRecuperacao,
    async (req, res) => {

        try {

            const senha =
                req.body.senha;


            if (
                !senhaValida(senha)
            ) {

                return res.status(400).json({

                    mensagem:
                        "❌ A senha precisa ter no mínimo 7 caracteres, uma letra e um número."

                });

            }


            const recuperacao =
                req.session.recuperacao;


            if (
                !recuperacao
            ) {

                return res.status(401).json({

                    mensagem:
                        "❌ Solicitação de recuperação inválida ou expirada."

                });

            }


            /*
               A recuperação vale somente 10 minutos.
            */

            if (
                Date.now() -
                recuperacao.criadaEm >
                10 * 60 * 1000
            ) {

                delete req.session.recuperacao;


                return res.status(401).json({

                    mensagem:
                        "❌ A recuperação expirou. Comece novamente."

                });

            }


            const senhaCriptografada =
                await bcrypt.hash(
                    senha,
                    12
                );


            const [
                resultado
            ] =
                await banco.execute(

                    `UPDATE usuarios
                     SET senha = ?
                     WHERE id = ?`,

                    [
                        senhaCriptografada,

                        recuperacao.usuarioId
                    ]

                );


            delete req.session.recuperacao;


            if (
                resultado.affectedRows ===
                0
            ) {

                return res.status(404).json({

                    mensagem:
                        "❌ Usuário não encontrado."

                });

            }


            return res.json({

                mensagem:
                    "✅ Senha alterada com sucesso!"

            });


        } catch (erro) {

            console.error(
                "❌ Erro ao alterar senha:",
                erro
            );


            return res.status(500).json({

                mensagem:
                    "❌ Erro interno no servidor."

            });

        }

    }
);


/* =====================================================
   ADMINISTRADOR
   ===================================================== */

app.get(
    "/api/admin/usuarios",
    autenticar,
    somenteAdmin,
    async (req, res) => {

        try {

            const [
                usuarios
            ] =
                await banco.execute(

                    `SELECT
                        id,
                        nome,
                        gmail,
                        telefone,
                        data_registro,
                        nivel
                     FROM usuarios
                     ORDER BY id DESC`

                );


            return res.json({

                usuarios

            });


        } catch (erro) {

            console.error(
                "❌ Erro ao buscar usuários:",
                erro
            );


            return res.status(500).json({

                mensagem:
                    "❌ Erro interno no servidor."

            });

        }

    }
);


/* =====================================================
   INICIAR SERVIDOR
   ===================================================== */

app.listen(
    PORT,
    () => {

        console.log("");

        console.log(
            "================================="
        );

        console.log(
            "🚀 ONETOUCH ENERGY ONLINE"
        );

        console.log(
            "================================="
        );

        console.log(
            `🌐 http://localhost:${PORT}`
        );

        console.log(
            "================================="
        );

    }
);