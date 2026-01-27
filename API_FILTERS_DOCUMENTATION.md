# API de Filtros - CRM Imobiliário

Esta documentação descreve os endpoints disponíveis com suporte a filtros para o frontend do CRM.

## Base URL
```
http://localhost:3000/api
```

---

## 1. Propriedades (Properties)

### GET `/api/properties`
Retorna lista paginada de propriedades com filtros avançados.

#### Query Parameters

| Parâmetro | Tipo | Descrição | Exemplo |
|-----------|------|-----------|---------|
| `page` | number | Número da página (padrão: 1) | `page=1` |
| `limit` | number | Itens por página (padrão: 9) | `limit=20` |
| `search` | string | Busca texto em título, descrição, bairro, cidade e rua | `search=apartamento` |
| `type` | string | Tipo do imóvel | `type=Apartamento` |
| `city` | string | Cidade | `city=São Paulo` |
| `state` | string | Estado | `state=SP` |
| `neighborhood` | string | Bairro | `neighborhood=Jardins` |
| `priceMin` | number | Preço mínimo | `priceMin=200000` |
| `priceMax` | number | Preço máximo | `priceMax=500000` |
| `bedrooms` | number | Mínimo de quartos | `bedrooms=3` |
| `bathrooms` | number | Mínimo de banheiros | `bathrooms=2` |
| `parking` | number | Mínimo de vagas | `parking=1` |
| `areaMin` | number | Área mínima (m²) | `areaMin=80` |
| `areaMax` | number | Área máxima (m²) | `areaMax=150` |
| `sold` | boolean | Filtrar vendidos/disponíveis | `sold=false` |
| `featured` | boolean | Apenas imóveis em destaque | `featured=true` |
| `furnished` | boolean | Filtrar por mobiliado | `furnished=true` |
| `status` | string | Status do imóvel | `status=Disponível` |

#### Exemplo de Request
```javascript
// Buscar apartamentos em São Paulo com 3 quartos, preço entre 200k-500k
GET /api/properties?type=Apartamento&city=São Paulo&bedrooms=3&priceMin=200000&priceMax=500000&page=1&limit=10
```

#### Resposta
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Apartamento 3 quartos em Jardins",
      "description": "Excelente apartamento...",
      "type": "Apartamento",
      "price": 450000,
      "bedrooms": 3,
      "bathrooms": 2,
      "area": 120,
      "parking": 2,
      "city": "São Paulo",
      "state": "SP",
      "neighborhood": "Jardins",
      "featured": false,
      "sold": false,
      "status": "Disponível",
      "furnished": false,
      "imageUrl": "https://...",
      "imageUrls": ["https://..."],
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 45,
  "page": 1,
  "totalPages": 5
}
```

---

## 2. Clientes (Clients)

### GET `/api/clients`
Retorna lista paginada de clientes/leads com filtros.

#### Query Parameters

| Parâmetro | Tipo | Descrição | Exemplo |
|-----------|------|-----------|---------|
| `page` | number | Número da página (padrão: 1) | `page=1` |
| `limit` | number | Itens por página (padrão: 20) | `limit=50` |
| `search` | string | Busca em nome, email e telefone | `search=João` |
| `companyId` | string | ID da empresa (multi-tenant) | `companyId=uuid` |
| `name` | string | Filtrar por nome | `name=João Silva` |
| `email` | string | Filtrar por email | `email=joao@example.com` |
| `phone` | string | Filtrar por telefone | `phone=11999999999` |
| `createdAfter` | string | Data mínima de criação (ISO 8601) | `createdAfter=2024-01-01` |
| `createdBefore` | string | Data máxima de criação (ISO 8601) | `createdBefore=2024-12-31` |

#### Exemplo de Request
```javascript
// Buscar clientes criados em janeiro de 2024
GET /api/clients?createdAfter=2024-01-01&createdBefore=2024-01-31&page=1&limit=20
```

#### Resposta
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "João Silva",
      "email": "joao@example.com",
      "phone": "11999999999",
      "company_id": "uuid",
      "created_at": "2024-01-15T10:30:00.000Z"
    }
  ],
  "total": 15,
  "page": 1,
  "totalPages": 1
}
```

### GET `/api/clients/:id`
Retorna um cliente específico por ID.

### POST `/api/clients`
Cria um novo cliente.

#### Request Body
```json
{
  "name": "João Silva",
  "email": "joao@example.com",
  "phone": "11999999999",
  "company_id": "uuid"
}
```

### PUT `/api/clients/:id`
Atualiza um cliente existente.

### DELETE `/api/clients/:id`
Remove um cliente.

---

## 3. Visitas (Visits)

### GET `/api/visits`
Retorna lista de visitas com filtros. Suporta paginação opcional.

#### Query Parameters

