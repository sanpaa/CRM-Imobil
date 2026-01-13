# Guia de Integração Backend - Sistema Multi-Tenant

## 📡 Endpoints Necessários

### 1. Buscar Site por Domínio (OBRIGATÓRIO)

```http
GET /api/public/site-by-domain/{domain}
```

**Parâmetros:**
- `domain` (path): Nome do domínio (ex: alancarmo.com.br)

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "company": {
    "id": "company-uuid-123",
    "name": "Imobiliária Alan Carmo",
    "email": "contato@alancarmo.com.br",
    "phone": "(11) 98765-4321",
    "address": "Rua Exemplo, 123 - São Paulo, SP",
    "logo_url": "https://cdn.exemplo.com/logos/alancarmo.png",
    "description": "Sua imobiliária de confiança desde 1990",
    "whatsapp": "5511987654321"
  },
  "visualConfig": {
    "theme": {
      "primaryColor": "#0B2E4D",
      "secondaryColor": "#FF6B00",
      "accentColor": "#25d366",
      "backgroundColor": "#ffffff",
      "textColor": "#1a1a1a",
      "fontFamily": "Montserrat, sans-serif"
    },
    "branding": {
      "logo": "https://cdn.exemplo.com/logos/alancarmo.png",
      "companyName": "Imobiliária Alan Carmo",
      "tagline": "Realizando sonhos"
    },
    "contact": {
      "email": "contato@alancarmo.com.br",
      "phone": "(11) 98765-4321",
      "whatsapp": "5511987654321",
      "address": "Rua Exemplo, 123 - São Paulo, SP"
    },
    "socialLinks": {
      "facebook": "https://facebook.com/alancarmo",
      "instagram": "https://instagram.com/alancarmo",
      "linkedin": "https://linkedin.com/company/alancarmo",
      "youtube": "https://youtube.com/@alancarmo"
    },
    "businessHours": {
      "monday": "09:00 - 18:00",
      "tuesday": "09:00 - 18:00",
      "wednesday": "09:00 - 18:00",
      "thursday": "09:00 - 18:00",
      "friday": "09:00 - 18:00",
      "saturday": "09:00 - 13:00",
      "sunday": "Fechado"
    },
    "layout": {
      "header": {
        "backgroundColor": "#ffffff",
        "textColor": "#0B2E4D",
        "logo": "https://cdn.exemplo.com/logos/alancarmo.png",
        "showSearch": true,
        "menuItems": [
          { "label": "Início", "url": "/" },
          { "label": "Imóveis", "url": "/buscar" },
          { "label": "Sobre", "url": "/p/sobre" },
          { "label": "Contato", "url": "/p/contato" }
        ]
      },
      "footer": {
        "backgroundColor": "#0B2E4D",
        "textColor": "#ffffff",
        "columns": [
          {
            "title": "Sobre Nós",
            "links": [
              { "label": "Quem Somos", "url": "/p/quem-somos" },
              { "label": "Nossa Equipe", "url": "/p/equipe" }
            ]
          },
          {
            "title": "Links Úteis",
            "links": [
              { "label": "Política de Privacidade", "url": "/p/privacidade" },
              { "label": "Termos de Uso", "url": "/p/termos" }
            ]
          }
        ],
        "showSocialLinks": true,
        "copyrightText": "© 2026 Imobiliária Alan Carmo. Todos os direitos reservados."
      }
    }
  },
  "pages": [
    {
      "id": "page-uuid-1",
      "slug": "/",
      "pageType": "home",
      "name": "Página Inicial",
      "components": [
        {
          "id": "comp-1",
          "type": "hero-section",
          "order": 1,
          "config": {
            "title": "Encontre o imóvel dos seus sonhos",
            "subtitle": "A melhor imobiliária de São Paulo",
            "backgroundImage": "https://cdn.exemplo.com/hero.jpg",
            "ctaText": "Ver Imóveis",
            "ctaUrl": "/buscar"
          }
        },
        {
          "id": "comp-2",
          "type": "property-grid-section",
          "order": 2,
          "config": {
            "title": "Imóveis em Destaque",
            "limit": 6,
            "filter": "featured"
          }
        },
        {
          "id": "comp-3",
          "type": "about-section",
          "order": 3,
          "config": {
            "title": "Quem Somos",
            "content": "Com mais de 30 anos de experiência...",
            "image": "https://cdn.exemplo.com/about.jpg"
          }
        }
      ],
      "meta": {
        "title": "Imobiliária Alan Carmo - Imóveis em SP",
        "description": "Encontre os melhores imóveis em São Paulo com a Imobiliária Alan Carmo",
        "keywords": "imóveis, são paulo, apartamentos, casas, venda, aluguel"
      },
      "isPublished": true
    },
    {
      "id": "page-uuid-2",
      "slug": "sobre",
      "pageType": "custom",
      "name": "Sobre Nós",
      "components": [
        {
          "id": "comp-4",
          "type": "about-section",
          "order": 1,
          "config": {
            "title": "Nossa História",
            "content": "Fundada em 1990...",
            "image": "https://cdn.exemplo.com/history.jpg"
          }
        },
        {
          "id": "comp-5",
          "type": "team-section",
          "order": 2,
          "config": {
            "title": "Nossa Equipe",
            "members": [
              {
                "name": "Alan Carmo",
                "role": "Fundador & CEO",
                "photo": "https://cdn.exemplo.com/alan.jpg",
                "bio": "Corretor CRECI 12345"
              }
            ]
          }
        }
      ],
      "meta": {
        "title": "Sobre a Imobiliária Alan Carmo",
        "description": "Conheça nossa história e equipe",
        "keywords": "imobiliária, são paulo, história"
      },
      "isPublished": true
    }
  ],
  "domain": "alancarmo.com.br"
}
```

**Resposta de Erro - Domínio não encontrado (404):**
```json
{
  "success": false,
  "error": "Domain not found",
  "message": "O domínio 'exemplo.com.br' não está configurado no sistema"
}
```

**Resposta de Erro - Domínio não publicado (403):**
```json
{
  "success": false,
  "error": "Domain not active",
  "message": "O domínio 'exemplo.com.br' não está ativo ou publicado"
}
```

---

### 2. Buscar Imóveis (Público)

```http
GET /api/public/properties
```

**Query Parameters:**
- `company_id` (required): ID da empresa
- `page` (optional): Número da página (default: 1)
- `limit` (optional): Itens por página (default: 12)
- `type` (optional): Tipo do imóvel (apartamento, casa, etc)
- `transaction` (optional): Tipo de transação (venda, aluguel)
- `min_price` (optional): Preço mínimo
- `max_price` (optional): Preço máximo
- `city` (optional): Cidade
- `neighborhood` (optional): Bairro

**Exemplo:**
```http
GET /api/public/properties?company_id=123&type=apartamento&transaction=venda&limit=12
```

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "prop-uuid-1",
      "title": "Apartamento 3 Quartos - Jardins",
      "description": "Lindo apartamento...",
      "type": "apartamento",
      "transaction": "venda",
      "price": 850000,
      "area": 120,
      "bedrooms": 3,
      "bathrooms": 2,
      "parking": 2,
      "address": {
        "street": "Rua Augusta",
        "number": "1500",
        "complement": "Apto 501",
        "neighborhood": "Jardins",
        "city": "São Paulo",
        "state": "SP",
        "zipCode": "01304-001"
      },
      "images": [
        "https://cdn.exemplo.com/prop1-1.jpg",
        "https://cdn.exemplo.com/prop1-2.jpg"
      ],
      "features": ["piscina", "academia", "churrasqueira"],
      "status": "disponivel",
      "featured": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 48,
    "totalPages": 4
  }
}
```

