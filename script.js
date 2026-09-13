/* =====================================================
   ONETOUCH ENERGY
   SISTEMA DE LOGIN / CADASTRO
   ===================================================== */


/* =====================================================
   VARIÁVEIS DO SISTEMA
   ===================================================== */

let gmailRecuperacao = "";

let usuarioLogado = null;


/* =====================================================
   FUNÇÃO PARA MOSTRAR AS TELAS DE AUTENTICAÇÃO
   ===================================================== */

function mostrarTela(tela) {

    const telas = [
        "telaCadastro",
        "telaLogin",
        "telaRecuperar",
        "telaNovaSenha"
    ];


    telas.forEach(function(id) {

        const elemento =
            document.getElementById(id);

        if (elemento) {

            elemento.classList.add(
                "escondido"
            );

        }

    });


    const mapaTelas = {

        cadastro:
            "telaCadastro",

        login:
            "telaLogin",

        recuperar:
            "telaRecuperar",

        novaSenha:
            "telaNovaSenha"

    };


    const telaSelecionada =
        mapaTelas[tela];


    if (telaSelecionada) {

        const elemento =
            document.getElementById(
                telaSelecionada
            );


        if (elemento) {

            elemento.classList.remove(
                "escondido"
            );

        }

    }

}


/* =====================================================
   CADASTRO
   ===================================================== */

const formCadastro =
    document.getElementById(
        "formCadastro"
    );


if (formCadastro) {

    formCadastro.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            const nome =
                document
                    .getElementById("nome")
                    .value
                    .trim();


            const gmail =
                document
                    .getElementById("gmail")
                    .value
                    .trim()
                    .toLowerCase();


            const telefone =
                document
                    .getElementById("telefone")
                    .value
                    .trim();


            const empresa =
                document
                    .getElementById("empresa")
                    .value
                    .trim();


            const endereco =
                document
                    .getElementById("endereco")
                    .value
                    .trim();


            const senha =
                document
                    .getElementById("senha")
                    .value;


            const confirmarSenha =
                document
                    .getElementById(
                        "confirmarSenha"
                    )
                    .value;


            const mensagem =
                document
                    .getElementById(
                        "mensagemCadastro"
                    );


            /* =================================================
               VALIDAÇÃO DO NOME
               ================================================= */

            if (nome.length < 2) {

                mensagem.style.color =
                    "red";

                mensagem.textContent =
                    "❌ Digite um nome válido.";

                return;

            }


            /* =================================================
               VALIDAÇÃO DO E-MAIL
               ================================================= */

            if (
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                    gmail
                )
            ) {

                mensagem.style.color =
                    "red";

                mensagem.textContent =
                    "❌ Informe um e-mail válido.";

                return;

            }


            /* =================================================
               TELEFONE
               ================================================= */

            const numerosTelefone =
                telefone.replace(
                    /\D/g,
                    ""
                );


            if (
                numerosTelefone.length !==
                11
            ) {

                mensagem.style.color =
                    "red";

                mensagem.textContent =
                    "❌ Telefone inválido! Digite DDD + 9 dígitos.";

                return;

            }


            if (empresa.length < 2) {

                mensagem.style.color =
                    "red";

                mensagem.textContent =
                    "❌ Informe o nome da empresa.";

                return;

            }


            if (endereco.length < 5) {

                mensagem.style.color =
                    "red";

                mensagem.textContent =
                    "❌ Informe o endereço da empresa ou unidade.";

                return;

            }


            /* =================================================
               SENHA
               ================================================= */

            if (senha.length < 7) {

                mensagem.style.color =
                    "red";

                mensagem.textContent =
                    "❌ A senha precisa ter no mínimo 7 caracteres.";

                return;

            }


            if (
                !/[A-Za-z]/.test(
                    senha
                )
            ) {

                mensagem.style.color =
                    "red";

                mensagem.textContent =
                    "❌ A senha precisa ter pelo menos uma letra.";

                return;

            }


            if (
                !/[0-9]/.test(
                    senha
                )
            ) {

                mensagem.style.color =
                    "red";

                mensagem.textContent =
                    "❌ A senha precisa ter pelo menos um número.";

                return;

            }


            if (
                senha !==
                confirmarSenha
            ) {

                mensagem.style.color =
                    "red";

                mensagem.textContent =
                    "❌ As senhas não são iguais.";

                return;

            }


            const botao =
                document.querySelector(
                    "#formCadastro button[type='submit']"
                );


            if (botao) {

                botao.disabled =
                    true;

                botao.textContent =
                    "Cadastrando...";

            }


            mensagem.style.color =
                "#243b55";

            mensagem.textContent =
                "⏳ Salvando seus dados...";


            /* =================================================
               ENVIAR CADASTRO
               ================================================= */

            try {

                const resposta =
                    await fetch(
                        "/api/cadastro",
                        {

                            method:
                                "POST",

                            headers: {

                                "Content-Type":
                                    "application/json"

                            },

                            body:
                                JSON.stringify({

                                    nome:
                                        nome,

                                    gmail:
                                        gmail,

                                    telefone:
                                        numerosTelefone,

                                    empresa:
                                        empresa,

                                    endereco:
                                        endereco,

                                    senha:
                                        senha

                                })

                        }
                    );


                let dados = {};


                try {

                    dados =
                        await resposta.json();

                } catch (erro) {

                    dados = {};

                }


                if (!resposta.ok) {

                    mensagem.style.color =
                        "red";

                    mensagem.textContent =
                        dados.mensagem ||
                        "❌ Não foi possível realizar o cadastro.";

                    return;

                }


                if (dados.usuario) {

                    usuarioLogado =
                        dados.usuario;


                }


                mensagem.style.color =
                    "green";

                mensagem.textContent =
                    dados.mensagem ||
                    "✅ Conta criada com sucesso!";


                formCadastro.reset();


                setTimeout(
                    function() {

                        mostrarTela(
                            "login"
                        );

                        mensagem.textContent =
                            "";

                    },
                    1200
                );


            } catch (erro) {

                console.error(
                    "Erro no cadastro:",
                    erro
                );


                mensagem.style.color =
                    "red";

                mensagem.textContent =
                    "❌ Não foi possível conectar ao servidor.";

            } finally {

                if (botao) {

                    botao.disabled =
                        false;

                    botao.textContent =
                        "Criar conta";

                }

            }

        }
    );

}


/* =====================================================
   LOGIN
   ===================================================== */

const formLogin =
    document.getElementById(
        "formLogin"
    );


if (formLogin) {

    formLogin.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            const gmail =
                document
                    .getElementById(
                        "loginGmail"
                    )
                    .value
                    .trim()
                    .toLowerCase();


            const senha =
                document
                    .getElementById(
                        "loginSenha"
                    )
                    .value;


            const mensagem =
                document
                    .getElementById(
                        "mensagemLogin"
                    );


            mensagem.style.color =
                "#243b55";

            mensagem.textContent =
                "⏳ Verificando login...";


            /* =================================================
               ACESSO DEMONSTRAÇÃO
               ================================================= */

            if (
                gmail ===
                    "demo@onetouch.com" &&
                senha ===
                    "demo123"
            ) {

                usuarioLogado = {

                    id:
                        "DEMO",

                    nome:
                        "OneTouch Demo",

                    gmail:
                        "demo@onetouch.com",

                    telefone:
                        "",

                    data_registro:
                        new Date()
                            .toISOString(),

                    nivel:
                        "admin"

                };


                /* Salvar sessão demo */

                try {

                    localStorage.setItem(
                        "usuarioOneTouch",
                        JSON.stringify(
                            usuarioLogado
                        )
                    );

                } catch (erro) {

                    console.log(
                        "Não foi possível salvar o usuário demo."
                    );

                }


                mensagem.style.color =
                    "green";

                mensagem.textContent =
                    "✅ Acesso à demonstração liberado!";


                setTimeout(
                    function() {

                        const areaLogin =
                            document.getElementById(
                                "areaLogin"
                            );


                        const sistema =
                            document.getElementById(
                                "sistemaOneTouch"
                            );


                        if (areaLogin) {

                            areaLogin
                                .classList
                                .add(
                                    "escondido"
                                );

                        }


                        if (sistema) {

                            sistema
                                .classList
                                .remove(
                                    "escondido"
                                );

                        }


                        abrirPagina(
                            "dashboard"
                        );


                        atualizarDadosUsuario();


                        formLogin.reset();


                        mensagem.textContent =
                            "";

                    },
                    500
                );


                return;

            }


            /* =================================================
               LOGIN REAL
               ================================================= */

            try {

                const resposta =
                    await fetch(
                        "/api/login",
                        {

                            method:
                                "POST",

                            headers: {

                                "Content-Type":
                                    "application/json"

                            },

                            body:
                                JSON.stringify({

                                    gmail:
                                        gmail,

                                    senha:
                                        senha

                                })

                        }
                    );


                let dados = {};


                try {

                    dados =
                        await resposta.json();

                } catch (erro) {

                    dados = {};

                }


                if (!resposta.ok) {

                    mensagem.style.color =
                        "red";

                    mensagem.textContent =
                        dados.mensagem ||
                        "❌ Gmail ou senha incorretos.";

                    return;

                }


                if (dados.usuario) {

                    usuarioLogado =
                        dados.usuario;


                    try {

                        localStorage.setItem(
                            "usuarioOneTouch",
                            JSON.stringify(
                                usuarioLogado
                            )
                        );

                    } catch (erro) {

                        console.log(
                            "Não foi possível salvar os dados localmente."
                        );

                    }

                }


                await sincronizarSessaoUsuario();

                const sessaoConfirmada =
                    await verificarSessaoAtiva();


                if (
                    !sessaoConfirmada ||
                    String(
                        sessaoConfirmada.gmail ||
                        ""
                    )
                        .trim()
                        .toLowerCase() !==
                    gmail
                ) {

                    mensagem.style.color =
                        "red";

                    mensagem.textContent =
                        "❌ A sessão do usuário não foi confirmada. Faça login novamente.";

                    return;

                }


                usuarioLogado = {
                    ...usuarioLogado,
                    ...sessaoConfirmada
                };


                try {

                    localStorage.setItem(
                        "usuarioOneTouch",
                        JSON.stringify(
                            usuarioLogado
                        )
                    );

                } catch (erro) {

                }


                aplicarPermissoesInterface();


                mensagem.style.color =
                    "green";

                mensagem.textContent =
                    dados.mensagem ||
                    "✅ Login realizado com sucesso!";


                setTimeout(
                    function() {

                        const areaLogin =
                            document.getElementById(
                                "areaLogin"
                            );


                        const sistema =
                            document.getElementById(
                                "sistemaOneTouch"
                            );


                        if (areaLogin) {

                            areaLogin
                                .classList
                                .add(
                                    "escondido"
                                );

                        }


                        if (sistema) {

                            sistema
                                .classList
                                .remove(
                                    "escondido"
                                );

                        }


                        abrirPagina(
                            "inicio"
                        );


                        formLogin.reset();


                        mensagem.textContent =
                            "";


                        atualizarDadosUsuario();

                        iniciarAtualizacaoTelemetria();

                        carregarAlertasReais();


                    },
                    700
                );


            } catch (erro) {

                console.error(
                    "Erro no login:",
                    erro
                );


                mensagem.style.color =
                    "red";

                mensagem.textContent =
                    "❌ Não foi possível conectar ao servidor.";

            }

        }
    );

}


/* =====================================================
   ATUALIZAR DADOS DO USUÁRIO
   ===================================================== */

function atualizarDadosUsuario() {

    if (!usuarioLogado) {

        return;

    }


    const elementoId =
        document.getElementById(
            "usuarioId"
        );


    if (elementoId) {

        elementoId.textContent =
            usuarioLogado.id ??
            "";

    }


    const elementoNome =
        document.getElementById(
            "usuarioNome"
        );


    if (elementoNome) {

        elementoNome.textContent =
            usuarioLogado.nome ??
            "";

    }


    const elementoGmail =
        document.getElementById(
            "usuarioGmail"
        );


    if (elementoGmail) {

        elementoGmail.textContent =
            usuarioLogado.gmail ??
            "";

    }


    const elementoTelefone =
        document.getElementById(
            "usuarioTelefone"
        );


    if (elementoTelefone) {

        elementoTelefone.textContent =
            usuarioLogado.telefone ??
            "";

    }


    const elementoEmpresa =
        document.getElementById(
            "usuarioEmpresa"
        );


    if (elementoEmpresa) {

        elementoEmpresa.textContent =
            usuarioLogado.empresa ??
            "";

    }


    const elementoEndereco =
        document.getElementById(
            "usuarioEndereco"
        );


    if (elementoEndereco) {

        elementoEndereco.textContent =
            usuarioLogado.endereco ??
            "";

    }


    const elementoData =
        document.getElementById(
            "usuarioDataRegistro"
        );


    if (elementoData) {

        elementoData.textContent =
            formatarData(
                usuarioLogado
                    .data_registro
            );

    }

}


/* =====================================================
   FORMATAR DATA
   ===================================================== */

function formatarData(data) {

    if (!data) {

        return "";

    }


    try {

        const dataObj =
            new Date(data);


        if (
            isNaN(
                dataObj.getTime()
            )
        ) {

            return data;

        }


        return dataObj
            .toLocaleString(
                "pt-BR"
            );


    } catch (erro) {

        return data;

    }

}


/* =====================================================
   RECUPERAÇÃO DE SENHA
   ===================================================== */

const formRecuperar =
    document.getElementById(
        "formRecuperar"
    );


if (formRecuperar) {

    formRecuperar.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            const gmail =
                document
                    .getElementById(
                        "recuperarGmail"
                    )
                    .value
                    .trim()
                    .toLowerCase();


            const telefone =
                document
                    .getElementById(
                        "recuperarTelefone"
                    )
                    .value
                    .replace(
                        /\D/g,
                        ""
                    );


            const mensagem =
                document
                    .getElementById(
                        "mensagemRecuperar"
                    );


            mensagem.style.color =
                "#243b55";

            mensagem.textContent =
                "⏳ Verificando dados...";


            try {

                const resposta =
                    await fetch(
                        "/api/recuperar",
                        {

                            method:
                                "POST",

                            headers: {

                                "Content-Type":
                                    "application/json"

                            },

                            body:
                                JSON.stringify({

                                    gmail:
                                        gmail,

                                    telefone:
                                        telefone

                                })

                        }
                    );


                let dados = {};


                try {

                    dados =
                        await resposta.json();

                } catch (erro) {

                    dados = {};

                }


                if (!resposta.ok) {

                    mensagem.style.color =
                        "red";

                    mensagem.textContent =
                        dados.mensagem ||
                        "❌ Gmail ou telefone não correspondem a uma conta.";

                    return;

                }


                gmailRecuperacao =
                    gmail;


                mensagem.style.color =
                    "green";

                mensagem.textContent =
                    dados.mensagem ||
                    "✅ Dados confirmados!";


                setTimeout(
                    function() {

                        mostrarTela(
                            "novaSenha"
                        );

                        mensagem.textContent =
                            "";

                    },
                    700
                );


            } catch (erro) {

                console.error(
                    "Erro na recuperação:",
                    erro
                );


                mensagem.style.color =
                    "red";

                mensagem.textContent =
                    "❌ Não foi possível conectar ao servidor.";

            }

        }
    );

}


/* =====================================================
   NOVA SENHA
   ===================================================== */

const formNovaSenha =
    document.getElementById(
        "formNovaSenha"
    );


if (formNovaSenha) {

    formNovaSenha.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            const novaSenha =
                document
                    .getElementById(
                        "novaSenha"
                    )
                    .value;


            const confirmarNovaSenha =
                document
                    .getElementById(
                        "confirmarNovaSenha"
                    )
                    .value;


            const mensagem =
                document
                    .getElementById(
                        "mensagemNovaSenha"
                    );


            if (
                novaSenha.length <
                7
            ) {

                mensagem.style.color =
                    "red";

                mensagem.textContent =
                    "❌ A senha precisa ter no mínimo 7 caracteres.";

                return;

            }


            if (
                !/[A-Za-z]/.test(
                    novaSenha
                )
            ) {

                mensagem.style.color =
                    "red";

                mensagem.textContent =
                    "❌ A senha precisa ter pelo menos uma letra.";

                return;

            }


            if (
                !/[0-9]/.test(
                    novaSenha
                )
            ) {

                mensagem.style.color =
                    "red";

                mensagem.textContent =
                    "❌ A senha precisa ter pelo menos um número.";

                return;

            }


            if (
                novaSenha !==
                confirmarNovaSenha
            ) {

                mensagem.style.color =
                    "red";

                mensagem.textContent =
                    "❌ As senhas não são iguais.";

                return;

            }


            mensagem.style.color =
                "#243b55";

            mensagem.textContent =
                "⏳ Alterando senha...";


            try {

                const resposta =
                    await fetch(
                        "/api/nova-senha",
                        {

                            method:
                                "PUT",

                            headers: {

                                "Content-Type":
                                    "application/json"

                            },

                            body:
                                JSON.stringify({

                                    gmail:
                                        gmailRecuperacao,

                                    senha:
                                        novaSenha

                                })

                        }
                    );


                let dados = {};


                try {

                    dados =
                        await resposta.json();

                } catch (erro) {

                    dados = {};

                }


                if (!resposta.ok) {

                    mensagem.style.color =
                        "red";

                    mensagem.textContent =
                        dados.mensagem ||
                        "❌ Não foi possível alterar a senha.";

                    return;

                }


                mensagem.style.color =
                    "green";

                mensagem.textContent =
                    dados.mensagem ||
                    "✅ Senha alterada com sucesso!";


                setTimeout(
                    function() {

                        formNovaSenha
                            .reset();


                        mostrarTela(
                            "login"
                        );


                        gmailRecuperacao =
                            "";


                        mensagem.textContent =
                            "";

                    },
                    1200
                );


            } catch (erro) {

                console.error(
                    "Erro ao alterar senha:",
                    erro
                );


                mensagem.style.color =
                    "red";

                mensagem.textContent =
                    "❌ Não foi possível conectar ao servidor.";

            }

        }
    );

}


