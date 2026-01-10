/**
 * Integration test for Visit entity and service
 * Tests the business logic without requiring database
 */
const Visit = require('./src/domain/entities/Visit');

console.log('🧪 Testing Visit Entity and Validation...\n');

let passedTests = 0;
let failedTests = 0;

function test(description, testFn) {
    try {
        testFn();
        console.log(`✓ ${description}`);
        passedTests++;
    } catch (error) {
        console.log(`✗ ${description}`);
        console.log(`  Error: ${error.message}`);
        failedTests++;
    }
}

// Test 1: Create valid visit
test('Should create a valid visit with required fields', () => {
    const visit = new Visit({
        dataVisita: '2024-01-20',
        horaVisita: '14:00',
        status: 'Agendada'
    });
    
    if (!visit.dataVisita || !visit.horaVisita) {
        throw new Error('Visit should have required fields');
    }
});

// Test 2: Validate required fields
test('Should fail validation when dataVisita is missing', () => {
    const visit = new Visit({
        horaVisita: '14:00',
        status: 'Agendada'
    });
    
    try {
        visit.validate();
        throw new Error('Should have thrown validation error');
    } catch (error) {
        if (!error.message.includes('Data da visita é obrigatória')) {
            throw new Error('Wrong validation error: ' + error.message);
        }
    }
});

// Test 3: Validate status
test('Should fail validation when status is invalid', () => {
    const visit = new Visit({
        dataVisita: '2024-01-20',
        horaVisita: '14:00',
        status: 'InvalidStatus'
    });
    
    try {
        visit.validate();
        throw new Error('Should have thrown validation error');
    } catch (error) {
        if (!error.message.includes('Status deve ser um dos seguintes')) {
            throw new Error('Wrong validation error: ' + error.message);
        }
    }
});

// Test 4: Validate evaluations only for Realizada status
test('Should fail validation when evaluation exists but status is not Realizada', () => {
    const visit = new Visit({
        dataVisita: '2024-01-20',
        horaVisita: '14:00',
        status: 'Agendada',
        imoveis: [
            {
                referenciaImovel: 'APT-001',
                avaliacao: {
                    estadoConservacao: 5
                }
            }
        ]
    });
    
    try {
        visit.validate();
        throw new Error('Should have thrown validation error');
    } catch (error) {
        if (!error.message.includes('Avaliações só podem ser preenchidas quando o status for "Realizada"')) {
            throw new Error('Wrong validation error: ' + error.message);
        }
    }
});

// Test 5: Allow evaluations for Realizada status
test('Should allow evaluation when status is Realizada', () => {
    const visit = new Visit({
        dataVisita: '2024-01-20',
        horaVisita: '14:00',
        status: 'Realizada',
        imoveis: [
            {
                referenciaImovel: 'APT-001',
                avaliacao: {
                    estadoConservacao: 5,
                    localizacao: 4,
                    valorImovel: 3,
                    interesse: 'INTERESSOU'
                }
            }
        ]
    });
    
    visit.validate(); // Should not throw
});

// Test 6: Check canHaveEvaluations method
test('Should return true for canHaveEvaluations when status is Realizada', () => {
    const visit = new Visit({
        dataVisita: '2024-01-20',
        horaVisita: '14:00',
        status: 'Realizada'
    });
    
    if (!visit.canHaveEvaluations()) {
        throw new Error('canHaveEvaluations should return true for Realizada status');
    }
});

// Test 7: Check canHaveEvaluations method returns false for other statuses
test('Should return false for canHaveEvaluations when status is not Realizada', () => {
    const visit = new Visit({
        dataVisita: '2024-01-20',
        horaVisita: '14:00',
        status: 'Agendada'
    });
    
    if (visit.canHaveEvaluations()) {
        throw new Error('canHaveEvaluations should return false for non-Realizada status');
    }
});

// Test 8: toJSON should work correctly
test('Should convert visit to JSON', () => {
    const visit = new Visit({
        dataVisita: '2024-01-20',
        horaVisita: '14:00',
        status: 'Agendada',
        cliente: { nome: 'Test Client' },
        corretor: { nome: 'Test Broker' }
    });
    
    const json = visit.toJSON();
    
    if (!json.dataVisita || !json.horaVisita || !json.cliente || !json.corretor) {
        throw new Error('JSON should contain all fields');
    }
});

// Test 9: Complex visit with multiple properties
test('Should handle multiple properties in a visit', () => {
    const visit = new Visit({
        dataVisita: '2024-01-20',
        horaVisita: '14:00',
        status: 'Realizada',
        cliente: {
            nome: 'Maria Santos',
            telefoneResidencial: '(11) 3333-4444'
        },
        corretor: {
            nome: 'João Silva',
            creci: 'CRECI 12345-F'
        },
        proprietario: {
            nome: 'Carlos Oliveira',
            telefone: '(11) 97777-6666',
            email: 'carlos@example.com'
        },
        imoveis: [
            {
                referenciaImovel: 'APT-001',
                enderecoCompleto: 'Av. Paulista, 1000',
                dormitorios: 3,
                suites: 2,
                banheiros: 3,
                vagas: 2,
                areaTotal: 120,
                areaConstruida: 110,
                valorVendaSugerido: 850000,
                avaliacao: {
                    estadoConservacao: 5,
                    localizacao: 5,
                    valorImovel: 4,
                    interesse: 'INTERESSOU_E_ASSINOU_PROPOSTA'
                }
            },
            {
                referenciaImovel: 'APT-002',
                enderecoCompleto: 'Rua Augusta, 500',
                dormitorios: 2,
                suites: 1,
                banheiros: 2,
                vagas: 1,
                areaTotal: 80,
                areaConstruida: 75,
                valorVendaSugerido: 620000,
                avaliacao: {
                    estadoConservacao: 4,
                    localizacao: 5,
                    valorImovel: 3,
                    interesse: 'INTERESSOU'
                }
            }
        ]
    });
    
    visit.validate(); // Should not throw
    
    if (visit.imoveis.length !== 2) {
        throw new Error('Visit should have 2 properties');
    }
});

// Summary
console.log('\n' + '='.repeat(50));
console.log(`Tests passed: ${passedTests}`);
console.log(`Tests failed: ${failedTests}`);
console.log('='.repeat(50));

if (failedTests > 0) {
    process.exit(1);
}

console.log('\n✅ All tests passed!');
