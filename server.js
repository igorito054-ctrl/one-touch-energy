const express = require("express");
const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");
const session = require("express-session");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const path = require("path");
const crypto = require("crypto");

const app = express();

const PORT = Number(process.env.PORT) || 3000;

app.use(express.static(path.join(__dirname)));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/style.css", (req, res) => {
    res.type("text/css");
    res.sendFile(path.join(__dirname, "style.css"));
});

app.get("/script.js", (req, res) => {
    res.type("application/javascript");
    res.sendFile(path.join(__dirname, "script.js"));
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



const limiteSuporte =
    rateLimit({
        windowMs:
            15 * 60 * 1000,

        max: 20,

        standardHeaders: true,

        legacyHeaders: false,

        message: {
            mensagem:
                "Muitos chamados enviados em pouco tempo. Aguarde alguns minutos."
        }
    });



const limiteDispositivo =
    rateLimit({
        windowMs:
            60 * 1000,

        max: 180,

        standardHeaders: true,

        legacyHeaders: false,

        message: {
            mensagem:
                "Muitas requisições do dispositivo. Aguarde alguns instantes."
        }
    });


/* =====================================================
   CONEXÃO COM O MYSQL
   ===================================================== */

const banco =
    mysql.createPool({

        host:
            process.env.DB_HOST,

        port:
            Number(
                process.env.DB_PORT ||
                3306
            ),

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

function normalizarEmail(email) {

    return String(
        email || ""
    )
        .trim()
        .toLowerCase();

}


function normalizarGmail(email) {

    return normalizarEmail(
        email
    );

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

        empresa:
            usuario.empresa || "",

        endereco:
            usuario.endereco || "",

        data_registro:
            usuario.data_registro,

        nivel:
            usuario.nivel ||
            "usuario"
    };

}



/* =====================================================
   FUNÇÕES DE SEGURANÇA PARA CONTROLADORES
   ===================================================== */

function gerarControllerId() {

    return (
        "ctrl_" +
        crypto
            .randomBytes(8)
            .toString("hex")
    );

}


function gerarCodigoAtivacao() {

    return crypto
        .randomBytes(6)
        .toString("hex")
        .toUpperCase();

}


function gerarCredencialControlador() {

    return (
        "otc_" +
        crypto
            .randomBytes(32)
            .toString("hex")
    );

}


function hashSeguro(valor) {

    return crypto
        .createHash("sha256")
        .update(
            String(valor || "")
        )
        .digest("hex");

}


function extrairCredencialDispositivo(req) {

    const authorization =
        String(
            req.headers.authorization || ""
        ).trim();

    if (
        authorization
            .toLowerCase()
            .startsWith("bearer ")
    ) {

        return authorization
            .slice(7)
            .trim();

    }

    return String(
        req.headers["x-controller-key"] || ""
    ).trim();

}


async function autenticarDispositivo(
    req,
    res,
    next
) {

    try {

        const credencial =
            extrairCredencialDispositivo(
                req
            );

        if (!credencial) {

            return res.status(401).json({
                mensagem:
                    "Credencial do controlador não informada."
            });

        }


        const hash =
            hashSeguro(
                credencial
            );


        const [
            linhas
        ] =
            await banco.execute(
                `SELECT
                    dc.id AS credencial_id,
                    dc.controller_fk,
                    c.controller_id,
                    c.tenant_id,
                    c.site_id,
                    c.status,
                    c.revoked_at
                 FROM device_credentials dc
                 INNER JOIN controllers c
                    ON c.id = dc.controller_fk
                 WHERE dc.credential_hash = ?
                 AND dc.revoked_at IS NULL
                 LIMIT 1`,
                [
                    hash
                ]
            );


        if (
            linhas.length === 0
        ) {

            return res.status(401).json({
                mensagem:
                    "Credencial do controlador inválida ou revogada."
            });

        }


        const dispositivo =
            linhas[0];


        if (
            dispositivo.status !==
                "ativo" ||
            dispositivo.revoked_at
        ) {

            return res.status(403).json({
                mensagem:
                    "Controlador inativo ou revogado."
            });

        }


        req.controlador =
            dispositivo;


        next();


    } catch (erro) {

        console.error(
            "❌ Erro na autenticação do controlador:",
            erro
        );

        return res.status(500).json({
            mensagem:
                "Erro interno ao autenticar controlador."
        });

    }

}


async function usuarioPodeAcessarTenant(
    usuarioId,
    tenantId
) {

    const [
        linhas
    ] =
        await banco.execute(
            `SELECT 1
             FROM user_tenants
             WHERE usuario_id = ?
             AND tenant_id = ?
             LIMIT 1`,
            [
                usuarioId,
                tenantId
            ]
        );

    return (
        linhas.length > 0
    );

}


async function garantirTenantPadraoUsuario(
    usuarioId,
    empresa,
    endereco
) {

    const [
        vinculos
    ] =
        await banco.execute(
            `SELECT
                ut.tenant_id
             FROM user_tenants ut
             WHERE ut.usuario_id = ?
             LIMIT 1`,
            [
                usuarioId
            ]
        );


    if (
        vinculos.length > 0
    ) {

        return vinculos[0].tenant_id;

    }


    const [
        tenantResultado
    ] =
        await banco.execute(
            `INSERT INTO tenants
            (
                nome,
                status
            )
            VALUES
            (?, 'ativo')`,
            [
                empresa ||
                `Cliente ${usuarioId}`
            ]
        );


    const tenantId =
        tenantResultado.insertId;


    await banco.execute(
        `INSERT INTO user_tenants
        (
            usuario_id,
            tenant_id,
            papel
        )
        VALUES
        (?, ?, 'proprietario')`,
        [
            usuarioId,
            tenantId
        ]
    );


    await banco.execute(
        `INSERT INTO sites
        (
            tenant_id,
            nome,
            endereco,
            status
        )
        VALUES
        (?, 'Instalação principal', ?, 'ativo')`,
        [
            tenantId,
            endereco || null
        ]
    );


    return tenantId;

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

async function somenteAdmin(
    req,
    res,
    next
) {

    try {

        if (!req.session.usuario) {

            return res.status(401).json({
                mensagem:
                    "❌ Você precisa estar logado."
            });

        }


        const [
            usuarios
        ] =
            await banco.execute(
                `SELECT
                    id,
                    nivel
                 FROM usuarios
                 WHERE id = ?
                 LIMIT 1`,
                [
                    req.session.usuario.id
                ]
            );


        if (
            usuarios.length ===
            0
        ) {

            return res.status(401).json({
                mensagem:
                    "❌ Usuário da sessão não foi encontrado."
            });

        }


        const nivelAtual =
            String(
                usuarios[0].nivel ||
                ""
            )
                .trim()
                .toLowerCase();


        /*
           Atualiza a sessão com o nível REAL do banco.
           Assim, uma sessão antiga não mantém permissões
           desatualizadas depois de alterar o usuário.
        */
        req.session.usuario.nivel =
            nivelAtual;


        if (
            nivelAtual !==
            "admin"
        ) {

            return res.status(403).json({
                mensagem:
                    "❌ Acesso negado. Apenas administradores."
            });

        }


        next();


    } catch (erro) {

        console.error(
            "❌ Erro ao validar administrador:",
            erro
        );


        return res.status(500).json({
            mensagem:
                "❌ Não foi possível validar a permissão administrativa."
        });

    }

}



/* =====================================================
   PREPARAR ESTRUTURA DO BANCO
   ===================================================== */

async function colunaExiste(
    tabela,
    coluna
) {

    const [
        linhas
    ] =
        await banco.execute(
            `SELECT COLUMN_NAME
             FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = ?
             AND TABLE_NAME = ?
             AND COLUMN_NAME = ?
             LIMIT 1`,
            [
                process.env.DB_NAME,
                tabela,
                coluna
            ]
        );

    return (
        linhas.length > 0
    );

}


async function garantirColuna(
    tabela,
    coluna,
    definicao
) {

    const existe =
        await colunaExiste(
            tabela,
            coluna
        );

    if (!existe) {

        await banco.query(
            `ALTER TABLE ${tabela}
             ADD COLUMN ${coluna} ${definicao}`
        );

        console.log(
            `✅ Coluna criada: ${tabela}.${coluna}`
        );

    }

}


async function prepararEstruturaBanco() {

    try {

        await garantirColuna(
            "usuarios",
            "empresa",
            "VARCHAR(150) NULL"
        );

        await garantirColuna(
            "usuarios",
            "endereco",
            "VARCHAR(255) NULL"
        );


        await banco.query(
            `CREATE TABLE IF NOT EXISTS chamados_suporte (
                id INT AUTO_INCREMENT PRIMARY KEY,
                usuario_id INT NULL,
                nome VARCHAR(120) NOT NULL,
                email VARCHAR(160) NOT NULL,
                telefone VARCHAR(20) NULL,
                categoria VARCHAR(80) NOT NULL,
                prioridade VARCHAR(30) NOT NULL,
                assunto VARCHAR(180) NOT NULL,
                descricao TEXT NOT NULL,
                status VARCHAR(30) NOT NULL DEFAULT 'aberto',
                data_abertura TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_chamados_usuario (usuario_id),
                INDEX idx_chamados_status (status),
                INDEX idx_chamados_data (data_abertura)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
        );





        await banco.query(
            `CREATE TABLE IF NOT EXISTS solicitacoes_instalacao (
                id INT AUTO_INCREMENT PRIMARY KEY,
                usuario_id INT NOT NULL,
                nome_instalacao VARCHAR(180) NOT NULL,
                endereco VARCHAR(255) NOT NULL,
                equipamento VARCHAR(180) NOT NULL,
                modelo VARCHAR(180) NULL,
                serial VARCHAR(180) NOT NULL,
                observacoes TEXT NULL,
                status VARCHAR(30) NOT NULL DEFAULT 'pendente',
                admin_id INT NULL,
                tenant_id INT NULL,
                site_id INT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                    ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_solicitacao_usuario (usuario_id),
                INDEX idx_solicitacao_status (status),
                INDEX idx_solicitacao_serial (serial)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
        );

        await banco.query(
            `CREATE TABLE IF NOT EXISTS tenants (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nome VARCHAR(180) NOT NULL,
                status VARCHAR(30) NOT NULL DEFAULT 'ativo',
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_tenants_status (status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
        );


        await banco.query(
            `CREATE TABLE IF NOT EXISTS user_tenants (
                id INT AUTO_INCREMENT PRIMARY KEY,
                usuario_id INT NOT NULL,
                tenant_id INT NOT NULL,
                papel VARCHAR(40) NOT NULL DEFAULT 'usuario',
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY uq_user_tenant (usuario_id, tenant_id),
                INDEX idx_user_tenants_usuario (usuario_id),
                INDEX idx_user_tenants_tenant (tenant_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
        );


        await banco.query(
            `CREATE TABLE IF NOT EXISTS sites (
                id INT AUTO_INCREMENT PRIMARY KEY,
                tenant_id INT NOT NULL,
                nome VARCHAR(180) NOT NULL,
                endereco VARCHAR(255) NULL,
                status VARCHAR(30) NOT NULL DEFAULT 'ativo',
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_sites_tenant (tenant_id),
                INDEX idx_sites_status (status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
        );


        await banco.query(
            `CREATE TABLE IF NOT EXISTS controllers (
                id INT AUTO_INCREMENT PRIMARY KEY,
                controller_id VARCHAR(80) NOT NULL UNIQUE,
                tenant_id INT NOT NULL,
                site_id INT NOT NULL,
                nome VARCHAR(180) NOT NULL,
                status VARCHAR(30) NOT NULL DEFAULT 'aguardando_ativacao',
                firmware_version VARCHAR(80) NULL,
                activation_code_hash CHAR(64) NULL,
                activation_expires_at DATETIME NULL,
                activation_used_at DATETIME NULL,
                last_seen_at DATETIME NULL,
                revoked_at DATETIME NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_controllers_tenant (tenant_id),
                INDEX idx_controllers_site (site_id),
                INDEX idx_controllers_status (status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
        );


        await banco.query(
            `CREATE TABLE IF NOT EXISTS device_credentials (
                id INT AUTO_INCREMENT PRIMARY KEY,
                controller_fk INT NOT NULL,
                credential_hash CHAR(64) NOT NULL UNIQUE,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                last_used_at DATETIME NULL,
                revoked_at DATETIME NULL,
                INDEX idx_device_credentials_controller (controller_fk)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
        );


        await banco.query(
            `CREATE TABLE IF NOT EXISTS field_devices (
                id INT AUTO_INCREMENT PRIMARY KEY,
                controller_fk INT NOT NULL,
                device_id VARCHAR(120) NOT NULL,
                nome VARCHAR(180) NULL,
                protocol VARCHAR(40) NULL,
                modbus_address INT NULL,
                status VARCHAR(30) NOT NULL DEFAULT 'ativo',
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY uq_field_device_controller (controller_fk, device_id),
                INDEX idx_field_devices_controller (controller_fk)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
        );


        await banco.query(
            `CREATE TABLE IF NOT EXISTS telemetry (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                controller_fk INT NOT NULL,
                field_device_id INT NULL,
                device_id VARCHAR(120) NOT NULL,
                protocol_version VARCHAR(20) NOT NULL DEFAULT '1.0',
                sequence_id BIGINT NOT NULL,
                timestamp_utc DATETIME(3) NOT NULL,
                data JSON NOT NULL,
                quality VARCHAR(30) NOT NULL DEFAULT 'GOOD',
                received_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
                UNIQUE KEY uq_telemetry_sequence
                    (controller_fk, device_id, sequence_id),
                INDEX idx_telemetry_controller_time
                    (controller_fk, timestamp_utc),
                INDEX idx_telemetry_device_time
                    (device_id, timestamp_utc)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
        );




        await garantirColuna(
            "controllers",
            "equipment_serial",
            "VARCHAR(180) NULL"
        );

        await garantirColuna(
            "controllers",
            "equipment_model",
            "VARCHAR(180) NULL"
        );

        console.log(
            "✅ Estrutura de clientes, suporte e IoT pronta."
        );

    } catch (erro) {

        console.error(
            "❌ Não foi possível preparar a estrutura do banco:",
            erro.message
        );

    }

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
                normalizarEmail(
                    req.body.gmail
                );


            const telefone =
                limparTelefone(
                    req.body.telefone
                );


            const empresa =
                String(
                    req.body.empresa || ""
                ).trim();


            const endereco =
                String(
                    req.body.endereco || ""
                ).trim();


            const senha =
                req.body.senha;


            if (
                !nome ||
                !gmail ||
                !telefone ||
                !empresa ||
                !endereco ||
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
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(
                    gmail
                )
            ) {

                return res.status(400).json({

                    mensagem:
                        "❌ Informe um e-mail válido."

                });

            }


            if (
                telefone.length < 10 ||
                telefone.length > 11
            ) {

                return res.status(400).json({

                    mensagem:
                        "❌ Telefone inválido."

                });

            }


            if (
                empresa.length < 2 ||
                empresa.length > 150
            ) {

                return res.status(400).json({

                    mensagem:
                        "❌ Informe o nome da empresa."

                });

            }


            if (
                endereco.length < 5 ||
                endereco.length > 255
            ) {

                return res.status(400).json({

                    mensagem:
                        "❌ Informe um endereço válido."

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
                        "❌ Este e-mail já está cadastrado."

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

                    `INSERT INTO usuarios
                    (
                        nome,
                        gmail,
                        telefone,
                        empresa,
                        endereco,
                        senha,
                        nivel
                    )
                     VALUES
                     (?, ?, ?, ?, ?, ?, 'usuario')`,

                    [
                        nome,
                        gmail,
                        telefone,
                        empresa,
                        endereco,
                        senhaCriptografada
                    ]

                );

            const [
                novoUsuario
            ] =
                await banco.execute(

                    `SELECT
                        id,
                        nome,
                        gmail,
                        telefone,
                        empresa,
                        endereco,
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
                    "✅ Conta criada com sucesso. Agora envie os dados da instalação para análise da equipe OneTouch.",

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
                        "❌ Este e-mail já está cadastrado."

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
                        empresa,
                        endereco,
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

            const usuarioSessao =
                dadosPublicos(
                    usuario
                );


            /*
               Cria uma sessão NOVA a cada login.
               Isso impede que a identidade do cliente anterior
               permaneça presa ao mesmo cookie do navegador.
            */
            await new Promise(
                function(resolve, reject) {

                    req.session.regenerate(
                        function(erro) {

                            if (erro) {

                                reject(
                                    erro
                                );

                                return;

                            }


                            resolve();

                        }
                    );

                }
            );


            req.session.usuario =
                usuarioSessao;


            await new Promise(
                function(resolve, reject) {

                    req.session.save(
                        function(erro) {

                            if (erro) {

                                reject(
                                    erro
                                );

                                return;

                            }


                            resolve();

                        }
                    );

                }
            );


            return res.json({

                mensagem:
                    "✅ Login realizado com sucesso!",

                usuario:
                    usuarioSessao

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
                        empresa,
                        endereco,
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


            await new Promise(
                function(resolve, reject) {

                    req.session.save(
                        function(erro) {

                            if (erro) {

                                reject(
                                    erro
                                );

                                return;

                            }


                            resolve();

                        }
                    );

                }
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
   SESSÃO ATIVA
   ===================================================== */

app.get(
    "/api/session-status",
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
                        nivel
                     FROM usuarios
                     WHERE id = ?
                     LIMIT 1`,
                    [
                        req.session.usuario.id
                    ]
                );


            if (
                usuarios.length ===
                0
            ) {

                return res.status(401).json({
                    mensagem:
                        "Usuário da sessão não encontrado."
                });

            }


            const usuario =
                usuarios[0];


            return res.json({
                autenticado:
                    true,
                usuario: {
                    id:
                        usuario.id,
                    nome:
                        usuario.nome,
                    gmail:
                        usuario.gmail,
                    nivel:
                        String(
                            usuario.nivel ||
                            ""
                        )
                            .trim()
                            .toLowerCase()
                }
            });


        } catch (erro) {

            console.error(
                "❌ Erro ao consultar sessão:",
                erro
            );


            return res.status(500).json({
                mensagem:
                    "Não foi possível consultar a sessão."
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
   INSTALAÇÃO DO CLIENTE / APROVAÇÃO ADMINISTRATIVA
   ===================================================== */

app.get(
    "/api/installation/status",
    autenticar,
    async (req, res) => {

        try {

            const usuarioId =
                req.session.usuario.id;


            const [
                estrutura
            ] =
                await banco.execute(
                    `SELECT
                        ut.tenant_id,
                        s.id AS site_id,
                        s.nome AS site_nome,
                        (
                            SELECT COUNT(*)
                            FROM controllers c
                            WHERE c.tenant_id = ut.tenant_id
                            AND c.site_id = s.id
                            AND c.status <> 'revogado'
                        ) AS controllers_count
                     FROM user_tenants ut
                     INNER JOIN sites s
                        ON s.tenant_id = ut.tenant_id
                     WHERE ut.usuario_id = ?
                     AND s.status = 'ativo'
                     ORDER BY s.id ASC
                     LIMIT 1`,
                    [
                        usuarioId
                    ]
                );


            const configurado =
                estrutura.length > 0 &&
                Number(
                    estrutura[0].controllers_count ||
                    0
                ) > 0;


            const [
                solicitacoes
            ] =
                await banco.execute(
                    `SELECT
                        id,
                        nome_instalacao,
                        endereco,
                        equipamento,
                        modelo,
                        serial,
                        observacoes,
                        status,
                        tenant_id,
                        site_id,
                        created_at,
                        updated_at
                     FROM solicitacoes_instalacao
                     WHERE usuario_id = ?
                     ORDER BY id DESC
                     LIMIT 1`,
                    [
                        usuarioId
                    ]
                );


            return res.json({
                configurado,
                estrutura:
                    estrutura[0] ||
                    null,
                solicitacao:
                    solicitacoes[0] ||
                    null
            });


        } catch (erro) {

            console.error(
                "❌ Erro ao consultar status da instalação:",
                erro
            );


            return res.status(500).json({
                mensagem:
                    "Não foi possível consultar o status da instalação."
            });

        }

    }
);


app.post(
    "/api/installation/request",
    autenticar,
    async (req, res) => {

        try {

            const usuarioId =
                req.session.usuario.id;

            const nomeInstalacao =
                String(
                    req.body.nome_instalacao ||
                    ""
                ).trim();

            const endereco =
                String(
                    req.body.endereco ||
                    ""
                ).trim();

            const equipamento =
                String(
                    req.body.equipamento ||
                    ""
                ).trim();

            const modelo =
                String(
                    req.body.modelo ||
                    ""
                ).trim();

            const serial =
                String(
                    req.body.serial ||
                    ""
                ).trim();

            const observacoes =
                String(
                    req.body.observacoes ||
                    ""
                ).trim();


            if (
                !nomeInstalacao ||
                !endereco ||
                !equipamento ||
                !serial
            ) {

                return res.status(400).json({
                    mensagem:
                        "Preencha instalação, endereço, equipamento e serial."
                });

            }


            const [
                estruturaExistente
            ] =
                await banco.execute(
                    `SELECT
                        c.id
                     FROM user_tenants ut
                     INNER JOIN controllers c
                        ON c.tenant_id = ut.tenant_id
                     WHERE ut.usuario_id = ?
                     AND c.status <> 'revogado'
                     LIMIT 1`,
                    [
                        usuarioId
                    ]
                );


            if (
                estruturaExistente.length >
                0
            ) {

                return res.status(409).json({
                    mensagem:
                        "Sua instalação já está configurada."
                });

            }


            const [
                pendentes
            ] =
                await banco.execute(
                    `SELECT id
                     FROM solicitacoes_instalacao
                     WHERE usuario_id = ?
                     AND status IN ('pendente', 'em_analise', 'aprovada')
                     ORDER BY id DESC
                     LIMIT 1`,
                    [
                        usuarioId
                    ]
                );


            if (
                pendentes.length > 0
            ) {

                await banco.execute(
                    `UPDATE solicitacoes_instalacao
                     SET
                        nome_instalacao = ?,
                        endereco = ?,
                        equipamento = ?,
                        modelo = ?,
                        serial = ?,
                        observacoes = ?,
                        status = 'pendente',
                        admin_id = NULL
                     WHERE id = ?`,
                    [
                        nomeInstalacao,
                        endereco,
                        equipamento,
                        modelo || null,
                        serial,
                        observacoes || null,
                        pendentes[0].id
                    ]
                );


                return res.json({
                    mensagem:
                        "✅ Solicitação atualizada e enviada novamente para análise."
                });

            }


            await banco.execute(
                `INSERT INTO solicitacoes_instalacao
                (
                    usuario_id,
                    nome_instalacao,
                    endereco,
                    equipamento,
                    modelo,
                    serial,
                    observacoes,
                    status
                )
                VALUES
                (?, ?, ?, ?, ?, ?, ?, 'pendente')`,
                [
                    usuarioId,
                    nomeInstalacao,
                    endereco,
                    equipamento,
                    modelo || null,
                    serial,
                    observacoes || null
                ]
            );


            return res.status(201).json({
                mensagem:
                    "✅ Solicitação enviada. Um administrador precisa configurar a instalação antes da liberação dos dados."
            });


        } catch (erro) {

            console.error(
                "❌ Erro ao enviar solicitação de instalação:",
                erro
            );


            return res.status(500).json({
                mensagem:
                    "Não foi possível enviar a solicitação."
            });

        }

    }
);


app.get(
    "/api/admin/installation-requests",
    autenticar,
    somenteAdmin,
    async (req, res) => {

        try {

            const [
                solicitacoes
            ] =
                await banco.execute(
                    `SELECT
                        si.id,
                        si.usuario_id,
                        si.nome_instalacao,
                        si.endereco,
                        si.equipamento,
                        si.modelo,
                        si.serial,
                        si.observacoes,
                        si.status,
                        si.tenant_id,
                        si.site_id,
                        si.created_at,
                        si.updated_at,
                        u.nome AS cliente_nome,
                        u.gmail AS cliente_email,
                        u.telefone AS cliente_telefone,
                        u.empresa AS cliente_empresa
                     FROM solicitacoes_instalacao si
                     INNER JOIN usuarios u
                        ON u.id = si.usuario_id
                     ORDER BY
                        CASE
                            WHEN si.status = 'pendente' THEN 0
                            WHEN si.status = 'em_analise' THEN 1
                            ELSE 2
                        END,
                        si.id DESC`
                );


            return res.json({
                solicitacoes
            });


        } catch (erro) {

            console.error(
                "❌ Erro ao listar solicitações:",
                erro
            );


            return res.status(500).json({
                mensagem:
                    "Não foi possível listar as solicitações."
            });

        }

    }
);


app.post(
    "/api/admin/installation-requests/:id/approve",
    autenticar,
    somenteAdmin,
    async (req, res) => {

        const conexao =
            await banco.getConnection();

        try {

            const solicitacaoId =
                Number(
                    req.params.id
                );

            const tenantNome =
                String(
                    req.body.tenant_nome ||
                    ""
                ).trim();

            const siteNome =
                String(
                    req.body.site_nome ||
                    ""
                ).trim();

            const siteEndereco =
                String(
                    req.body.site_endereco ||
                    ""
                ).trim();


            if (
                !Number.isInteger(
                    solicitacaoId
                ) ||
                solicitacaoId <= 0
            ) {

                return res.status(400).json({
                    mensagem:
                        "Solicitação inválida."
                });

            }


            if (
                !tenantNome ||
                !siteNome ||
                !siteEndereco
            ) {

                return res.status(400).json({
                    mensagem:
                        "Informe nome do cliente/tenant, nome da instalação e endereço."
                });

            }


            await conexao.beginTransaction();


            const [
                solicitacoes
            ] =
                await conexao.execute(
                    `SELECT
                        si.*,
                        u.nome AS cliente_nome,
                        u.empresa AS cliente_empresa
                     FROM solicitacoes_instalacao si
                     INNER JOIN usuarios u
                        ON u.id = si.usuario_id
                     WHERE si.id = ?
                     LIMIT 1
                     FOR UPDATE`,
                    [
                        solicitacaoId
                    ]
                );


            if (
                solicitacoes.length ===
                0
            ) {

                await conexao.rollback();

                return res.status(404).json({
                    mensagem:
                        "Solicitação não encontrada."
                });

            }


            const solicitacao =
                solicitacoes[0];


            let tenantId =
                null;


            const [
                vinculos
            ] =
                await conexao.execute(
                    `SELECT tenant_id
                     FROM user_tenants
                     WHERE usuario_id = ?
                     ORDER BY id ASC
                     LIMIT 1`,
                    [
                        solicitacao.usuario_id
                    ]
                );


            if (
                vinculos.length >
                0
            ) {

                tenantId =
                    vinculos[0].tenant_id;

            } else {

                const [
                    tenantCriado
                ] =
                    await conexao.execute(
                        `INSERT INTO tenants
                        (
                            nome,
                            status
                        )
                        VALUES
                        (?, 'ativo')`,
                        [
                            tenantNome
                        ]
                    );


                tenantId =
                    tenantCriado.insertId;


                await conexao.execute(
                    `INSERT INTO user_tenants
                    (
                        usuario_id,
                        tenant_id,
                        papel
                    )
                    VALUES
                    (?, ?, 'proprietario')`,
                    [
                        solicitacao.usuario_id,
                        tenantId
                    ]
                );

            }


            const [
                siteCriado
            ] =
                await conexao.execute(
                    `INSERT INTO sites
                    (
                        tenant_id,
                        nome,
                        endereco,
                        status
                    )
                    VALUES
                    (?, ?, ?, 'ativo')`,
                    [
                        tenantId,
                        siteNome,
                        siteEndereco
                    ]
                );


            const siteId =
                siteCriado.insertId;


            await conexao.execute(
                `UPDATE solicitacoes_instalacao
                 SET
                    status = 'aprovada',
                    admin_id = ?,
                    tenant_id = ?,
                    site_id = ?
                 WHERE id = ?`,
                [
                    req.session.usuario.id,
                    tenantId,
                    siteId,
                    solicitacaoId
                ]
            );


            await conexao.commit();


            return res.json({
                mensagem:
                    "✅ Estrutura aprovada. Agora cadastre o controlador usando os IDs retornados.",
                tenant_id:
                    tenantId,
                site_id:
                    siteId,
                equipamento: {
                    nome:
                        solicitacao.equipamento,
                    modelo:
                        solicitacao.modelo,
                    serial:
                        solicitacao.serial
                }
            });


        } catch (erro) {

            try {

                await conexao.rollback();

            } catch (erroRollback) {

            }


            console.error(
                "❌ Erro ao aprovar instalação:",
                erro
            );


            return res.status(500).json({
                mensagem:
                    "Não foi possível aprovar a instalação."
            });


        } finally {

            conexao.release();

        }

    }
);



/* =====================================================
   SUPORTE
   ===================================================== */

app.post(
    "/api/suporte",
    limiteSuporte,
    async (req, res) => {

        try {

            if (!req.session.usuario) {

                return res.status(401).json({

                    mensagem:
                        "❌ Faça login com uma conta de cliente para abrir um chamado."

                });

            }


            const usuarioId =
                req.session.usuario.id;


            const categoria =
                String(
                    req.body.categoria || ""
                ).trim();


            const prioridade =
                String(
                    req.body.prioridade || ""
                ).trim();


            const assunto =
                String(
                    req.body.assunto || ""
                ).trim();


            const descricao =
                String(
                    req.body.descricao || ""
                ).trim();


            if (
                !categoria ||
                !prioridade ||
                !assunto ||
                !descricao
            ) {

                return res.status(400).json({

                    mensagem:
                        "❌ Preencha todos os campos do chamado."

                });

            }


            if (
                assunto.length > 180 ||
                descricao.length > 4000
            ) {

                return res.status(400).json({

                    mensagem:
                        "❌ O chamado ultrapassou o limite de caracteres."

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
                        telefone
                     FROM usuarios
                     WHERE id = ?
                     LIMIT 1`,
                    [
                        usuarioId
                    ]
                );


            if (
                usuarios.length === 0
            ) {

                return res.status(404).json({

                    mensagem:
                        "❌ Usuário não encontrado."

                });

            }


            const usuario =
                usuarios[0];


            const [
                resultado
            ] =
                await banco.execute(
                    `INSERT INTO chamados_suporte
                    (
                        usuario_id,
                        nome,
                        email,
                        telefone,
                        categoria,
                        prioridade,
                        assunto,
                        descricao,
                        status
                    )
                     VALUES
                     (?, ?, ?, ?, ?, ?, ?, ?, 'aberto')`,
                    [
                        usuario.id,
                        usuario.nome,
                        usuario.gmail,
                        usuario.telefone,
                        categoria,
                        prioridade,
                        assunto,
                        descricao
                    ]
                );


            return res.status(201).json({

                mensagem:
                    "✅ Chamado enviado com sucesso!",

                chamado: {

                    id:
                        resultado.insertId,

                    status:
                        "aberto"

                }

            });


        } catch (erro) {

            console.error(
                "❌ Erro ao abrir chamado:",
                erro
            );


            return res.status(500).json({

                mensagem:
                    "❌ Não foi possível registrar o chamado."

            });

        }

    }
);



/* =====================================================
   CONTROLADORES / IOT
   ===================================================== */

app.post(
    "/api/admin/controllers",
    autenticar,
    somenteAdmin,
    async (req, res) => {

        try {

            const tenantId =
                Number(
                    req.body.tenant_id
                );

            const siteId =
                Number(
                    req.body.site_id
                );

            const nome =
                String(
                    req.body.nome ||
                    "Controlador OneTouch"
                ).trim();


            if (
                !Number.isInteger(tenantId) ||
                !Number.isInteger(siteId) ||
                !nome
            ) {

                return res.status(400).json({
                    mensagem:
                        "Informe tenant_id, site_id e nome válidos."
                });

            }


            const [
                site
            ] =
                await banco.execute(
                    `SELECT id
                     FROM sites
                     WHERE id = ?
                     AND tenant_id = ?
                     AND status = 'ativo'
                     LIMIT 1`,
                    [
                        siteId,
                        tenantId
                    ]
                );


            if (
                site.length === 0
            ) {

                return res.status(404).json({
                    mensagem:
                        "Site não encontrado para este tenant."
                });

            }


            const controllerId =
                gerarControllerId();

            const codigoAtivacao =
                gerarCodigoAtivacao();

            const codigoHash =
                hashSeguro(
                    codigoAtivacao
                );


            await banco.execute(
                `INSERT INTO controllers
                (
                    controller_id,
                    tenant_id,
                    site_id,
                    nome,
                    status,
                    activation_code_hash,
                    activation_expires_at
                )
                VALUES
                (
                    ?, ?, ?, ?,
                    'aguardando_ativacao',
                    ?,
                    DATE_ADD(NOW(), INTERVAL 15 MINUTE)
                )`,
                [
                    controllerId,
                    tenantId,
                    siteId,
                    nome,
                    codigoHash
                ]
            );


            return res.status(201).json({

                mensagem:
                    "Controlador criado. O código de ativação expira em 15 minutos.",

                controlador: {
                    controller_id:
                        controllerId,

                    activation_code:
                        codigoAtivacao,

                    tenant_id:
                        tenantId,

                    site_id:
                        siteId
                }

            });


        } catch (erro) {

            console.error(
                "❌ Erro ao criar controlador:",
                erro
            );

            return res.status(500).json({
                mensagem:
                    "Não foi possível criar o controlador."
            });

        }

    }
);


app.get(
    "/api/admin/controllers",
    autenticar,
    somenteAdmin,
    async (req, res) => {

        try {

            const [
                controladores
            ] =
                await banco.execute(
                    `SELECT
                        c.id,
                        c.controller_id,
                        c.nome,
                        c.status,
                        c.firmware_version,
                        c.last_seen_at,
                        c.revoked_at,
                        c.created_at,
                        c.equipment_serial,
                        c.equipment_model,
                        t.nome AS tenant,
                        s.nome AS site
                     FROM controllers c
                     INNER JOIN tenants t
                        ON t.id = c.tenant_id
                     INNER JOIN sites s
                        ON s.id = c.site_id
                     ORDER BY c.id DESC`
                );


            return res.json({
                controladores
            });


        } catch (erro) {

            console.error(
                "❌ Erro ao listar controladores:",
                erro
            );

            return res.status(500).json({
                mensagem:
                    "Não foi possível listar os controladores."
            });

        }

    }
);




/* =====================================================
   ADMIN - SEGURANÇA DE CONTROLADORES
   ===================================================== */



/* =====================================================
   REGERAR CÓDIGO DE ATIVAÇÃO
   ===================================================== */



/* =====================================================
   VINCULAR EQUIPAMENTO / SERIAL AO CONTROLADOR
   ===================================================== */

app.post(
    "/api/admin/controllers/:controllerId/equipment",
    autenticar,
    somenteAdmin,
    async (req, res) => {

        try {

            const controllerId =
                String(
                    req.params.controllerId ||
                    ""
                ).trim();

            const serial =
                String(
                    req.body.serial ||
                    ""
                ).trim();

            const modelo =
                String(
                    req.body.modelo ||
                    ""
                ).trim();


            if (
                !controllerId ||
                !serial
            ) {

                return res.status(400).json({
                    mensagem:
                        "Controller ID e serial são obrigatórios."
                });

            }


            const [
                controladores
            ] =
                await banco.execute(
                    `SELECT
                        id,
                        controller_id,
                        tenant_id,
                        site_id,
                        status
                     FROM controllers
                     WHERE controller_id = ?
                     LIMIT 1`,
                    [
                        controllerId
                    ]
                );


            if (
                controladores.length ===
                0
            ) {

                return res.status(404).json({
                    mensagem:
                        "Controlador não encontrado."
                });

            }


            await banco.execute(
                `UPDATE controllers
                 SET
                    equipment_serial = ?,
                    equipment_model = ?
                 WHERE id = ?`,
                [
                    serial,
                    modelo || null,
                    controladores[0].id
                ]
            );


            return res.json({
                mensagem:
                    "✅ Equipamento vinculado ao controlador com sucesso.",
                controller_id:
                    controllerId,
                serial,
                modelo:
                    modelo || null
            });


        } catch (erro) {

            console.error(
                "❌ Erro ao vincular equipamento:",
                erro
            );


            return res.status(500).json({
                mensagem:
                    "Não foi possível vincular o equipamento."
            });

        }

    }
);



app.post(
    "/api/admin/controllers/:controllerId/regenerate-activation",
    autenticar,
    somenteAdmin,
    async (req, res) => {

        try {

            const controllerId =
                String(
                    req.params.controllerId ||
                    ""
                ).trim();


            if (!controllerId) {

                return res.status(400).json({
                    mensagem:
                        "Controller ID inválido."
                });

            }


            const [
                controladores
            ] =
                await banco.execute(
                    `SELECT
                        id,
                        controller_id,
                        status,
                        activation_used_at,
                        revoked_at
                     FROM controllers
                     WHERE controller_id = ?
                     LIMIT 1`,
                    [
                        controllerId
                    ]
                );


            if (
                controladores.length ===
                0
            ) {

                return res.status(404).json({
                    mensagem:
                        "Controlador não encontrado."
                });

            }


            const controlador =
                controladores[0];


            if (
                controlador.revoked_at ||
                String(
                    controlador.status ||
                    ""
                )
                    .trim()
                    .toLowerCase() ===
                    "revogado"
            ) {

                return res.status(409).json({
                    mensagem:
                        "Controlador revogado não pode receber novo código de ativação."
                });

            }


            if (
                controlador.activation_used_at
            ) {

                return res.status(409).json({
                    mensagem:
                        "Este controlador já foi provisionado. Use rotação de credencial."
                });

            }


            const novoCodigo =
                gerarCodigoAtivacao();

            const novoHash =
                hashSeguro(
                    novoCodigo
                );


            await banco.execute(
                `UPDATE controllers
                 SET
                    status = 'aguardando_ativacao',
                    activation_code_hash = ?,
                    activation_expires_at = DATE_ADD(NOW(), INTERVAL 15 MINUTE)
                 WHERE id = ?`,
                [
                    novoHash,
                    controlador.id
                ]
            );


            res.set(
                "Cache-Control",
                "no-store"
            );


            return res.json({
                mensagem:
                    "Novo código de ativação gerado com sucesso. Ele expira em 15 minutos.",
                controller_id:
                    controlador.controller_id,
                activation_code:
                    novoCodigo,
                expires_in_minutes:
                    15
            });


        } catch (erro) {

            console.error(
                "❌ Erro ao regenerar código de ativação:",
                erro
            );


            return res.status(500).json({
                mensagem:
                    "Não foi possível gerar um novo código de ativação."
            });

        }

    }
);



app.post(
    "/api/admin/controllers/:controllerId/rotate-credential",
    autenticar,
    somenteAdmin,
    async (req, res) => {

        const conexao =
            await banco.getConnection();

        try {

            const controllerId =
                String(
                    req.params.controllerId || ""
                ).trim();


            if (!controllerId) {

                return res.status(400).json({
                    mensagem:
                        "Controller ID inválido."
                });

            }


            await conexao.beginTransaction();


            const [
                controladores
            ] =
                await conexao.execute(
                    `SELECT
                        id,
                        controller_id,
                        status,
                        revoked_at
                     FROM controllers
                     WHERE controller_id = ?
                     LIMIT 1
                     FOR UPDATE`,
                    [
                        controllerId
                    ]
                );


            if (
                controladores.length === 0
            ) {

                await conexao.rollback();

                return res.status(404).json({
                    mensagem:
                        "Controlador não encontrado."
                });

            }


            const controlador =
                controladores[0];


            if (
                controlador.revoked_at ||
                controlador.status ===
                    "revogado"
            ) {

                await conexao.rollback();

                return res.status(409).json({
                    mensagem:
                        "Não é possível rotacionar a credencial de um controlador revogado."
                });

            }


            const novaCredencial =
                gerarCredencialControlador();


            await conexao.execute(
                `UPDATE device_credentials
                 SET revoked_at = NOW()
                 WHERE controller_fk = ?
                 AND revoked_at IS NULL`,
                [
                    controlador.id
                ]
            );


            await conexao.execute(
                `INSERT INTO device_credentials
                (
                    controller_fk,
                    credential_hash
                )
                VALUES
                (?, ?)`,
                [
                    controlador.id,
                    hashSeguro(
                        novaCredencial
                    )
                ]
            );


            await conexao.execute(
                `UPDATE controllers
                 SET
                    status = 'ativo',
                    last_seen_at = last_seen_at
                 WHERE id = ?`,
                [
                    controlador.id
                ]
            );


            await conexao.commit();


            res.set(
                "Cache-Control",
                "no-store"
            );


            return res.json({

                mensagem:
                    "Credencial rotacionada com sucesso. A credencial anterior foi revogada.",

                controller_id:
                    controlador.controller_id,

                credential:
                    novaCredencial,

                auth_type:
                    "Bearer"

            });


        } catch (erro) {

            try {

                await conexao.rollback();

            } catch (rollbackErro) {

            }


            console.error(
                "❌ Erro ao rotacionar credencial:",
                erro
            );


            return res.status(500).json({
                mensagem:
                    "Não foi possível rotacionar a credencial."
            });


        } finally {

            conexao.release();

        }

    }
);


app.post(
    "/api/admin/controllers/:controllerId/revoke",
    autenticar,
    somenteAdmin,
    async (req, res) => {

        const conexao =
            await banco.getConnection();

        try {

            const controllerId =
                String(
                    req.params.controllerId || ""
                ).trim();


            if (!controllerId) {

                return res.status(400).json({
                    mensagem:
                        "Controller ID inválido."
                });

            }


            await conexao.beginTransaction();


            const [
                controladores
            ] =
                await conexao.execute(
                    `SELECT
                        id,
                        controller_id,
                        status,
                        revoked_at
                     FROM controllers
                     WHERE controller_id = ?
                     LIMIT 1
                     FOR UPDATE`,
                    [
                        controllerId
                    ]
                );


            if (
                controladores.length === 0
            ) {

                await conexao.rollback();

                return res.status(404).json({
                    mensagem:
                        "Controlador não encontrado."
                });

            }


            const controlador =
                controladores[0];


            if (
                controlador.revoked_at ||
                controlador.status ===
                    "revogado"
            ) {

                await conexao.rollback();

                return res.status(200).json({
                    mensagem:
                        "Controlador já estava revogado.",
                    controller_id:
                        controlador.controller_id
                });

            }


            await conexao.execute(
                `UPDATE device_credentials
                 SET revoked_at = NOW()
                 WHERE controller_fk = ?
                 AND revoked_at IS NULL`,
                [
                    controlador.id
                ]
            );


            await conexao.execute(
                `UPDATE controllers
                 SET
                    status = 'revogado',
                    revoked_at = NOW()
                 WHERE id = ?`,
                [
                    controlador.id
                ]
            );


            await conexao.commit();


            return res.json({

                mensagem:
                    "Controlador e credenciais revogados com sucesso.",

                controller_id:
                    controlador.controller_id

            });


        } catch (erro) {

            try {

                await conexao.rollback();

            } catch (rollbackErro) {

            }


            console.error(
                "❌ Erro ao revogar controlador:",
                erro
            );


            return res.status(500).json({
                mensagem:
                    "Não foi possível revogar o controlador."
            });


        } finally {

            conexao.release();

        }

    }
);



app.post(
    "/api/v1/device/provision",
    limiteDispositivo,
    async (req, res) => {

        const conexao =
            await banco.getConnection();

        try {

            const controllerId =
                String(
                    req.body.controller_id || ""
                ).trim();

            const codigoAtivacao =
                String(
                    req.body.activation_code || ""
                ).trim();

            const firmwareVersion =
                String(
                    req.body.firmware_version || ""
                ).trim()
                .slice(0, 80);


            if (
                !controllerId ||
                !codigoAtivacao
            ) {

                return res.status(400).json({
                    mensagem:
                        "controller_id e activation_code são obrigatórios."
                });

            }


            await conexao.beginTransaction();


            const [
                controladores
            ] =
                await conexao.execute(
                    `SELECT
                        id,
                        controller_id,
                        status,
                        activation_code_hash,
                        activation_expires_at,
                        activation_used_at,
                        revoked_at
                     FROM controllers
                     WHERE controller_id = ?
                     LIMIT 1
                     FOR UPDATE`,
                    [
                        controllerId
                    ]
                );


            if (
                controladores.length === 0
            ) {

                await conexao.rollback();

                return res.status(404).json({
                    mensagem:
                        "Controlador não encontrado."
                });

            }


            const controlador =
                controladores[0];


            if (
                controlador.revoked_at
            ) {

                await conexao.rollback();

                return res.status(403).json({
                    mensagem:
                        "Controlador revogado."
                });

            }


            if (
                controlador.activation_used_at
            ) {

                await conexao.rollback();

                return res.status(409).json({
                    mensagem:
                        "Código de ativação já utilizado."
                });

            }


            if (
                !controlador.activation_expires_at ||
                new Date(
                    controlador.activation_expires_at
                ).getTime() <
                    Date.now()
            ) {

                await conexao.rollback();

                return res.status(410).json({
                    mensagem:
                        "Código de ativação expirado."
                });

            }


            if (
                hashSeguro(
                    codigoAtivacao
                ) !==
                controlador.activation_code_hash
            ) {

                await conexao.rollback();

                return res.status(401).json({
                    mensagem:
                        "Código de ativação inválido."
                });

            }


            const credencial =
                gerarCredencialControlador();


            await conexao.execute(
                `INSERT INTO device_credentials
                (
                    controller_fk,
                    credential_hash
                )
                VALUES
                (?, ?)`,
                [
                    controlador.id,
                    hashSeguro(
                        credencial
                    )
                ]
            );


            await conexao.execute(
                `UPDATE controllers
                 SET
                    status = 'ativo',
                    firmware_version = ?,
                    activation_used_at = NOW(),
                    activation_code_hash = NULL,
                    last_seen_at = NOW()
                 WHERE id = ?`,
                [
                    firmwareVersion || null,
                    controlador.id
                ]
            );


            await conexao.commit();


            return res.json({

                mensagem:
                    "Controlador provisionado com sucesso.",

                controller_id:
                    controllerId,

                credential:
                    credencial,

                auth_type:
                    "Bearer",

                telemetry_endpoint:
                    "/api/v1/device/telemetry"

            });


        } catch (erro) {

            await conexao.rollback();

            console.error(
                "❌ Erro no provisionamento:",
                erro
            );

            return res.status(500).json({
                mensagem:
                    "Não foi possível provisionar o controlador."
            });


        } finally {

            conexao.release();

        }

    }
);


app.post(
    "/api/v1/device/telemetry",
    limiteDispositivo,
    autenticarDispositivo,
    async (req, res) => {

        try {

            const protocolVersion =
                String(
                    req.body.protocol_version ||
                    "1.0"
                ).trim()
                .slice(0, 20);

            const sequenceId =
                Number(
                    req.body.sequence_id
                );

            const timestamp =
                new Date(
                    req.body.timestamp
                );

            const deviceId =
                String(
                    req.body.device_id || ""
                ).trim()
                .slice(0, 120);

            const data =
                req.body.data;

            const quality =
                String(
                    req.body.quality ||
                    "GOOD"
                ).trim()
                .slice(0, 30);


            if (
                !Number.isSafeInteger(
                    sequenceId
                ) ||
                sequenceId < 0 ||
                !deviceId ||
                !data ||
                typeof data !== "object" ||
                Array.isArray(data) ||
                Number.isNaN(
                    timestamp.getTime()
                )
            ) {

                return res.status(400).json({
                    mensagem:
                        "Payload de telemetria inválido."
                });

            }


            const [
                equipamentos
            ] =
                await banco.execute(
                    `SELECT id
                     FROM field_devices
                     WHERE controller_fk = ?
                     AND device_id = ?
                     LIMIT 1`,
                    [
                        req.controlador.controller_fk,
                        deviceId
                    ]
                );


            let fieldDeviceId;


            if (
                equipamentos.length === 0
            ) {

                const [
                    criado
                ] =
                    await banco.execute(
                        `INSERT INTO field_devices
                        (
                            controller_fk,
                            device_id,
                            nome,
                            status
                        )
                        VALUES
                        (?, ?, ?, 'ativo')`,
                        [
                            req.controlador.controller_fk,
                            deviceId,
                            deviceId
                        ]
                    );

                fieldDeviceId =
                    criado.insertId;

            } else {

                fieldDeviceId =
                    equipamentos[0].id;

            }


            const timestampMysql =
                timestamp
                    .toISOString()
                    .slice(0, 23)
                    .replace("T", " ");


            try {

                const [
                    resultado
                ] =
                    await banco.execute(
                        `INSERT INTO telemetry
                        (
                            controller_fk,
                            field_device_id,
                            device_id,
                            protocol_version,
                            sequence_id,
                            timestamp_utc,
                            data,
                            quality
                        )
                        VALUES
                        (?, ?, ?, ?, ?, ?, ?, ?)`,
                        [
                            req.controlador.controller_fk,
                            fieldDeviceId,
                            deviceId,
                            protocolVersion,
                            sequenceId,
                            timestampMysql,
                            JSON.stringify(data),
                            quality
                        ]
                    );


                await banco.execute(
                    `UPDATE controllers
                     SET last_seen_at = NOW()
                     WHERE id = ?`,
                    [
                        req.controlador.controller_fk
                    ]
                );


                await banco.execute(
                    `UPDATE device_credentials
                     SET last_used_at = NOW()
                     WHERE id = ?`,
                    [
                        req.controlador.credencial_id
                    ]
                );


                return res.status(201).json({

                    mensagem:
                        "Telemetria recebida.",

                    telemetry_id:
                        resultado.insertId,

                    controller_id:
                        req.controlador.controller_id,

                    sequence_id:
                        sequenceId

                });


            } catch (erro) {

                if (
                    erro.code ===
                    "ER_DUP_ENTRY"
                ) {

                    return res.status(200).json({

                        mensagem:
                            "Telemetria já recebida anteriormente.",

                        duplicate:
                            true,

                        sequence_id:
                            sequenceId

                    });

                }

                throw erro;

            }


        } catch (erro) {

            console.error(
                "❌ Erro ao receber telemetria:",
                erro
            );

            return res.status(500).json({
                mensagem:
                    "Não foi possível registrar a telemetria."
            });

        }

    }
);




/* =====================================================
   HISTÓRICO DE TELEMETRIA
   ===================================================== */




/* =====================================================
   EPCUBE - INTEGRAÇÃO REAL (REVISADA)
   ===================================================== */

const EPCUBE_BASE_URL =
    String(
        process.env.EPCUBE_BASE_URL ||
        "https://epcube-monitoring.com"
    )
        .trim()
        .replace(
            /\/+$/,
            ""
        );

const EPCUBE_TOKEN =
    String(
        process.env.EPCUBE_TOKEN ||
        ""
    ).trim();

const EPCUBE_SERIAL =
    String(
        process.env.EPCUBE_SERIAL ||
        ""
    ).trim();

const EPCUBE_DEV_ID =
    String(
        process.env.EPCUBE_DEV_ID ||
        ""
    ).trim();

const EPCUBE_USER_AGENT =
    String(
        process.env.EPCUBE_USER_AGENT ||
        "ReservoirMonitoring/2.6.0 (iPhone; iOS 18.7.9; Scale/2.00)"
    ).trim();

const EPCUBE_SYNC_INTERVAL_MS =
    Math.max(
        5,
        Number(
            process.env.EPCUBE_SYNC_MINUTES ||
            15
        )
    ) *
    60 *
    1000;


/*
   Retorna YYYY-MM-DD no fuso de São Paulo.
   Esse é o formato que observamos no app EPCube.
*/
function dataHojeSaoPaulo() {

    const partes =
        new Intl.DateTimeFormat(
            "en-CA",
            {
                timeZone:
                    "America/Sao_Paulo",

                year:
                    "numeric",

                month:
                    "2-digit",

                day:
                    "2-digit"
            }
        )
            .formatToParts(
                new Date()
            );


    const mapa =
        {};


    partes.forEach(
        function(parte) {

            mapa[
                parte.type
            ] =
                parte.value;

        }
    );


    return (
        mapa.year +
        "-" +
        mapa.month +
        "-" +
        mapa.day
    );

}


function numeroEPCube(
    valor
) {

    if (
        valor === null ||
        valor === undefined ||
        valor === ""
    ) {

        return null;

    }


    const numero =
        Number(
            valor
        );


    return Number.isFinite(
        numero
    )
        ? numero
        : null;

}


async function requisicaoEPCube(
    caminho,
    parametros = {}
) {

    if (!EPCUBE_TOKEN) {

        throw new Error(
            "EPCUBE_TOKEN não configurado no .env."
        );

    }


    const url =
        new URL(
            EPCUBE_BASE_URL +
            caminho
        );


    Object.entries(
        parametros
    )
        .forEach(
            function([
                chave,
                valor
            ]) {

                if (
                    valor === null ||
                    valor === undefined ||
                    valor === ""
                ) {

                    return;

                }


                url.searchParams.set(
                    chave,
                    String(
                        valor
                    )
                );

            }
        );


    const resposta =
        await fetch(
            url,
            {
                method:
                    "GET",

                headers: {
                    "accept":
                        "*/*",

                    "accept-language":
                        "en-US",

                    "authorization":
                        "Bearer " +
                        EPCUBE_TOKEN,

                    "user-agent":
                        EPCUBE_USER_AGENT
                },

                signal:
                    AbortSignal.timeout(
                        15000
                    )
            }
        );


    let corpo =
        null;


    try {

        corpo =
            await resposta.json();

    } catch (erro) {

        throw new Error(
            "A API EPCube respondeu sem JSON válido."
        );

    }


    if (!resposta.ok) {

        throw new Error(
            "EPCube HTTP " +
            resposta.status +
            (
                corpo &&
                corpo.message
                    ? ": " +
                        corpo.message
                    : ""
            )
        );

    }


    if (
        !corpo ||
        Number(
            corpo.status
        ) !== 200 ||
        corpo.data === null ||
        corpo.data === undefined
    ) {

        throw new Error(
            (
                corpo &&
                corpo.message
            ) ||
            "Resposta inesperada da API EPCube."
        );

    }


    return corpo;

}


async function obterControladorEPCube(
    controllerId = null
) {

    let sql =
        `SELECT
            id,
            controller_id,
            tenant_id,
            site_id,
            nome,
            status,
            equipment_serial,
            equipment_model
         FROM controllers
         WHERE status = 'ativo'`;

    const parametros =
        [];


    if (controllerId) {

        sql +=
            ` AND controller_id = ?`;

        parametros.push(
            controllerId
        );

    } else {

        if (!EPCUBE_SERIAL) {

            throw new Error(
                "EPCUBE_SERIAL não configurado no .env."
            );

        }


        sql +=
            ` AND equipment_serial = ?`;

        parametros.push(
            EPCUBE_SERIAL
        );

    }


    sql +=
        ` LIMIT 1`;


    const [
        linhas
    ] =
        await banco.execute(
            sql,
            parametros
        );


    if (
        linhas.length ===
        0
    ) {

        throw new Error(
            "Controlador EPCube ativo não encontrado."
        );

    }


    const controlador =
        linhas[0];


    if (
        EPCUBE_SERIAL &&
        controlador.equipment_serial &&
        String(
            controlador.equipment_serial
        ) !== EPCUBE_SERIAL
    ) {

        throw new Error(
            "O serial do controlador não corresponde ao EPCUBE_SERIAL configurado."
        );

    }


    return controlador;

}


async function carregarSnapshotEPCube(
    controlador
) {

    const serial =
        String(
            controlador.equipment_serial ||
            EPCUBE_SERIAL ||
            ""
        ).trim();


    if (!serial) {

        throw new Error(
            "O controlador não possui serial EPCube vinculado."
        );

    }


    const dataHoje =
        dataHojeSaoPaulo();


    const home =
        await requisicaoEPCube(
            "/app-api/device/homeDeviceInfo",
            {
                dayMonthYearFormat:
                    dataHoje,

                sgSn:
                    serial
            }
        );


    const homeData =
        home.data &&
        typeof home.data ===
            "object" &&
        !Array.isArray(
            home.data
        )
            ? home.data
            : {};


    const devId =
        String(
            homeData.devId ||
            EPCUBE_DEV_ID ||
            ""
        ).trim();


    let electricity =
        null;


    /*
       Os totais diários vêm de queryDataElectricityV2.
       Se essa rota falhar, ainda salvamos o snapshot atual.
    */
    if (devId) {

        try {

            electricity =
                await requisicaoEPCube(
                    "/app-api/device/queryDataElectricityV2",
                    {
                        devId:
                            devId,

                        queryDateStr:
                            dataHoje,

                        scopeType:
                            1
                    }
                );

        } catch (erro) {

            console.warn(
                "⚠️ EPCube electricity:",
                erro.message
            );

        }

    }


    const electricityData =
        electricity &&
        electricity.data &&
        typeof electricity.data ===
            "object" &&
        !Array.isArray(
            electricity.data
        )
            ? electricity.data
            : {};


    /*
       IMPORTANTE SOBRE UNIDADES:
       O frontend OneTouch já espera potências em W e divide por 1000
       para mostrar kW. Por isso usamos os campos de fluxo em W
       (gridTotalPower, solarFlow e backUpFlowPower).

       smartHomePower não é usado como fallback de power_total porque
       o endpoint de gráfico demonstrou escala diferente desse campo.
       Assim evitamos misturar W e kW.
    */
    const normalizada = {

        source:
            "epcube",

        epcube_dev_id:
            devId ||
            null,

        epcube_serial:
            serial,

        source_timestamp:
            home.timestamp ||
            null,

        source_local_timestamp:
            homeData.fromCreateTime ||
            homeData.defCreateTime ||
            null,

        source_timezone:
            homeData.fromTimeZone ||
            homeData.defTimeZone ||
            null,

        device_status:
            homeData.status ??
            null,

        work_status:
            homeData.workStatus ??
            null,

        system_status:
            numeroEPCube(
                homeData.systemStatus
            ),

        battery_percent:
            numeroEPCube(
                homeData.batterySoc
            ),

        battery_power:
            numeroEPCube(
                homeData.batteryPower
            ),

        grid_power:
            numeroEPCube(
                homeData.gridTotalPower
            ),

        solar_power:
            numeroEPCube(
                homeData.solarFlow
            ),

        power_total:
            numeroEPCube(
                homeData.backUpFlowPower
            ),

        backup_power:
            numeroEPCube(
                homeData.backUpFlowPower
            ),

        daily_consumption:
            numeroEPCube(
                electricityData.smartHomeElectricity ??
                electricityData.backUpElectricity ??
                homeData.smartHomeElectricity ??
                homeData.backUpElectricity
            ),

        energy_import:
            numeroEPCube(
                electricityData.gridElectricityFrom ??
                homeData.gridElectricity
            ),

        energy_export:
            numeroEPCube(
                electricityData.gridElectricityTo
            ),

        solar_electricity:
            numeroEPCube(
                electricityData.solarElectricity ??
                homeData.solarElectricity
            ),

        self_help_rate:
            numeroEPCube(
                electricityData.selfHelpRate ??
                homeData.selfHelpRate
            ),

        is_alert:
            String(
                homeData.isAlert ??
                "0"
            ) === "1",

        is_fault:
            String(
                homeData.isFault ??
                "0"
            ) === "1",

        grid_online:
            String(
                homeData.gridLight ??
                "0"
            ) === "1",

        off_grid_hint:
            homeData.off_ON_Grid_Hint ||
            null,

        frequency:
            null,

        voltage:
            null,

        raw_epcube: {
            home:
                homeData,

            electricity:
                electricityData
        }

    };


    return normalizada;

}


async function garantirFieldDeviceEPCube(
    controlador,
    telemetria
) {

    const deviceId =
        (
            "epcube_" +
            (
                telemetria.epcube_dev_id ||
                controlador.equipment_serial ||
                controlador.id
            )
        )
            .slice(
                0,
                120
            );


    const [
        existentes
    ] =
        await banco.execute(
            `SELECT id
             FROM field_devices
             WHERE controller_fk = ?
             AND device_id = ?
             LIMIT 1`,
            [
                controlador.id,
                deviceId
            ]
        );


    if (
        existentes.length >
        0
    ) {

        return {
            id:
                existentes[0].id,

            device_id:
                deviceId
        };

    }


    const [
        criado
    ] =
        await banco.execute(
            `INSERT INTO field_devices
            (
                controller_fk,
                device_id,
                nome,
                protocol,
                status
            )
            VALUES
            (?, ?, ?, 'EPCUBE_HTTPS', 'ativo')`,
            [
                controlador.id,
                deviceId,
                controlador.equipment_model ||
                "EP Cube"
            ]
        );


    return {
        id:
            criado.insertId,

        device_id:
            deviceId
    };

}


async function gravarSnapshotEPCube(
    controlador,
    telemetria
) {

    const equipamento =
        await garantirFieldDeviceEPCube(
            controlador,
            telemetria
        );


    /*
       sequence_id precisa ser inteiro, positivo e único dentro
       do controlador/dispositivo. Date.now() atende a esse caso.
    */
    const sequenceId =
        Date.now();


    const timestamp =
        new Date();


    const timestampMysql =
        timestamp
            .toISOString()
            .slice(
                0,
                23
            )
            .replace(
                "T",
                " "
            );


    const quality =
        telemetria.is_fault
            ? "FAULT"
            : telemetria.is_alert
                ? "WARNING"
                : "GOOD";


    const [
        insercao
    ] =
        await banco.execute(
            `INSERT INTO telemetry
            (
                controller_fk,
                field_device_id,
                device_id,
                protocol_version,
                sequence_id,
                timestamp_utc,
                data,
                quality
            )
            VALUES
            (?, ?, ?, 'EPCUBE-1.0', ?, ?, ?, ?)`,
            [
                controlador.id,
                equipamento.id,
                equipamento.device_id,
                sequenceId,
                timestampMysql,
                JSON.stringify(
                    telemetria
                ),
                quality
            ]
        );


    await banco.execute(
        `UPDATE controllers
         SET last_seen_at = NOW()
         WHERE id = ?`,
        [
            controlador.id
        ]
    );


    return {
        telemetry_id:
            insercao.insertId,

        sequence_id:
            sequenceId,

        timestamp_utc:
            timestamp.toISOString(),

        quality:
            quality
    };

}


async function sincronizarEPCube(
    controllerId = null
) {

    const controlador =
        await obterControladorEPCube(
            controllerId
        );


    const telemetria =
        await carregarSnapshotEPCube(
            controlador
        );


    const gravacao =
        await gravarSnapshotEPCube(
            controlador,
            telemetria
        );


    return {
        controlador: {
            controller_id:
                controlador.controller_id,

            tenant_id:
                controlador.tenant_id,

            site_id:
                controlador.site_id,

            equipment_serial:
                controlador.equipment_serial
        },

        telemetria:
            telemetria,

        gravacao:
            gravacao
    };

}


app.get(
    "/api/admin/epcube/status",
    autenticar,
    somenteAdmin,
    async (req, res) => {

        return res.json({
            configured:
                Boolean(
                    EPCUBE_TOKEN &&
                    EPCUBE_SERIAL
                ),

            base_url:
                EPCUBE_BASE_URL,

            serial_configured:
                Boolean(
                    EPCUBE_SERIAL
                ),

            token_configured:
                Boolean(
                    EPCUBE_TOKEN
                ),

            dev_id:
                EPCUBE_DEV_ID ||
                null,

            sync_interval_minutes:
                EPCUBE_SYNC_INTERVAL_MS /
                60000
        });

    }
);


app.post(
    "/api/admin/epcube/sync/:controllerId",
    autenticar,
    somenteAdmin,
    async (req, res) => {

        try {

            const controllerId =
                String(
                    req.params.controllerId ||
                    ""
                ).trim();


            if (!controllerId) {

                return res.status(400).json({
                    mensagem:
                        "Controller ID inválido."
                });

            }


            const resultado =
                await sincronizarEPCube(
                    controllerId
                );


            return res.json({
                mensagem:
                    "EPCube sincronizado com telemetria real.",
                resultado:
                    resultado
            });


        } catch (erro) {

            console.error(
                "❌ Erro ao sincronizar EPCube:",
                erro
            );


            const mensagem =
                erro &&
                erro.message
                    ? erro.message
                    : "Não foi possível sincronizar o EPCube.";


            const erroToken =
                /401|403|token|unauthorized|forbidden/i.test(
                    mensagem
                );


            return res
                .status(
                    erroToken
                        ? 401
                        : 502
                )
                .json({
                    mensagem:
                        mensagem
                });

        }

    }
);


let epcubeSyncEmAndamento =
    false;


async function executarSincronizacaoAutomaticaEPCube() {

    if (
        epcubeSyncEmAndamento ||
        !EPCUBE_TOKEN ||
        !EPCUBE_SERIAL
    ) {

        return;

    }


    epcubeSyncEmAndamento =
        true;


    try {

        const resultado =
            await sincronizarEPCube();


        console.log(
            "⚡ EPCube sincronizado:",
            resultado.controlador.controller_id,
            "| leitura",
            resultado.gravacao.telemetry_id
        );

    } catch (erro) {

        console.error(
            "⚠️ EPCube automático:",
            erro.message
        );

    } finally {

        epcubeSyncEmAndamento =
            false;

    }

}


function iniciarSincronizacaoEPCube() {

    if (
        !EPCUBE_TOKEN ||
        !EPCUBE_SERIAL
    ) {

        console.log(
            "ℹ️ EPCube: integração aguardando EPCUBE_TOKEN e EPCUBE_SERIAL no .env."
        );

        return;

    }


    setTimeout(
        executarSincronizacaoAutomaticaEPCube,
        5000
    );


    setInterval(
        executarSincronizacaoAutomaticaEPCube,
        EPCUBE_SYNC_INTERVAL_MS
    );

}



/* =====================================================
   ALERTAS REAIS
   ===================================================== */

app.get(
    "/api/alerts",
    autenticar,
    async (req, res) => {

        try {

            const usuarioId =
                req.session.usuario.id;


            const [
                controladores
            ] =
                await banco.execute(
                    `SELECT
                        c.id,
                        c.controller_id,
                        c.nome,
                        c.status,
                        c.firmware_version,
                        c.last_seen_at,
                        c.revoked_at,
                        s.nome AS site,
                        t.nome AS tenant
                     FROM controllers c
                     INNER JOIN user_tenants ut
                        ON ut.tenant_id = c.tenant_id
                     LEFT JOIN tenants t
                        ON t.id = c.tenant_id
                     LEFT JOIN sites s
                        ON s.id = c.site_id
                     WHERE ut.usuario_id = ?
                     ORDER BY c.created_at DESC`,
                    [
                        usuarioId
                    ]
                );


            const alertas =
                [];


            const agora =
                Date.now();


            for (
                const controlador
                of controladores
            ) {

                const [
                    telemetrias
                ] =
                    await banco.execute(
                        `SELECT
                            device_id,
                            timestamp_utc,
                            quality,
                            data
                         FROM telemetry
                         WHERE controller_fk = ?
                         ORDER BY timestamp_utc DESC
                         LIMIT 1`,
                        [
                            controlador.id
                        ]
                    );


                const telemetria =
                    telemetrias.length > 0
                        ? telemetrias[0]
                        : null;


                if (
                    controlador.revoked_at ||
                    String(
                        controlador.status ||
                        ""
                    )
                        .trim()
                        .toLowerCase() ===
                            "revogado"
                ) {

                    alertas.push({

                        id:
                            "controller-revoked-" +
                            controlador.id,

                        severity:
                            "info",

                        category:
                            "SEGURANÇA",

                        title:
                            "Controlador revogado",

                        message:
                            "O controlador foi revogado e não pode mais autenticar novas telemetrias.",

                        controller_id:
                            controlador.controller_id,

                        controller_name:
                            controlador.nome,

                        site:
                            controlador.site,

                        timestamp:
                            controlador.revoked_at,

                        icon:
                            "ban"

                    });


                    continue;

                }


                if (
                    !controlador.last_seen_at
                ) {

                    alertas.push({

                        id:
                            "controller-never-seen-" +
                            controlador.id,

                        severity:
                            "warning",

                        category:
                            "COMUNICAÇÃO",

                        title:
                            "Controlador sem comunicação",

                        message:
                            "Este controlador ainda não registrou comunicação com a plataforma.",

                        controller_id:
                            controlador.controller_id,

                        controller_name:
                            controlador.nome,

                        site:
                            controlador.site,

                        timestamp:
                            null,

                        icon:
                            "wifi-off"

                    });

                } else {

                    const ultimoContato =
                        new Date(
                            controlador.last_seen_at
                        ).getTime();


                    if (
                        Number.isFinite(
                            ultimoContato
                        )
                    ) {

                        const minutosSemContato =
                            Math.max(
                                0,
                                Math.floor(
                                    (
                                        agora -
                                        ultimoContato
                                    ) /
                                    60000
                                )
                            );


                        if (
                            minutosSemContato >
                            30
                        ) {

                            alertas.push({

                                id:
                                    "controller-stale-" +
                                    controlador.id,

                                severity:
                                    minutosSemContato >
                                        180
                                        ? "critical"
                                        : "warning",

                                category:
                                    "COMUNICAÇÃO",

                                title:
                                    "Controlador sem atualização recente",

                                message:
                                    "Nenhuma comunicação foi registrada nos últimos " +
                                    minutosSemContato +
                                    " minutos.",

                                controller_id:
                                    controlador.controller_id,

                                controller_name:
                                    controlador.nome,

                                site:
                                    controlador.site,

                                timestamp:
                                    controlador.last_seen_at,

                                icon:
                                    "wifi-off"

                            });

                        }

                    }

                }


                if (!telemetria) {

                    alertas.push({

                        id:
                            "telemetry-missing-" +
                            controlador.id,

                        severity:
                            "warning",

                        category:
                            "TELEMETRIA",

                        title:
                            "Sem telemetria registrada",

                        message:
                            "O controlador está cadastrado, mas ainda não possui leituras de telemetria no banco.",

                        controller_id:
                            controlador.controller_id,

                        controller_name:
                            controlador.nome,

                        site:
                            controlador.site,

                        timestamp:
                            controlador.last_seen_at,

                        icon:
                            "database-zap"

                    });


                    continue;

                }


                const qualidade =
                    String(
                        telemetria.quality ||
                        ""
                    )
                        .trim()
                        .toUpperCase();


                if (
                    qualidade &&
                    qualidade !== "GOOD" &&
                    qualidade !== "BOM"
                ) {

                    alertas.push({

                        id:
                            "telemetry-quality-" +
                            controlador.id,

                        severity:
                            "critical",

                        category:
                            "QUALIDADE",

                        title:
                            "Qualidade de telemetria fora do esperado",

                        message:
                            "A leitura mais recente foi recebida com qualidade \"" +
                            qualidade +
                            "\".",

                        controller_id:
                            controlador.controller_id,

                        controller_name:
                            controlador.nome,

                        site:
                            controlador.site,

                        timestamp:
                            telemetria.timestamp_utc,

                        icon:
                            "triangle-alert"

                    });

                }

            }


            if (
                alertas.length ===
                0
            ) {

                alertas.push({

                    id:
                        "system-ok",

                    severity:
                        "info",

                    category:
                        "SISTEMA",

                    title:
                        "Nenhuma ocorrência ativa",

                    message:
                        "Os controladores e as telemetrias acessíveis ao usuário não apresentam ocorrências no momento.",

                    controller_id:
                        null,

                    controller_name:
                        null,

                    site:
                        null,

                    timestamp:
                        new Date(),

                    icon:
                        "circle-check-big"

                });

            }


            const ordem = {

                critical:
                    0,

                warning:
                    1,

                info:
                    2

            };


            alertas.sort(
                function(a, b) {

                    const porSeveridade =
                        (
                            ordem[
                                a.severity
                            ] ?? 9
                        ) -
                        (
                            ordem[
                                b.severity
                            ] ?? 9
                        );


                    if (
                        porSeveridade !==
                        0
                    ) {

                        return porSeveridade;

                    }


                    const dataA =
                        a.timestamp
                            ? new Date(
                                a.timestamp
                            ).getTime()
                            : 0;

                    const dataB =
                        b.timestamp
                            ? new Date(
                                b.timestamp
                            ).getTime()
                            : 0;


                    return dataB -
                        dataA;

                }
            );


            const resumo = {

                critical:
                    alertas.filter(
                        function(item) {

                            return item.severity ===
                                "critical";

                        }
                    ).length,

                warning:
                    alertas.filter(
                        function(item) {

                            return item.severity ===
                                "warning";

                        }
                    ).length,

                info:
                    alertas.filter(
                        function(item) {

                            return item.severity ===
                                "info";

                        }
                    ).length,

                total:
                    alertas.length

            };


            return res.json({

                summary:
                    resumo,

                alerts:
                    alertas,

                generated_at:
                    new Date()

            });


        } catch (erro) {

            console.error(
                "❌ Erro ao buscar alertas:",
                erro
            );


            return res.status(500).json({
                mensagem:
                    "Não foi possível consultar os alertas."
            });

        }

    }
);




app.get(
    "/api/telemetry/history",
    autenticar,
    async (req, res) => {

        try {

            const usuarioId =
                req.session.usuario.id;

            const diasBrutos =
                Number(
                    req.query.days ||
                    7
                );

            const dias =
                Math.min(
                    90,
                    Math.max(
                        1,
                        Number.isFinite(
                            diasBrutos
                        )
                            ? Math.floor(
                                diasBrutos
                            )
                            : 7
                    )
                );


            const [
                leituras
            ] =
                await banco.execute(
                    `SELECT
                        tm.id,
                        tm.controller_fk,
                        tm.device_id,
                        tm.sequence_id,
                        tm.timestamp_utc,
                        tm.quality,
                        tm.data,
                        c.controller_id,
                        c.nome AS controller_name,
                        c.tenant_id,
                        c.site_id,
                        s.nome AS site_name
                     FROM telemetry tm
                     INNER JOIN controllers c
                        ON c.id = tm.controller_fk
                     INNER JOIN user_tenants ut
                        ON ut.tenant_id = c.tenant_id
                     LEFT JOIN sites s
                        ON s.id = c.site_id
                     WHERE ut.usuario_id = ?
                     AND tm.timestamp_utc >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL ? DAY)
                     ORDER BY tm.timestamp_utc ASC, tm.id ASC`,
                    [
                        usuarioId,
                        dias
                    ]
                );


            const historico =
                leituras.map(
                    function(item) {

                        let dados =
                            item.data;


                        if (
                            typeof dados ===
                            "string"
                        ) {

                            try {

                                dados =
                                    JSON.parse(
                                        dados
                                    );

                            } catch (erro) {

                                dados =
                                    {};

                            }

                        }


                        return {
                            id:
                                item.id,
                            controller_id:
                                item.controller_id,
                            controller_name:
                                item.controller_name,
                            tenant_id:
                                item.tenant_id,
                            site_id:
                                item.site_id,
                            site_name:
                                item.site_name,
                            device_id:
                                item.device_id,
                            sequence_id:
                                item.sequence_id,
                            timestamp_utc:
                                item.timestamp_utc,
                            quality:
                                item.quality,
                            power_total:
                                dados &&
                                Number.isFinite(
                                    Number(
                                        dados.power_total
                                    )
                                )
                                    ? Number(
                                        dados.power_total
                                    )
                                    : null,
                            frequency:
                                dados &&
                                Number.isFinite(
                                    Number(
                                        dados.frequency
                                    )
                                )
                                    ? Number(
                                        dados.frequency
                                    )
                                    : null,
                            energy_import:
                                dados &&
                                Number.isFinite(
                                    Number(
                                        dados.energy_import
                                    )
                                )
                                    ? Number(
                                        dados.energy_import
                                    )
                                    : null,
                            data:
                                dados &&
                                typeof dados ===
                                    "object"
                                    ? dados
                                    : {}
                        };

                    }
                );


            return res.json({
                estado:
                    historico.length > 0
                        ? "COM_TELEMETRIA"
                        : "SEM_TELEMETRIA",
                days:
                    dias,
                count:
                    historico.length,
                historico
            });


        } catch (erro) {

            console.error(
                "❌ Erro ao buscar histórico de telemetria:",
                erro
            );


            return res.status(500).json({
                mensagem:
                    "Não foi possível consultar o histórico."
            });

        }

    }
);

app.get(
    "/api/telemetry/latest",
    autenticar,
    async (req, res) => {

        try {

            const usuarioId =
                req.session.usuario.id;


            const [
                leituras
            ] =
                await banco.execute(
                    `SELECT
                        tm.id,
                        tm.controller_fk,
                        tm.device_id,
                        tm.sequence_id,
                        tm.timestamp_utc,
                        tm.quality,
                        tm.data,
                        c.controller_id,
                        c.nome AS controller_name,
                        c.tenant_id,
                        c.site_id,
                        s.nome AS site_name
                     FROM telemetry tm
                     INNER JOIN controllers c
                        ON c.id = tm.controller_fk
                     INNER JOIN user_tenants ut
                        ON ut.tenant_id = c.tenant_id
                     LEFT JOIN sites s
                        ON s.id = c.site_id
                     WHERE ut.usuario_id = ?
                     AND c.status <> 'revogado'
                     ORDER BY tm.timestamp_utc DESC, tm.id DESC
                     LIMIT 1`,
                    [
                        usuarioId
                    ]
                );


            if (
                leituras.length ===
                0
            ) {

                return res.status(200).json({
                    estado:
                        "SEM_TELEMETRIA",
                    leitura:
                        null
                });

            }


            const leitura =
                leituras[0];


            if (
                typeof leitura.data ===
                "string"
            ) {

                try {

                    leitura.data =
                        JSON.parse(
                            leitura.data
                        );

                } catch (erro) {

                    leitura.data =
                        {};

                }

            }


            return res.json({
                estado:
                    "COM_TELEMETRIA",
                leitura
            });


        } catch (erro) {

            console.error(
                "❌ Erro ao buscar telemetria mais recente:",
                erro
            );


            return res.status(500).json({
                mensagem:
                    "Não foi possível consultar a telemetria."
            });

        }

    }
);

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
                        empresa,
                        endereco,
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



app.get(
    "/api/admin/chamados",
    autenticar,
    somenteAdmin,
    async (req, res) => {

        try {

            const [
                chamados
            ] =
                await banco.execute(
                    `SELECT
                        id,
                        usuario_id,
                        nome,
                        email,
                        telefone,
                        categoria,
                        prioridade,
                        assunto,
                        descricao,
                        status,
                        data_abertura
                     FROM chamados_suporte
                     ORDER BY data_abertura DESC`
                );


            return res.json({

                chamados

            });


        } catch (erro) {

            console.error(
                "❌ Erro ao buscar chamados:",
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

async function iniciarServidor() {

    await prepararEstruturaBanco();

    iniciarSincronizacaoEPCube();


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

}


iniciarServidor();
