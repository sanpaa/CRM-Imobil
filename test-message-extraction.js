/**
 * Test script for WhatsApp message body extraction
 * Tests the extractMessageBody method to ensure it correctly extracts text from various message types
 */

// Import the actual WhatsAppClientManager to test the real implementation
const WhatsAppClientManager = require('./src/utils/whatsappClientManager');

// Create a mock repository for testing
const mockRepository = {
    findByCompanyId: async () => null,
    updateStatus: async () => {},
    findAll: async () => []
};

// Create an instance
const manager = new WhatsAppClientManager(mockRepository);

// Test cases covering various Baileys message formats
const testMessages = [
    {
        name: 'Simple text message (conversation)',
        message: {
            conversation: 'Olá, estou interessado no imóvel'
        },
        expected: 'Olá, estou interessado no imóvel'
    },
    {
        name: 'Extended text message',
        message: {
            extendedTextMessage: {
                text: 'Qual o preço do apartamento?'
            }
        },
        expected: 'Qual o preço do apartamento?'
    },
    {
        name: 'Image with caption',
        message: {
            imageMessage: {
                caption: 'Esta é a foto do imóvel'
            }
        },
        expected: 'Esta é a foto do imóvel'
    },
    {
        name: 'Image without caption',
        message: {
            imageMessage: {}
        },
        expected: '[Imagem]'
    },
    {
        name: 'Video with caption',
        message: {
            videoMessage: {
                caption: 'Tour do apartamento'
            }
        },
        expected: 'Tour do apartamento'
    },
    {
        name: 'Video without caption',
        message: {
            videoMessage: {}
        },
        expected: '[Vídeo]'
    },
    {
        name: 'Document with caption',
        message: {
            documentMessage: {
                caption: 'Contrato de locação'
            }
        },
        expected: 'Contrato de locação'
    },
    {
        name: 'Audio message',
        message: {
            audioMessage: {}
        },
        expected: '[Áudio]'
    },
    {
        name: 'Sticker message',
        message: {
            stickerMessage: {}
        },
        expected: '[Sticker]'
    },
    {
        name: 'Location message',
        message: {
            locationMessage: {}
        },
        expected: '[Localização]'
    },
    {
        name: 'Contact message',
        message: {
            contactMessage: {}
        },
        expected: '[Contato]'
    },
    {
        name: 'Button response',
        message: {
            buttonsResponseMessage: {
                selectedButtonId: 'button_1'
            }
        },
        expected: 'button_1'
    },
    {
        name: 'Template button reply',
        message: {
            templateButtonReplyMessage: {
                selectedId: 'template_1'
            }
        },
        expected: 'template_1'
    },
    {
        name: 'List response',
        message: {
            listResponseMessage: {
                singleSelectReply: {
                    selectedRowId: 'row_1'
                }
            }
        },
        expected: 'row_1'
    },
    {
        name: 'View once message with text',
        message: {
            viewOnceMessage: {
                message: {
                    conversation: 'Mensagem que desaparece'
                }
            }
        },
        expected: 'Mensagem que desaparece'
    },
    {
        name: 'Ephemeral message with text',
        message: {
            ephemeralMessage: {
                message: {
                    conversation: 'Mensagem temporária'
                }
            }
        },
        expected: 'Mensagem temporária'
    },
    {
        name: 'Reaction message',
        message: {
            reactionMessage: {
                text: '👍'
            }
        },
        expected: '[Reação: 👍]'
    },
    {
        name: 'Empty message object',
        message: {},
        expected: ''
    },
    {
        name: 'Null message',
        message: null,
        expected: ''
    }
];

// Run tests
console.log('\n=================================================================');
console.log('🧪 TESTE DE EXTRAÇÃO DE MENSAGEM DO WHATSAPP');
console.log('=================================================================\n');

let passed = 0;
let failed = 0;

testMessages.forEach((test, index) => {
    try {
        const result = manager.extractMessageBody(test.message);
        const status = result === test.expected ? '✅ PASS' : '❌ FAIL';
        
        if (result === test.expected) {
            passed++;
        } else {
            failed++;
            console.log(`${status} Teste ${index + 1}: ${test.name}`);
            console.log(`   Esperado: "${test.expected}"`);
            console.log(`   Resultado: "${result}"`);
            console.log('');
        }
    } catch (error) {
        failed++;
        console.log(`❌ FAIL Teste ${index + 1}: ${test.name}`);
        console.log(`   Erro: ${error.message}`);
        console.log('');
    }
});

console.log('=================================================================');
console.log(`📊 RESULTADO: ${passed} testes passaram, ${failed} falharam`);
console.log('=================================================================\n');

if (failed === 0) {
    console.log('🎉 Todos os testes passaram! A extração de mensagem está funcionando corretamente.\n');
    process.exit(0);
} else {
    console.log('⚠️  Alguns testes falharam. Revise a lógica de extração.\n');
    process.exit(1);
}
