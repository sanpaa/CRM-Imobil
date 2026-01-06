/**
 * PDF Generator for Visit Itinerary
 * Generates a professional PDF report for real estate visit itineraries
 */
const puppeteer = require('puppeteer');

/**
 * Generates an HTML template for the visit itinerary
 */
function generateVisitHTML(visitData) {
    const {
        dataVisita,
        horaVisita,
        status,
        observacoes,
        cliente,
        corretor,
        proprietario,
        codigoReferencia,
        imoveis = [],
        imobiliaria
    } = visitData;

    // Helper function to format currency
    const formatCurrency = (value) => {
        if (!value) return 'N/A';
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    // Helper function to format date
    const formatDate = (date) => {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString('pt-BR');
    };

    // Generate property cards HTML
    const generatePropertyCards = () => {
        if (imoveis.length === 0) {
            return '<p>Nenhum imóvel cadastrado nesta visita.</p>';
        }

        return imoveis.map((imovel, index) => {
            const avaliacao = imovel.avaliacao || {};
            
            return `
                <div class="property-card ${index > 0 ? 'page-break-before' : ''}">
                    <h3>Imóvel ${index + 1}: ${imovel.referenciaImovel || 'Ref. não informada'}</h3>
                    
                    <div class="section">
                        <h4>Endereço</h4>
                        <p>${imovel.enderecoCompleto || 'Não informado'}</p>
                        ${imovel.empreendimento ? `<p><strong>Empreendimento:</strong> ${imovel.empreendimento}</p>` : ''}
                    </div>

                    <div class="section">
                        <h4>Descrição do Imóvel</h4>
                        <div class="property-details">
                            <div class="detail-row">
                                <span><strong>Dormitórios:</strong> ${imovel.dormitorios || 0}</span>
                                <span><strong>Suítes:</strong> ${imovel.suites || 0}</span>
                            </div>
                            <div class="detail-row">
                                <span><strong>Banheiros:</strong> ${imovel.banheiros || 0}</span>
                                <span><strong>Vagas:</strong> ${imovel.vagas || 0}</span>
                            </div>
                            <div class="detail-row">
                                <span><strong>Área Total:</strong> ${imovel.areaTotal || 0} m²</span>
                                <span><strong>Área Construída:</strong> ${imovel.areaConstruida || 0} m²</span>
                            </div>
                            <div class="detail-row">
                                <span><strong>Valor de Venda:</strong> ${formatCurrency(imovel.valorVendaSugerido)}</span>
                            </div>
                        </div>
                    </div>

                    ${status === 'Realizada' ? `
                    <div class="section evaluation-section">
                        <h4>Avaliação do Cliente</h4>
                        
                        <div class="evaluation-grid">
                            <div class="evaluation-item">
                                <label>Estado de Conservação:</label>
                                <div class="rating">
                                    ${generateRating(avaliacao.estadoConservacao)}
                                </div>
                            </div>
                            
                            <div class="evaluation-item">
                                <label>Localização:</label>
                                <div class="rating">
                                    ${generateRating(avaliacao.localizacao)}
                                </div>
                            </div>
                            
                            <div class="evaluation-item">
                                <label>Valor do Imóvel:</label>
                                <div class="rating">
                                    ${generateRating(avaliacao.valorImovel)}
                                </div>
                            </div>
                        </div>

                        <div class="interest-section">
                            <h4>Interesse do Cliente:</h4>
                            <div class="checkbox-group">
                                <label>
                                    <input type="checkbox" ${avaliacao.interesse === 'DESCARTOU' ? 'checked' : ''} disabled>
                                    Descartou
                                </label>
                                <label>
                                    <input type="checkbox" ${avaliacao.interesse === 'INTERESSOU' ? 'checked' : ''} disabled>
                                    Interessou
                                </label>
                                <label>
                                    <input type="checkbox" ${avaliacao.interesse === 'INTERESSOU_E_ASSINOU_PROPOSTA' ? 'checked' : ''} disabled>
                                    Interessou e Assinou Proposta
                                </label>
                            </div>
                        </div>
                    </div>
                    ` : ''}
                </div>
            `;
        }).join('');
    };

    // Generate rating stars/circles
    const generateRating = (value) => {
        if (!value) {
            return '<span class="not-rated">Não avaliado</span>';
        }
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            stars += `<span class="star ${i <= value ? 'filled' : ''}">●</span>`;
        }
        return stars;
    };

    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Roteiro de Visita Imobiliária</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: Arial, sans-serif;
            font-size: 11pt;
            line-height: 1.4;
            color: #333;
            padding: 20mm;
        }
        
        .header {
            text-align: center;
            border-bottom: 2px solid #333;
            padding-bottom: 15px;
            margin-bottom: 20px;
        }
        
        .header h1 {
            font-size: 18pt;
            margin-bottom: 10px;
            color: #0066cc;
        }
        
        .company-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            padding: 10px;
            background-color: #f5f5f5;
            border-radius: 5px;
        }
        
        .company-info div {
            flex: 1;
        }
        
        .section {
            margin-bottom: 15px;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 5px;
        }
        
        .section h4 {
            margin-bottom: 8px;
            color: #0066cc;
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
        }
        
        .info-item {
            margin-bottom: 5px;
        }
        
        .info-item strong {
            color: #555;
        }
        
        .property-card {
            margin-bottom: 20px;
            padding: 15px;
            border: 2px solid #0066cc;
            border-radius: 8px;
        }
        
        .property-card h3 {
            color: #0066cc;
            margin-bottom: 15px;
            font-size: 14pt;
        }
        
        .property-details {
            background-color: #f9f9f9;
            padding: 10px;
            border-radius: 5px;
        }
        
        .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
        }
        
        .evaluation-section {
            background-color: #fff9e6;
        }
        
        .evaluation-grid {
            display: grid;
            gap: 10px;
            margin-bottom: 15px;
        }
        
        .evaluation-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px;
            background-color: white;
            border-radius: 5px;
        }
        
        .rating {
            display: flex;
            gap: 3px;
        }
        
        .star {
            font-size: 16pt;
            color: #ddd;
        }
        
        .star.filled {
            color: #ffd700;
        }
        
        .not-rated {
            font-style: italic;
            color: #999;
        }
        
        .interest-section {
            margin-top: 15px;
            padding: 10px;
            background-color: white;
            border-radius: 5px;
        }
        
        .checkbox-group {
            display: flex;
            gap: 20px;
            margin-top: 10px;
        }
        
        .checkbox-group label {
            display: flex;
            align-items: center;
            gap: 5px;
        }
        
        .signatures {
            margin-top: 40px;
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 20px;
        }
        
        .signature-box {
            text-align: center;
            padding-top: 40px;
        }
        
        .signature-line {
            border-top: 1px solid #333;
            margin-bottom: 5px;
        }
        
        .observations {
            margin-top: 20px;
            padding: 15px;
            border: 1px solid #ddd;
            border-radius: 5px;
            min-height: 80px;
        }
        
        .page-break-before {
            page-break-before: always;
        }
        
        @media print {
            body {
                padding: 15mm;
            }
            
            .page-break-before {
                page-break-before: always;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>ROTEIRO DE VISITA IMOBILIÁRIA</h1>
        ${imobiliaria ? `
            <p><strong>${imobiliaria.nome || 'Imobiliária'}</strong></p>
            ${imobiliaria.endereco ? `<p>${imobiliaria.endereco}</p>` : ''}
            ${imobiliaria.telefone ? `<p>Tel: ${imobiliaria.telefone}</p>` : ''}
        ` : ''}
    </div>

    <div class="company-info">
        <div>
            <h4>Dados da Visita</h4>
            <p><strong>Data:</strong> ${formatDate(dataVisita)}</p>
            <p><strong>Horário:</strong> ${horaVisita || 'Não informado'}</p>
            <p><strong>Status:</strong> ${status || 'Agendada'}</p>
            ${codigoReferencia ? `<p><strong>Código:</strong> ${codigoReferencia}</p>` : ''}
        </div>
        
        ${corretor ? `
        <div>
            <h4>Corretor Responsável</h4>
            <p><strong>Nome:</strong> ${corretor.nome || 'Não informado'}</p>
            ${corretor.creci ? `<p><strong>CRECI:</strong> ${corretor.creci}</p>` : ''}
            ${corretor.telefone ? `<p><strong>Telefone:</strong> ${corretor.telefone}</p>` : ''}
        </div>
        ` : ''}
    </div>

    ${cliente ? `
    <div class="section">
        <h4>Cliente Visitante</h4>
        <div class="info-grid">
            <div class="info-item"><strong>Nome:</strong> ${cliente.nome || 'Não informado'}</div>
            ${cliente.telefoneResidencial ? `<div class="info-item"><strong>Tel. Residencial:</strong> ${cliente.telefoneResidencial}</div>` : ''}
            ${cliente.telefoneComercial ? `<div class="info-item"><strong>Tel. Comercial:</strong> ${cliente.telefoneComercial}</div>` : ''}
        </div>
    </div>
    ` : ''}

    ${proprietario ? `
    <div class="section">
        <h4>Proprietário</h4>
        <div class="info-grid">
            <div class="info-item"><strong>Nome:</strong> ${proprietario.nome || 'Não informado'}</div>
            ${proprietario.telefone ? `<div class="info-item"><strong>Telefone:</strong> ${proprietario.telefone}</div>` : ''}
            ${proprietario.email ? `<div class="info-item"><strong>E-mail:</strong> ${proprietario.email}</div>` : ''}
        </div>
    </div>
    ` : ''}

    <h3 style="margin-top: 30px; margin-bottom: 15px; color: #0066cc;">Imóveis Visitados</h3>
    ${generatePropertyCards()}

    ${observacoes ? `
    <div class="observations">
        <h4 style="margin-bottom: 10px;">Observações Finais</h4>
        <p>${observacoes}</p>
    </div>
    ` : ''}

    <div class="signatures">
        ${cliente ? `
        <div class="signature-box">
            <div class="signature-line"></div>
            <p><strong>Assinatura do Cliente</strong></p>
            <p>${cliente.nome || ''}</p>
        </div>
        ` : ''}
        
        ${corretor ? `
        <div class="signature-box">
            <div class="signature-line"></div>
            <p><strong>Assinatura do Corretor</strong></p>
            <p>${corretor.nome || ''}</p>
            ${corretor.creci ? `<p>CRECI: ${corretor.creci}</p>` : ''}
        </div>
        ` : ''}
        
        ${proprietario ? `
        <div class="signature-box">
            <div class="signature-line"></div>
            <p><strong>Assinatura do Proprietário</strong></p>
            <p>${proprietario.nome || ''}</p>
        </div>
        ` : ''}
    </div>
</body>
</html>
    `;
}

/**
 * Generate PDF from visit data
 * @param {Object} visitData - The visit data object
 * @returns {Promise<Buffer>} - PDF buffer
 */
async function generateVisitPDF(visitData) {
    let browser;
    
    try {
        // Generate HTML content
        const htmlContent = generateVisitHTML(visitData);
        
        // Launch headless browser
        browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu'
            ]
        });
        
        const page = await browser.newPage();
        
        // Set content and wait for it to load
        await page.setContent(htmlContent, {
            waitUntil: 'networkidle0'
        });
        
        // Generate PDF
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '15mm',
                right: '15mm',
                bottom: '15mm',
                left: '15mm'
            }
        });
        
        return pdfBuffer;
    } catch (error) {
        console.error('Error generating PDF:', error);
        throw error;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

module.exports = {
    generateVisitPDF,
    generateVisitHTML
};
