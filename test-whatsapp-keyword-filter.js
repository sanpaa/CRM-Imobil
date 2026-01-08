/**
 * Test script for WhatsApp keyword filtering
 * This script tests the keyword detection logic without needing a full WhatsApp connection
 */

// Simulate the WhatsAppService class's keyword checking method
class WhatsAppService {
    constructor() {
        // Keywords relacionados a imóveis para filtrar mensagens
        this.realEstateKeywords = [
            'imóvel', 'imovel',
            'interessado', 'interessada',
            'preço', 'preco',
            'visita',
            'aluguel', 'alugar',
            'compra', 'comprar',
            'vender', 'venda',
            'fotos', 'foto',
            'disponível', 'disponivel',
            'valor',
            'orçamento', 'orcamento',
            'apartamento', 'apto', 'ap',
            'casa',
            'condomínio', 'condominio',
            'condições', 'condicoes'
        ];
    }

    /**
     * Check if message contains real estate keywords
     * @param {string} messageBody - The message text to check
     * @returns {boolean} - True if message contains at least one keyword
     */
    containsRealEstateKeywords(messageBody) {
        if (!messageBody || typeof messageBody !== 'string') {
            return false;
        }
        
        const normalizedMessage = messageBody.toLowerCase();
        
        return this.realEstateKeywords.some(keyword => 
            normalizedMessage.includes(keyword.toLowerCase())
        );
    }
}

// Test cases
const testMessages = [
    // Should match (with keywords)
    { text: "Olá, estou interessado no imóvel que você anunciou", expected: true },
    { text: "Qual o preço do apartamento?", expected: true },
    { text: "Gostaria de agendar uma visita", expected: true },
    { text: "Quanto é o aluguel?", expected: true },
    { text: "Tem fotos da casa?", expected: true },
    { text: "Esse imóvel ainda está disponível?", expected: true },
    { text: "Qual o valor do condomínio?", expected: true },
    { text: "Quais as condições de pagamento?", expected: true },
    { text: "Quero comprar um apartamento", expected: true },
    { text: "Está vendendo essa casa?", expected: true },
    { text: "Preciso de um orçamento", expected: true },
    { text: "O imovel tem quantos quartos?", expected: true },
    { text: "Interessada no apto anunciado", expected: true },
    { text: "Oi! Vc tem disponivel alguma casa para alugar?", expected: true },
    
    // Should NOT match (without keywords)
    { text: "Olá, tudo bem?", expected: false },
    { text: "Boa tarde!", expected: false },
    { text: "Você trabalha com o que?", expected: false },
    { text: "Obrigado pela resposta", expected: false },
    { text: "Até logo!", expected: false },
    { text: "Como vai?", expected: false },
    { text: "Quando podemos conversar?", expected: false }
];

// Run tests
console.log('\n=================================================================');
console.log('🧪 TESTE DE FILTRO DE PALAVRAS-CHAVE DO WHATSAPP');
console.log('=================================================================\n');

const service = new WhatsAppService();
let passed = 0;
let failed = 0;

testMessages.forEach((test, index) => {
    const result = service.containsRealEstateKeywords(test.text);
    const status = result === test.expected ? '✅ PASS' : '❌ FAIL';
    
    if (result === test.expected) {
        passed++;
    } else {
        failed++;
    }
    
    console.log(`${status} Teste ${index + 1}: "${test.text}"`);
    console.log(`   Esperado: ${test.expected ? 'MATCH' : 'NO MATCH'}, Resultado: ${result ? 'MATCH' : 'NO MATCH'}`);
    console.log('');
});

console.log('=================================================================');
console.log(`📊 RESULTADO: ${passed} testes passaram, ${failed} falharam`);
console.log('=================================================================\n');

if (failed === 0) {
    console.log('🎉 Todos os testes passaram! O filtro está funcionando corretamente.\n');
    process.exit(0);
} else {
    console.log('⚠️  Alguns testes falharam. Revise a lógica de filtragem.\n');
    process.exit(1);
}
