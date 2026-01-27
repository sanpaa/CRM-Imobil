/**
 * Script de Teste - Integração WhatsApp
 * Testa todas as funcionalidades após conexão estabelecida
 */

require('dotenv').config();
const axios = require('axios');

// Configuração
const API_URL = process.env.API_URL || 'http://localhost:3000/api';
const TOKEN = process.env.TEST_TOKEN || 'SEU_TOKEN_AQUI';

// Cliente HTTP
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
    }
});

// Cores para console
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message) {
    log(`✅ ${message}`, 'green');
}

function error(message) {
    log(`❌ ${message}`, 'red');
}

function info(message) {
    log(`ℹ️  ${message}`, 'cyan');
}

function section(title) {
    console.log('\n' + '='.repeat(60));
    log(title, 'blue');
    console.log('='.repeat(60));
}

// Testes
async function testStatus() {
    section('Teste 1: Verificar Status da Conexão');
    
    try {
        const response = await api.get('/whatsapp/status');
        
        if (response.data.is_connected) {
            success('WhatsApp conectado!');
            info(`Status: ${response.data.status}`);
            info(`Número: ${response.data.phone_number || 'N/A'}`);
            return true;
        } else {
            error('WhatsApp não está conectado');
            info(`Status: ${response.data.status}`);
            info(`Mensagem: ${response.data.message}`);
            return false;
        }
    } catch (err) {
        error(`Erro ao verificar status: ${err.response?.data?.message || err.message}`);
        return false;
    }
}

async function testSendMessage(phoneNumber, message) {
    section('Teste 2: Enviar Mensagem');
    
    try {
        info(`Enviando para: ${phoneNumber}`);
        info(`Mensagem: ${message}`);
        
        const response = await api.post('/whatsapp/send', {
            to: phoneNumber,
            message: message
        });
        
        success('Mensagem enviada com sucesso!');
        console.log(JSON.stringify(response.data, null, 2));
        return true;
    } catch (err) {
        error(`Erro ao enviar mensagem: ${err.response?.data?.message || err.message}`);
        return false;
    }
}

async function testGetMessages() {
    section('Teste 3: Listar Mensagens');
    
    try {
        const response = await api.get('/whatsapp/messages', {
            params: { limit: 10 }
        });
        
        success(`${response.data.data.length} mensagens encontradas`);
        
        if (response.data.data.length > 0) {
            console.log('\nÚltimas mensagens:');
            response.data.data.slice(0, 5).forEach((msg, i) => {
                console.log(`\n${i + 1}. De: ${msg.contact_name || msg.from_number}`);
                console.log(`   Para: ${msg.to_number}`);
                console.log(`   Mensagem: ${msg.body.substring(0, 50)}${msg.body.length > 50 ? '...' : ''}`);
                console.log(`   Data: ${new Date(msg.timestamp).toLocaleString('pt-BR')}`);
            });
        } else {
            info('Nenhuma mensagem ainda. Envie uma mensagem para o número conectado!');
        }
        
        return true;
    } catch (err) {
        error(`Erro ao listar mensagens: ${err.response?.data?.message || err.message}`);
        return false;
    }
}

async function testGetConversation(phoneNumber) {
    section('Teste 4: Ver Conversa Específica');
    
    try {
        info(`Buscando conversa com: ${phoneNumber}`);
        
        const response = await api.get(`/whatsapp/conversation/${phoneNumber}`);
        
        success(`${response.data.data.length} mensagens na conversa`);
        
        if (response.data.data.length > 0) {
            console.log('\nÚltimas mensagens da conversa:');
            response.data.data.slice(0, 5).forEach((msg, i) => {
                const direction = msg.is_from_me ? '➡️' : '⬅️';
                console.log(`\n${direction} ${new Date(msg.timestamp).toLocaleString('pt-BR')}`);
                console.log(`   ${msg.body}`);
            });
        } else {
            info('Nenhuma mensagem nesta conversa ainda.');
        }
        
        return true;
    } catch (err) {
        error(`Erro ao buscar conversa: ${err.response?.data?.message || err.message}`);
        return false;
    }
}

