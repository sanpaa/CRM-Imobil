# Visit Itinerary Feature - Quick Start Guide

## Overview
This feature allows you to manage property visit schedules and generate professional PDF reports for real estate visit itineraries.

## What's Included

### Backend Components
- **Domain Entity**: `Visit` - Core business logic and validation
- **Repository**: `SupabaseVisitRepository` - Database operations
- **Service**: `VisitService` - Application business logic
- **Routes**: RESTful API endpoints at `/api/visits`
- **PDF Generator**: Professional A4 format PDF generation using PDFKit

### API Endpoints
- `GET /api/visits` - List all visits
- `GET /api/visits/:id` - Get single visit
- `POST /api/visits` - Create new visit
- `PUT /api/visits/:id` - Update visit
- `DELETE /api/visits/:id` - Delete visit
- `POST /api/visits/:id/generate-pdf` - Generate PDF from existing visit
- `POST /api/visits/generate-pdf-direct` - Generate PDF without saving to database

## Quick Setup

### 1. Install Dependencies
```bash
npm install
```

This will install all required dependencies including `pdfkit` for PDF generation.

### 2. Run Database Migration
Apply the visits table schema to your Supabase database:

```bash
# Using psql
psql -d your_database < migration-visits.sql

# Or using Supabase dashboard
# Copy the contents of migration-visits.sql and run it in the SQL editor
```

### 3. Start the Server
```bash
npm run dev
```

The server will start on port 3000 (or the port specified in your .env file).

## Testing

### Test Entity Validation
```bash
node test-visit-entity.js
```

### Test PDF Generation
```bash
node test-visit-pdf.js
```

This will create sample PDFs in the `tmp/` directory that you can inspect.

## Usage Examples

### Create a Visit
```bash
curl -X POST http://localhost:3000/api/visits \
  -H "Content-Type: application/json" \
  -d '{
    "dataVisita": "2024-01-20",
    "horaVisita": "14:00",
    "status": "Agendada",
    "codigoReferencia": "VIS-2024-001",
    "cliente": {
      "nome": "Maria Santos",
      "telefoneResidencial": "(11) 3333-4444",
      "telefoneComercial": "(11) 99999-8888"
    },
    "corretor": {
      "nome": "João Silva",
      "creci": "CRECI 12345-F",
      "telefone": "(11) 98765-4321"
    },
    "imoveis": [
      {
        "referenciaImovel": "APT-001",
        "enderecoCompleto": "Av. Paulista, 1000 - Apto 501",
        "dormitorios": 3,
        "suites": 2,
        "banheiros": 3,
        "vagas": 2,
        "areaTotal": 120,
        "areaConstruida": 110,
        "valorVendaSugerido": 850000
      }
    ]
  }'
```

### Generate PDF
```bash
curl -X POST http://localhost:3000/api/visits/{visit-id}/generate-pdf \
  -o roteiro-visita.pdf
```

## Visit Data Structure

### Required Fields
- `dataVisita` - Visit date (format: YYYY-MM-DD)
- `horaVisita` - Visit time (format: HH:MM)

### Optional Fields
- `status` - Visit status: 'Agendada', 'Realizada', or 'Cancelada' (default: 'Agendada')
- `observacoes` - General observations
- `codigoReferencia` - Visit reference code
- `cliente` - Client information object
- `corretor` - Broker information object
- `proprietario` - Owner information object
- `imoveis` - Array of visited properties
- `imobiliaria` - Real estate agency information

### Client Object
```json
{
  "nome": "Client Name",
  "telefoneResidencial": "(11) 3333-4444",
  "telefoneComercial": "(11) 99999-8888"
}
```

### Broker Object
```json
{
  "nome": "Broker Name",
  "creci": "CRECI 12345-F",
  "telefone": "(11) 98765-4321"
}
```

### Owner Object
```json
{
  "nome": "Owner Name",
  "telefone": "(11) 97777-6666",
  "email": "owner@example.com"
}
```

### Property Object
```json
{
  "referenciaImovel": "APT-001",
  "enderecoCompleto": "Av. Paulista, 1000 - Apto 501",
  "empreendimento": "Edifício Sunset Boulevard",
  "dormitorios": 3,
  "suites": 2,
  "banheiros": 3,
  "vagas": 2,
  "areaTotal": 120,
  "areaConstruida": 110,
  "valorVendaSugerido": 850000,
  "avaliacao": {
    "estadoConservacao": 5,
    "localizacao": 5,
    "valorImovel": 4,
    "interesse": "INTERESSOU_E_ASSINOU_PROPOSTA"
  }
}
```

### Evaluation Rules
- Evaluations can only be added when `status` is `'Realizada'`
- `estadoConservacao`, `localizacao`, `valorImovel` - Rating from 1 to 5
- `interesse` - Options: `'DESCARTOU'`, `'INTERESSOU'`, `'INTERESSOU_E_ASSINOU_PROPOSTA'`

## PDF Report Features

The generated PDF includes:

1. **Header**
   - Title and real estate agency information
   - Logo support (if provided)

2. **Visit Information**
   - Date, time, status, reference code
   - Broker details with CRECI number

3. **Participants**
   - Client contact information
   - Owner contact information

4. **Property Details**
   - Complete address and reference
   - Room details (bedrooms, suites, bathrooms, parking)
   - Area information (total and constructed)
   - Suggested sale price

5. **Client Evaluations** (when status is 'Realizada')
   - Conservation status rating (1-5 stars)
   - Location rating (1-5 stars)
   - Value rating (1-5 stars)
   - Interest level checkboxes

6. **Observations**
   - Free text field for notes

7. **Signature Lines**
   - Client, broker, and owner signatures

## Architecture

This feature follows the Onion Architecture pattern:

```
Domain Layer (Core)
├── entities/Visit.js           - Business entity with validation
└── interfaces/IVisitRepository.js - Repository contract

Application Layer
└── services/VisitService.js    - Business logic orchestration

Infrastructure Layer
└── repositories/SupabaseVisitRepository.js - Database implementation

Presentation Layer
└── routes/visitRoutes.js       - HTTP API endpoints

Utils
└── pdfGenerator.js             - PDF generation utility
```

## Troubleshooting

### Database Connection Issues
- Ensure `SUPABASE_URL` and `SUPABASE_KEY` are set in your `.env` file
- Check that the migration has been run successfully

### PDF Generation Issues
- Verify that `pdfkit` is installed: `npm list pdfkit`
- Check the `tmp/` directory permissions for test PDF output

### Validation Errors
- Ensure required fields (`dataVisita`, `horaVisita`) are provided
- Check that status is one of the valid values
- Verify that evaluations are only added when status is 'Realizada'

## Full Documentation

For complete API documentation, see [VISITS_API_DOCUMENTATION.md](./VISITS_API_DOCUMENTATION.md)

## Support

For issues or questions, please refer to the main project documentation or create an issue in the repository.
