/* =====================================================
   ONETOUCH ENERGY
   SISTEMA DE LOGIN / CADASTRO
   ===================================================== */


/* =====================================================
   VARIÁVEIS DO SISTEMA
   ===================================================== */

let gmailRecuperacao = "";

/*
   Guarda os dados do usuário que está logado.

   Depois do login, o backend deve retornar:
   id
   nome
   gmail
   telefone
   data_registro
*/
let usuarioLogado = null;


/* =====================================================
   FUNÇÃO PARA MOSTRAR AS TELAS
   ===================================================== */

function mostrarTela(tela) {

    const telas = [
        "telaCadastro",
        "telaLogin",
        "telaRecuperar",
        "telaNovaSenha"
    ];

    telas.forEach(function(id) {

        const elemento = document.getElementById(id);

        if (elemento) {
            elemento.classList.add("escondido");
        }

    });


    if (tela === "cadastro") {

        const elemento =
            document.getElementById("telaCadastro");

        if (elemento) {
            elemento.classList.remove("escondido");
        }

    }


    if (tela === "login") {

        const elemento =
            document.getElementById("telaLogin");

        if (elemento) {
            elemento.classList.remove("escondido");
        }

    }


    if (tela === "recuperar") {

        const elemento =
            document.getElementById("telaRecuperar");

        if (elemento) {
            elemento.classList.remove("escondido");
        }

    }


    if (tela === "novaSenha") {

        const elemento =
            document.getElementById("telaNovaSenha");

        if (elemento) {
            elemento.classList.remove("escondido");
        }

    }

}


/* =====================================================
   CADASTRO
   ===================================================== */

const formCadastro =
    document.getElementById("formCadastro");


