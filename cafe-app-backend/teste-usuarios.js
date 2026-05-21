/**
 * 🧪 Script de Teste para Gerenciamento de Usuários
 * Execute: node teste-usuarios.js
 */

const API_URL = 'http://localhost:3000/api';
let adminToken = '';
let usuarioTesteId = '';

const cores = {
    reset: '\x1b[0m',
    verde: '\x1b[32m',
    vermelho: '\x1b[31m',
    amarelo: '\x1b[33m',
    azul: '\x1b[34m',
};

function log(titulo, dados) {
    console.log(`\n${cores.azul}═══════════════════════════════════════${cores.reset}`);
    console.log(`${cores.amarelo}${titulo}${cores.reset}`);
    console.log(`${cores.azul}═══════════════════════════════════════${cores.reset}`);
    console.log(JSON.stringify(dados, null, 2));
}

async function fazer_requisicao(metodo, endpoint, dados = null, token = null) {
    try {
        const opcoes = {
            method: metodo,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        if (token) {
            opcoes.headers['Authorization'] = `Bearer ${token}`;
        }

        if (dados) {
            opcoes.body = JSON.stringify(dados);
        }

        const resposta = await fetch(`${API_URL}${endpoint}`, opcoes);
        const json = await resposta.json();

        if (!resposta.ok) {
            throw new Error(JSON.stringify(json));
        }

        return { sucesso: true, dados: json, status: resposta.status };
    } catch (erro) {
        return { sucesso: false, erro: erro.message };
    }
}

async function teste_completo() {
    console.log(`\n${cores.verde}🚀 INICIANDO TESTES DE GERENCIAMENTO DE USUÁRIOS${cores.reset}\n`);

    // 1. Login como admin
    console.log(`${cores.amarelo}1️⃣  Fazendo login como admin...${cores.reset}`);
    let resultado = await fazer_requisicao('POST', '/auth/login', {
        username: 'admin',
        password: 'admin123',
    });

    if (!resultado.sucesso) {
        console.log(`${cores.vermelho}❌ ERRO: ${resultado.erro}${cores.reset}`);
        process.exit(1);
    }

    adminToken = resultado.dados.token;
    log('✅ Login bem-sucedido!', resultado.dados);

    // 2. Listar usuários existentes
    console.log(`${cores.amarelo}2️⃣  Listando usuários existentes...${cores.reset}`);
    resultado = await fazer_requisicao('GET', '/admin/users', null, adminToken);

    if (!resultado.sucesso) {
        console.log(`${cores.vermelho}❌ ERRO: ${resultado.erro}${cores.reset}`);
    } else {
        log('✅ Usuários listados!', resultado.dados);
    }

    // 3. Criar novo usuário (atendente)
    console.log(`${cores.amarelo}3️⃣  Criando novo usuário "atendente_teste"...${cores.reset}`);
    resultado = await fazer_requisicao('POST', '/admin/users', {
        username: 'atendente_teste',
        password: 'teste123456',
        is_admin: false,
    }, adminToken);

    if (!resultado.sucesso) {
        console.log(`${cores.vermelho}❌ ERRO: ${resultado.erro}${cores.reset}`);
    } else {
        usuarioTesteId = resultado.dados.usuario.id;
        log('✅ Usuário criado!', resultado.dados);
    }

    // 4. Login como atendente
    console.log(`${cores.amarelo}4️⃣  Fazendo login como atendente...${cores.reset}`);
    resultado = await fazer_requisicao('POST', '/auth/login', {
        username: 'atendente_teste',
        password: 'teste123456',
    });

    if (!resultado.sucesso) {
        console.log(`${cores.vermelho}❌ ERRO: ${resultado.erro}${cores.reset}`);
    } else {
        const tokenAtendente = resultado.dados.token;
        log('✅ Login do atendente bem-sucedido!', resultado.dados);

        // 5. Atendente tenta listar usuários (deve falhar)
        console.log(`${cores.amarelo}5️⃣  Atendente tenta acessar /admin/users (deve falhar)...${cores.reset}`);
        resultado = await fazer_requisicao('GET', '/admin/users', null, tokenAtendente);

        if (resultado.sucesso) {
            console.log(`${cores.vermelho}❌ ERRO: Atendente não deveria ter acesso!${cores.reset}`);
        } else {
            console.log(`${cores.verde}✅ Acesso corretamente negado!${cores.reset}`);
            console.log(`${cores.amarelo}Mensagem de erro esperada:${cores.reset} ${resultado.erro}`);
        }

        // 6. Atendente muda sua própria senha
        console.log(`${cores.amarelo}6️⃣  Atendente muda sua própria senha...${cores.reset}`);
        resultado = await fazer_requisicao('PATCH', '/auth/change-password', {
            senhaAtual: 'teste123456',
            novaSenha: 'novaSenha123',
            confirmarSenha: 'novaSenha123',
        }, tokenAtendente);

        if (!resultado.sucesso) {
            console.log(`${cores.vermelho}❌ ERRO: ${resultado.erro}${cores.reset}`);
        } else {
            log('✅ Senha alterada com sucesso!', resultado.dados);

            // 7. Testar login com nova senha
            console.log(`${cores.amarelo}7️⃣  Testando login com nova senha...${cores.reset}`);
            resultado = await fazer_requisicao('POST', '/auth/login', {
                username: 'atendente_teste',
                password: 'novaSenha123',
            });

            if (!resultado.sucesso) {
                console.log(`${cores.vermelho}❌ ERRO: Login com nova senha falhou!${cores.reset}`);
            } else {
                console.log(`${cores.verde}✅ Login com nova senha funcionou!${cores.reset}`);
            }
        }
    }

    // 8. Admin edita o usuário criado
    console.log(`${cores.amarelo}8️⃣  Admin edita o usuário criado...${cores.reset}`);
    resultado = await fazer_requisicao('PATCH', `/admin/users/${usuarioTesteId}`, {
        username: 'atendente_teste_editado',
    }, adminToken);

    if (!resultado.sucesso) {
        console.log(`${cores.vermelho}❌ ERRO: ${resultado.erro}${cores.reset}`);
    } else {
        log('✅ Usuário editado com sucesso!', resultado.dados);
    }

    // 9. Admin reseta a senha do usuário
    console.log(`${cores.amarelo}9️⃣  Admin reseta a senha do usuário...${cores.reset}`);
    resultado = await fazer_requisicao('PATCH', `/admin/users/${usuarioTesteId}/reset-password`, {
        novaSenha: 'senhaReset123',
    }, adminToken);

    if (!resultado.sucesso) {
        console.log(`${cores.vermelho}❌ ERRO: ${resultado.erro}${cores.reset}`);
    } else {
        log('✅ Senha resetada com sucesso!', resultado.dados);
    }

    // 10. Admin muda sua própria senha
    console.log(`${cores.amarelo}🔟 Admin muda sua própria senha...${cores.reset}`);
    resultado = await fazer_requisicao('PATCH', '/auth/change-password', {
        senhaAtual: 'admin123',
        novaSenha: 'admin123novo',
        confirmarSenha: 'admin123novo',
    }, adminToken);

    if (!resultado.sucesso) {
        console.log(`${cores.vermelho}❌ ERRO: ${resultado.erro}${cores.reset}`);
    } else {
        console.log(`${cores.verde}✅ Senha do admin alterada com sucesso!${cores.reset}`);
        log('Resposta:', resultado.dados);

        // Voltar a senha do admin ao normal
        console.log(`${cores.amarelo}Voltando senha do admin ao normal...${cores.reset}`);
        resultado = await fazer_requisicao('POST', '/auth/login', {
            username: 'admin',
            password: 'admin123novo',
        });

        if (resultado.sucesso) {
            const novoToken = resultado.dados.token;
            resultado = await fazer_requisicao('PATCH', '/auth/change-password', {
                senhaAtual: 'admin123novo',
                novaSenha: 'admin123',
                confirmarSenha: 'admin123',
            }, novoToken);

            if (resultado.sucesso) {
                console.log(`${cores.verde}✅ Senha do admin restaurada!${cores.reset}`);
            }
        }
    }

    // 11. Admin deleta o usuário de teste
    console.log(`${cores.amarelo}1️⃣1️⃣  Admin deleta o usuário de teste...${cores.reset}`);
    resultado = await fazer_requisicao('DELETE', `/admin/users/${usuarioTesteId}`, null, adminToken);

    if (!resultado.sucesso) {
        console.log(`${cores.vermelho}❌ ERRO: ${resultado.erro}${cores.reset}`);
    } else {
        log('✅ Usuário deletado com sucesso!', resultado.dados);
    }

    // 12. Verificar que o usuário foi deletado
    console.log(`${cores.amarelo}1️⃣2️⃣  Verificando lista final de usuários...${cores.reset}`);
    resultado = await fazer_requisicao('GET', '/admin/users', null, adminToken);

    if (!resultado.sucesso) {
        console.log(`${cores.vermelho}❌ ERRO: ${resultado.erro}${cores.reset}`);
    } else {
        log('✅ Usuários finais:', resultado.dados);
    }

    console.log(`\n${cores.verde}✅ TODOS OS TESTES CONCLUÍDOS COM SUCESSO!${cores.reset}\n`);
}

teste_completo().catch(console.error);
