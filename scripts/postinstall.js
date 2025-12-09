#!/usr/bin/env node
/**
 * Post-install script
 * Auto-creates .env file if it doesn't exist
 */

const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
const envExamplePath = path.join(__dirname, '..', '.env.example');

// Only create .env if it doesn't exist
if (!fs.existsSync(envPath)) {
    try {
        fs.copyFileSync(envExamplePath, envPath);
        console.log('\n💡 Arquivo .env criado! Edite-o para configurar o banco de dados.');
        console.log('   Veja DATABASE_SETUP.md ou INICIO_RAPIDO.md para instruções.\n');
    } catch (error) {
        console.warn('⚠️  Não foi possível criar o arquivo .env automaticamente.');
        console.warn('   Execute: cp .env.example .env\n');
    }
}