| Parâmetro | Tipo | Descrição | Exemplo |
|-----------|------|-----------|---------|
| `page` | number | Número da página (opcional) | `page=1` |
| `limit` | number | Itens por página (padrão: 20) | `limit=30` |
| `search` | string | Busca em cliente, corretor, proprietário, código e observações | `search=apartamento` |
| `status` | string | Status da visita | `status=Agendada` |
| `dateFrom` | string | Data inicial (YYYY-MM-DD) | `dateFrom=2024-01-01` |
| `dateTo` | string | Data final (YYYY-MM-DD) | `dateTo=2024-12-31` |
| `client` | string | Nome do cliente | `client=João` |
| `propertyCode` | string | Código de referência do imóvel | `propertyCode=APT-001` |
| `broker` | string | Nome do corretor | `broker=Maria` |
| `owner` | string | Nome do proprietário | `owner=Pedro` |
| `imobiliaria` | string | Nome da imobiliária | `imobiliaria=MinhaImob` |

#### Exemplo de Request
```javascript
// Buscar visitas agendadas para janeiro de 2024
GET /api/visits?status=Agendada&dateFrom=2024-01-01&dateTo=2024-01-31&page=1&limit=20

// Buscar todas as visitas (sem paginação)
GET /api/visits
```

#### Resposta (com paginação)
```json
{
  "data": [
    {
      "id": "uuid",
      "dataVisita": "2024-01-15",
      "horaVisita": "14:00",
      "status": "Agendada",
      "cliente": "João Silva",
      "corretor": "Maria Santos",
      "proprietario": "Pedro Alves",
      "codigoReferencia": "APT-001",
      "imoveis": ["uuid1", "uuid2"],
      "observacoes": "Cliente interessado",
      "imobiliaria": "MinhaImob",
      "createdAt": "2024-01-10T10:00:00.000Z"
    }
  ],
  "total": 25,
  "page": 1,
  "totalPages": 2
}
```

#### Resposta (sem paginação)
```json
[
  {
    "id": "uuid",
    "dataVisita": "2024-01-15",
    "horaVisita": "14:00",
    "status": "Agendada",
    "cliente": "João Silva",
    ...
  }
]
```

### GET `/api/visits/:id`
Retorna uma visita específica por ID.

### POST `/api/visits`
Cria uma nova visita.

### PUT `/api/visits/:id`
Atualiza uma visita existente.

### DELETE `/api/visits/:id`
Remove uma visita.

### POST `/api/visits/:id/generate-pdf`
Gera PDF do roteiro de visita.

---

## Exemplos de Uso no Frontend

### Angular/TypeScript

```typescript
// Serviço de Propriedades
import { HttpClient, HttpParams } from '@angular/common/http';

export class PropertyService {
  private apiUrl = 'http://localhost:3000/api/properties';

  constructor(private http: HttpClient) {}

  getProperties(filters: any) {
    let params = new HttpParams();
    
    // Adicionar filtros
    if (filters.page) params = params.set('page', filters.page);
    if (filters.limit) params = params.set('limit', filters.limit);
    if (filters.search) params = params.set('search', filters.search);
    if (filters.type) params = params.set('type', filters.type);
    if (filters.city) params = params.set('city', filters.city);
    if (filters.priceMin) params = params.set('priceMin', filters.priceMin);
    if (filters.priceMax) params = params.set('priceMax', filters.priceMax);
    if (filters.bedrooms) params = params.set('bedrooms', filters.bedrooms);
    
    return this.http.get(this.apiUrl, { params });
  }
}

// Uso no componente
this.propertyService.getProperties({
  page: 1,
  limit: 10,
  type: 'Apartamento',
  city: 'São Paulo',
  bedrooms: 3,
  priceMin: 200000,
  priceMax: 500000
}).subscribe(response => {
  console.log('Propriedades:', response.data);
  console.log('Total:', response.total);
});
```

### JavaScript Puro

```javascript
// Função para buscar propriedades
async function buscarPropriedades(filtros) {
  const params = new URLSearchParams();
  
  Object.keys(filtros).forEach(key => {
    if (filtros[key] !== undefined && filtros[key] !== '') {
      params.append(key, filtros[key]);
    }
  });
  
  const response = await fetch(`http://localhost:3000/api/properties?${params}`);
  const data = await response.json();
  
  return data;
}

// Uso
const propriedades = await buscarPropriedades({
  page: 1,
  limit: 10,
  type: 'Apartamento',
  city: 'São Paulo',
  bedrooms: 3,
  priceMin: 200000,
  priceMax: 500000
});

console.log(propriedades.data); // Array de propriedades
console.log(propriedades.total); // Total de resultados
```

---

## Notas Importantes

1. **Paginação**: Todos os endpoints paginados retornam:
   - `data`: Array com os itens
   - `total`: Total de registros encontrados
   - `page`: Página atual
   - `totalPages`: Total de páginas

2. **Filtros Vazios**: Filtros com valores vazios são ignorados automaticamente.

3. **Busca de Texto**: Os parâmetros `search` fazem busca case-insensitive em múltiplos campos.

4. **Datas**: Use formato ISO 8601 (YYYY-MM-DD) para filtros de data.

5. **Boolean**: Use strings `'true'` ou `'false'` para filtros booleanos.

6. **Multi-tenant**: Clientes são filtrados por `company_id` quando aplicável.

---

## Status Codes

- `200`: Sucesso
- `201`: Criado com sucesso
- `400`: Erro de validação
- `404`: Não encontrado
- `500`: Erro interno do servidor
- `503`: Banco de dados indisponível

---

## Suporte

Para dúvidas ou problemas, consulte a documentação completa do backend ou entre em contato com a equipe de desenvolvimento.
