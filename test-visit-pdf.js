/**
 * Test script for Visit PDF generation
 * This script tests the PDF generation functionality without requiring a database
 */
const { generateVisitPDF } = require('./src/utils/pdfGenerator');
const fs = require('fs');
const path = require('path');

// Sample visit data for testing
const sampleVisitData = {
    dataVisita: '2024-01-20',
    horaVisita: '14:00',
    status: 'Realizada',
    codigoReferencia: 'VIS-2024-001',
    observacoes: 'Cliente demonstrou muito interesse no imóvel. Visitante gostou principalmente da localização e do acabamento.',
    
    imobiliaria: {
        nome: 'Imobiliária Prime',
        endereco: 'Rua das Flores, 123 - Centro',
        telefone: '(11) 3456-7890',
        logoUrl: null
    },
    
    corretor: {
        nome: 'João Silva',
        creci: 'CRECI 12345-F',
        telefone: '(11) 98765-4321'
    },
    
    cliente: {
        nome: 'Maria Santos',
        telefoneResidencial: '(11) 3333-4444',
        telefoneComercial: '(11) 99999-8888'
    },
    
    proprietario: {
        nome: 'Carlos Oliveira',
        telefone: '(11) 97777-6666',
        email: 'carlos@example.com'
    },
    
    imoveis: [
        {
            referenciaImovel: 'APT-001',
            enderecoCompleto: 'Av. Paulista, 1000 - Apto 501 - Bela Vista - São Paulo/SP',
            empreendimento: 'Edifício Sunset Boulevard',
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
            enderecoCompleto: 'Rua Augusta, 500 - Apto 302 - Consolação - São Paulo/SP',
            empreendimento: 'Residencial Augusta Tower',
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
};

async function testPDFGeneration() {
    console.log('🧪 Testing Visit PDF Generation...\n');
    
    try {
        // Test 1: Generate PDF with full data
        console.log('📄 Test 1: Generating PDF with full data...');
        const pdfBuffer = await generateVisitPDF(sampleVisitData);
        console.log('✓ PDF generated successfully');
        console.log(`  PDF size: ${pdfBuffer.length} bytes\n`);
        
        // Save PDF for inspection
        const pdfPath = path.join(__dirname, 'tmp', 'test-visit.pdf');
        fs.mkdirSync(path.dirname(pdfPath), { recursive: true });
        fs.writeFileSync(pdfPath, pdfBuffer);
        console.log(`  PDF saved to: ${pdfPath}\n`);
        
        // Test 2: Generate PDF with minimal data
        console.log('📄 Test 2: Generating PDF with minimal data...');
        const minimalData = {
            dataVisita: '2024-01-20',
            horaVisita: '14:00',
            status: 'Agendada',
            imoveis: []
        };
        const minimalPdf = await generateVisitPDF(minimalData);
        console.log('✓ Minimal PDF generated successfully');
        console.log(`  PDF size: ${minimalPdf.length} bytes\n`);
        
        const minimalPdfPath = path.join(__dirname, 'tmp', 'test-visit-minimal.pdf');
        fs.writeFileSync(minimalPdfPath, minimalPdf);
        console.log(`  Minimal PDF saved to: ${minimalPdfPath}\n`);
        
        console.log('✅ All tests passed!');
        console.log('\nGenerated files:');
        console.log(`  - ${pdfPath}`);
        console.log(`  - ${minimalPdfPath}`);
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    }
}

// Run tests
testPDFGeneration();
