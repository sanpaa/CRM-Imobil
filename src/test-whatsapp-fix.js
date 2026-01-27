/**
 * Script de teste para validar correções do WhatsApp
 * Execute com: node test-whatsapp-fix.js
 */

require('dotenv').config();
const { SupabaseUserRepository } = require('./src/infrastructure/repositories');
const { UserService } = require('./src/application/services');

async function testUserEntity() {
    console.log('🧪 Testando entidade User com company_id...\n');
    
    const userRepository = new SupabaseUserRepository();
    const userService = new UserService(userRepository);
    
    // Test 1: Verificar se findById retorna company_id
    console.log('📝 Test 1: Buscar usuário por ID');
    const userId = 'dcffbe62-4247-4e6d-98dc-50097c0d6a64';
    
    try {
        const user = await userRepository.findById(userId);
        
        if (!user) {
            console.log('❌ FALHA: Usuário não encontrado');
            console.log('   Verifique se o ID está correto no banco de dados\n');
            return false;
        }
        
        console.log('✅ Usuário encontrado:');
        console.log(`   - ID: ${user.id}`);
        console.log(`   - Username: ${user.username}`);
        console.log(`   - Email: ${user.email}`);
        console.log(`   - Company ID: ${user.company_id || 'NULL'}`);
        
        if (!user.company_id) {
            console.log('\n⚠️  ATENÇÃO: company_id está NULL!');
            console.log('   Execute este SQL para corrigir:');
            console.log(`   UPDATE users SET company_id = '3b1bee0c-cbee-4de1-88f1-d6e890f4c995' WHERE id = '${userId}';`);
            return false;
        }
        
        console.log('✅ company_id presente!\n');
        
        // Test 2: Verificar se toJSON inclui company_id
        console.log('📝 Test 2: Verificar método toJSON');
        const userJSON = user.toJSON();
        
        if (!userJSON.company_id) {
            console.log('❌ FALHA: toJSON não inclui company_id\n');
            return false;
        }
        
        console.log('✅ toJSON inclui company_id\n');
        
        // Test 3: Verificar token JWT
        console.log('📝 Test 3: Verificar token JWT');
        const token = userService.generateToken(user);
        console.log(`✅ Token gerado: ${token.substring(0, 20)}...\n`);
        
        const isValid = userService.verifyToken(token);
        if (!isValid) {
            console.log('❌ FALHA: Token inválido\n');
            return false;
        }
        
        console.log('✅ Token válido\n');
        
        const userData = userService.getUserFromToken(token);
        if (!userData || !userData.company_id) {
            console.log('❌ FALHA: company_id não está no token\n');
            return false;
        }
        
        console.log('✅ company_id presente no token');
        console.log(`   - Company ID no token: ${userData.company_id}\n`);
        
        return true;
        
    } catch (error) {
        console.log(`❌ ERRO: ${error.message}`);
        console.log(`   Stack: ${error.stack}\n`);
        return false;
    }
}

async function checkDatabase() {
    console.log('🗄️  Verificando estrutura do banco de dados...\n');
    
    const supabase = require('./src/infrastructure/database/supabase');
    
    try {
        // Verificar se a coluna company_id existe
        const { data, error } = await supabase
            .from('users')
            .select('id, username, email, company_id')
            .limit(1);
        
        if (error) {
            console.log('❌ ERRO ao consultar banco:');
            console.log(`   ${error.message}\n`);
            
            if (error.message.includes('column "company_id" does not exist')) {
                console.log('⚠️  A coluna company_id não existe na tabela users!');
                console.log('   Execute este SQL no Supabase:');
                console.log('   ALTER TABLE users ADD COLUMN company_id UUID REFERENCES companies(id);\n');
            }
            
            return false;
        }
        
        console.log('✅ Estrutura do banco OK');
        console.log('   Coluna company_id existe\n');
        return true;
        
    } catch (error) {
        console.log(`❌ ERRO: ${error.message}\n`);
        return false;
    }
}

async function main() {
    console.log('='.repeat(60));
    console.log('🔧 TESTE DE CORREÇÕES WHATSAPP');
    console.log('='.repeat(60));
    console.log();
    
    // Verificar conexão com banco
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
        console.log('❌ ERRO: Variáveis de ambiente não configuradas');
        console.log('   Verifique SUPABASE_URL e SUPABASE_ANON_KEY no arquivo .env\n');
        process.exit(1);
    }
    
    console.log('✅ Variáveis de ambiente configuradas\n');
    
    // Executar testes
    const dbOk = await checkDatabase();
    if (!dbOk) {
        console.log('\n❌ Teste de banco falhou. Corrija os problemas antes de continuar.\n');
        process.exit(1);
    }
    
    const entityOk = await testUserEntity();
    
    console.log('='.repeat(60));
    if (entityOk && dbOk) {
        console.log('✅ TODOS OS TESTES PASSARAM!');
        console.log('   O backend está pronto para receber requisições WhatsApp');
    } else {
        console.log('❌ ALGUNS TESTES FALHARAM');
        console.log('   Corrija os problemas antes de fazer deploy');
    }
    console.log('='.repeat(60));
    console.log();
}

// Executar
main().catch(console.error);