---

### 3. Detalhes do Imóvel (Público)

```http
GET /api/public/properties/:id
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "id": "prop-uuid-1",
    "title": "Apartamento 3 Quartos - Jardins",
    "description": "Lindo apartamento com vista panorâmica...",
    "type": "apartamento",
    "transaction": "venda",
    "price": 850000,
    "area": 120,
    "bedrooms": 3,
    "bathrooms": 2,
    "parking": 2,
    "address": {
      "street": "Rua Augusta",
      "number": "1500",
      "complement": "Apto 501",
      "neighborhood": "Jardins",
      "city": "São Paulo",
      "state": "SP",
      "zipCode": "01304-001",
      "coordinates": {
        "lat": -23.5558,
        "lng": -46.6634
      }
    },
    "images": [
      {
        "url": "https://cdn.exemplo.com/prop1-1.jpg",
        "title": "Sala de Estar",
        "order": 1
      },
      {
        "url": "https://cdn.exemplo.com/prop1-2.jpg",
        "title": "Cozinha",
        "order": 2
      }
    ],
    "features": ["piscina", "academia", "churrasqueira", "segurança 24h"],
    "status": "disponivel",
    "featured": true,
    "company": {
      "id": "company-uuid-123",
      "name": "Imobiliária Alan Carmo",
      "phone": "(11) 98765-4321",
      "whatsapp": "5511987654321"
    },
    "broker": {
      "name": "Alan Carmo",
      "creci": "12345-F",
      "phone": "(11) 98765-4321",
      "photo": "https://cdn.exemplo.com/alan.jpg"
    }
  }
}
```

