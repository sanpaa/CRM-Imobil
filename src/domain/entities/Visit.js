/**
 * Visit Entity
 * Core domain entity representing a real estate visit
 */
class Visit {
    constructor({
        id = null,
        
        // Dados principais
        dataVisita,
        horaVisita,
        status = 'Agendada', // Agendada | Realizada | Cancelada
        observacoes = null,
        
        // Vínculos (podem ser null inicialmente)
        cliente = null, // { nome, telefoneResidencial, telefoneComercial }
        corretor = null, // { nome, creci, telefone }
        proprietario = null, // { nome, telefone, email }
        
        // Código/referência da visita
        codigoReferencia = null,
        
        // Imóveis visitados (array de objetos)
        imoveis = [], // Array de { referenciaImovel, enderecoCompleto, empreendimento, dormitorios, suites, banheiros, vagas, areaTotal, areaConstruida, valorVendaSugerido, avaliacao }
        
        // Dados da imobiliária (opcional, para PDF)
        imobiliaria = null, // { nome, endereco, telefone, logoUrl }
        
        createdAt = null,
        updatedAt = null
    }) {
        this.id = id;
        this.dataVisita = dataVisita;
        this.horaVisita = horaVisita;
        this.status = status;
        this.observacoes = observacoes;
        this.cliente = cliente;
        this.corretor = corretor;
        this.proprietario = proprietario;
        this.codigoReferencia = codigoReferencia;
        this.imoveis = imoveis || [];
        this.imobiliaria = imobiliaria;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    /**
     * Validates the visit entity
     * @throws {Error} if validation fails
     */
    validate() {
        const errors = [];

        if (!this.dataVisita) {
            errors.push('Data da visita é obrigatória');
        }

        if (!this.horaVisita) {
            errors.push('Horário da visita é obrigatório');
        }

        const validStatuses = ['Agendada', 'Realizada', 'Cancelada'];
        if (!validStatuses.includes(this.status)) {
            errors.push(`Status deve ser um dos seguintes: ${validStatuses.join(', ')}`);
        }

        // Validar que avaliações só podem existir se status for "Realizada"
        if (this.status !== 'Realizada' && this.imoveis.length > 0) {
            for (const imovel of this.imoveis) {
                if (imovel.avaliacao && (
                    imovel.avaliacao.estadoConservacao ||
                    imovel.avaliacao.localizacao ||
                    imovel.avaliacao.valorImovel ||
                    imovel.avaliacao.interesse
                )) {
                    errors.push('Avaliações só podem ser preenchidas quando o status for "Realizada"');
                    break;
                }
            }
        }

        if (errors.length > 0) {
            throw new Error(`Validation failed: ${errors.join(', ')}`);
        }
    }

    /**
     * Checks if visit can have evaluations filled
     * @returns {boolean}
     */
    canHaveEvaluations() {
        return this.status === 'Realizada';
    }

    /**
     * Convert to plain JSON object
     * @returns {Object}
     */
    toJSON() {
        return {
            id: this.id,
            dataVisita: this.dataVisita,
            horaVisita: this.horaVisita,
            status: this.status,
            observacoes: this.observacoes,
            cliente: this.cliente,
            corretor: this.corretor,
            proprietario: this.proprietario,
            codigoReferencia: this.codigoReferencia,
            imoveis: this.imoveis,
            imobiliaria: this.imobiliaria,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}

module.exports = Visit;
