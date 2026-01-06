/**
 * PDF Generator for Visit Itinerary
 * Generates a professional PDF report for real estate visit itineraries using PDFKit
 */
const PDFDocument = require('pdfkit');

/**
 * Generate PDF from visit data using PDFKit
 * @param {Object} visitData - The visit data object
 * @returns {Promise<Buffer>} - PDF buffer
 */
async function generateVisitPDF(visitData) {
    return new Promise((resolve, reject) => {
        try {
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

            // Create PDF document
            const doc = new PDFDocument({
                size: 'A4',
                margins: {
                    top: 50,
                    bottom: 50,
                    left: 50,
                    right: 50
                }
            });

            // Buffer to collect PDF data
            const buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfBuffer = Buffer.concat(buffers);
                resolve(pdfBuffer);
            });
            doc.on('error', reject);

            // Helper functions
            const formatCurrency = (value) => {
                if (!value) return 'N/A';
                return new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                }).format(value);
            };

            const formatDate = (date) => {
                if (!date) return '';
                try {
                    // Handle various date formats consistently
                    const d = new Date(date);
                    // Check if date is valid
                    if (isNaN(d.getTime())) {
                        return date; // Return original if parsing fails
                    }
                    return d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
                } catch (error) {
                    console.error('Error formatting date:', error);
                    return date; // Return original if parsing fails
                }
            };

            const addSection = (title, topMargin = 15) => {
                doc.moveDown(topMargin / 12);
                doc.fillColor('#0066cc')
                   .fontSize(12)
                   .font('Helvetica-Bold')
                   .text(title);
                doc.moveDown(0.5);
                doc.fillColor('#000000').fontSize(10).font('Helvetica');
            };

            const addField = (label, value, inline = false) => {
                if (inline) {
                    doc.font('Helvetica-Bold').text(label + ': ', { continued: true })
                       .font('Helvetica').text(value || 'Não informado');
                } else {
                    doc.font('Helvetica-Bold').text(label + ': ')
                       .font('Helvetica').text(value || 'Não informado');
                    doc.moveDown(0.3);
                }
            };

            // Header
            doc.fillColor('#0066cc')
               .fontSize(18)
               .font('Helvetica-Bold')
               .text('ROTEIRO DE VISITA IMOBILIÁRIA', { align: 'center' });
            
            doc.moveDown(0.5);

            if (imobiliaria) {
                doc.fontSize(12).fillColor('#000000');
                if (imobiliaria.nome) {
                    doc.font('Helvetica-Bold').text(imobiliaria.nome, { align: 'center' });
                }
                if (imobiliaria.endereco) {
                    doc.font('Helvetica').fontSize(10).text(imobiliaria.endereco, { align: 'center' });
                }
                if (imobiliaria.telefone) {
                    doc.text('Tel: ' + imobiliaria.telefone, { align: 'center' });
                }
            }

            doc.moveDown(1);
            doc.moveTo(50, doc.y)
               .lineTo(doc.page.width - 50, doc.y)
               .stroke('#0066cc');
            doc.moveDown(1);

            // Visit Information Box
            const boxY = doc.y;
            doc.rect(50, boxY, doc.page.width - 100, 80)
               .fillAndStroke('#f5f5f5', '#dddddd');

            doc.fillColor('#000000').fontSize(10);
            
            // Left column - Visit data
            doc.font('Helvetica-Bold').text('Dados da Visita', 60, boxY + 10);
            doc.font('Helvetica').fontSize(9);
            doc.text('Data: ' + formatDate(dataVisita), 60, boxY + 25);
            doc.text('Horário: ' + (horaVisita || 'Não informado'), 60, boxY + 40);
            doc.text('Status: ' + (status || 'Agendada'), 60, boxY + 55);
            if (codigoReferencia) {
                doc.text('Código: ' + codigoReferencia, 60, boxY + 70);
            }

            // Right column - Broker info
            if (corretor) {
                doc.font('Helvetica-Bold').fontSize(10).text('Corretor Responsável', doc.page.width - 250, boxY + 10);
                doc.font('Helvetica').fontSize(9);
                if (corretor.nome) {
                    doc.text('Nome: ' + corretor.nome, doc.page.width - 250, boxY + 25);
                }
                if (corretor.creci) {
                    doc.text('CRECI: ' + corretor.creci, doc.page.width - 250, boxY + 40);
                }
                if (corretor.telefone) {
                    doc.text('Tel: ' + corretor.telefone, doc.page.width - 250, boxY + 55);
                }
            }

            doc.y = boxY + 90;

            // Client Information
            if (cliente) {
                addSection('Cliente Visitante', 20);
                doc.fontSize(9);
                if (cliente.nome) addField('Nome', cliente.nome, true);
                if (cliente.telefoneResidencial) addField('Tel. Residencial', cliente.telefoneResidencial, true);
                if (cliente.telefoneComercial) addField('Tel. Comercial', cliente.telefoneComercial, true);
            }

            // Owner Information
            if (proprietario) {
                addSection('Proprietário', 15);
                doc.fontSize(9);
                if (proprietario.nome) addField('Nome', proprietario.nome, true);
                if (proprietario.telefone) addField('Telefone', proprietario.telefone, true);
                if (proprietario.email) addField('E-mail', proprietario.email, true);
            }

            // Properties
            doc.moveDown(1);
            doc.fillColor('#0066cc')
               .fontSize(13)
               .font('Helvetica-Bold')
               .text('Imóveis Visitados');
            doc.moveDown(0.5);

            if (imoveis.length === 0) {
                doc.fillColor('#000000').fontSize(10).font('Helvetica')
                   .text('Nenhum imóvel cadastrado nesta visita.');
            } else {
                imoveis.forEach((imovel, index) => {
                    // Check if we need a new page
                    if (doc.y > 650) {
                        doc.addPage();
                    }

                    // Property card
                    const cardY = doc.y;
                    doc.rect(50, cardY, doc.page.width - 100, 'auto')
                       .stroke('#0066cc');

                    doc.fillColor('#0066cc')
                       .fontSize(11)
                       .font('Helvetica-Bold')
                       .text(`Imóvel ${index + 1}: ${imovel.referenciaImovel || 'Ref. não informada'}`, 60, cardY + 10);

                    doc.fillColor('#000000').fontSize(9).font('Helvetica');
                    let currentY = cardY + 30;

                    // Address
                    doc.font('Helvetica-Bold').text('Endereço:', 60, currentY);
                    currentY += 12;
                    doc.font('Helvetica').text(imovel.enderecoCompleto || 'Não informado', 60, currentY, { width: doc.page.width - 120 });
                    currentY = doc.y + 5;

                    if (imovel.empreendimento) {
                        doc.font('Helvetica-Bold').text('Empreendimento: ', 60, currentY, { continued: true });
                        doc.font('Helvetica').text(imovel.empreendimento);
                        currentY = doc.y + 5;
                    }

                    // Property details
                    doc.font('Helvetica-Bold').text('Descrição do Imóvel:', 60, currentY);
                    currentY += 15;

                    doc.font('Helvetica').fontSize(9);
                    doc.text(`Dormitórios: ${imovel.dormitorios || 0}`, 60, currentY, { continued: true, width: 150 });
                    doc.text(`Suítes: ${imovel.suites || 0}`, 210, currentY);
                    currentY += 12;

                    doc.text(`Banheiros: ${imovel.banheiros || 0}`, 60, currentY, { continued: true, width: 150 });
                    doc.text(`Vagas: ${imovel.vagas || 0}`, 210, currentY);
                    currentY += 12;

                    doc.text(`Área Total: ${imovel.areaTotal || 0} m²`, 60, currentY, { continued: true, width: 150 });
                    doc.text(`Área Construída: ${imovel.areaConstruida || 0} m²`, 210, currentY);
                    currentY += 12;

                    doc.font('Helvetica-Bold').text('Valor de Venda: ', 60, currentY, { continued: true });
                    doc.font('Helvetica').text(formatCurrency(imovel.valorVendaSugerido));
                    currentY = doc.y + 10;

                    // Evaluation (only if status is Realizada)
                    if (status === 'Realizada' && imovel.avaliacao) {
                        const avaliacao = imovel.avaliacao;
                        
                        doc.font('Helvetica-Bold').text('Avaliação do Cliente:', 60, currentY);
                        currentY += 15;

                        const renderRating = (label, value, y) => {
                            doc.font('Helvetica').text(label + ': ', 60, y, { continued: true });
                            if (value) {
                                doc.text('★'.repeat(value) + '☆'.repeat(5 - value));
                            } else {
                                doc.text('Não avaliado');
                            }
                        };

                        renderRating('Estado de Conservação', avaliacao.estadoConservacao, currentY);
                        currentY += 12;
                        renderRating('Localização', avaliacao.localizacao, currentY);
                        currentY += 12;
                        renderRating('Valor do Imóvel', avaliacao.valorImovel, currentY);
                        currentY += 15;

                        doc.font('Helvetica-Bold').text('Interesse do Cliente:', 60, currentY);
                        currentY += 12;

                        const interestMap = {
                            'DESCARTOU': '[X] Descartou',
                            'INTERESSOU': '[X] Interessou',
                            'INTERESSOU_E_ASSINOU_PROPOSTA': '[X] Interessou e Assinou Proposta'
                        };

                        const interest = avaliacao.interesse;
                        doc.font('Helvetica').fontSize(9);
                        ['DESCARTOU', 'INTERESSOU', 'INTERESSOU_E_ASSINOU_PROPOSTA'].forEach(key => {
                            const label = interestMap[key].substring(4);
                            const checked = interest === key;
                            doc.text((checked ? '[X]' : '[ ]') + ' ' + label, 60, currentY);
                            currentY += 12;
                        });
                    }

                    doc.y = currentY + 10;
                    doc.moveDown(1);
                });
            }

            // Observations
            if (observacoes) {
                if (doc.y > 650) {
                    doc.addPage();
                }
                
                addSection('Observações Finais', 20);
                doc.fontSize(9).font('Helvetica').text(observacoes, {
                    width: doc.page.width - 100,
                    align: 'justify'
                });
                doc.moveDown(1);
            }

            // Signatures
            if (doc.y > 600) {
                doc.addPage();
            }

            doc.moveDown(2);
            const sigY = doc.y;
            const sigWidth = (doc.page.width - 150) / 3;
            
            let sigX = 50;
            if (cliente) {
                doc.moveTo(sigX, sigY).lineTo(sigX + sigWidth, sigY).stroke();
                doc.fontSize(8).font('Helvetica-Bold')
                   .text('Assinatura do Cliente', sigX, sigY + 5, { width: sigWidth, align: 'center' });
                doc.font('Helvetica').text(cliente.nome || '', sigX, sigY + 18, { width: sigWidth, align: 'center' });
                sigX += sigWidth + 25;
            }

            if (corretor) {
                doc.moveTo(sigX, sigY).lineTo(sigX + sigWidth, sigY).stroke();
                doc.fontSize(8).font('Helvetica-Bold')
                   .text('Assinatura do Corretor', sigX, sigY + 5, { width: sigWidth, align: 'center' });
                doc.font('Helvetica').text(corretor.nome || '', sigX, sigY + 18, { width: sigWidth, align: 'center' });
                if (corretor.creci) {
                    doc.text('CRECI: ' + corretor.creci, sigX, sigY + 30, { width: sigWidth, align: 'center' });
                }
                sigX += sigWidth + 25;
            }

            if (proprietario) {
                doc.moveTo(sigX, sigY).lineTo(sigX + sigWidth, sigY).stroke();
                doc.fontSize(8).font('Helvetica-Bold')
                   .text('Assinatura do Proprietário', sigX, sigY + 5, { width: sigWidth, align: 'center' });
                doc.font('Helvetica').text(proprietario.nome || '', sigX, sigY + 18, { width: sigWidth, align: 'center' });
            }

            // Finalize PDF
            doc.end();

        } catch (error) {
            reject(error);
        }
    });
}

module.exports = {
    generateVisitPDF
};