/* =====================================================
   ABRIR PÁGINAS DO SISTEMA
   ===================================================== */

function abrirPagina(pagina) {

    if (
        pagina === "controladores" &&
        !usuarioEhAdmin()
    ) {

        window.alert(
            "Apenas administradores podem acessar Controladores."
        );

        pagina =
            "inicio";

    }



    if (
        pagina === "controladores" &&
        !usuarioEhAdmin()
    ) {

        pagina =
            "inicio";

    }


    const paginas = [

        "paginaInicio",

        "paginaDashboard",

        "paginaEquipamentos",

        "paginaControladores",

        "paginaHistorico",

        "paginaAlertas",

        "paginaSuporte",

        "paginaEmpresa",

        "paginaConfiguracoes"

    ];


    paginas.forEach(
        function(id) {

            const elemento =
                document.getElementById(
                    id
                );


            if (elemento) {

                elemento
                    .classList
                    .add(
                        "escondido"
                    );

            }

        }
    );


    const mapa = {

        inicio:
            "paginaInicio",

        dashboard:
            "paginaDashboard",

        equipamentos:
            "paginaEquipamentos",

        controladores:
            "paginaControladores",

        historico:
            "paginaHistorico",

        alertas:
            "paginaAlertas",

        suporte:
            "paginaSuporte",

        empresa:
            "paginaEmpresa",

        configuracoes:
            "paginaConfiguracoes"

    };


    const idPagina =
        mapa[pagina];


    if (idPagina) {

        const paginaElemento =
            document.getElementById(
                idPagina
            );


        if (paginaElemento) {

            paginaElemento
                .classList
                .remove(
                    "escondido"
                );

        }

    }


    if (
        pagina === "inicio" ||
        pagina === "dashboard" ||
        pagina === "equipamentos"
    ) {

        carregarStatusInstalacao()
            .then(
                function(configurado) {

                    if (
                        configurado &&
                        (
                            pagina === "inicio" ||
                            pagina === "dashboard" ||
                            pagina === "equipamentos"
                        )
                    ) {

                        carregarTelemetriaMaisRecente();

                    }

                }
            );

    }


    if (
        pagina === "controladores" &&
        usuarioEhAdmin()
    ) {

        carregarSolicitacoesInstalacaoAdmin();

        carregarControladores();

    }


    if (
        pagina === "historico"
    ) {

        carregarHistoricoTelemetria();

    }


    if (
        pagina === "alertas"
    ) {

        carregarAlertasReais();

    }


    if (
        pagina === "configuracoes"
    ) {

        carregarTelemetriaMaisRecente();

    }


    window.scrollTo({

        top:
            0,

        behavior:
            "smooth"

    });

}


/* =====================================================
   SAIR
   ===================================================== */

async function sair() {

    try {

        await fetch(
            "/api/logout",
            {
                method:
                    "POST",

                credentials:
                    "same-origin",

                headers: {
                    "Accept":
                        "application/json"
                }
            }
        );

    } catch (erro) {

        console.warn(
            "Não foi possível encerrar a sessão no servidor:",
            erro
        );

    }


    const sistema =
        document.getElementById(
            "sistemaOneTouch"
        );

    const areaLogin =
        document.getElementById(
            "areaLogin"
        );


    if (sistema) {

        sistema
            .classList
            .add(
                "escondido"
            );

    }


    if (areaLogin) {

        areaLogin
            .classList
            .remove(
                "escondido"
            );

    }


    mostrarTela(
        "login"
    );


    if (formLogin) {

        formLogin.reset();

    }


    usuarioLogado =
        null;


    if (
        intervaloTelemetria
    ) {

        clearInterval(
            intervaloTelemetria
        );

        intervaloTelemetria =
            null;

    }


    try {

        localStorage.removeItem(
            "usuarioOneTouch"
        );

    } catch (erro) {

        console.log(
            "Não foi possível limpar os dados locais."
        );

    }

}


/* =====================================================
   RECUPERAR USUÁRIO SALVO
   ===================================================== */

try {

    const usuarioSalvo =
        localStorage.getItem(
            "usuarioOneTouch"
        );


    if (usuarioSalvo) {

        usuarioLogado =
            JSON.parse(
                usuarioSalvo
            );

    }


} catch (erro) {

    usuarioLogado =
        null;

}



/* =====================================================
   ENVIAR CHAMADO AO BACKEND
   ===================================================== */

const supportForm =
    document.getElementById(
        "supportForm"
    );


if (supportForm) {

    supportForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            const categoria =
                document
                    .getElementById(
                        "supportCategory"
                    )
                    .value
                    .trim();


            const prioridade =
                document
                    .getElementById(
                        "supportPriority"
                    )
                    .value
                    .trim();


            const assunto =
                document
                    .getElementById(
                        "supportSubject"
                    )
                    .value
                    .trim();


            const descricao =
                document
                    .getElementById(
                        "supportDescription"
                    )
                    .value
                    .trim();


            const mensagem =
                document.getElementById(
                    "supportMessage"
                );


            if (
                !categoria ||
                !prioridade ||
                !assunto ||
                !descricao
            ) {

                mensagem.style.color =
                    "red";

                mensagem.textContent =
                    "❌ Preencha todos os campos do chamado.";

                return;

            }


            if (
                usuarioLogado &&
                usuarioLogado.id ===
                "DEMO"
            ) {

                mensagem.style.color =
                    "#697586";

                mensagem.textContent =
                    "ℹ️ No acesso demo o chamado não é salvo. Entre com uma conta de cliente para registrar no banco.";

                return;

            }


            mensagem.style.color =
                "#243b55";

            mensagem.textContent =
                "⏳ Enviando chamado...";


            try {

                const resposta =
                    await fetch(
                        "/api/suporte",
                        {

                            method:
                                "POST",

                            headers: {

                                "Content-Type":
                                    "application/json"

                            },

                            body:
                                JSON.stringify({

                                    categoria,
                                    prioridade,
                                    assunto,
                                    descricao

                                })

                        }
                    );


                let dados = {};


                try {

                    dados =
                        await resposta.json();

                } catch (erro) {

                    dados = {};

                }


                if (!resposta.ok) {

                    mensagem.style.color =
                        "red";

                    mensagem.textContent =
                        dados.mensagem ||
                        "❌ Não foi possível enviar o chamado.";

                    return;

                }


                mensagem.style.color =
                    "green";

                mensagem.textContent =
                    dados.mensagem ||
                    "✅ Chamado enviado com sucesso!";


                supportForm.reset();


            } catch (erro) {

                console.error(
                    "Erro ao enviar chamado:",
                    erro
                );


                mensagem.style.color =
                    "red";

                mensagem.textContent =
                    "❌ Não foi possível conectar ao servidor.";

            }

        }
    );

}









/* =====================================================
   PERMISSÕES DE INTERFACE
   ===================================================== */

function usuarioEhAdmin() {

    return Boolean(
        usuarioLogado &&
        usuarioLogado.id !== "DEMO" &&
        String(
            usuarioLogado.nivel ||
            ""
        )
            .trim()
            .toLowerCase() ===
            "admin"
    );

}


function aplicarPermissoesInterface() {

    const admin =
        usuarioEhAdmin();


    const navControladores =
        document.getElementById(
            "navControladores"
        );


    if (navControladores) {

        navControladores.style.setProperty(
            "display",
            admin
                ? ""
                : "none",
            "important"
        );

    }


    const paginaControladores =
        document.getElementById(
            "paginaControladores"
        );


    if (
        paginaControladores &&
        !admin
    ) {

        paginaControladores.classList.add(
            "escondido"
        );

    }


    document
        .querySelectorAll(
            "[data-admin-only='true']"
        )
        .forEach(
            function(elemento) {

                if (
                    elemento.id ===
                    "paginaControladores"
                ) {

                    return;

                }


                elemento.style.display =
                    admin
                        ? ""
                        : "none";

            }
        );

}




async function verificarSessaoAtiva() {

    try {

        const resposta =
            await fetch(
                "/api/session-status",
                {
                    method:
                        "GET",

                    credentials:
                        "same-origin",

                    cache:
                        "no-store",

                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );


        if (!resposta.ok) {

            return null;

        }


        const dados =
            await resposta.json();


        return (
            dados &&
            dados.usuario
                ? dados.usuario
                : null
        );


    } catch (erro) {

        console.error(
            "Erro ao verificar sessão ativa:",
            erro
        );


        return null;

    }

}


async function sincronizarSessaoUsuario() {

    try {

        const resposta =
            await fetch(
                "/api/me",
                {
                    method:
                        "GET",

                    credentials:
                        "same-origin",

                    headers: {
                        "Accept":
                            "application/json"
                    },

                    cache:
                        "no-store"
                }
            );


        if (!resposta.ok) {

            aplicarPermissoesInterface();

            return false;

        }


        const dados =
            await resposta.json();


        if (
            !dados ||
            !dados.usuario
        ) {

            aplicarPermissoesInterface();

            return false;

        }


        usuarioLogado =
            dados.usuario;


        try {

            localStorage.setItem(
                "usuarioOneTouch",
                JSON.stringify(
                    usuarioLogado
                )
            );

        } catch (erro) {

        }


        aplicarPermissoesInterface();


        return true;


    } catch (erro) {

        console.error(
            "Erro ao sincronizar sessão:",
            erro
        );


        aplicarPermissoesInterface();


        return false;

    }

}


/* =====================================================
   ONBOARDING DE NOVOS CLIENTES
   ===================================================== */

let instalacaoConfigurada =
    null;


function escaparHtmlInstalacao(
    valor
) {

    return String(
        valor ??
        ""
    )
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


function mostrarConteudoEnergetico(
    mostrar
) {

    const fluxo =
        document.querySelector(
            "#paginaInicio .energy-flow-section"
        );


    if (fluxo) {

        fluxo.style.display =
            mostrar
                ? ""
                : "none";

    }


    document
        .querySelectorAll(
            "#paginaDashboard .dashboard-toolbar, " +
            "#paginaDashboard .kpi-grid, " +
            "#paginaDashboard .dashboard-main-grid, " +
            "#paginaDashboard .dashboard-secondary-grid"
        )
        .forEach(
            function(elemento) {

                elemento.style.display =
                    mostrar
                        ? ""
                        : "none";

            }
        );


    const equipamentos =
        document.querySelector(
            "#paginaEquipamentos .equipment-grid"
        );


    const arquitetura =
        document.querySelector(
            "#paginaEquipamentos .architecture-panel"
        );


    if (equipamentos) {

        equipamentos.style.display =
            mostrar
                ? ""
                : "none";

    }


    if (arquitetura) {

        arquitetura.style.display =
            mostrar
                ? ""
                : "none";

    }

}


function aplicarStatusInstalacao(
    dados
) {

    instalacaoConfigurada =
        Boolean(
            dados &&
            dados.configurado
        );


    const painel =
        document.getElementById(
            "installationSetupPanel"
        );

    const formulario =
        document.getElementById(
            "installationRequestForm"
        );

    const titulo =
        document.getElementById(
            "installationSetupTitle"
        );

    const descricao =
        document.getElementById(
            "installationSetupDescription"
        );

    const mensagem =
        document.getElementById(
            "installationRequestMessage"
        );


    if (
        usuarioLogado &&
        usuarioLogado.id ===
            "DEMO"
    ) {

        aplicarEstadoSemTelemetria();

        if (painel) {

            painel.classList.add(
                "escondido"
            );

        }

        return;

    }


    if (
        instalacaoConfigurada
    ) {

        if (painel) {

            painel.classList.add(
                "escondido"
            );

        }


        return;

    }


    aplicarEstadoSemTelemetria();


    if (painel) {

        painel.classList.remove(
            "escondido"
        );

    }


    const solicitacao =
        dados
            ? dados.solicitacao
            : null;


    if (
        solicitacao &&
        solicitacao.status ===
            "pendente"
    ) {

        if (titulo) {

            titulo.textContent =
                "Instalação aguardando análise";

        }


        if (descricao) {

            descricao.textContent =
                "Recebemos os dados do seu equipamento. Um administrador precisa analisar e configurar sua instalação antes da liberação do painel.";

        }


        if (mensagem) {

            mensagem.className =
                "controllers-form-message";

            mensagem.textContent =
                "⏳ Solicitação enviada. Você pode atualizar os dados abaixo enquanto ela estiver pendente.";

        }


        if (formulario) {

            const campos = {
                installationName:
                    solicitacao.nome_instalacao,
                installationAddress:
                    solicitacao.endereco,
                installationEquipment:
                    solicitacao.equipamento,
                installationModel:
                    solicitacao.modelo,
                installationSerial:
                    solicitacao.serial,
                installationNotes:
                    solicitacao.observacoes
            };


            Object.entries(
                campos
            )
                .forEach(
                    function([
                        id,
                        valor
                    ]) {

                        const campo =
                            document.getElementById(
                                id
                            );


                        if (
                            campo &&
                            valor !== null &&
                            valor !== undefined
                        ) {

                            campo.value =
                                valor;

                        }

                    }
                );

        }

    } else if (
        solicitacao &&
        solicitacao.status ===
            "aprovada"
    ) {

        if (titulo) {

            titulo.textContent =
                "Estrutura aprovada";

        }


        if (descricao) {

            descricao.textContent =
                "A estrutura do cliente já foi criada. A liberação dos dados acontecerá após o administrador cadastrar e provisionar o controlador.";

        }


        if (mensagem) {

            mensagem.textContent =
                "🔧 Configuração técnica em andamento.";

        }

    } else {

        if (titulo) {

            titulo.textContent =
                "Configure sua instalação";

        }


        if (descricao) {

            descricao.textContent =
                "Sua conta foi criada sem dados fictícios. Envie as informações do equipamento para que a equipe OneTouch configure sua instalação.";

        }


        if (mensagem) {

            mensagem.textContent =
                "";

        }

    }


    if (
        window.lucide
    ) {

        lucide.createIcons();

    }

}


async function carregarStatusInstalacao() {

    if (
        !usuarioLogado ||
        usuarioLogado.id ===
            "DEMO"
    ) {

        aplicarStatusInstalacao({
            configurado:
                true
        });

        return true;

    }


    try {

        const resposta =
            await fetch(
                "/api/installation/status",
                {
                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );


        if (!resposta.ok) {

            throw new Error(
                "Não foi possível consultar a instalação."
            );

        }


        const dados =
            await resposta.json();


        aplicarStatusInstalacao(
            dados
        );


        return Boolean(
            dados.configurado
        );


    } catch (erro) {

        console.error(
            "Erro ao consultar instalação:",
            erro
        );


        return false;

    }

}


const installationRequestForm =
    document.getElementById(
        "installationRequestForm"
    );


if (installationRequestForm) {

    installationRequestForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            const mensagem =
                document.getElementById(
                    "installationRequestMessage"
                );


            const payload = {

                nome_instalacao:
                    document
                        .getElementById(
                            "installationName"
                        )
                        .value
                        .trim(),

                endereco:
                    document
                        .getElementById(
                            "installationAddress"
                        )
                        .value
                        .trim(),

                equipamento:
                    document
                        .getElementById(
                            "installationEquipment"
                        )
                        .value
                        .trim(),

                modelo:
                    document
                        .getElementById(
                            "installationModel"
                        )
                        .value
                        .trim(),

                serial:
                    document
                        .getElementById(
                            "installationSerial"
                        )
                        .value
                        .trim(),

                observacoes:
                    document
                        .getElementById(
                            "installationNotes"
                        )
                        .value
                        .trim()

            };


            if (mensagem) {

                mensagem.className =
                    "controllers-form-message";

                mensagem.textContent =
                    "⏳ Enviando para análise...";

            }


            try {

                const resposta =
                    await fetch(
                        "/api/installation/request",
                        {
                            method:
                                "POST",

                            credentials:
                                "same-origin",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify(
                                    payload
                                )
                        }
                    );


                let dados =
                    {};


                try {

                    dados =
                        await resposta.json();

                } catch (erro) {

                }


                if (!resposta.ok) {

                    throw new Error(
                        dados.mensagem ||
                        "Não foi possível enviar a solicitação."
                    );

                }


                if (mensagem) {

                    mensagem.className =
                        "controllers-form-message success";

                    mensagem.textContent =
                        dados.mensagem ||
                        "✅ Solicitação enviada.";

                }


                await carregarStatusInstalacao();


            } catch (erro) {

                if (mensagem) {

                    mensagem.className =
                        "controllers-form-message error";

                    mensagem.textContent =
                        erro.message;

                }

            }

        }
    );

}


/* =====================================================
   ADMIN - SOLICITAÇÕES DE INSTALAÇÃO
   ===================================================== */

async function aprovarSolicitacaoInstalacao(
    id,
    dadosPadrao
) {

    const tenantNome =
        window.prompt(
            "Nome do cliente / tenant:",
            dadosPadrao.tenantNome ||
            ""
        );


    if (!tenantNome) {

        return;

    }


    const siteNome =
        window.prompt(
            "Nome da instalação / site:",
            dadosPadrao.siteNome ||
            ""
        );


    if (!siteNome) {

        return;

    }


    const siteEndereco =
        window.prompt(
            "Endereço da instalação:",
            dadosPadrao.siteEndereco ||
            ""
        );


    if (!siteEndereco) {

        return;

    }


    try {

        const resposta =
            await fetch(
                "/api/admin/installation-requests/" +
                encodeURIComponent(
                    id
                ) +
                "/approve",
                {
                    method:
                        "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            tenant_nome:
                                tenantNome,
                            site_nome:
                                siteNome,
                            site_endereco:
                                siteEndereco
                        })
                }
            );


        const dados =
            await resposta.json();


        if (!resposta.ok) {

            throw new Error(
                dados.mensagem ||
                "Não foi possível aprovar."
            );

        }


        window.alert(
            (
                dados.mensagem ||
                "Instalação aprovada."
            ) +
            "\n\nTenant ID: " +
            dados.tenant_id +
            "\nSite ID: " +
            dados.site_id +
            "\n\nAgora use esses IDs para cadastrar o controlador."
        );


        await carregarSolicitacoesInstalacaoAdmin();


    } catch (erro) {

        window.alert(
            erro.message
        );

    }

}