---

## 🔒 Autenticação

### Endpoints Públicos (sem autenticação):
- `GET /api/public/site-by-domain/:domain`
- `GET /api/public/properties`
- `GET /api/public/properties/:id`

### Endpoints Administrativos (requerem Bearer Token):
- Todos os endpoints em `/api/admin/*`
- Todos os endpoints em `/api/domains/*`

**Header de Autenticação:**
```http
Authorization: Bearer {JWT_TOKEN}
```

---

## 🎨 Mapeamento de Cores no Theme

O frontend espera as seguintes propriedades no `visualConfig.theme`:

| Propriedade Backend | CSS Variable Frontend | Descrição |
|---------------------|----------------------|-----------|
| `primaryColor` | `--primary` | Cor principal da marca |
| `secondaryColor` | `--secondary` | Cor secundária |
| `accentColor` | `--accent` | Cor de destaque/ação |
| `backgroundColor` | `--background` | Cor de fundo |
| `textColor` | `--text` | Cor do texto principal |
| `fontFamily` | `--font-family` | Fonte principal |

Para header e footer, usar:
```json
"layout": {
  "header": {
    "backgroundColor": "#ffffff",
    "textColor": "#0B2E4D"
  },
  "footer": {
    "backgroundColor": "#0B2E4D",
    "textColor": "#ffffff"
  }
}
```

---

## 🔄 Cache e Performance

### Recomendações Backend:

1. **Cache de configuração de site:**
   - Cachear resposta de `/site-by-domain/:domain`
   - TTL sugerido: 5-10 minutos
   - Invalidar quando configuração for alterada no CRM

2. **CDN para assets:**
   - Logos, imagens, arquivos estáticos
   - Usar URLs absolutas com CDN

3. **Compressão:**
   - Gzip/Brotli para respostas JSON
   - Otimizar imagens (WebP quando possível)

---

## 🧪 Testando a Integração

### 1. Testar endpoint de domínio:
```bash
curl -X GET "https://api.exemplo.com/api/public/site-by-domain/alancarmo.com.br"
```

### 2. Testar com domínio inexistente:
```bash
curl -X GET "https://api.exemplo.com/api/public/site-by-domain/naoexiste.com.br"
# Deve retornar 404
```

### 3. Validar estrutura de resposta:
- Todos os campos obrigatórios presentes
- URLs de imagens válidas
- Cores em formato hexadecimal (#RRGGBB)
- Arrays de pages não vazio

---

## 🚨 Pontos de Atenção

1. **Performance:**
   - Endpoint deve responder em < 200ms
   - Considerar paginação para arrays grandes

2. **Validação:**
   - Validar formato de domínio
   - Verificar se domínio está ativo/publicado
   - Validar URLs de imagens

3. **Segurança:**
   - Não expor dados sensíveis em endpoints públicos
   - Rate limiting em endpoints públicos
   - CORS configurado corretamente

4. **Compatibilidade:**
   - Manter estrutura de resposta estável
   - Versionar API se necessário
   - Documentar mudanças breaking changes

---

## 📝 Exemplo de Teste Frontend

No ambiente de desenvolvimento (localhost), testar com:

```
http://localhost:4200/?domain=alancarmo.com.br
```

O frontend irá:
1. Capturar o parâmetro `domain`
2. Chamar `/api/public/site-by-domain/alancarmo.com.br`
3. Aplicar tema retornado
4. Renderizar site

---

**Versão:** 1.0.0  
**Última atualização:** Janeiro 2026