if (formCadastro) {

    formCadastro.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            /* =================================================
               PEGAR DADOS DO FORMULÁRIO
            ================================================= */

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


            const senha =
                document
                    .getElementById("senha")
                    .value;


            const confirmarSenha =
                document
                    .getElementById("confirmarSenha")
                    .value;


            const mensagem =
                document
                    .getElementById("mensagemCadastro");


            /* =================================================
               VALIDAÇÃO DO NOME
            ================================================= */

            if (nome.length < 2) {

                mensagem.style.color = "red";

                mensagem.textContent =
                    "❌ Digite um nome válido.";

                return;

            }


            /* =================================================
               VALIDAÇÃO DO GMAIL
            ================================================= */

            if (!gmail.endsWith("@gmail.com")) {

                mensagem.style.color = "red";

                mensagem.textContent =
                    "❌ Gmail inválido! Use um endereço terminado em @gmail.com.";

                return;

            }


            /* =================================================
               LIMPAR TELEFONE
            ================================================= */

            const numerosTelefone =
                telefone.replace(/\D/g, "");


            if (numerosTelefone.length !== 11) {

                mensagem.style.color = "red";

                mensagem.textContent =
                    "❌ Telefone inválido! Digite DDD + 9 dígitos.";

                return;

            }


            /* =================================================
               VALIDAÇÃO DA SENHA
            ================================================= */

            if (senha.length < 7) {

                mensagem.style.color = "red";

                mensagem.textContent =
                    "❌ A senha precisa ter no mínimo 7 caracteres.";

                return;

            }


            if (!/[A-Za-z]/.test(senha)) {

                mensagem.style.color = "red";

                mensagem.textContent =
                    "❌ A senha precisa ter pelo menos uma letra.";

                return;

            }


            if (!/[0-9]/.test(senha)) {

                mensagem.style.color = "red";

                mensagem.textContent =
                    "❌ A senha precisa ter pelo menos um número.";

                return;

            }


            if (senha !== confirmarSenha) {

                mensagem.style.color = "red";

                mensagem.textContent =
                    "❌ As senhas não são iguais.";

                return;

            }


            /* =================================================
               BOTÃO
            ================================================= */

            const botao =
                document.querySelector(
                    "#formCadastro button[type='submit']"
                );


            if (botao) {

                botao.disabled = true;

                botao.textContent =
                    "Cadastrando...";

            }


            mensagem.style.color = "#243b55";

            mensagem.textContent =
                "⏳ Salvando seus dados...";


            /* =================================================
               ENVIAR PARA O BACKEND
            ================================================= */

            try {

                const resposta =
                    await fetch("/api/cadastro", {

                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({

                            nome: nome,

                            gmail: gmail,

                            telefone: numerosTelefone,

                            senha: senha

                        })

                    });


                let dados = {};


                try {

                    dados =
                        await resposta.json();

                } catch (erro) {

                    dados = {};

                }


                /* =================================================
                   ERRO
                ================================================= */

                if (!resposta.ok) {

                    mensagem.style.color =
                        "red";

                    mensagem.textContent =
                        dados.mensagem ||
                        "❌ Não foi possível realizar o cadastro.";

                    return;

                }


                /* =================================================
                   RECEBER DADOS DO USUÁRIO
                ================================================= */

                if (dados.usuario) {

                    usuarioLogado =
                        dados.usuario;

                }


                /*
                   Esperamos que o backend possa retornar algo como:

                   {
                       id: 1,
                       nome: "Igor",
                       gmail: "igor@gmail.com",
                       telefone: "11999999999",
                       data_registro: "2026-08-26 20:30:00"
                   }
                */


                mensagem.style.color =
                    "green";


                mensagem.textContent =
                    dados.mensagem ||
                    "✅ Conta criada com sucesso!";


                /* =================================================
                   LIMPAR FORMULÁRIO
                ================================================= */

                formCadastro.reset();


                /* =================================================
                   IR PARA LOGIN
                ================================================= */

                setTimeout(function() {

                    mostrarTela("login");

                    mensagem.textContent = "";

                }, 1200);


            } catch (erro) {

                console.error(
                    "Erro no cadastro:",
                    erro
                );


                mensagem.style.color =
                    "red";


                mensagem.textContent =
                    "❌ Não foi possível conectar ao servidor. Verifique se o servidor está funcionando.";

            } finally {

                if (botao) {

                    botao.disabled = false;

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
    document.getElementById("formLogin");


if (formLogin) {

    formLogin.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            /* =================================================
               PEGAR DADOS
            ================================================= */

            const gmail =
                document
                    .getElementById("loginGmail")
                    .value
                    .trim()
                    .toLowerCase();


            const senha =
                document
                    .getElementById("loginSenha")
                    .value;
const mensagem =
    document
        .getElementById("mensagemLogin");

mensagem.style.color = "#243b55";
mensagem.textContent = "⌛ Verificando login...";

/* =====================================================
   ACESSO DEMONSTRAÇÃO
===================================================== */

if (
    gmail === "demo@onetouch.com" &&
    senha === "demo123"
) {
    usuarioLogado = {
        id: "DEMO",
        nome: "OneTouch Demo",
        gmail: "demo@onetouch.com",
        telefone: "",
        data_registro: new Date().toISOString(),
        nivel: "admin"
    };

    mensagem.style.color = "green";
    mensagem.textContent = "✅ Acesso à demonstração liberado!";

    setTimeout(function() {

        const areaLogin =
            document.getElementById("areaLogin");

        const sistema =
            document.getElementById("sistemaOneTouch");

        if (areaLogin) {
            areaLogin.classList.add("escondido");
        }

        if (sistema) {
            sistema.classList.remove("escondido");
        }

        abrirPagina("dashboard");

        atualizarDadosUsuario();

        mensagem.textContent = "";

    }, 500);

    return;
}
    
            /* =================================================
               ENVIAR LOGIN
            ================================================= */

            try {

                const resposta =
                    await fetch("/api/login", {

                        method: "POST",

                        headers: {

                            "Content-Type":
                                "application/json"

                        },

                        body: JSON.stringify({

                            gmail: gmail,

                            senha: senha

                        })

                    });


                let dados = {};


                try {

                    dados =
                        await resposta.json();

                } catch (erro) {

                    dados = {};

                }


                /* =================================================
                   ERRO
                ================================================= */

                if (!resposta.ok) {

                    mensagem.style.color =
                        "red";


                    mensagem.textContent =
                        dados.mensagem ||
                        "❌ Gmail ou senha incorretos.";

                    return;

                }


                /* =================================================
                   RECEBER DADOS COMPLETOS DO USUÁRIO
                ================================================= */

                if (dados.usuario) {

                    usuarioLogado =
                        dados.usuario;


                    /*
                       Salva os dados para poder
                       utilizá-los no dashboard.
                    */

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


                mensagem.style.color =
                    "green";


                mensagem.textContent =
                    dados.mensagem ||
                    "✅ Login realizado com sucesso!";


                /* =================================================
                   ENTRAR NO SISTEMA
                ================================================= */

                setTimeout(function() {

                    const areaLogin =
                        document.getElementById(
                            "areaLogin"
                        );


                    const sistema =
                        document.getElementById(
                            "sistemaOneTouch"
                        );


                    if (areaLogin) {

                        areaLogin.classList.add(
                            "escondido"
                        );

                    }


                    if (sistema) {

                        sistema.classList.remove(
                            "escondido"
                        );

                    }


                    abrirPagina("inicio");


                    formLogin.reset();


                    mensagem.textContent = "";


                    /*
                       Atualiza informações do usuário
                       no dashboard, caso os elementos
                       existam no HTML.
                    */

                    atualizarDadosUsuario();


                }, 700);


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


    /*
       ID
    */

    const elementoId =
        document.getElementById(
            "usuarioId"
        );


    if (elementoId) {

        elementoId.textContent =
            usuarioLogado.id ??
            "";

    }


    /*
       NOME
    */

    const elementoNome =
        document.getElementById(
            "usuarioNome"
        );


    if (elementoNome) {

        elementoNome.textContent =
            usuarioLogado.nome ??
            "";

    }


    /*
       GMAIL
    */

    const elementoGmail =
        document.getElementById(
            "usuarioGmail"
        );


    if (elementoGmail) {

        elementoGmail.textContent =
            usuarioLogado.gmail ??
            "";

    }


    /*
       TELEFONE
    */

    const elementoTelefone =
        document.getElementById(
            "usuarioTelefone"
        );


    if (elementoTelefone) {

        elementoTelefone.textContent =
            usuarioLogado.telefone ??
            "";

    }


    /*
       DATA DE REGISTRO
    */

    const elementoData =
        document.getElementById(
            "usuarioDataRegistro"
        );


    if (elementoData) {

        elementoData.textContent =
            formatarData(
                usuarioLogado.data_registro
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


        if (isNaN(dataObj.getTime())) {

            return data;

        }


        return dataObj.toLocaleString(
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
                    .replace(/\D/g, "");


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

                            method: "POST",

                            headers: {

                                "Content-Type":
                                    "application/json"

                            },

                            body: JSON.stringify({

                                gmail: gmail,

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


                setTimeout(function() {

                    mostrarTela(
                        "novaSenha"
                    );


                    mensagem.textContent =
                        "";

                }, 700);


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


            /* =================================================
               VALIDAÇÕES
            ================================================= */

            if (novaSenha.length < 7) {

                mensagem.style.color =
                    "red";


                mensagem.textContent =
                    "❌ A senha precisa ter no mínimo 7 caracteres.";

                return;

            }


            if (!/[A-Za-z]/.test(novaSenha)) {

                mensagem.style.color =
                    "red";


                mensagem.textContent =
                    "❌ A senha precisa ter pelo menos uma letra.";

                return;

            }


            if (!/[0-9]/.test(novaSenha)) {

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

                            method: "PUT",

                            headers: {

                                "Content-Type":
                                    "application/json"

                            },

                            body: JSON.stringify({

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


                setTimeout(function() {

                    formNovaSenha.reset();


                    mostrarTela(
                        "login"
                    );


                    gmailRecuperacao =
                        "";


                    mensagem.textContent =
                        "";

                }, 1200);


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
   ABRIR PÁGINAS
   ===================================================== */

function abrirPagina(pagina) {

    const paginas = [

        "paginaInicio",

        "paginaDashboard",

        "paginaEquipamentos",

        "paginaHistorico",

        "paginaAlertas",

        "paginaEmpresa"

    ];


    paginas.forEach(function(id) {

        const elemento =
            document.getElementById(id);


        if (elemento) {

            elemento.classList.add(
                "escondido"
            );

        }

    });


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

        empresa:
            "paginaEmpresa"

    };


    if (mapa[pagina]) {

        const paginaElemento =
            document.getElementById(
                mapa[pagina]
            );


        if (paginaElemento) {

            paginaElemento.classList.remove(
                "escondido"
            );

        }

    }


    window.scrollTo({

        top: 0,

        behavior: "smooth"

    });

}


/* =====================================================
   SAIR
   ===================================================== */

function sair() {

    const sistema =
        document.getElementById(
            "sistemaOneTouch"
        );


    const areaLogin =
        document.getElementById(
            "areaLogin"
        );


    if (sistema) {

        sistema.classList.add(
            "escondido"
        );

    }


    if (areaLogin) {

        areaLogin.classList.remove(
            "escondido"
        );

    }


    mostrarTela("login");


    if (formLogin) {

        formLogin.reset();

    }


    /*
       Apaga os dados do usuário
       que estavam guardados.
    */

    usuarioLogado = null;


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

    usuarioLogado = null;

}


/* =====================================================
   FINALIZAÇÃO
   ===================================================== */
   console.log(
    "✅ OneTouch Energy JS carregado com sucesso."
);  /* =========================================================
   ONETOUCH ENERGY
   ANIMAÇÕES PROFISSIONAIS DO SISTEMA
   ========================================================= */

(function () {

    "use strict";


    /* =====================================================
       ADICIONAR CSS DAS ANIMAÇÕES
       ===================================================== */

    function adicionarAnimacoesOneTouch() {

        if (
            document.getElementById(
                "oneTouchMotionStyle"
            )
        ) {
            return;
        }


        const style =
            document.createElement("style");


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


            /* ==========================================
               CONTEÚDO DA ABERTURA
               ========================================== */

            .ot-splash-inner {

                text-align: center;

                animation:
                    otSplashEntrada
                    .8s ease both;

            }


            /* ==========================================
               LOGO
               ========================================== */

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
                        #20b879,
                        #087092
                    );

                font-size: 40px;

                box-shadow:
                    0 0 0
                    rgba(32,184,121,.5);

                animation:
                    otLogoPulse
                    1.8s
                    ease-in-out
                    infinite;

            }


            /* ==========================================
               TÍTULO
               ========================================== */

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


            /* ==========================================
               BARRA DE CARREGAMENTO
               ========================================== */

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
                    #20bd80;

                animation:
                    otLoading
                    1.1s
                    ease-in-out
                    infinite;

            }


            /* ==========================================
               ANIMAÇÃO DE ENTRADA
               ========================================== */

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


            /* ==========================================
               PULSO DO LOGO
               ========================================== */

            @keyframes otLogoPulse {

                0% {

                    transform:
                        scale(1);

                    box-shadow:
                        0 0 0
                        rgba(
                            32,
                            184,
                            121,
                            .35
                        );

                }

                50% {

                    transform:
                        scale(1.04);

                    box-shadow:
                        0 0 0 13px
                        rgba(
                            32,
                            184,
                            121,
                            0
                        );

                }

                100% {

                    transform:
                        scale(1);

                    box-shadow:
                        0 0 0
                        rgba(
                            32,
                            184,
                            121,
                            0
                        );

                }

            }


            /* ==========================================
               CARREGAMENTO
               ========================================== */

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
               ENTRADA DAS PÁGINAS
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
               CARDS DO DASHBOARD
               ========================================== */

            #paginaDashboard .card,

            #paginaDashboard
            .dashboard-card,

            #paginaDashboard
            .card-dashboard,

            #paginaDashboard
            .stat-card,

            #paginaDashboard
            .info-card {

                transition:
                    transform .22s ease,
                    box-shadow .22s ease;

            }


            #paginaDashboard .card:hover,

            #paginaDashboard
            .dashboard-card:hover,

            #paginaDashboard
            .card-dashboard:hover,

            #paginaDashboard
            .stat-card:hover,

            #paginaDashboard
            .info-card:hover {

                transform:
                    translateY(-4px);

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

            @media (prefers-reduced-motion: reduce) {

                #oneTouchSplash *,

                #paginaDashboard * {

                    animation-duration:
                        .01ms !important;

                    animation-iteration-count:
                        1 !important;

                    transition-duration:
                        .01ms !important;

                }

            }

        `;


        document.head.appendChild(style);


        /* =================================================
           TELA DE ABERTURA
           ================================================= */

        let splashJaVisto = false;


        try {

            splashJaVisto =
                sessionStorage.getItem(
                    "oneTouchSplashVisto"
                ) === "1";

        } catch (erro) {

            splashJaVisto = false;

        }


        if (!splashJaVisto) {

            const splash =
                document.createElement("div");


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


            setTimeout(function () {

                splash.classList.add(
                    "ot-hide"
                );


                setTimeout(function () {

                    if (splash) {

                        splash.remove();

                    }

                }, 650);


                try {

                    sessionStorage.setItem(
                        "oneTouchSplashVisto",
                        "1"
                    );

                } catch (erro) {}

            }, 1600);

        }


        /* =================================================
           ANIMAÇÃO DAS PÁGINAS
           ================================================= */

        const abrirPaginaOriginal =
            window.abrirPagina;


        if (
            typeof abrirPaginaOriginal ===
            "function"
        ) {

            window.abrirPagina =
                function (pagina) {

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

                        empresa:
                            "paginaEmpresa"

                    };


                    const alvo =
                        document.getElementById(
                            mapa[pagina]
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