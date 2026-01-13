# Visit Itinerary API Documentation

## Overview
The Visit Itinerary feature allows real estate agencies to manage property visit schedules and generate professional PDF reports for visit itineraries.

## Database Schema

### visits Table
```sql
CREATE TABLE visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data_visita DATE NOT NULL,
    hora_visita TIME NOT NULL,
    status VARCHAR(50) DEFAULT 'Agendada' CHECK (status IN ('Agendada', 'Realizada', 'Cancelada')),
    observacoes TEXT,
    codigo_referencia VARCHAR(100),
    cliente JSONB,
    corretor JSONB,
    proprietario JSONB,
    imoveis JSONB DEFAULT '[]'::jsonb,
    imobiliaria JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

### 1. List All Visits
**GET** `/api/visits`

Returns a list of all visits.

**Response:**
```json
[
  {
    "id": "uuid",
    "dataVisita": "2024-01-20",
    "horaVisita": "14:00",
    "status": "Realizada",
    "observacoes": "Cliente muito interessado",
    "codigoReferencia": "VIS-2024-001",
    "cliente": { ... },
    "corretor": { ... },
    "proprietario": { ... },
    "imoveis": [ ... ],
    "createdAt": "2024-01-20T10:00:00Z",
    "updatedAt": "2024-01-20T15:30:00Z"
  }
]
```

### 2. Get Single Visit
**GET** `/api/visits/:id`

Returns details of a specific visit.

**Response:** Same as item in list above

**Errors:**
- `404` - Visit not found

### 3. Create Visit
**POST** `/api/visits`

Creates a new visit entry.

**Request Body:**
```json
{
  "dataVisita": "2024-01-20",
  "horaVisita": "14:00",
  "status": "Agendada",
  "codigoReferencia": "VIS-2024-001",
  "observacoes": "Primeira visita do cliente",
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
  "proprietario": {
    "nome": "Carlos Oliveira",
    "telefone": "(11) 97777-6666",
    "email": "carlos@example.com"
  },
  "imoveis": [
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
      "valorVendaSugerido": 850000
    }
  ],
  "imobiliaria": {
    "nome": "Imobiliária Prime",
    "endereco": "Rua das Flores, 123 - Centro",
    "telefone": "(11) 3456-7890"
  }
}
```

**Required Fields:**
- `dataVisita` (date)
- `horaVisita` (time)

**Response:** Created visit object with ID

**Errors:**
- `400` - Validation failed
- `503` - Database not available

### 4. Update Visit
**PUT** `/api/visits/:id`

Updates an existing visit.

**Request Body:** Same as create, all fields optional

**Response:** Updated visit object

**Errors:**
- `400` - Validation failed
- `404` - Visit not found
- `503` - Database not available

### 5. Delete Visit
**DELETE** `/api/visits/:id`

Deletes a visit.

**Response:**
```json
{
  "message": "Visit deleted successfully"
}
```

**Errors:**
- `404` - Visit not found

### 6. Generate PDF from Existing Visit
**POST** `/api/visits/:id/generate-pdf`

Generates a PDF report for an existing visit.

**Response:** PDF file (application/pdf)

**Headers:**
- `Content-Type: application/pdf`
- `Content-Disposition: attachment; filename="roteiro-visita-{id}.pdf"`

**Errors:**
- `404` - Visit not found
- `500` - PDF generation failed

### 7. Generate PDF from Data (Without Saving)
**POST** `/api/visits/generate-pdf-direct`

Generates a PDF report directly from provided data without saving to database.

**Request Body:** Same structure as create visit

**Response:** PDF file (application/pdf)

**Headers:**
- `Content-Type: application/pdf`
- `Content-Disposition: attachment; filename="roteiro-visita.pdf"`

**Errors:**
- `400` - Missing required fields
- `500` - PDF generation failed

## Visit Status

- **Agendada** (Scheduled) - Visit is scheduled for the future
- **Realizada** (Completed) - Visit has been completed
- **Cancelada** (Cancelled) - Visit was cancelled

## Validation Rules

1. **Required Fields:**
   - `dataVisita` - Visit date
   - `horaVisita` - Visit time

2. **Status Validation:**
   - Status must be one of: 'Agendada', 'Realizada', 'Cancelada'

3. **Evaluation Rules:**
   - Property evaluations can only be filled when status is 'Realizada'
   - If status is changed from 'Realizada' to another status, evaluations are blocked

## Property Evaluation Structure

When a visit has status 'Realizada', each property can have an evaluation:

```json
{
  "avaliacao": {
    "estadoConservacao": 5,      // 1-5 rating
    "localizacao": 5,              // 1-5 rating
    "valorImovel": 4,              // 1-5 rating
    "interesse": "INTERESSOU_E_ASSINOU_PROPOSTA"  // DESCARTOU | INTERESSOU | INTERESSOU_E_ASSINOU_PROPOSTA
  }
}
```

## PDF Report Structure

The generated PDF includes:

1. **Header**
   - Title: "ROTEIRO DE VISITA IMOBILIÁRIA"
   - Real estate agency information (logo, name, address, phone)

2. **Visit Information**
   - Date, time, status, reference code
   - Broker information (name, CRECI, phone)

3. **Participants**
   - Client information (name, residential phone, commercial phone)
   - Owner information (name, phone, email)

4. **Properties Visited**
   - For each property:
     - Reference and address
     - Property details (bedrooms, suites, bathrooms, parking, area)
     - Suggested sale value
     - Client evaluation (if status is 'Realizada')
     - Interest level

5. **Observations**
   - Final notes about the visit

6. **Signatures**
   - Signature lines for client, broker, and owner

## Example cURL Commands

### Create a Visit
```bash
curl -X POST http://localhost:3000/api/visits \
  -H "Content-Type: application/json" \
  -d '{
    "dataVisita": "2024-01-20",
    "horaVisita": "14:00",
    "status": "Agendada",
    "cliente": {
      "nome": "Maria Santos",
      "telefoneResidencial": "(11) 3333-4444"
    },
    "corretor": {
      "nome": "João Silva",
      "creci": "CRECI 12345-F"
    }
  }'
```

### Generate PDF
```bash
curl -X POST http://localhost:3000/api/visits/{visit-id}/generate-pdf \
  -o roteiro-visita.pdf
```

### Generate PDF Without Saving
```bash
curl -X POST http://localhost:3000/api/visits/generate-pdf-direct \
  -H "Content-Type: application/json" \
  -d '{
    "dataVisita": "2024-01-20",
    "horaVisita": "14:00",
    "status": "Realizada",
    "cliente": { "nome": "Maria Santos" },
    "imoveis": [...]
  }' \
  -o roteiro-visita.pdf
```

## Installation

1. Run the database migration:
```bash
psql -d your_database < migration-visits.sql
```

2. Install dependencies (pdfkit is included):
```bash
npm install
```

3. Start the server:
```bash
npm run dev
```

## Testing

Run the test script to verify PDF generation:
```bash
node test-visit-pdf.js
```

This will generate sample PDFs in the `tmp/` directory for inspection.