async function testAutoClients() {
    section('Teste 5: Clientes Criados Automaticamente');
    
    try {
        const response = await api.get('/whatsapp/auto-clients');
        
        success(`${response.data.data.length} clientes criados automaticamente`);
        
        if (response.data.data.length > 0) {
            console.log('\nClientes:');
            response.data.data.slice(0, 5).forEach((client, i) => {
                console.log(`\n${i + 1}. ${client.client_name}`);
                console.log(`   Telefone: ${client.phone_number}`);
                console.log(`   Criado em: ${new Date(client.created_at).toLocaleString('pt-BR')}`);
            });
        } else {
            info('Nenhum cliente criado automaticamente ainda.');
            info('Envie uma mensagem para o WhatsApp conectado para testar!');
        }
        
        return true;
    } catch (err) {
        error(`Erro ao listar auto-clientes: ${err.response?.data?.message || err.message}`);
        return false;
    }
}

async function testDisconnect() {
    section('Teste 6: Desconectar WhatsApp (OPCIONAL)');
    
    const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    return new Promise((resolve) => {
        readline.question('\n⚠️  Deseja desconectar o WhatsApp? (s/N): ', async (answer) => {
            readline.close();
            
            if (answer.toLowerCase() === 's') {
                try {
                    const response = await api.post('/whatsapp/disconnect');
                    success('WhatsApp desconectado!');
                    console.log(JSON.stringify(response.data, null, 2));
                    resolve(true);
                } catch (err) {
                    error(`Erro ao desconectar: ${err.response?.data?.message || err.message}`);
                    resolve(false);
                }
            } else {
                info('Mantendo conexão ativa.');
                resolve(true);
            }
        });
    });
}

// Executar todos os testes
async function runAllTests() {
    console.clear();
    log('╔════════════════════════════════════════════════════════════╗', 'blue');
    log('║     TESTE DE INTEGRAÇÃO WHATSAPP - CRM IMOBIL             ║', 'blue');
    log('╚════════════════════════════════════════════════════════════╝', 'blue');
    
    info(`API URL: ${API_URL}`);
    info(`Token: ${TOKEN.substring(0, 20)}...`);
    
    const results = {
        status: false,
        messages: false,
        autoClients: false,
        disconnect: false
    };
    
    // Teste 1: Status
    results.status = await testStatus();
    
    if (!results.status) {
        error('\n⚠️  WhatsApp não está conectado. Execute /initialize primeiro!');
        process.exit(1);
    }
    
    // Teste 2: Listar mensagens
    results.messages = await testGetMessages();
    
    // Teste 3: Auto-clientes
    results.autoClients = await testAutoClients();
    
    // Teste 4: Enviar mensagem (interativo)
    section('Teste Opcional: Enviar Mensagem');
    const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    readline.question('\nDeseja enviar uma mensagem de teste? (s/N): ', async (answer) => {
        if (answer.toLowerCase() === 's') {
            readline.question('Digite o número (ex: 5511999999999): ', async (phone) => {
                readline.question('Digite a mensagem: ', async (message) => {
                    readline.close();
                    
                    await testSendMessage(phone, message);
                    
                    if (phone) {
                        await testGetConversation(phone);
                    }
                    
                    // Teste de desconexão (opcional)
                    await testDisconnect();
                    
                    // Resumo final
                    printSummary(results);
                });
            });
        } else {
            readline.close();
            
            // Teste de desconexão (opcional)
            await testDisconnect();
            
            // Resumo final
            printSummary(results);
        }
    });
}

function printSummary(results) {
    section('📊 RESUMO DOS TESTES');
    
    const passed = Object.values(results).filter(r => r).length;
    const total = Object.keys(results).length;
    
    console.log('\nResultados:');
    console.log(`  Status: ${results.status ? '✅' : '❌'}`);
    console.log(`  Mensagens: ${results.messages ? '✅' : '❌'}`);
    console.log(`  Auto-clientes: ${results.autoClients ? '✅' : '❌'}`);
    
    console.log(`\n${passed}/${total} testes passaram\n`);
    
    if (passed === total) {
        success('🎉 Integração WhatsApp funcionando perfeitamente!');
    } else {
        error('⚠️  Alguns testes falharam. Verifique os logs acima.');
    }
    
    console.log('\n📚 Próximos passos:');
    console.log('  1. Envie mensagens para o número conectado do seu celular');
    console.log('  2. Verifique se clientes são criados automaticamente');
    console.log('  3. Teste enviar mensagens via API');
    console.log('  4. Integre com o frontend Angular\n');
}

// Executar
if (require.main === module) {
    runAllTests().catch(err => {
        error(`Erro fatal: ${err.message}`);
        process.exit(1);
    });
}

module.exports = { testStatus, testSendMessage, testGetMessages, testAutoClients };