async function carregarSolicitacoesInstalacaoAdmin() {

    const painel =
        document.getElementById(
            "adminInstallationRequestsPanel"
        );

    const lista =
        document.getElementById(
            "adminInstallationRequestsList"
        );


    if (
        !painel ||
        !lista
    ) {

        return;

    }


    if (
        !usuarioLogado ||
        usuarioLogado.nivel !==
            "admin"
    ) {

        painel.classList.add(
            "escondido"
        );

        return;

    }


    painel.classList.remove(
        "escondido"
    );

    lista.className =
        "controllers-loading";

    lista.innerHTML =
        "Carregando solicitações...";


    try {

        const resposta =
            await fetch(
                "/api/admin/installation-requests",
                {
                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );


        const dados =
            await resposta.json();


        if (!resposta.ok) {

            throw new Error(
                dados.mensagem ||
                "Não foi possível carregar as solicitações."
            );

        }


        const solicitacoes =
            Array.isArray(
                dados.solicitacoes
            )
                ? dados.solicitacoes
                : [];


        if (
            solicitacoes.length ===
            0
        ) {

            lista.className =
                "controllers-empty";

            lista.innerHTML =
                `
                <i data-lucide="inbox"></i>
                <strong>Nenhuma solicitação recebida</strong>
                <span>Novos clientes aparecerão aqui depois de enviarem os dados da instalação.</span>
                `;

        } else {

            lista.className =
                "";

            lista.innerHTML =
                solicitacoes.map(
                    function(item) {

                        const pendente =
                            item.status ===
                            "pendente";


                        return `
                            <article class="panel" style="margin-bottom:14px;padding:18px;">
                                <div class="panel-header" style="margin-bottom:12px;">
                                    <div>
                                        <span class="panel-eyebrow">
                                            ${escaparHtmlInstalacao(
                                                item.status ||
                                                "pendente"
                                            ).toUpperCase()}
                                        </span>

                                        <h3 style="margin:6px 0;">
                                            ${escaparHtmlInstalacao(
                                                item.cliente_nome ||
                                                "Cliente"
                                            )}
                                        </h3>

                                        <p>
                                            ${escaparHtmlInstalacao(
                                                item.cliente_email ||
                                                ""
                                            )}
                                        </p>
                                    </div>

                                    ${
                                        pendente
                                            ? `
                                                <button
                                                    type="button"
                                                    class="controllers-btn-primary btn-aprovar-instalacao"
                                                    data-id="${item.id}"
                                                >
                                                    <i data-lucide="check-circle-2"></i>
                                                    Aprovar estrutura
                                                </button>
                                            `
                                            : `
                                                <span class="controller-status-pill active">
                                                    ${escaparHtmlInstalacao(
                                                        item.status
                                                    )}
                                                </span>
                                            `
                                    }
                                </div>

                                <div class="controllers-summary-grid" style="grid-template-columns:repeat(4,minmax(0,1fr));">
                                    <div>
                                        <span class="controllers-summary-label">Instalação</span>
                                        <strong style="font-size:14px;">${escaparHtmlInstalacao(item.nome_instalacao)}</strong>
                                    </div>
                                    <div>
                                        <span class="controllers-summary-label">Equipamento</span>
                                        <strong style="font-size:14px;">${escaparHtmlInstalacao(item.equipamento)}</strong>
                                    </div>
                                    <div>
                                        <span class="controllers-summary-label">Modelo</span>
                                        <strong style="font-size:14px;">${escaparHtmlInstalacao(item.modelo || "Não informado")}</strong>
                                    </div>
                                    <div>
                                        <span class="controllers-summary-label">Serial / NS</span>
                                        <strong style="font-size:14px;">${escaparHtmlInstalacao(item.serial)}</strong>
                                    </div>
                                </div>

                                <p style="margin-top:12px;">
                                    <strong>Endereço:</strong>
                                    ${escaparHtmlInstalacao(item.endereco)}
                                </p>

                                ${
                                    item.tenant_id && item.site_id
                                        ? `
                                            <p style="margin-top:8px;">
                                                <strong>Tenant ID:</strong> ${item.tenant_id}
                                                &nbsp; | &nbsp;
                                                <strong>Site ID:</strong> ${item.site_id}
                                            </p>
                                        `
                                        : ""
                                }
                            </article>
                        `;

                    }
                )
                .join(
                    ""
                );


            lista
                .querySelectorAll(
                    ".btn-aprovar-instalacao"
                )
                .forEach(
                    function(botao) {

                        botao.addEventListener(
                            "click",
                            function() {

                                const item =
                                    solicitacoes.find(
                                        function(solicitacao) {

                                            return String(
                                                solicitacao.id
                                            ) ===
                                                String(
                                                    botao.dataset.id
                                                );

                                        }
                                    );


                                if (!item) {

                                    return;

                                }


                                aprovarSolicitacaoInstalacao(
                                    item.id,
                                    {
                                        tenantNome:
                                            item.cliente_empresa ||
                                            item.cliente_nome ||
                                            "",
                                        siteNome:
                                            item.nome_instalacao ||
                                            "",
                                        siteEndereco:
                                            item.endereco ||
                                            ""
                                    }
                                );

                            }
                        );

                    }
                );

        }


        if (
            window.lucide
        ) {

            lucide.createIcons();

        }


    } catch (erro) {

        lista.className =
            "controllers-empty";

        lista.innerHTML =
            `
            <i data-lucide="triangle-alert"></i>
            <strong>Não foi possível carregar as solicitações</strong>
            <span>${escaparHtmlInstalacao(erro.message)}</span>
            `;


        if (
            window.lucide
        ) {

            lucide.createIcons();

        }

    }

}


const btnAtualizarSolicitacoes =
    document.getElementById(
        "btnAtualizarSolicitacoes"
    );


if (btnAtualizarSolicitacoes) {

    btnAtualizarSolicitacoes.addEventListener(
        "click",
        carregarSolicitacoesInstalacaoAdmin
    );

}





/* =====================================================
   ESTADO GLOBAL DE TELEMETRIA REAL
   ===================================================== */

const ESTADO_SEM_TELEMETRIA =
    "SEM_TELEMETRIA";

const ESTADO_COM_TELEMETRIA =
    "COM_TELEMETRIA";


function definirTextoSemDados(
    seletor
) {

    document
        .querySelectorAll(
            seletor
        )
        .forEach(
            function(elemento) {

                elemento.textContent =
                    "Sem dados";

            }
        );

}


function aplicarEstadoSemTelemetria() {

    const vazioInicio =
        document.getElementById(
            "semTelemetriaInicio"
        );

    const vazioDashboard =
        document.getElementById(
            "semTelemetriaDashboard"
        );


    if (vazioInicio) {

        vazioInicio.classList.remove(
            "escondido"
        );

    }


    if (vazioDashboard) {

        vazioDashboard.classList.remove(
            "escondido"
        );

    }


    document
        .querySelectorAll(
            "#paginaInicio .energy-flow-section, " +
            "#paginaDashboard .dashboard-toolbar, " +
            "#paginaDashboard .kpi-grid, " +
            "#paginaDashboard .dashboard-main-grid, " +
            "#paginaDashboard .dashboard-secondary-grid"
        )
        .forEach(
            function(elemento) {

                elemento.style.display =
                    "none";

            }
        );


    definirTextoSemDados(
        "#paginaInicio .flow-value, " +
        "#paginaDashboard .kpi-value, " +
        "#paginaDashboard .metric-value, " +
        "#paginaDashboard .dashboard-value"
    );


    atualizarStatusTelemetriaReal(
        null
    );

}


function aplicarEstadoComTelemetria() {

    const vazioInicio =
        document.getElementById(
            "semTelemetriaInicio"
        );

    const vazioDashboard =
        document.getElementById(
            "semTelemetriaDashboard"
        );


    if (vazioInicio) {

        vazioInicio.classList.add(
            "escondido"
        );

    }


    if (vazioDashboard) {

        vazioDashboard.classList.add(
            "escondido"
        );

    }


    document
        .querySelectorAll(
            "#paginaInicio .energy-flow-section, " +
            "#paginaDashboard .dashboard-toolbar, " +
            "#paginaDashboard .kpi-grid, " +
            "#paginaDashboard .dashboard-main-grid, " +
            "#paginaDashboard .dashboard-secondary-grid"
        )
        .forEach(
            function(elemento) {

                elemento.style.display =
                    "";

            }
        );

}



/* =====================================================
   STATUS REAL DE COMUNICAÇÃO / TELEMETRIA
   ===================================================== */

function diferencaMinutosTelemetria(
    valorData
) {

    if (!valorData) {

        return null;

    }


    const data =
        new Date(
            valorData
        );


    if (
        Number.isNaN(
            data.getTime()
        )
    ) {

        return null;

    }


    return Math.max(
        0,
        Math.floor(
            (
                Date.now() -
                data.getTime()
            ) /
            60000
        )
    );

}


function aplicarEstadoVisualTelemetria(
    elemento,
    estado
) {

    if (!elemento) {

        return;

    }


    const mapa = {

        online: {
            cor:
                "#18a66f",
            fundo:
                "#eaf8f2"
        },

        warning: {
            cor:
                "#b77900",
            fundo:
                "#fff6dc"
        },

        offline: {
            cor:
                "#e5484d",
            fundo:
                "#fff0f1"
        }

    };


    const visual =
        mapa[estado] ||
        mapa.offline;


    elemento.style.setProperty(
        "color",
        visual.cor,
        "important"
    );


    elemento.style.setProperty(
        "background-color",
        visual.fundo,
        "important"
    );


    elemento.style.setProperty(
        "border-color",
        visual.cor + "33",
        "important"
    );


    const ponto =
        elemento.querySelector(
            "span"
        );


    if (ponto) {

        ponto.style.setProperty(
            "background-color",
            visual.cor,
            "important"
        );

    }

}


function atualizarStatusTelemetriaReal(
    leitura
) {

    const dataLeitura =
        leitura
            ? (
                leitura.timestamp_utc ||
                leitura.received_at
            )
            : null;


    const minutos =
        diferencaMinutosTelemetria(
            dataLeitura
        );


    let estado =
        "offline";

    let textoPrincipal =
        "Sem telemetria";

    let textoComunicacao =
        "Offline";

    let textoSaude =
        "Sem comunicação";

    let percentual =
        "0%";


    if (
        minutos !== null &&
        minutos <= 30
    ) {

        estado =
            "online";

        textoPrincipal =
            "Telemetria atualizada";

        textoComunicacao =
            "Online";

        textoSaude =
            "Comunicação saudável";

        percentual =
            "100%";

    } else if (
        minutos !== null &&
        minutos <= 180
    ) {

        estado =
            "warning";

        textoPrincipal =
            "Telemetria atrasada";

        textoComunicacao =
            "Atenção";

        textoSaude =
            "Atualização atrasada";

        percentual =
            "65%";

    } else if (
        minutos !== null
    ) {

        estado =
            "offline";

        textoPrincipal =
            "Sem comunicação recente";

        textoComunicacao =
            "Offline";

        textoSaude =
            "Comunicação interrompida";

        percentual =
            "25%";

    }


    const statusInicio =
        document.getElementById(
            "telemetriaStatusInicio"
        );

    const comunicacaoInicio =
        document.getElementById(
            "telemetriaComunicacaoInicio"
        );

    const statusDashboard =
        document.getElementById(
            "telemetriaStatusDashboard"
        );

    const saudePercentual =
        document.getElementById(
            "telemetriaSaudePercentual"
        );

    const saudeTexto =
        document.getElementById(
            "telemetriaSaudeTexto"
        );

    const gateway =
        document.getElementById(
            "telemetriaGatewayStatus"
        );

    const medidor =
        document.getElementById(
            "telemetriaMedidorStatus"
        );

    const sincronizacao =
        document.getElementById(
            "telemetriaSincronizacaoStatus"
        );


    if (statusInicio) {

        statusInicio.innerHTML =
            "<span></span>" +
            textoPrincipal;

        aplicarEstadoVisualTelemetria(
            statusInicio,
            estado
        );

    }


    if (comunicacaoInicio) {

        comunicacaoInicio.textContent =
            textoComunicacao;

        comunicacaoInicio.style.setProperty(
            "color",
            estado === "online"
                ? "#18a66f"
                : estado === "warning"
                    ? "#b77900"
                    : "#e5484d",
            "important"
        );

    }


    if (statusDashboard) {

        statusDashboard.innerHTML =
            "<span></span>" +
            textoPrincipal;

        aplicarEstadoVisualTelemetria(
            statusDashboard,
            estado
        );

    }


    if (saudePercentual) {

        saudePercentual.textContent =
            percentual;

    }


    if (saudeTexto) {

        saudeTexto.textContent =
            textoSaude;

    }


    if (gateway) {

        gateway.textContent =
            textoComunicacao;

        gateway.style.setProperty(
            "color",
            estado === "online"
                ? "#18a66f"
                : estado === "warning"
                    ? "#b77900"
                    : "#e5484d",
            "important"
        );

    }


    if (medidor) {

        medidor.textContent =
            leitura
                ? textoComunicacao
                : "Sem dados";

        medidor.style.setProperty(
            "color",
            estado === "online"
                ? "#18a66f"
                : estado === "warning"
                    ? "#b77900"
                    : "#e5484d",
            "important"
        );

    }


    if (sincronizacao) {

        if (
            minutos === null
        ) {

            sincronizacao.textContent =
                "Sem dados";

        } else if (
            minutos <= 30
        ) {

            sincronizacao.textContent =
                "Atualizada";

        } else {

            sincronizacao.textContent =
                minutos +
                " min atrás";

        }


        sincronizacao.style.setProperty(
            "color",
            estado === "online"
                ? "#18a66f"
                : estado === "warning"
                    ? "#b77900"
                    : "#e5484d",
            "important"
        );

    }

}


function atualizarDataDashboard() {

    const elemento =
        document.getElementById(
            "dashboardDataAtual"
        );


    if (!elemento) {

        return;

    }


    elemento.innerHTML =
        '<i data-lucide="calendar-days"></i>' +
        new Date()
            .toLocaleDateString(
                "pt-BR",
                {
                    day:
                        "2-digit",

                    month:
                        "long",

                    year:
                        "numeric"
                }
            );


    if (
        window.lucide
    ) {

        lucide.createIcons();

    }

}



/* =====================================================
   TELEMETRIA DO BANCO / ATUALIZAÇÃO DO DASHBOARD
   ===================================================== */

let intervaloTelemetria = null;


function formatarPotenciaKw(watts) {

    const numero =
        Number(watts);

    if (
        !Number.isFinite(numero)
    ) {

        return null;

    }

    return (
        numero / 1000
    )
        .toFixed(2)
        .replace(".", ",");

}


function valorNumericoTelemetria(
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


function formatarValorTelemetria(
    valor,
    divisor = 1,
    casas = 2
) {

    const numero =
        valorNumericoTelemetria(
            valor
        );


    if (numero === null) {

        return null;

    }


    return (
        numero /
        divisor
    )
        .toLocaleString(
            "pt-BR",
            {
                minimumFractionDigits:
                    casas,
                maximumFractionDigits:
                    casas
            }
        );

}


function obterDadosTelemetria(
    leitura
) {

    if (
        !leitura ||
        leitura.data === null ||
        leitura.data === undefined
    ) {

        return {};

    }


    if (
        typeof leitura.data ===
            "object"
    ) {

        return leitura.data;

    }


    if (
        typeof leitura.data ===
            "string"
    ) {

        try {

            const dados =
                JSON.parse(
                    leitura.data
                );


            return (
                dados &&
                typeof dados ===
                    "object"
            )
                ? dados
                : {};

        } catch (erro) {

            console.error(
                "Telemetria com JSON inválido:",
                erro
            );


            return {};

        }

    }


    return {};

}


function definirMetricaHtml(
    elemento,
    valorFormatado,
    unidade = ""
) {

    if (!elemento) {

        return;

    }


    if (
        valorFormatado === null ||
        valorFormatado === undefined
    ) {

        elemento.textContent =
            "Sem dados";

        return;

    }


    elemento.innerHTML =
        String(
            valorFormatado
        ) +
        (
            unidade
                ? " <small>" +
                    unidade +
                    "</small>"
                : ""
        );

}


function localizarKpiPorRotulo(
    textoRotulo
) {

    const cards =
        document.querySelectorAll(
            "#paginaDashboard .kpi-card"
        );


    for (
        const card
        of cards
    ) {

        const rotulo =
            card.querySelector(
                ".kpi-label"
            );


        if (
            rotulo &&
            rotulo.textContent
                .trim()
                .toLowerCase() ===
                String(
                    textoRotulo
                )
                    .trim()
                    .toLowerCase()
        ) {

            return card.querySelector(
                ".kpi-value"
            );

        }

    }


    return null;

}


function localizarResumoInicioPorRotulo(
    textoRotulo
) {

    const elementos =
        document.querySelectorAll(
            "#paginaInicio .energy-flow-section " +
            ".flow-node, " +
            "#paginaInicio .energy-flow-section " +
            ".flow-core"
        );


    for (
        const elemento
        of elementos
    ) {

        const texto =
            elemento.textContent
                .toLowerCase();


        if (
            texto.includes(
                String(
                    textoRotulo
                )
                    .toLowerCase()
            )
        ) {

            return elemento;

        }

    }


    return null;

}


function limparValoresFicticiosVisiveis() {

    /*
       O HTML original possui números de demonstração.
       Antes de aplicar a leitura real, limpamos todos os
       indicadores que ainda não possuem fonte real.
    */

    const gridStrong =
        document.querySelector(
            "#paginaInicio " +
            ".flow-node-grid > strong"
        );

    const solarStrong =
        document.querySelector(
            "#paginaInicio " +
            ".flow-node-solar > strong"
        );

    const bateriaStrong =
        document.querySelector(
            "#paginaInicio " +
            ".flow-core-inner > strong"
        );

    const consumoStrong =
        document.querySelector(
            "#paginaInicio " +
            ".flow-node-load > strong"
        );


    [
        gridStrong,
        solarStrong,
        bateriaStrong,
        consumoStrong
    ]
        .forEach(
            function(elemento) {

                if (elemento) {

                    elemento.textContent =
                        "Sem dados";

                }

            }
        );


    document
        .querySelectorAll(
            "#paginaDashboard .kpi-value, " +
            "#paginaDashboard .metric-value, " +
            "#paginaDashboard .dashboard-value"
        )
        .forEach(
            function(elemento) {

                elemento.textContent =
                    "Sem dados";

            }
        );


    /*
       Remove também textos derivados de números demonstrativos
       que poderiam induzir o cliente a acreditar que são reais.
    */
    const kpiConsumo =
        localizarKpiPorRotulo(
            "Consumo atual"
        );

    const kpiEnergia =
        localizarKpiPorRotulo(
            "Energia hoje"
        );

    const kpiPico =
        localizarKpiPorRotulo(
            "Potência máxima"
        );

    const kpiCusto =
        localizarKpiPorRotulo(
            "Custo estimado"
        );


    [
        kpiConsumo,
        kpiEnergia,
        kpiPico,
        kpiCusto
    ]
        .forEach(
            function(elemento) {

                if (elemento) {

                    elemento.textContent =
                        "Sem dados";

                }

            }
        );

}


function aplicarTelemetriaRealNaTela(
    dados
) {

    limparValoresFicticiosVisiveis();


    const gridKw =
        formatarValorTelemetria(
            dados.grid_power,
            1000,
            2
        );

    const solarKw =
        formatarValorTelemetria(
            dados.solar_power,
            1000,
            2
        );

    const consumoKw =
        formatarValorTelemetria(
            dados.power_total,
            1000,
            2
        );

    const bateria =
        formatarValorTelemetria(
            dados.battery_percent,
            1,
            0
        );

    const consumoHoje =
        formatarValorTelemetria(
            dados.daily_consumption,
            1,
            2
        );

    const taxaPropria =
        formatarValorTelemetria(
            dados.self_help_rate,
            1,
            0
        );


    definirMetricaHtml(
        document.querySelector(
            "#paginaInicio " +
            ".flow-node-grid > strong"
        ),
        gridKw,
        "kW"
    );


    definirMetricaHtml(
        document.querySelector(
            "#paginaInicio " +
            ".flow-node-solar > strong"
        ),
        solarKw,
        "kW"
    );


    const bateriaElemento =
        document.querySelector(
            "#paginaInicio " +
            ".flow-core-inner > strong"
        );


    if (bateriaElemento) {

        bateriaElemento.textContent =
            bateria !== null
                ? bateria + "%"
                : "Sem dados";

    }


    definirMetricaHtml(
        document.querySelector(
            "#paginaInicio " +
            ".flow-node-load > strong"
        ),
        consumoKw,
        "kW"
    );


    /*
       IDs antigos, caso existam em outra versão do HTML.
       Isso mantém compatibilidade sem depender deles.
    */
    definirMetricaHtml(
        document.getElementById(
            "redeAtual"
        ),
        gridKw,
        "kW"
    );

    definirMetricaHtml(
        document.getElementById(
            "solarAtual"
        ),
        solarKw,
        "kW"
    );

    definirMetricaHtml(
        document.getElementById(
            "consumoAtual"
        ),
        consumoKw,
        "kW"
    );

    definirMetricaHtml(
        document.getElementById(
            "dashboardPotenciaAtual"
        ),
        consumoKw,
        "kW"
    );


    const bateriaId =
        document.getElementById(
            "bateriaAtual"
        );

    if (bateriaId) {

        bateriaId.textContent =
            bateria !== null
                ? bateria + "%"
                : "Sem dados";

    }


    const dashboardBateria =
        document.getElementById(
            "dashboardBateria"
        );

    if (dashboardBateria) {

        dashboardBateria.textContent =
            bateria !== null
                ? bateria + "%"
                : "Sem dados";

    }


    /*
       Dashboard: só preenche métricas para as quais há
       uma fonte explícita no payload EPCube.
    */
    definirMetricaHtml(
        localizarKpiPorRotulo(
            "Consumo atual"
        ),
        consumoKw,
        "kW"
    );


    definirMetricaHtml(
        localizarKpiPorRotulo(
            "Energia hoje"
        ),
        consumoHoje,
        "kWh"
    );


    /*
       Potência máxima e custo estimado não estão no snapshot
       atual do EPCube. Permanecem "Sem dados".
    */


    const dashboardConsumoHoje =
        document.getElementById(
            "dashboardConsumoHoje"
        );

    definirMetricaHtml(
        dashboardConsumoHoje,
        consumoHoje,
        "kWh"
    );


    const frequencia =
        valorNumericoTelemetria(
            dados.frequency
        );


    document
        .querySelectorAll(
            "[data-telemetry-frequency]"
        )
        .forEach(
            function(elemento) {

                elemento.textContent =
                    frequencia !== null
                        ? frequencia
                            .toLocaleString(
                                "pt-BR",
                                {
                                    minimumFractionDigits:
                                        1,
                                    maximumFractionDigits:
                                        1
                                }
                            ) +
                            " Hz"
                        : "Sem dados";

            }
        );


    const tensao =
        formatarValorTelemetria(
            dados.voltage,
            1,
            1
        );


    definirMetricaHtml(
        document.getElementById(
            "dashboardTensao"
        ),
        tensao,
        "V"
    );


    /*
       Textos auxiliares do fluxo.
       Não afirmamos importação/exportação instantânea porque
       o sentido do sinal ainda não foi validado oficialmente.
    */
    const gridStatus =
        document.querySelector(
            "#paginaInicio " +
            ".flow-node-grid > em"
        );

    const solarStatus =
        document.querySelector(
            "#paginaInicio " +
            ".flow-node-solar > em"
        );

    const cargaStatus =
        document.querySelector(
            "#paginaInicio " +
            ".flow-node-load > em"
        );

    const bateriaSubtexto =
        document.querySelector(
            "#paginaInicio " +
            ".flow-core-inner > small"
        );

    const bateriaStatus =
        document.querySelector(
            "#paginaInicio " +
            ".flow-core-status"
        );


    if (gridStatus) {

        gridStatus.textContent =
            gridKw !== null
                ? "Leitura real EPCube"
                : "Sem dados";

    }


    if (solarStatus) {

        solarStatus.textContent =
            solarKw !== null
                ? "Leitura real EPCube"
                : "Sem dados";

    }


    if (cargaStatus) {

        cargaStatus.textContent =
            consumoKw !== null
                ? "Leitura real EPCube"
                : "Sem dados";

    }


    if (bateriaSubtexto) {

        bateriaSubtexto.textContent =
            bateria !== null
                ? "Estado de carga real"
                : "Sem dados";

    }


    if (bateriaStatus) {

        const ponto =
            bateriaStatus.querySelector(
                "span"
            );


        bateriaStatus.textContent =
            bateria !== null
                ? "Dados reais EPCube"
                : "Sem dados";


        if (ponto) {

            bateriaStatus.prepend(
                ponto
            );

        }

    }


    /*
       Alguns cards inferiores do início ainda eram demonstrativos.
       Se houver um card "Contribuição própria", podemos usar a
       self_help_rate real. Eficiência e modo operacional permanecem
       sem dados porque não há um campo equivalente confirmado.
    */
    document
        .querySelectorAll(
            "#paginaInicio .energy-flow-section " +
            ".flow-summary-card, " +
            "#paginaInicio .energy-flow-section " +
            ".energy-summary-card, " +
            "#paginaInicio .energy-flow-section " +
            ".summary-card"
        )
        .forEach(
            function(card) {

                const texto =
                    card.textContent
                        .toLowerCase();


                const valor =
                    card.querySelector(
                        "strong"
                    );


                if (!valor) {

                    return;

                }


                if (
                    texto.includes(
                        "contribuição própria"
                    )
                ) {

                    valor.textContent =
                        taxaPropria !== null
                            ? taxaPropria + "%"
                            : "Sem dados";

                } else if (
                    texto.includes(
                        "eficiência"
                    ) ||
                    texto.includes(
                        "modo de operação"
                    )
                ) {

                    valor.textContent =
                        "Sem dados";

                }

            }
        );

}



function aplicarEquipamentosReais(
    leitura,
    dados
) {

    const grid =
        document.querySelector(
            "#paginaEquipamentos .equipment-grid"
        );


    if (!grid) {

        return;

    }


    const cards =
        grid.querySelectorAll(
            ".equipment-card"
        );


    if (
        cards.length <
        3
    ) {

        return;

    }


    const minutos =
        diferencaMinutosTelemetria(
            leitura
                ? (
                    leitura.timestamp_utc ||
                    leitura.received_at
                )
                : null
        );


    const online =
        minutos !== null &&
        minutos <= 30;


    const statusTexto =
        online
            ? "Online"
            : minutos !== null &&
              minutos <= 180
                ? "Atenção"
                : "Offline";


    const statusClasse =
        online
            ? "online"
            : "warning";


    const potenciaKw =
        formatarValorTelemetria(
            dados.power_total,
            1000,
            2
        );


    const bateria =
        formatarValorTelemetria(
            dados.battery_percent,
            1,
            0
        );


    const serial =
        dados.epcube_serial ||
        "Sem dados";


    const devId =
        dados.epcube_dev_id ||
        (
            leitura &&
            leitura.device_id
                ? leitura.device_id
                : "Sem dados"
        );


    const nomeControlador =
        (
            leitura &&
            (
                leitura.controller_name ||
                leitura.controller_id
            )
        ) ||
        "Controlador EPCube";


    const atualizarCard =
        function(
            card,
            {
                titulo,
                descricao,
                metaRotulo,
                metaValor,
                status = statusTexto,
                classe = statusClasse
            }
        ) {

            const tituloEl =
                card.querySelector(
                    "h3"
                );

            const descricaoEl =
                card.querySelector(
                    "p"
                );

            const statusEl =
                card.querySelector(
                    ".status-pill"
                );

            const metaRotuloEl =
                card.querySelector(
                    ".equipment-meta span"
                );

            const metaValorEl =
                card.querySelector(
                    ".equipment-meta strong"
                );


            if (tituloEl) {

                tituloEl.textContent =
                    titulo;

            }


            if (descricaoEl) {

                descricaoEl.textContent =
                    descricao;

            }


            if (statusEl) {

                statusEl.classList.remove(
                    "online",
                    "warning",
                    "offline"
                );

                statusEl.classList.add(
                    classe
                );

                statusEl.textContent =
                    status;

            }


            if (metaRotuloEl) {

                metaRotuloEl.textContent =
                    metaRotulo;

            }


            if (metaValorEl) {

                metaValorEl.textContent =
                    metaValor;

            }

        };


    atualizarCard(
        cards[0],
        {
            titulo:
                nomeControlador,

            descricao:
                "Controlador vinculado à instalação do cliente.",

            metaRotulo:
                "Última comunicação",

            metaValor:
                minutos === null
                    ? "Sem dados"
                    : minutos === 0
                        ? "Agora"
                        : minutos +
                            (
                                minutos === 1
                                    ? " min atrás"
                                    : " min atrás"
                            )
        }
    );


    atualizarCard(
        cards[1],
        {
            titulo:
                "EP Cube",

            descricao:
                "Medição real recebida da API EPCube.",

            metaRotulo:
                "Potência atual",

            metaValor:
                potenciaKw !== null
                    ? potenciaKw + " kW"
                    : "Sem dados"
        }
    );


    atualizarCard(
        cards[2],
        {
            titulo:
                "Dispositivo EPCube",

            descricao:
                "Serial: " +
                serial,

            metaRotulo:
                "ID do dispositivo",

            metaValor:
                String(
                    devId
                ),

            status:
                bateria !== null
                    ? "Bateria " +
                        bateria +
                        "%"
                    : statusTexto,

            classe:
                statusClasse
        }
    );


    if (
        window.lucide
    ) {

        lucide.createIcons();

    }

}


function corrigirResumoInicioReal(
    dados
) {

    const stats =
        document.querySelectorAll(
            "#paginaInicio .flow-stat"
        );


    stats.forEach(
        function(card) {

            const rotulo =
                card.querySelector(
                    "span"
                );

            const valor =
                card.querySelector(
                    "strong"
                );


            if (
                !rotulo ||
                !valor
            ) {

                return;

            }


            const texto =
                rotulo.textContent
                    .trim()
                    .toLowerCase();


            if (
                texto.includes(
                    "contribuição própria"
                )
            ) {

                const taxa =
                    formatarValorTelemetria(
                        dados.self_help_rate,
                        1,
                        0
                    );


                valor.textContent =
                    taxa !== null
                        ? taxa + "%"
                        : "Sem dados";

            }


            if (
                texto.includes(
                    "eficiência"
                )
            ) {

                /*
                   A API capturada não trouxe uma métrica
                   confirmada equivalente à eficiência exibida
                   no layout antigo.
                */
                valor.textContent =
                    "Sem dados";

            }

        }
    );


    const modo =
        document.querySelector(
            "#paginaInicio .flow-mode strong"
        );


    if (modo) {

        modo.textContent =
            dados.off_grid_hint
                ? "Operação EPCube"
                : "Sem dados";

    }

}



function atualizarConfiguracoesReais(
    leitura,
    dados
) {

    const pagina =
        document.getElementById(
            "paginaConfiguracoes"
        );


    if (!pagina) {

        return;

    }


    const cards =
        pagina.querySelectorAll(
            ".panel, .settings-card, .config-card"
        );


    const minutos =
        diferencaMinutosTelemetria(
            leitura
                ? (
                    leitura.timestamp_utc ||
                    leitura.received_at
                )
                : null
        );


    const online =
        minutos !== null &&
        minutos <= 30;


    const atualizado =
        leitura &&
        (
            leitura.timestamp_utc ||
            leitura.received_at
        )
            ? new Date(
                leitura.timestamp_utc ||
                leitura.received_at
            )
                .toLocaleString(
                    "pt-BR",
                    {
                        day:
                            "2-digit",
                        month:
                            "2-digit",
                        year:
                            "numeric",
                        hour:
                            "2-digit",
                        minute:
                            "2-digit"
                    }
                )
            : "Sem dados";


    const substituirTextoExato =
        function(
            antigo,
            novo
        ) {

            pagina
                .querySelectorAll(
                    "h3, strong, p, span"
                )
                .forEach(
                    function(elemento) {

                        if (
                            elemento.textContent
                                .trim() ===
                            antigo
                        ) {

                            elemento.textContent =
                                novo;

                        }

                    }
                );

        };


    substituirTextoExato(
        "Cloud",
        "Backend OneTouch ativo"
    );


    substituirTextoExato(
        "Aguardando API",
        "EPCube conectado"
    );


    substituirTextoExato(
        "Em configuração",
        online
            ? "Sincronização ativa"
            : "Sincronização sem comunicação recente"
    );


    pagina
        .querySelectorAll(
            "p"
        )
        .forEach(
            function(paragrafo) {

                const texto =
                    paragrafo.textContent
                        .trim()
                        .toLowerCase();


                if (
                    texto.includes(
                        "ambiente preparado para sincronização"
                    )
                ) {

                    paragrafo.textContent =
                        "Backend OneTouch operacional e preparado para receber telemetria real.";

                }


                if (
                    texto.includes(
                        "credenciais e endpoints ainda serão conectados"
                    )
                ) {

                    paragrafo.textContent =
                        "Integração EPCube autenticada e conectada ao backend OneTouch.";

                }


                if (
                    texto.includes(
                        "os dados energéticos serão atualizados automaticamente"
                    )
                ) {

                    paragrafo.textContent =
                        "Atualização automática ativa a cada 15 minutos. Última leitura: " +
                        atualizado +
                        ".";

                }

            }
        );


    const dadosExtras =
        [
            {
                titulo:
                    "Fonte de dados",
                valor:
                    dados.source ===
                        "epcube"
                        ? "EPCube API real"
                        : "Sem dados"
            },
            {
                titulo:
                    "Serial",
                valor:
                    dados.epcube_serial ||
                    "Sem dados"
            },
            {
                titulo:
                    "ID EPCube",
                valor:
                    dados.epcube_dev_id ||
                    "Sem dados"
            },
            {
                titulo:
                    "Última atualização",
                valor:
                    atualizado
            }
        ];


    let resumo =
        document.getElementById(
            "configuracoesIntegracaoReal"
        );


    if (!resumo) {

        resumo =
            document.createElement(
                "div"
            );

        resumo.id =
            "configuracoesIntegracaoReal";

        resumo.style.marginTop =
            "16px";

        resumo.style.display =
            "grid";

        resumo.style.gridTemplateColumns =
            "repeat(4, minmax(0, 1fr))";

        resumo.style.gap =
            "12px";


        const alvo =
            pagina.querySelector(
                ".panel"
            ) ||
            pagina;


        alvo.appendChild(
            resumo
        );

    }


    resumo.innerHTML =
        dadosExtras.map(
            function(item) {

                return `
                    <div
                        style="
                            border:1px solid #e4eaf0;
                            border-radius:14px;
                            padding:14px;
                            background:#fff;
                        "
                    >
                        <span
                            style="
                                display:block;
                                font-size:11px;
                                color:#7a8795;
                                margin-bottom:5px;
                            "
                        >
                            ${item.titulo}
                        </span>

                        <strong
                            style="
                                font-size:14px;
                                color:#10233a;
                            "
                        >
                            ${item.valor}
                        </strong>
                    </div>
                `;

            }
        )
            .join(
                ""
            );

}


function aplicarConfiguracoesSemTelemetria() {

    const pagina =
        document.getElementById(
            "paginaConfiguracoes"
        );


    if (!pagina) {

        return;

    }


    pagina
        .querySelectorAll(
            "h3, strong, p, span"
        )
        .forEach(
            function(elemento) {

                const texto =
                    elemento.textContent
                        .trim();


                if (
                    texto ===
                        "Aguardando API" ||
                    texto ===
                        "EPCube conectado"
                ) {

                    elemento.textContent =
                        "Sem telemetria";

                }


                if (
                    texto ===
                        "Em configuração" ||
                    texto ===
                        "Sincronização ativa" ||
                    texto ===
                        "Sincronização sem comunicação recente"
                ) {

                    elemento.textContent =
                        "Aguardando dados";

                }

            }
        );


    const resumo =
        document.getElementById(
            "configuracoesIntegracaoReal"
        );


    if (resumo) {

        resumo.remove();

    }

}


async function carregarTelemetriaMaisRecente() {

    if (
        !usuarioLogado ||
        usuarioLogado.id ===
            "DEMO"
    ) {

        aplicarEstadoSemTelemetria();

        return;

    }


    try {

        const resposta =
            await fetch(
                "/api/telemetry/latest",
                {
                    method:
                        "GET",

                    credentials:
                        "same-origin",

                    cache:
                        "no-store",

                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );


        let respostaJson =
            {};


        try {

            respostaJson =
                await resposta.json();

        } catch (erro) {

            respostaJson =
                {};

        }


        if (!resposta.ok) {

            throw new Error(
                respostaJson.mensagem ||
                "Não foi possível carregar a telemetria."
            );

        }


        if (
            respostaJson.estado ===
                ESTADO_SEM_TELEMETRIA ||
            !respostaJson.leitura
        ) {

            aplicarEstadoSemTelemetria();

            aplicarConfiguracoesSemTelemetria();

            return;

        }


        const leitura =
            respostaJson.leitura;


        const dados =
            obterDadosTelemetria(
                leitura
            );


        /*
           Só libera o painel depois que uma leitura real
           foi retornada pelo backend.
        */
        aplicarEstadoComTelemetria();


        atualizarStatusTelemetriaReal(
            leitura
        );


        aplicarTelemetriaRealNaTela(
            dados
        );


        corrigirResumoInicioReal(
            dados
        );


        aplicarEquipamentosReais(
            leitura,
            dados
        );


        atualizarConfiguracoesReais(
            leitura,
            dados
        );


        console.log(
            "✅ Telemetria real aplicada na interface:",
            {
                source:
                    dados.source ||
                    "desconhecida",

                battery_percent:
                    dados.battery_percent,

                grid_power:
                    dados.grid_power,

                solar_power:
                    dados.solar_power,

                power_total:
                    dados.power_total
            }
        );


    } catch (erro) {

        console.error(
            "Erro ao carregar telemetria:",
            erro
        );


        aplicarEstadoSemTelemetria();

    }

}

function iniciarAtualizacaoTelemetria() {

    if (
        intervaloTelemetria
    ) {

        clearInterval(
            intervaloTelemetria
        );

    }


    carregarTelemetriaMaisRecente();


    intervaloTelemetria =
        setInterval(
            carregarTelemetriaMaisRecente,
            15 * 60 * 1000
        );

}



/* =====================================================
   ANIMAÇÕES PROFISSIONAIS
   ===================================================== */

(function() {

    "use strict";


    function adicionarAnimacoesOneTouch() {

        if (
            document.getElementById(
                "oneTouchMotionStyle"
            )
        ) {

            return;

        }


        const style =
            document.createElement(
                "style"
            );


        style.id =
            "oneTouchMotionStyle";


        style.textContent = `

            /* ==========================================
               TELA DE ABERTURA
               ========================================== */

            #oneTouchSplash {

                position: fixed;

                inset: 0;

                z-index: 999999;

                display: flex;

                align-items: center;

                justify-content: center;

                background:
                    linear-gradient(
                        135deg,
                        #071c2b,
                        #0b3549
                    );

                color: white;

                opacity: 1;

                visibility: visible;

                transition:
                    opacity .6s ease,
                    visibility .6s ease;

            }


            #oneTouchSplash.ot-hide {

                opacity: 0;

                visibility: hidden;

                pointer-events: none;

            }


            .ot-splash-inner {

                text-align: center;

                animation:
                    otSplashEntrada
                    .8s ease both;

            }


            .ot-splash-logo {

                width: 86px;

                height: 86px;

                margin:
                    0 auto 20px;

                display: flex;

                align-items: center;

                justify-content: center;

                border-radius: 25px;

                background:
                    linear-gradient(
                        145deg,
                        #12b8c4,
                        #087092
                    );

                font-size: 40px;

                box-shadow:
                    0 0 0
                    rgba(
                        18,
                        184,
                        196,
                        .5
                    );

                animation:
                    otLogoPulse
                    1.8s
                    ease-in-out
                    infinite;

            }


            .ot-splash-title {

                margin: 0;

                font-size: 30px;

                font-weight: 800;

                letter-spacing: .3px;

            }


            .ot-splash-sub {

                margin:
                    8px 0 0;

                color:
                    rgba(
                        255,
                        255,
                        255,
                        .65
                    );

                font-size: 11px;

                font-weight: 600;

                letter-spacing: 2px;

                text-transform:
                    uppercase;

            }


            .ot-splash-line {

                width: 170px;

                height: 3px;

                margin:
                    25px auto 0;

                overflow: hidden;

                border-radius: 10px;

                background:
                    rgba(
                        255,
                        255,
                        255,
                        .12
                    );

            }


            .ot-splash-line::after {

                content: "";

                display: block;

                width: 50%;

                height: 100%;

                border-radius: 10px;

                background:
                    #12b8c4;

                animation:
                    otLoading
                    1.1s
                    ease-in-out
                    infinite;

            }


            @keyframes otSplashEntrada {

                from {

                    opacity: 0;

                    transform:
                        translateY(15px)
                        scale(.96);

                }

                to {

                    opacity: 1;

                    transform:
                        translateY(0)
                        scale(1);

                }

            }


            @keyframes otLogoPulse {

                0% {

                    transform:
                        scale(1);

                    box-shadow:
                        0 0 0
                        rgba(
                            18,
                            184,
                            196,
                            .35
                        );

                }

                50% {

                    transform:
                        scale(1.04);

                    box-shadow:
                        0 0 0 13px
                        rgba(
                            18,
                            184,
                            196,
                            0
                        );

                }

                100% {

                    transform:
                        scale(1);

                    box-shadow:
                        0 0 0
                        rgba(
                            18,
                            184,
                            196,
                            0
                        );

                }

            }


            @keyframes otLoading {

                0% {

                    transform:
                        translateX(-120%);

                }

                100% {

                    transform:
                        translateX(300%);

                }

            }


            /* ==========================================
               ANIMAÇÃO DAS PÁGINAS
               ========================================== */

            .ot-page-enter {

                animation:
                    otPageEnter
                    .42s
                    ease
                    both;

            }


            @keyframes otPageEnter {

                from {

                    opacity: 0;

                    transform:
                        translateY(9px);

                }

                to {

                    opacity: 1;

                    transform:
                        translateY(0);

                }

            }


            /* ==========================================
               CARDS
               ========================================== */

            #paginaDashboard .card,
            #paginaDashboard .dashboard-card,
            #paginaDashboard .card-dashboard,
            #paginaDashboard .stat-card,
            #paginaDashboard .info-card,
            #paginaConfiguracoes .content-card {

                transition:
                    transform .22s ease,
                    box-shadow .22s ease;

            }


            /* ==========================================
               BOTÕES
               ========================================== */

            button {

                transition:
                    transform .18s ease,
                    filter .18s ease;

            }


            button:hover {

                transform:
                    translateY(-1px);

                filter:
                    brightness(1.04);

            }


            button:active {

                transform:
                    translateY(0)
                    scale(.98);

            }


            /* ==========================================
               INPUTS
               ========================================== */

            input,
            select,
            textarea {

                transition:
                    border-color .2s ease,
                    box-shadow .2s ease;

            }


            input:focus,
            select:focus,
            textarea:focus {

                outline: none;

            }


            /* ==========================================
               LINKS
               ========================================== */

            a {

                transition:
                    opacity .2s ease;

            }


            a:hover {

                opacity: .85;

            }


            /* ==========================================
               RESPONSIVIDADE
               ========================================== */

            @media (max-width: 600px) {

                .ot-splash-title {

                    font-size: 25px;

                }


                .ot-splash-logo {

                    width: 74px;

                    height: 74px;

                    font-size: 34px;

                }


                .ot-splash-line {

                    width: 140px;

                }

            }


            /* ==========================================
               ACESSIBILIDADE
               ========================================== */

            @media (
                prefers-reduced-motion:
                reduce
            ) {

                #oneTouchSplash *,
                #paginaDashboard *,
                #paginaConfiguracoes * {

                    animation-duration:
                        .01ms !important;

                    animation-iteration-count:
                        1 !important;

                    transition-duration:
                        .01ms !important;

                }

            }

        `;


        document.head.appendChild(
            style
        );


        /* =================================================
           TELA DE ABERTURA
           ================================================= */

        let splashJaVisto =
            false;


        try {

            splashJaVisto =
                sessionStorage.getItem(
                    "oneTouchSplashVisto"
                ) === "1";


        } catch (erro) {

            splashJaVisto =
                false;

        }


        if (!splashJaVisto) {

            const splash =
                document.createElement(
                    "div"
                );


            splash.id =
                "oneTouchSplash";


            splash.innerHTML = `

                <div class="ot-splash-inner">

                    <div class="ot-splash-logo">
                        ⚡
                    </div>

                    <h1 class="ot-splash-title">
                        OneTouch Energy
                    </h1>

                    <p class="ot-splash-sub">
                        Energia inteligente
                    </p>

                    <div class="ot-splash-line"></div>

                </div>

            `;


            document.body.appendChild(
                splash
            );


            setTimeout(
                function() {

                    splash.classList.add(
                        "ot-hide"
                    );


                    setTimeout(
                        function() {

                            if (splash) {

                                splash.remove();

                            }

                        },
                        650
                    );


                    try {

                        sessionStorage.setItem(
                            "oneTouchSplashVisto",
                            "1"
                        );

                    } catch (erro) {

                    }

                },
                1600
            );

        }


        /* =================================================
           ANIMAÇÃO AO TROCAR DE PÁGINA
           ================================================= */

        const abrirPaginaOriginal =
            window.abrirPagina;


        if (
            typeof abrirPaginaOriginal ===
            "function"
        ) {

            window.abrirPagina =
                function(pagina) {

                    abrirPaginaOriginal(
                        pagina
                    );


                    const mapa = {

                        inicio:
                            "paginaInicio",

                        dashboard:
                            "paginaDashboard",

                        equipamentos:
                            "paginaEquipamentos",

                        historico:
                            "paginaHistorico",

                        alertas:
                            "paginaAlertas",

                        suporte:
                            "paginaSuporte",

                        empresa:
                            "paginaEmpresa",

                        configuracoes:
                            "paginaConfiguracoes"

                    };


                    const idPagina =
                        mapa[pagina];


                    if (!idPagina) {

                        return;

                    }


                    const alvo =
                        document.getElementById(
                            idPagina
                        );


                    if (alvo) {

                        alvo.classList.remove(
                            "ot-page-enter"
                        );


                        void alvo.offsetWidth;


                        alvo.classList.add(
                            "ot-page-enter"
                        );

                    }

                };

        }

    }


    /* =====================================================
       INICIAR
       ===================================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            adicionarAnimacoesOneTouch
        );


    } else {

        adicionarAnimacoesOneTouch();

    }

})();




/* =====================================================
   CONTROLADORES / IOT
   ===================================================== */

let controladoresCache =
    [];


function normalizarStatusControlador(status) {

    return String(
        status ||
        ""
    )
        .trim()
        .toLowerCase();

}


function formatarStatusControlador(status) {

    const valor =
        normalizarStatusControlador(
            status
        );


    const mapa = {

        ativo:
            "Ativo",

        online:
            "Online",

        aguardando_ativacao:
            "Aguardando ativação",

        aguardando:
            "Aguardando ativação",

        offline:
            "Sem comunicação",

        inativo:
            "Inativo",

        revogado:
            "Revogado"

    };


    return mapa[valor] ||
        status ||
        "Desconhecido";

}


function classeStatusControlador(status) {

    const valor =
        normalizarStatusControlador(
            status
        );


    if (
        valor === "ativo" ||
        valor === "online"
    ) {

        return "online";

    }


    if (
        valor === "aguardando_ativacao" ||
        valor === "aguardando"
    ) {

        return "waiting";

    }


    if (
        valor === "revogado"
    ) {

        return "revoked";

    }


    return "offline";

}


function formatarUltimaComunicacaoControlador(data) {

    if (!data) {

        return "Nunca";

    }


    try {

        const valor =
            new Date(data);


        if (
            Number.isNaN(
                valor.getTime()
            )
        ) {

            return String(data);

        }


        return valor.toLocaleString(
            "pt-BR"
        );


    } catch (erro) {

        return String(data);

    }

}


function escaparHtmlControladores(valor) {

    return String(
        valor ??
        ""
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

}


function atualizarResumoControladores(controladores) {

    const total =
        controladores.length;


    const ativos =
        controladores.filter(
            function(item) {

                const status =
                    normalizarStatusControlador(
                        item.status
                    );


                return (
                    status === "ativo" ||
                    status === "online"
                );

            }
        ).length;


    const aguardando =
        controladores.filter(
            function(item) {

                const status =
                    normalizarStatusControlador(
                        item.status
                    );


                return (
                    status ===
                        "aguardando_ativacao" ||
                    status ===
                        "aguardando"
                );

            }
        ).length;


    const offline =
        controladores.filter(
            function(item) {

                const status =
                    normalizarStatusControlador(
                        item.status
                    );


                return (
                    status === "offline" ||
                    status === "inativo"
                );

            }
        ).length;


    const totalEl =
        document.getElementById(
            "controllersTotal"
        );

    const ativosEl =
        document.getElementById(
            "controllersAtivos"
        );

    const aguardandoEl =
        document.getElementById(
            "controllersAguardando"
        );

    const offlineEl =
        document.getElementById(
            "controllersOffline"
        );


    if (totalEl) {

        totalEl.textContent =
            total;

    }


    if (ativosEl) {

        ativosEl.textContent =
            ativos;

    }


    if (aguardandoEl) {

        aguardandoEl.textContent =
            aguardando;

    }


    if (offlineEl) {

        offlineEl.textContent =
            offline;

    }

}


function renderizarControladores(controladores) {

    const loading =
        document.getElementById(
            "controllersLoading"
        );

    const empty =
        document.getElementById(
            "controllersEmpty"
        );

    const wrapper =
        document.getElementById(
            "controllersTableWrapper"
        );

    const body =
        document.getElementById(
            "controllersTableBody"
        );


    if (loading) {

        loading.classList.add(
            "escondido"
        );

    }


    if (!body) {

        return;

    }


    body.innerHTML =
        "";


    atualizarResumoControladores(
        controladores
    );


    if (
        !Array.isArray(
            controladores
        ) ||
        controladores.length === 0
    ) {

        if (empty) {

            empty.classList.remove(
                "escondido"
            );

        }


        if (wrapper) {

            wrapper.classList.add(
                "escondido"
            );

        }


        return;

    }


    if (empty) {

        empty.classList.add(
            "escondido"
        );

    }


    if (wrapper) {

        wrapper.classList.remove(
            "escondido"
        );

    }


    controladores.forEach(
        function(controlador) {

            const tr =
                document.createElement(
                    "tr"
                );


            const status =
                formatarStatusControlador(
                    controlador.status
                );


            const classeStatus =
                classeStatusControlador(
                    controlador.status
                );


            const nome =
                controlador.nome ||
                "Controlador";


            const controllerId =
                controlador.controller_id ||
                "-";


            const tenant =
                controlador.tenant ||
                (
                    controlador.tenant_id
                        ? "Tenant " +
                            controlador.tenant_id
                        : "-"
                );


            const site =
                controlador.site ||
                (
                    controlador.site_id
                        ? "Site " +
                            controlador.site_id
                        : "-"
                );


            const firmware =
                controlador.firmware_version ||
                "Não informado";


            const ultimaComunicacao =
                formatarUltimaComunicacaoControlador(
                    controlador.last_seen_at
                );


            tr.innerHTML =
                `
                <td>
                    <div class="controllers-device-cell">
                        <div class="controllers-device-icon">
                            <i data-lucide="router"></i>
                        </div>

                        <div>
                            <strong>
                                ${escaparHtmlControladores(nome)}
                            </strong>

                            <span>
                                ${escaparHtmlControladores(controllerId)}
                            </span>

                            ${
                                controlador.equipment_serial
                                    ? `
                                        <small style="display:block;margin-top:3px;color:#8aa0af;">
                                            NS: ${escaparHtmlControladores(controlador.equipment_serial)}
                                        </small>
                                    `
                                    : ""
                            }
                        </div>
                    </div>
                </td>

                <td>
                    <div class="controllers-site-cell">
                        <strong>
                            ${escaparHtmlControladores(site)}
                        </strong>

                        <span>
                            ${escaparHtmlControladores(tenant)}
                        </span>
                    </div>
                </td>

                <td>
                    <span class="controller-status-pill ${classeStatus}">
                        <span></span>
                        ${escaparHtmlControladores(status)}
                    </span>
                </td>

                <td>
                    ${escaparHtmlControladores(firmware)}
                </td>

                <td>
                    ${escaparHtmlControladores(ultimaComunicacao)}
                </td>

                <td class="controllers-actions-cell">

                    <div class="controllers-row-actions">

                        <button
                            type="button"
                            class="controllers-row-button controller-copy-id"
                            data-controller-id="${escaparHtmlControladores(controllerId)}"
                            title="Copiar ID"
                        >
                            <i data-lucide="copy"></i>
                        </button>

                        ${
                            classeStatus === "waiting"
                                ? `
                                    <button
                                        type="button"
                                        class="controllers-row-button controller-regenerate-activation"
                                        data-controller-id="${escaparHtmlControladores(controllerId)}"
                                        data-controller-name="${escaparHtmlControladores(nome)}"
                                        title="Gerar novo código de ativação"
                                    >
                                        <i data-lucide="refresh-cw"></i>
                                    </button>

                                    <button
                                        type="button"
                                        class="controllers-row-button controller-revoke danger"
                                        data-controller-id="${escaparHtmlControladores(controllerId)}"
                                        data-controller-name="${escaparHtmlControladores(nome)}"
                                        title="Revogar controlador"
                                    >
                                        <i data-lucide="ban"></i>
                                    </button>
                                `
                                : classeStatus !== "revoked"
                                    ? `
                                        ${
                                            controlador.equipment_serial &&
                                            String(
                                                controlador.equipment_model ||
                                                ""
                                            )
                                                .toLowerCase()
                                                .includes(
                                                    "ep"
                                                )
                                                ? `
                                                    <button
                                                        type="button"
                                                        class="controllers-row-button controller-sync-epcube"
                                                        data-controller-id="${escaparHtmlControladores(controllerId)}"
                                                        data-controller-name="${escaparHtmlControladores(nome)}"
                                                        title="Sincronizar EPCube agora"
                                                    >
                                                        <i data-lucide="cloud-download"></i>
                                                    </button>
                                                `
                                                : ""
                                        }

                                        <button
                                            type="button"
                                            class="controllers-row-button controller-link-equipment"
                                            data-controller-id="${escaparHtmlControladores(controllerId)}"
                                            data-controller-name="${escaparHtmlControladores(nome)}"
                                            data-current-serial="${escaparHtmlControladores(controlador.equipment_serial || "")}"
                                            data-current-model="${escaparHtmlControladores(controlador.equipment_model || "")}"
                                            title="Vincular equipamento / serial"
                                        >
                                            <i data-lucide="link-2"></i>
                                        </button>

                                        <button
                                            type="button"
                                            class="controllers-row-button controller-rotate-credential"
                                            data-controller-id="${escaparHtmlControladores(controllerId)}"
                                            title="Rotacionar credencial"
                                        >
                                            <i data-lucide="key-round"></i>
                                        </button>

                                        <button
                                            type="button"
                                            class="controllers-row-button controller-revoke danger"
                                            data-controller-id="${escaparHtmlControladores(controllerId)}"
                                            data-controller-name="${escaparHtmlControladores(nome)}"
                                            title="Revogar controlador"
                                        >
                                            <i data-lucide="ban"></i>
                                        </button>
                                    `
                                    : `
                                        <span class="controllers-revoked-label">
                                            Revogado
                                        </span>
                                    `
                        }

                    </div>

                </td>
                `;


            body.appendChild(
                tr
            );

        }
    );


    body
        .querySelectorAll(
            ".controller-copy-id"
        )
        .forEach(
            function(botao) {

                botao.addEventListener(
                    "click",
                    async function() {

                        const controllerId =
                            botao.dataset
                                .controllerId;


                        try {

                            await navigator
                                .clipboard
                                .writeText(
                                    controllerId
                                );


                            const original =
                                botao.innerHTML;


                            botao.innerHTML =
                                '<i data-lucide="check"></i>';


                            if (
                                window.lucide
                            ) {

                                lucide.createIcons();

                            }


                            setTimeout(
                                function() {

                                    botao.innerHTML =
                                        original;


                                    if (
                                        window.lucide
                                    ) {

                                        lucide.createIcons();

                                    }

                                },
                                1200
                            );


                        } catch (erro) {

                            console.error(
                                "Não foi possível copiar o ID:",
                                erro
                            );

                        }

                    }
                );

            }
        );


    body
        .querySelectorAll(
            ".controller-regenerate-activation"
        )
        .forEach(
            function(botao) {

                botao.addEventListener(
                    "click",
                    async function() {

                        await regenerarCodigoAtivacao(
                            botao.dataset.controllerId,
                            botao.dataset.controllerName
                        );

                    }
                );

            }
        );


    body
        .querySelectorAll(
            ".controller-sync-epcube"
        )
        .forEach(
            function(botao) {

                botao.addEventListener(
                    "click",
                    async function() {

                        botao.disabled =
                            true;


                        try {

                            await sincronizarEPCubeAgora(
                                botao.dataset.controllerId,
                                botao.dataset.controllerName
                            );

                        } finally {

                            botao.disabled =
                                false;

                        }

                    }
                );

            }
        );


    body
        .querySelectorAll(
            ".controller-link-equipment"
        )
        .forEach(
            function(botao) {

                botao.addEventListener(
                    "click",
                    async function() {

                        await solicitarVinculoEquipamento(
                            botao.dataset.controllerId,
                            botao.dataset.controllerName,
                            botao.dataset.currentSerial,
                            botao.dataset.currentModel
                        );

                    }
                );

            }
        );


    body
        .querySelectorAll(
            ".controller-rotate-credential"
        )
        .forEach(
            function(botao) {

                botao.addEventListener(
                    "click",
                    async function() {

                        await rotacionarCredencialControlador(
                            botao.dataset.controllerId
                        );

                    }
                );

            }
        );


    body
        .querySelectorAll(
            ".controller-revoke"
        )
        .forEach(
            function(botao) {

                botao.addEventListener(
                    "click",
                    async function() {

                        await revogarControlador(
                            botao.dataset.controllerId,
                            botao.dataset.controllerName
                        );

                    }
                );

            }
        );


    if (
        window.lucide
    ) {

        lucide.createIcons();

    }

}












async function sincronizarEPCubeAgora(
    controllerId,
    controllerName
) {

    try {

        const resposta =
            await fetch(
                "/api/admin/epcube/sync/" +
                encodeURIComponent(
                    controllerId
                ),
                {
                    method:
                        "POST",

                    credentials:
                        "same-origin",

                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );


        let dados =
            {};


        try {

            dados =
                await resposta.json();

        } catch (erro) {

            dados =
                {};

        }


        if (!resposta.ok) {

            throw new Error(
                dados.mensagem ||
                "Não foi possível sincronizar o EPCube."
            );

        }


        const telemetria =
            dados &&
            dados.resultado &&
            dados.resultado.telemetria
                ? dados.resultado.telemetria
                : {};


        const formatar =
            function(valor, sufixo) {

                const numero =
                    Number(
                        valor
                    );


                return Number.isFinite(
                    numero
                )
                    ? numero
                        .toLocaleString(
                            "pt-BR",
                            {
                                maximumFractionDigits:
                                    2
                            }
                        ) +
                        sufixo
                    : "Sem dados";

            };


        window.alert(
            "EPCUBE SINCRONIZADO ✅\n\n" +
            (
                controllerName ||
                controllerId
            ) +
            "\nBateria: " +
            formatar(
                telemetria.battery_percent,
                "%"
            ) +
            "\nRede: " +
            formatar(
                telemetria.grid_power,
                " W"
            ) +
            "\nSolar: " +
            formatar(
                telemetria.solar_power,
                " W"
            ) +
            "\nConsumo: " +
            formatar(
                telemetria.power_total,
                " W"
            )
        );


        /*
           Atualiza controladores e, se o usuário atual tiver acesso
           ao tenant desse equipamento, atualiza também a telemetria.
        */
        await carregarControladores();


        if (
            typeof carregarTelemetriaMaisRecente ===
            "function"
        ) {

            await carregarTelemetriaMaisRecente();

        }


    } catch (erro) {

        console.error(
            "Erro ao sincronizar EPCube:",
            erro
        );


        window.alert(
            "Erro EPCube: " +
            (
                erro.message ||
                "Falha na sincronização."
            )
        );

    }

}


async function solicitarVinculoEquipamento(
    controllerId,
    controllerName,
    serialAtual = "",
    modeloAtual = ""
) {

    const serial =
        window.prompt(
            "Serial / NS do equipamento para " +
            (
                controllerName ||
                controllerId
            ) +
            ":",
            serialAtual ||
            ""
        );


    if (
        serial === null
    ) {

        return;

    }


    const serialLimpo =
        String(
            serial
        ).trim();


    if (!serialLimpo) {

        window.alert(
            "Informe o serial / NS do equipamento."
        );

        return;

    }


    const modelo =
        window.prompt(
            "Modelo do equipamento:",
            modeloAtual ||
            ""
        );


    if (
        modelo === null
    ) {

        return;

    }


    try {

        const dados =
            await vincularEquipamentoControlador(
                controllerId,
                serialLimpo,
                String(
                    modelo
                ).trim()
            );


        window.alert(
            dados.mensagem ||
            "Equipamento vinculado com sucesso."
        );


        await carregarControladores();


    } catch (erro) {

        window.alert(
            "Erro: " +
            (
                erro.message ||
                "Não foi possível vincular o equipamento."
            )
        );

    }

}


async function vincularEquipamentoControlador(
    controllerId,
    serial,
    modelo = ""
) {

    const resposta =
        await fetch(
            "/api/admin/controllers/" +
            encodeURIComponent(
                controllerId
            ) +
            "/equipment",
            {
                method:
                    "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify({
                        serial,
                        modelo
                    })
            }
        );


    const dados =
        await resposta.json();


    if (!resposta.ok) {

        throw new Error(
            dados.mensagem ||
            "Não foi possível vincular o equipamento."
        );

    }


    return dados;

}


async function regenerarCodigoAtivacao(
    controllerId,
    controllerName
) {

    const confirmar =
        window.confirm(
            "Gerar um novo código de ativação para " +
            (
                controllerName ||
                controllerId
            ) +
            "?\n\nO código anterior deixará de funcionar e o novo expirará em 15 minutos."
        );


    if (!confirmar) {

        return;

    }


    try {

        const resposta =
            await fetch(
                "/api/admin/controllers/" +
                encodeURIComponent(
                    controllerId
                ) +
                "/regenerate-activation",
                {
                    method:
                        "POST",

                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );


        let dados =
            {};


        try {

            dados =
                await resposta.json();

        } catch (erro) {

            dados =
                {};

        }


        if (!resposta.ok) {

            throw new Error(
                dados.mensagem ||
                "Não foi possível gerar um novo código de ativação."
            );

        }


        const codigo =
            dados.activation_code ||
            "";


        if (!codigo) {

            throw new Error(
                "O servidor não retornou o código de ativação."
            );

        }


        window.alert(
            "NOVO CÓDIGO DE ATIVAÇÃO\n\n" +
            codigo +
            "\n\nExpira em 15 minutos.\nCopie este código agora."
        );


        try {

            await navigator
                .clipboard
                .writeText(
                    codigo
                );

        } catch (erro) {

            console.log(
                "Código exibido, mas não foi possível copiar automaticamente."
            );

        }


        await carregarControladores();


    } catch (erro) {

        console.error(
            "Erro ao regenerar código de ativação:",
            erro
        );


        window.alert(
            "Erro: " +
            (
                erro.message ||
                "Não foi possível gerar o novo código."
            )
        );

    }

}


async function rotacionarCredencialControlador(
    controllerId
) {

    const confirmar =
        window.confirm(
            "Rotacionar a credencial deste controlador?\n\nA credencial atual deixará de funcionar imediatamente e uma nova será exibida apenas uma vez."
        );


    if (!confirmar) {

        return;

    }


    try {

        const resposta =
            await fetch(
                "/api/admin/controllers/" +
                encodeURIComponent(
                    controllerId
                ) +
                "/rotate-credential",
                {
                    method:
                        "POST"
                }
            );


        let dados =
            {};


        try {

            dados =
                await resposta.json();

        } catch (erro) {

            dados =
                {};

        }


        if (!resposta.ok) {

            throw new Error(
                dados.mensagem ||
                "Não foi possível rotacionar a credencial."
            );

        }


        const novaCredencial =
            dados.credential ||
            "";


        if (!novaCredencial) {

            throw new Error(
                "O servidor não retornou a nova credencial."
            );

        }


        window.alert(
            "NOVA CREDENCIAL GERADA\n\n" +
            novaCredencial +
            "\n\nCopie e guarde agora. Ela não poderá ser recuperada depois."
        );


        try {

            await navigator
                .clipboard
                .writeText(
                    novaCredencial
                );

        } catch (erro) {

            console.log(
                "A credencial foi exibida, mas não pôde ser copiada automaticamente."
            );

        }


        await carregarControladores();


    } catch (erro) {

        console.error(
            "Erro ao rotacionar credencial:",
            erro
        );


        window.alert(
            "Erro: " +
            (
                erro.message ||
                "Não foi possível rotacionar a credencial."
            )
        );

    }

}


async function revogarControlador(
    controllerId,
    controllerName
) {

    const confirmar =
        window.confirm(
            "Revogar " +
            (
                controllerName ||
                controllerId
            ) +
            "?\n\nTodas as credenciais ativas deste controlador deixarão de funcionar imediatamente."
        );


    if (!confirmar) {

        return;

    }


    try {

        const resposta =
            await fetch(
                "/api/admin/controllers/" +
                encodeURIComponent(
                    controllerId
                ) +
                "/revoke",
                {
                    method:
                        "POST"
                }
            );


        let dados =
            {};


        try {

            dados =
                await resposta.json();

        } catch (erro) {

            dados =
                {};

        }


        if (!resposta.ok) {

            throw new Error(
                dados.mensagem ||
                "Não foi possível revogar o controlador."
            );

        }


        window.alert(
            dados.mensagem ||
            "Controlador revogado com sucesso."
        );


        await carregarControladores();


    } catch (erro) {

        console.error(
            "Erro ao revogar controlador:",
            erro
        );


        window.alert(
            "Erro: " +
            (
                erro.message ||
                "Não foi possível revogar o controlador."
            )
        );

    }

}



async function carregarControladores() {

    const loading =
        document.getElementById(
            "controllersLoading"
        );

    const empty =
        document.getElementById(
            "controllersEmpty"
        );

    const wrapper =
        document.getElementById(
            "controllersTableWrapper"
        );

    const atualizacao =
        document.getElementById(
            "controllersUltimaAtualizacao"
        );


    if (loading) {

        loading.classList.remove(
            "escondido"
        );

    }


    if (empty) {

        empty.classList.add(
            "escondido"
        );

    }


    if (wrapper) {

        wrapper.classList.add(
            "escondido"
        );

    }


    try {

        const resposta =
            await fetch(
                "/api/admin/controllers"
            );


        let dados =
            {};


        try {

            dados =
                await resposta.json();

        } catch (erro) {

            dados =
                {};

        }


        if (!resposta.ok) {

            if (
                resposta.status ===
                403
            ) {

                throw new Error(
                    "Seu usuário não possui permissão de administrador para acessar os controladores."
                );

            }


            throw new Error(
                dados.mensagem ||
                "Não foi possível carregar os controladores."
            );

        }


        const lista =
            Array.isArray(
                dados
            )
                ? dados
                : (
                    dados.controladores ||
                    dados.controllers ||
                    []
                );


        controladoresCache =
            lista;


        renderizarControladores(
            lista
        );


        if (atualizacao) {

            atualizacao.textContent =
                "Atualizado em " +
                new Date()
                    .toLocaleTimeString(
                        "pt-BR",
                        {
                            hour:
                                "2-digit",

                            minute:
                                "2-digit"
                        }
                    );

        }


    } catch (erro) {

        console.error(
            "Erro ao carregar controladores:",
            erro
        );


        if (loading) {

            loading.classList.add(
                "escondido"
            );

        }


        if (wrapper) {

            wrapper.classList.add(
                "escondido"
            );

        }


        if (empty) {

            empty.classList.remove(
                "escondido"
            );

            empty.innerHTML =
                `
                <i data-lucide="triangle-alert"></i>

                <strong>
                    Não foi possível carregar os controladores
                </strong>

                <span>
                    ${escaparHtmlControladores(
                        erro.message ||
                        "Verifique a conexão com o servidor."
                    )}
                </span>
                `;

        }


        if (
            window.lucide
        ) {

            lucide.createIcons();

        }

    }

}


function mostrarFormularioNovoControlador(
    mostrar
) {

    const painel =
        document.getElementById(
            "painelNovoControlador"
        );


    if (!painel) {

        return;

    }


    painel.classList.toggle(
        "escondido",
        !mostrar
    );


    if (mostrar) {

        const nome =
            document.getElementById(
                "controllerNome"
            );


        if (nome) {

            setTimeout(
                function() {

                    nome.focus();

                },
                50
            );

        }

    }

}


async function copiarCodigoAtivacao() {

    const codigo =
        document.getElementById(
            "ativacaoCodigo"
        );


    if (!codigo) {

        return;

    }


    const valor =
        codigo.textContent
            .trim();


    if (
        !valor ||
        valor === "-"
    ) {

        return;

    }


    try {

        await navigator
            .clipboard
            .writeText(
                valor
            );


        const botao =
            document.getElementById(
                "btnCopiarAtivacao"
            );


        if (botao) {

            const htmlOriginal =
                botao.innerHTML;


            botao.innerHTML =
                '<i data-lucide="check"></i> Copiado';


            if (
                window.lucide
            ) {

                lucide.createIcons();

            }


            setTimeout(
                function() {

                    botao.innerHTML =
                        htmlOriginal;


                    if (
                        window.lucide
                    ) {

                        lucide.createIcons();

                    }

                },
                1300
            );

        }


    } catch (erro) {

        console.error(
            "Não foi possível copiar o código de ativação:",
            erro
        );

    }

}


const formNovoControlador =
    document.getElementById(
        "formNovoControlador"
    );


if (formNovoControlador) {

    formNovoControlador.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            const nome =
                document
                    .getElementById(
                        "controllerNome"
                    )
                    .value
                    .trim();


            const tenantId =
                Number(
                    document
                        .getElementById(
                            "controllerTenantId"
                        )
                        .value
                );


            const siteId =
                Number(
                    document
                        .getElementById(
                            "controllerSiteId"
                        )
                        .value
                );


            const mensagem =
                document.getElementById(
                    "mensagemControlador"
                );


            const botao =
                document.getElementById(
                    "btnSalvarControlador"
                );


            if (
                !nome ||
                !Number.isInteger(
                    tenantId
                ) ||
                tenantId < 1 ||
                !Number.isInteger(
                    siteId
                ) ||
                siteId < 1
            ) {

                if (mensagem) {

                    mensagem.textContent =
                        "❌ Preencha nome, Tenant ID e Site ID corretamente.";

                    mensagem.className =
                        "controllers-form-message error";

                }


                return;

            }


            if (botao) {

                botao.disabled =
                    true;

                botao.innerHTML =
                    '<i data-lucide="loader-circle"></i> Criando...';


                if (
                    window.lucide
                ) {

                    lucide.createIcons();

                }

            }


            if (mensagem) {

                mensagem.textContent =
                    "Criando controlador...";

                mensagem.className =
                    "controllers-form-message";

            }


            try {

                const resposta =
                    await fetch(
                        "/api/admin/controllers",
                        {

                            method:
                                "POST",

                            headers: {

                                "Content-Type":
                                    "application/json"

                            },

                            body:
                                JSON.stringify(
                                    {

                                        tenant_id:
                                            tenantId,

                                        site_id:
                                            siteId,

                                        nome:
                                            nome

                                    }
                                )

                        }
                    );


                let dados =
                    {};


                try {

                    dados =
                        await resposta.json();

                } catch (erro) {

                    dados =
                        {};

                }


                if (!resposta.ok) {

                    throw new Error(
                        dados.mensagem ||
                        "Não foi possível criar o controlador."
                    );

                }


                const controlador =
                    dados.controlador ||
                    dados.controller ||
                    {};


                const controllerId =
                    controlador.controller_id ||
                    "-";


                const activationCode =
                    controlador.activation_code ||
                    controlador.codigo_ativacao ||
                    "-";


                const card =
                    document.getElementById(
                        "cardAtivacaoControlador"
                    );

                const idEl =
                    document.getElementById(
                        "ativacaoControllerId"
                    );

                const codigoEl =
                    document.getElementById(
                        "ativacaoCodigo"
                    );


                if (idEl) {

                    idEl.textContent =
                        controllerId;

                }


                if (codigoEl) {

                    codigoEl.textContent =
                        activationCode;

                }


                if (card) {

                    card.classList.remove(
                        "escondido"
                    );

                }


                if (mensagem) {

                    mensagem.textContent =
                        dados.mensagem ||
                        "✅ Controlador criado com sucesso.";

                    mensagem.className =
                        "controllers-form-message success";

                }


                formNovoControlador.reset();


                await carregarControladores();


            } catch (erro) {

                console.error(
                    "Erro ao criar controlador:",
                    erro
                );


                if (mensagem) {

                    mensagem.textContent =
                        "❌ " +
                        (
                            erro.message ||
                            "Não foi possível criar o controlador."
                        );

                    mensagem.className =
                        "controllers-form-message error";

                }


            } finally {

                if (botao) {

                    botao.disabled =
                        false;

                    botao.innerHTML =
                        '<i data-lucide="plus-circle"></i> Criar controlador';


                    if (
                        window.lucide
                    ) {

                        lucide.createIcons();

                    }

                }

            }

        }
    );

}


const btnAbrirNovoControlador =
    document.getElementById(
        "btnAbrirNovoControlador"
    );


if (btnAbrirNovoControlador) {

    btnAbrirNovoControlador.addEventListener(
        "click",
        function() {

            mostrarFormularioNovoControlador(
                true
            );

        }
    );

}


[
    "btnFecharNovoControlador",
    "btnCancelarNovoControlador"
]
    .forEach(
        function(id) {

            const botao =
                document.getElementById(
                    id
                );


            if (botao) {

                botao.addEventListener(
                    "click",
                    function() {

                        mostrarFormularioNovoControlador(
                            false
                        );

                    }
                );

            }

        }
    );


const btnAtualizarControladores =
    document.getElementById(
        "btnAtualizarControladores"
    );


if (btnAtualizarControladores) {

    btnAtualizarControladores.addEventListener(
        "click",
        carregarControladores
    );

}


const btnCopiarAtivacao =
    document.getElementById(
        "btnCopiarAtivacao"
    );


if (btnCopiarAtivacao) {

    btnCopiarAtivacao.addEventListener(
        "click",
        copiarCodigoAtivacao
    );

}





/* =====================================================
   HISTÓRICO DE TELEMETRIA REAL
   ===================================================== */

let historicoPeriodoDias =
    7;

let historicoChart =
    null;


function numeroHistorico(
    valor,
    casas = 2
) {

    const numero =
        Number(
            valor
        );


    if (
        !Number.isFinite(
            numero
        )
    ) {

        return "--";

    }


    return numero
        .toFixed(
            casas
        )
        .replace(
            ".",
            ","
        );

}


function dataHistorico(
    valor,
    incluirHora = true
) {

    if (!valor) {

        return "--";

    }


    try {

        const data =
            new Date(
                valor
            );


        if (
            Number.isNaN(
                data.getTime()
            )
        ) {

            return "--";

        }


        return data.toLocaleString(
            "pt-BR",
            incluirHora
                ? {
                    day:
                        "2-digit",
                    month:
                        "2-digit",
                    year:
                        "numeric",
                    hour:
                        "2-digit",
                    minute:
                        "2-digit"
                }
                : {
                    day:
                        "2-digit",
                    month:
                        "2-digit"
                }
        );


    } catch (erro) {

        return "--";

    }

}


function atualizarTextoHistorico(
    id,
    texto
) {

    const elemento =
        document.getElementById(
            id
        );


    if (elemento) {

        elemento.textContent =
            texto;

    }

}


function configurarPeriodoHistorico(
    dias
) {

    historicoPeriodoDias =
        Number(
            dias
        ) ||
        7;


    const mapa = {

        1:
            "Hoje",

        7:
            "Últimos 7 dias",

        30:
            "Últimos 30 dias",

        365:
            "Último ano"

    };


    atualizarTextoHistorico(
        "historicoPeriodoLabel",
        mapa[
            historicoPeriodoDias
        ] ||
        (
            "Últimos " +
            historicoPeriodoDias +
            " dias"
        )
    );

}


function renderizarGraficoHistorico(
    leituras
) {

    const canvas =
        document.getElementById(
            "historyEnergyChart"
        );

    const semDados =
        document.getElementById(
            "historicoSemDados"
        );


    if (
        !canvas ||
        typeof Chart ===
            "undefined"
    ) {

        return;

    }


    const pontos =
        leituras
            .filter(
                function(leitura) {

                    return Number.isFinite(
                        Number(
                            leitura.power_total
                        )
                    );

                }
            );


    if (
        semDados
    ) {

        semDados.classList.toggle(
            "escondido",
            pontos.length > 0
        );

    }


    canvas.style.display =
        pontos.length > 0
            ? "block"
            : "none";


    if (
        historicoChart
    ) {

        historicoChart.destroy();

        historicoChart =
            null;

    }


    try {

        const existente =
            typeof Chart.getChart ===
                "function"
                ? Chart.getChart(
                    canvas
                )
                : null;


        if (
            existente
        ) {

            existente.destroy();

        }

    } catch (erro) {

    }


    if (
        pontos.length === 0
    ) {

        return;

    }


    const labels =
        pontos.map(
            function(leitura) {

                return dataHistorico(
                    leitura.timestamp_utc,
                    historicoPeriodoDias <= 1
                );

            }
        );


    const valores =
        pontos.map(
            function(leitura) {

                return Number(
                    leitura.power_total
                ) / 1000;

            }
        );


    historicoChart =
        new Chart(
            canvas.getContext(
                "2d"
            ),
            {

                type:
                    "line",

                data: {

                    labels:
                        labels,

                    datasets: [
                        {

                            label:
                                "Consumo medido",

                            data:
                                valores,

                            borderColor:
                                "#12b8c4",

                            backgroundColor:
                                "rgba(18,184,196,.08)",

                            borderWidth:
                                2.4,

                            pointRadius:
                                pontos.length <= 50
                                    ? 3
                                    : 0,

                            pointHoverRadius:
                                5,

                            fill:
                                true,

                            tension:
                                .32

                        }
                    ]

                },

                options: {

                    responsive:
                        true,

                    maintainAspectRatio:
                        false,

                    interaction: {

                        intersect:
                            false,

                        mode:
                            "index"

                    },

                    plugins: {

                        legend: {

                            display:
                                false

                        },

                        tooltip: {

                            callbacks: {

                                label:
                                    function(context) {

                                        return (
                                            "Potência: " +
                                            context.parsed.y
                                                .toFixed(
                                                    2
                                                )
                                                .replace(
                                                    ".",
                                                    ","
                                                ) +
                                            " kW"
                                        );

                                    }

                            }

                        }

                    },

                    scales: {

                        x: {

                            grid: {

                                display:
                                    false

                            },

                            ticks: {

                                maxTicksLimit:
                                    10

                            }

                        },

                        y: {

                            beginAtZero:
                                true,

                            ticks: {

                                callback:
                                    function(valor) {

                                        return valor +
                                            " kW";

                                    }

                            }

                        }

                    }

                }

            }
        );

}


function preencherHistorico(
    leituras
) {

    const listaOriginal =
        Array.isArray(
            leituras
        )
            ? leituras
            : [];


    const lista =
        listaOriginal.map(
            function(item) {

                let dados =
                    item &&
                    item.data &&
                    typeof item.data ===
                        "object"
                        ? item.data
                        : {};


                if (
                    item &&
                    typeof item.data ===
                        "string"
                ) {

                    try {

                        dados =
                            JSON.parse(
                                item.data
                            );

                    } catch (erro) {

                        dados =
                            {};

                    }

                }


                return {
                    ...item,

                    power_total:
                        item.power_total ??
                        dados.power_total ??
                        null,

                    frequency:
                        item.frequency ??
                        dados.frequency ??
                        null,

                    energy_import:
                        item.energy_import ??
                        dados.energy_import ??
                        null
                };

            }
        );


    const leiturasComPotencia =
        lista.filter(
            function(item) {

                return Number.isFinite(
                    Number(
                        item.power_total
                    )
                );

            }
        );


    const ultima =
        lista.length > 0
            ? lista[
                lista.length - 1
            ]
            : null;


    const ultimaPotencia =
        [...leiturasComPotencia]
            .reverse()[0] ||
        null;


    const potenciaMaxima =
        leiturasComPotencia.length > 0
            ? Math.max(
                ...leiturasComPotencia.map(
                    function(item) {

                        return Number(
                            item.power_total
                        );

                    }
                )
            )
            : null;


    const ultimaEnergia =
        [...lista]
            .reverse()
            .find(
                function(item) {

                    return Number.isFinite(
                        Number(
                            item.energy_import
                        )
                    );

                }
            );


    atualizarTextoHistorico(
        "historicoPotenciaAtual",
        ultimaPotencia
            ? (
                numeroHistorico(
                    Number(
                        ultimaPotencia
                            .power_total
                    ) /
                    1000
                ) +
                " kW"
            )
            : "-- kW"
    );


    atualizarTextoHistorico(
        "historicoPotenciaAtualInfo",
        ultimaPotencia
            ? (
                "Leitura de " +
                dataHistorico(
                    ultimaPotencia
                        .timestamp_utc
                )
            )
            : "Aguardando telemetria"
    );


    atualizarTextoHistorico(
        "historicoPotenciaMaxima",
        potenciaMaxima !== null
            ? (
                numeroHistorico(
                    potenciaMaxima /
                    1000
                ) +
                " kW"
            )
            : "-- kW"
    );


    atualizarTextoHistorico(
        "historicoEnergiaImportada",
        ultimaEnergia
            ? (
                numeroHistorico(
                    ultimaEnergia
                        .energy_import,
                    1
                ) +
                " kWh"
            )
            : "-- kWh"
    );


    atualizarTextoHistorico(
        "historicoTotalLeituras",
        String(
            lista.length
        )
    );


    atualizarTextoHistorico(
        "historicoControlador",
        ultima
            ? (
                ultima.controller_name ||
                ultima.controller_id ||
                "--"
            )
            : "--"
    );


    atualizarTextoHistorico(
        "historicoDispositivo",
        ultima
            ? (
                ultima.device_id ||
                "--"
            )
            : "--"
    );


    atualizarTextoHistorico(
        "historicoFrequencia",
        ultima &&
        Number.isFinite(
            Number(
                ultima.frequency
            )
        )
            ? (
                numeroHistorico(
                    ultima.frequency,
                    1
                ) +
                " Hz"
            )
            : "--"
    );


    atualizarTextoHistorico(
        "historicoQualidade",
        ultima
            ? (
                ultima.quality ||
                "--"
            )
            : "--"
    );


    const status =
        document.getElementById(
            "historicoStatus"
        );


    if (status) {

        status.innerHTML =
            '<span></span>' +
            (
                lista.length > 0
                    ? (
                        "Sincronizado · " +
                        lista.length +
                        (
                            lista.length === 1
                                ? " leitura"
                                : " leituras"
                        )
                    )
                    : "Sem dados no período"
            );

    }


    renderizarGraficoHistorico(
        lista
    );


    if (
        window.lucide
    ) {

        lucide.createIcons();

    }

}


async function carregarHistoricoTelemetria(
    dias = historicoPeriodoDias
) {

    if (
        !usuarioLogado ||
        usuarioLogado.id ===
            "DEMO"
    ) {

        return;

    }


    configurarPeriodoHistorico(
        dias
    );


    const status =
        document.getElementById(
            "historicoStatus"
        );


    if (status) {

        status.innerHTML =
            '<span></span>Carregando telemetria...';

    }


    try {

        const resposta =
            await fetch(
                "/api/telemetry/history?days=" +
                encodeURIComponent(
                    historicoPeriodoDias
                ),
                {

                    method:
                        "GET",

                    headers: {

                        "Accept":
                            "application/json"

                    }

                }
            );


        let dados =
            {};


        try {

            dados =
                await resposta.json();

        } catch (erro) {

            dados =
                {};

        }


        if (!resposta.ok) {

            throw new Error(
                dados.mensagem ||
                "Não foi possível carregar o histórico."
            );

        }


        preencherHistorico(
            Array.isArray(
                dados.historico
            )
                ? dados.historico
                : (
                    Array.isArray(
                        dados.readings
                    )
                        ? dados.readings
                        : []
                )
        );


    } catch (erro) {

        console.error(
            "Erro ao carregar histórico:",
            erro
        );


        if (status) {

            status.innerHTML =
                '<span></span>Erro ao sincronizar';

        }


        preencherHistorico(
            []
        );

    }

}


document
    .querySelectorAll(
        "[data-history-period]"
    )
    .forEach(
        function(botao) {

            botao.addEventListener(
                "click",
                function() {

                    document
                        .querySelectorAll(
                            "[data-history-period]"
                        )
                        .forEach(
                            function(item) {

                                item.classList.remove(
                                    "active"
                                );

                            }
                        );


                    botao.classList.add(
                        "active"
                    );


                    carregarHistoricoTelemetria(
                        Number(
                            botao.dataset
                                .historyPeriod
                        )
                    );

                }
            );

        }
    );





/* =====================================================
   ALERTAS REAIS
   ===================================================== */

let alertasCache =
    [];

let alertasFiltroAtual =
    "todos";


function escaparHtmlAlertas(
    valor
) {

    return String(
        valor ??
        ""
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

}


function formatarDataAlerta(
    valor
) {

    if (!valor) {

        return "Sem registro de comunicação";

    }


    try {

        const data =
            new Date(
                valor
            );


        if (
            Number.isNaN(
                data.getTime()
            )
        ) {

            return "--";

        }


        return data.toLocaleString(
            "pt-BR",
            {
                day:
                    "2-digit",

                month:
                    "2-digit",

                year:
                    "numeric",

                hour:
                    "2-digit",

                minute:
                    "2-digit"
            }
        );


    } catch (erro) {

        return "--";

    }

}


function atualizarResumoAlertas(
    resumo
) {

    const dados =
        resumo ||
        {};


    const mapa = {

        alertasCriticos:
            dados.critical ||
            0,

        alertasAtencao:
            dados.warning ||
            0,

        alertasInformativos:
            dados.info ||
            0,

        alertasTotal:
            dados.total ||
            0

    };


    Object.entries(
        mapa
    )
        .forEach(
            function([
                id,
                valor
            ]) {

                const elemento =
                    document.getElementById(
                        id
                    );


                if (elemento) {

                    elemento.textContent =
                        valor;

                }

            }
        );


    const badge =
        document.getElementById(
            "alertasNavBadge"
        );


    if (badge) {

        const pendentes =
            (
                dados.critical ||
                0
            ) +
            (
                dados.warning ||
                0
            );


        badge.textContent =
            pendentes;


        badge.style.display =
            pendentes > 0
                ? ""
                : "none";

    }

}


function renderizarAlertas() {

    const lista =
        document.getElementById(
            "alertasLista"
        );


    if (!lista) {

        return;

    }


    const filtrados =
        alertasFiltroAtual ===
            "todos"
            ? alertasCache
            : alertasCache.filter(
                function(item) {

                    return item.severity ===
                        alertasFiltroAtual;

                }
            );


    if (
        filtrados.length ===
        0
    ) {

        lista.innerHTML =
            `
            <div class="controllers-empty">
                <i data-lucide="circle-check-big"></i>

                <strong>
                    Nenhum alerta nesta categoria
                </strong>

                <span>
                    Não existem ocorrências correspondentes ao filtro selecionado.
                </span>
            </div>
            `;


        if (
            window.lucide
        ) {

            lucide.createIcons();

        }


        return;

    }


    lista.innerHTML =
        filtrados.map(
            function(alerta) {

                const severity =
                    alerta.severity ||
                    "info";


                const classe =
                    severity ===
                        "critical"
                        ? "critical"
                        : severity ===
                            "warning"
                            ? "warning"
                            : "info";


                const categoria =
                    alerta.category ||
                    (
                        severity ===
                            "critical"
                            ? "CRÍTICO"
                            : severity ===
                                "warning"
                                ? "ATENÇÃO"
                                : "SISTEMA"
                    );


                return `
                    <article class="alert-professional-card ${classe}">

                        <div class="alert-professional-icon">
                            <i data-lucide="${escaparHtmlAlertas(
                                alerta.icon ||
                                "bell-ring"
                            )}"></i>
                        </div>

                        <div class="alert-professional-content">

                            <div class="alert-professional-top">

                                <div>

                                    <span class="alert-category ${classe}">
                                        ${escaparHtmlAlertas(
                                            categoria
                                        )}
                                    </span>

                                    <span class="alert-time">
                                        ${escaparHtmlAlertas(
                                            formatarDataAlerta(
                                                alerta.timestamp
                                            )
                                        )}
                                    </span>

                                </div>

                                <span class="alert-status ${
                                    severity ===
                                        "info"
                                        ? "read"
                                        : "unread"
                                }">
                                    ${
                                        severity ===
                                            "info"
                                            ? "Informativo"
                                            : "Requer atenção"
                                    }
                                </span>

                            </div>

                            <h3>
                                ${escaparHtmlAlertas(
                                    alerta.title ||
                                    "Ocorrência"
                                )}
                            </h3>

                            <p>
                                ${escaparHtmlAlertas(
                                    alerta.message ||
                                    ""
                                )}
                            </p>

                            <div class="alert-professional-meta">

                                ${
                                    alerta.controller_name ||
                                    alerta.controller_id
                                        ? `
                                            <span>
                                                <i data-lucide="router"></i>
                                                ${escaparHtmlAlertas(
                                                    alerta.controller_name ||
                                                    alerta.controller_id
                                                )}
                                            </span>
                                        `
                                        : ""
                                }

                                ${
                                    alerta.site
                                        ? `
                                            <span>
                                                <i data-lucide="map-pin"></i>
                                                ${escaparHtmlAlertas(
                                                    alerta.site
                                                )}
                                            </span>
                                        `
                                        : ""
                                }

                            </div>

                        </div>

                    </article>
                `;

            }
        )
        .join(
            ""
        );


    if (
        window.lucide
    ) {

        lucide.createIcons();

    }

}


async function carregarAlertasReais() {

    if (
        !usuarioLogado ||
        usuarioLogado.id ===
            "DEMO"
    ) {

        return;

    }


    const lista =
        document.getElementById(
            "alertasLista"
        );


    if (lista) {

        lista.innerHTML =
            `
            <div class="controllers-loading">
                <i data-lucide="loader-circle"></i>
                Carregando alertas...
            </div>
            `;


        if (
            window.lucide
        ) {

            lucide.createIcons();

        }

    }


    try {

        const resposta =
            await fetch(
                "/api/alerts",
                {

                    method:
                        "GET",

                    headers: {

                        "Accept":
                            "application/json"

                    }

                }
            );


        let dados =
            {};


        try {

            dados =
                await resposta.json();

        } catch (erro) {

            dados =
                {};

        }


        if (!resposta.ok) {

            throw new Error(
                dados.mensagem ||
                "Não foi possível carregar os alertas."
            );

        }


        alertasCache =
            Array.isArray(
                dados.alerts
            )
                ? dados.alerts
                : [];


        atualizarResumoAlertas(
            dados.summary
        );


        renderizarAlertas();


        const atualizado =
            document.getElementById(
                "alertasAtualizadosEm"
            );


        if (atualizado) {

            atualizado.textContent =
                "Atualizado às " +
                new Date()
                    .toLocaleTimeString(
                        "pt-BR",
                        {
                            hour:
                                "2-digit",

                            minute:
                                "2-digit"
                        }
                    );

        }


    } catch (erro) {

        console.error(
            "Erro ao carregar alertas:",
            erro
        );


        alertasCache =
            [];


        atualizarResumoAlertas(
            {
                critical:
                    0,
                warning:
                    0,
                info:
                    0,
                total:
                    0
            }
        );


        if (lista) {

            lista.innerHTML =
                `
                <div class="controllers-empty">
                    <i data-lucide="triangle-alert"></i>

                    <strong>
                        Não foi possível carregar os alertas
                    </strong>

                    <span>
                        ${escaparHtmlAlertas(
                            erro.message ||
                            "Verifique a conexão com o servidor."
                        )}
                    </span>
                </div>
                `;

        }


        if (
            window.lucide
        ) {

            lucide.createIcons();

        }

    }

}


document
    .querySelectorAll(
        "[data-alert-filter]"
    )
    .forEach(
        function(botao) {

            botao.addEventListener(
                "click",
                function() {

                    alertasFiltroAtual =
                        botao.dataset
                            .alertFilter ||
                        "todos";


                    document
                        .querySelectorAll(
                            "[data-alert-filter]"
                        )
                        .forEach(
                            function(item) {

                                item.classList.remove(
                                    "active"
                                );

                            }
                        );


                    botao.classList.add(
                        "active"
                    );


                    renderizarAlertas();

                }
            );

        }
    );


const btnAtualizarAlertas =
    document.getElementById(
        "btnAtualizarAlertas"
    );


if (btnAtualizarAlertas) {

    btnAtualizarAlertas.addEventListener(
        "click",
        carregarAlertasReais
    );

}



/* =====================================================
   FINALIZAÇÃO
   ===================================================== */

console.log(
    "✅ OneTouch Energy JS carregado com sucesso."
);

/* Atualiza a data exibida no dashboard ao carregar a interface. */
if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        atualizarDataDashboard
    );

} else {

    atualizarDataDashboard();

}

/* =====================================================
   ANIMAÇÕES RICAS DO FLUXO DE ENERGIA
   ===================================================== */

(function adicionarAnimacaoFluxoEnergiaRica() {

    if (
        document.getElementById(
            "oneTouchEnergyFlowMotionRich"
        )
    ) {

        return;

    }


    const style =
        document.createElement(
            "style"
        );


    style.id =
        "oneTouchEnergyFlowMotionRich";


    style.textContent = `
        #paginaInicio .energy-flow-card {
            position: relative;
            overflow: hidden;
        }

        #paginaInicio .energy-flow-card::before {
            content: "";
            position: absolute;
            inset: -18%;
            pointer-events: none;
            background:
                radial-gradient(
                    circle at 50% 40%,
                    rgba(35, 213, 225, .11),
                    transparent 34%
                ),
                radial-gradient(
                    circle at 82% 18%,
                    rgba(25, 177, 207, .08),
                    transparent 23%
                );
            animation:
                otFlowAmbient
                5.5s
                ease-in-out
                infinite;
        }

        #paginaInicio .flow-node {
            transition:
                transform .28s ease,
                border-color .28s ease,
                box-shadow .28s ease;
        }

        #paginaInicio .flow-node:hover {
            transform:
                translateY(-4px);
            border-color:
                rgba(67, 218, 229, .28);
            box-shadow:
                0 18px 38px
                rgba(0, 0, 0, .16);
        }

        #paginaInicio .flow-node-icon {
            position: relative;
            overflow: visible;
            animation:
                otNodeGlow
                2.8s
                ease-in-out
                infinite;
        }

        #paginaInicio .flow-node-icon::after {
            content: "";
            position: absolute;
            inset: -8px;
            border-radius: 16px;
            border:
                1px solid
                rgba(76, 222, 231, .12);
            opacity: 0;
            animation:
                otIconWave
                2.6s
                ease-out
                infinite;
        }

        #paginaInicio .flow-node-solar .flow-node-icon svg {
            animation:
                otSolarSpin
                8s
                linear
                infinite;
            transform-origin:
                center;
        }

        #paginaInicio .flow-node-grid .flow-node-icon svg {
            animation:
                otGridPulse
                2.2s
                ease-in-out
                infinite;
        }

        #paginaInicio .flow-node-load .flow-node-icon svg {
            animation:
                otLoadBeat
                1.8s
                ease-in-out
                infinite;
        }

        #paginaInicio .flow-node > strong {
            animation:
                otNumberGlow
                3s
                ease-in-out
                infinite;
        }

        #paginaInicio .flow-core {
            filter:
                drop-shadow(
                    0 8px 24px
                    rgba(18, 189, 204, .12)
                );
        }

        #paginaInicio .flow-core-ring {
            position: relative;
            animation:
                otCoreBreathe
                3s
                ease-in-out
                infinite;
        }

        #paginaInicio .flow-core-ring::before {
            content: "";
            position: absolute;
            inset: -14px;
            border-radius: 50%;
            border:
                1px solid
                rgba(67, 221, 230, .18);
            box-shadow:
                0 0 28px
                rgba(40, 207, 218, .10);
            animation:
                otCoreHalo
                2.6s
                ease-out
                infinite;
        }

        #paginaInicio .flow-core-inner svg {
            animation:
                otBatteryZap
                1.8s
                ease-in-out
                infinite;
        }

        #paginaInicio .flow-core-status > span {
            animation:
                otStatusBeacon
                1.55s
                ease-in-out
                infinite;
        }

        #paginaInicio .flow-connector {
            overflow: visible;
            box-shadow:
                0 0 12px
                rgba(41, 209, 217, .12);
        }

        #paginaInicio .flow-connector::before {
            content: "";
            position: absolute;
            width: 11px;
            height: 11px;
            border-radius: 50%;
            background:
                #74f3f7;
            box-shadow:
                0 0 8px
                rgba(92, 235, 242, .85),
                0 0 18px
                rgba(60, 214, 225, .45);
        }

        #paginaInicio .flow-connector::after {
            width: 5px;
            height: 5px;
            background:
                #d5fdff;
            box-shadow:
                0 0 8px
                rgba(166, 248, 252, .95),
                0 0 16px
                rgba(71, 223, 232, .50);
        }

        #paginaInicio .connector-grid::before {
            top: 50%;
            left: 0;
            transform:
                translate(-50%, -50%);
            animation:
                otTravelGrid
                2.15s
                linear
                infinite;
        }

        #paginaInicio .connector-grid::after {
            top: 50%;
            left: 0;
            right: auto;
            transform:
                translate(-50%, -50%);
            animation:
                otTravelGrid
                2.15s
                linear
                .95s
                infinite;
        }

        #paginaInicio .connector-solar::before {
            top: 50%;
            right: 0;
            transform:
                translate(50%, -50%);
            animation:
                otTravelSolar
                2s
                linear
                infinite;
        }

        #paginaInicio .connector-solar::after {
            top: 50%;
            right: 0;
            left: auto;
            transform:
                translate(50%, -50%);
            animation:
                otTravelSolar
                2s
                linear
                .9s
                infinite;
        }

        #paginaInicio .connector-load::before {
            top: 0;
            left: 50%;
            transform:
                translate(-50%, -50%);
            animation:
                otTravelLoad
                1.8s
                linear
                infinite;
        }

        #paginaInicio .connector-load::after {
            top: 0;
            bottom: auto;
            left: 50%;
            transform:
                translate(-50%, -50%);
            animation:
                otTravelLoad
                1.8s
                linear
                .8s
                infinite;
        }

        #paginaInicio .flow-summary-card,
        #paginaInicio .flow-stat {
            transition:
                transform .24s ease,
                box-shadow .24s ease;
        }

        #paginaInicio .flow-summary-card:hover,
        #paginaInicio .flow-stat:hover {
            transform:
                translateY(-3px);
            box-shadow:
                0 12px 28px
                rgba(8, 50, 70, .08);
        }

        @keyframes otTravelGrid {
            0% {
                left: 0%;
                opacity: 0;
            }

            10% {
                opacity: 1;
            }

            90% {
                opacity: 1;
            }

            100% {
                left: 100%;
                opacity: 0;
            }
        }

        @keyframes otTravelSolar {
            0% {
                right: 0%;
                opacity: 0;
            }

            10% {
                opacity: 1;
            }

            90% {
                opacity: 1;
            }

            100% {
                right: 100%;
                opacity: 0;
            }
        }

        @keyframes otTravelLoad {
            0% {
                top: 0%;
                opacity: 0;
            }

            12% {
                opacity: 1;
            }

            88% {
                opacity: 1;
            }

            100% {
                top: 100%;
                opacity: 0;
            }
        }

        @keyframes otFlowAmbient {
            0%,
            100% {
                opacity: .55;
                transform:
                    scale(1);
            }

            50% {
                opacity: 1;
                transform:
                    scale(1.025);
            }
        }

        @keyframes otNodeGlow {
            0%,
            100% {
                box-shadow:
                    0 0 0
                    rgba(62, 220, 230, 0);
            }

            50% {
                box-shadow:
                    0 0 22px
                    rgba(62, 220, 230, .16);
            }
        }

        @keyframes otIconWave {
            0% {
                opacity: .55;
                transform:
                    scale(.82);
            }

            75%,
            100% {
                opacity: 0;
                transform:
                    scale(1.28);
            }
        }

        @keyframes otSolarSpin {
            to {
                transform:
                    rotate(360deg);
            }
        }

        @keyframes otGridPulse {
            0%,
            100% {
                opacity: .72;
                transform:
                    scale(.96);
            }

            50% {
                opacity: 1;
                transform:
                    scale(1.08);
            }
        }

        @keyframes otLoadBeat {
            0%,
            100% {
                transform:
                    scale(1);
            }

            50% {
                transform:
                    scale(1.10);
            }
        }

        @keyframes otNumberGlow {
            0%,
            100% {
                text-shadow:
                    0 0 0
                    rgba(83, 230, 238, 0);
            }

            50% {
                text-shadow:
                    0 0 14px
                    rgba(83, 230, 238, .12);
            }
        }

        @keyframes otCoreBreathe {
            0%,
            100% {
                transform:
                    scale(1);
            }

            50% {
                transform:
                    scale(1.018);
            }
        }

        @keyframes otCoreHalo {
            0% {
                opacity: .72;
                transform:
                    scale(.96);
            }

            75%,
            100% {
                opacity: 0;
                transform:
                    scale(1.12);
            }
        }

        @keyframes otBatteryZap {
            0%,
            100% {
                opacity: .72;
                transform:
                    translateY(0)
                    scale(1);
            }

            50% {
                opacity: 1;
                transform:
                    translateY(-2px)
                    scale(1.08);
            }
        }

        @keyframes otStatusBeacon {
            0%,
            100% {
                opacity: .55;
                box-shadow:
                    0 0 0 3px
                    rgba(24, 166, 111, .06);
            }

            50% {
                opacity: 1;
                box-shadow:
                    0 0 0 7px
                    rgba(24, 166, 111, .10);
            }
        }

        @media (
            prefers-reduced-motion:
            reduce
        ) {
            #paginaInicio .energy-flow-card *,
            #paginaInicio .energy-flow-card::before,
            #paginaInicio .flow-connector::before,
            #paginaInicio .flow-connector::after {
                animation:
                    none !important;
                transition:
                    none !important;
            }
        }
    `;


    document.head.appendChild(
        style
    );

})();



/* Sincroniza o usuário real da sessão ao carregar a aplicação. */
aplicarPermissoesInterface();

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        async function() {

            aplicarPermissoesInterface();

            await sincronizarSessaoUsuario();

        }
    );

} else {

    sincronizarSessaoUsuario();

}

