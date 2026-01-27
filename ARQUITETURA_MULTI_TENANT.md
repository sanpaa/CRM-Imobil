# 🏗️ Arquitetura Multi-Tenant - CRM Imobiliário

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Conceitos Fundamentais](#conceitos-fundamentais)
3. [Arquitetura de Dois Bancos de Dados](#arquitetura-de-dois-bancos-de-dados)
4. [Planos de Assinatura](#planos-de-assinatura)
5. [Fluxo de Dados](#fluxo-de-dados)
6. [Isolamento de Dados](#isolamento-de-dados)
7. [Implementação Técnica](#implementação-técnica)
8. [Provisionamento de Novos Tenants](#provisionamento-de-novos-tenants)
9. [Segurança](#segurança)
10. [Escalabilidade](#escalabilidade)

---

## 🎯 Visão Geral

O CRM Imobiliário utiliza uma **arquitetura multi-tenant com separação de bancos de dados**, onde cada cliente (imobiliária) possui seu próprio banco de dados isolado para dados de negócio, enquanto compartilha um banco de dados central para autenticação e configurações gerais.

### Por que Multi-Tenant?

- **Isolamento Total**: Cada cliente tem seus dados completamente isolados
- **Segurança**: Zero possibilidade de vazamento de dados entre clientes
- **Escalabilidade**: Bancos menores e mais performáticos
- **Flexibilidade**: Possibilidade de migrar clientes grandes para servidores dedicados
- **Backup Independente**: Cada cliente pode ter política de backup personalizada

### Por que Dois Bancos de Dados?

#### 🗄️ Banco Central (Compartilhado)
- **Propósito**: Autenticação, roteamento e configurações globais
- **Dados armazenados**:
  - Usuários e credenciais
  - Informações das empresas/tenants
  - Planos de assinatura
  - Mapeamento de domínios
  - Logs de auditoria global
  - Configurações de tenant

#### 🗄️ Banco do Tenant (Individual por Cliente)
- **Propósito**: Dados de negócio específicos de cada imobiliária
- **Dados armazenados**:
  - Imóveis (properties)
  - Clientes (clients)
  - Visitas (visits)
  - Configurações da loja (store_settings)
  - Mensagens WhatsApp
  - Documentos e anexos
  - Histórico de atividades

---

## 📚 Conceitos Fundamentais

### O que é Multi-Tenant?

**Multi-tenant** (multi-inquilino) é uma arquitetura onde uma única instância de software serve múltiplos clientes (tenants), mantendo dados isolados entre eles.

**Exemplo prático:**
- Tenant 1: Imobiliária ABC
- Tenant 2: Imobiliária XYZ
- Tenant 3: Imobiliária 123

Cada uma usa o mesmo sistema, mas vê apenas seus próprios dados.

### Estratégias de Multi-Tenancy

#### 1️⃣ Banco Único com tenant_id (Não recomendado para este caso)
```
┌─────────────────────────────────┐
│     Database Único              │
├─────────────────────────────────┤
│ properties                      │
│  - id                           │
│  - tenant_id ← Filtro           │
│  - title                        │
│  - ...                          │
└─────────────────────────────────┘
```
**Desvantagens:**
- Risco de vazamento de dados por erro de código
- Performance degrada com volume
- Backup/restore afeta todos os clientes

#### 2️⃣ Schema por Tenant (PostgreSQL schemas)
```
┌─────────────────────────────────┐
│     Database Único              │
├─────────────────────────────────┤
│ Schema: tenant_abc              │
│   - properties                  │
│   - clients                     │
│                                 │
│ Schema: tenant_xyz              │
│   - properties                  │
│   - clients                     │
└─────────────────────────────────┘
```
**Desvantagens:**
- Limite de schemas por database
- Migrations mais complexas
- Backup individual mais difícil

#### 3️⃣ Database por Tenant (✅ Escolhido)
```
┌─────────────────────┐     ┌─────────────────────┐
│  Central Database   │     │  tenant_abc_db      │
│  - users            │     │  - properties       │
│  - companies        │     │  - clients          │
│  - subscriptions    │     │  - visits           │
└─────────────────────┘     └─────────────────────┘
                            ┌─────────────────────┐
                            │  tenant_xyz_db      │
                            │  - properties       │
                            │  - clients          │
                            │  - visits           │
                            └─────────────────────┘
```
**Vantagens:**
- ✅ Isolamento completo
- ✅ Escalabilidade infinita
- ✅ Backup/restore independente
- ✅ Performance previsível
- ✅ Fácil migração para servidor dedicado

---

## 🏗️ Arquitetura de Dois Bancos de Dados

### Diagrama Geral

```
┌───────────────────────────────────────────────────────────────────┐
│                         USUÁRIO ACESSA                             │
│                    https://imobiliaria-abc.com                     │
└───────────────────────────────┬───────────────────────────────────┘
                                │
                                ▼
┌───────────────────────────────────────────────────────────────────┐
│                    1. ROTEAMENTO & AUTENTICAÇÃO                    │
├───────────────────────────────────────────────────────────────────┤
│  • Detecta domínio (imobiliaria-abc.com)                          │
│  • Busca no banco central qual tenant                             │
│  • Valida credenciais do usuário                                  │
│  • Determina qual banco do tenant usar                            │
└───────────────────────────────┬───────────────────────────────────┘
                                │
                    ┌───────────┴────────────┐
                    │                        │
                    ▼                        ▼
    ┌──────────────────────────┐  ┌──────────────────────────┐
    │   BANCO CENTRAL          │  │   BANCO DO TENANT        │
    │   (Compartilhado)        │  │   (tenant_abc_db)        │
    ├──────────────────────────┤  ├──────────────────────────┤
    │                          │  │                          │
    │ • users                  │  │ • properties             │
    │   - id                   │  │   - id                   │
    │   - email                │  │   - title                │
    │   - password_hash        │  │   - description          │
    │   - company_id ────────┐ │  │   - price                │
    │   - role                │ │  │   - created_at           │
    │                          │ │  │                          │
    │ • companies              │ │  │ • clients                │
    │   - id                   │ │  │   - name                 │
    │   - name                 │ │  │   - email                │
    │   - database_name ───────┼─┘  │   - phone                │
    │   - custom_domain        │    │                          │
    │   - plan_id              │    │ • visits                 │
    │                          │    │   - date                 │
    │ • subscription_plans     │    │   - property_id          │
    │   - id (Prime, K, K2)    │    │   - client_id            │
    │   - max_users            │    │                          │
    │   - max_properties       │    │ • store_settings         │
    │   - features             │    │   - logo_url             │
    │                          │    │   - colors               │
    │ • tenant_subscriptions   │    │   - contact_info         │
    │   - tenant_id            │    │                          │
    │   - plan_id              │    │ • whatsapp_messages      │
    │   - status               │    │                          │
    │                          │    │ • property_documents     │
    └──────────────────────────┘    └──────────────────────────┘
```

### Fluxo de Requisição

```
1. Usuario acessa https://imobiliaria-abc.com
   │
   ▼
2. Frontend envia requisição para API
   │
   ▼
3. API consulta BANCO CENTRAL
   │
   ├─> SELECT * FROM companies WHERE custom_domain = 'imobiliaria-abc.com'
   │   Resultado: { id: 'uuid-abc', database_name: 'tenant_abc_db' }
   │
   ▼
4. API valida autenticação no BANCO CENTRAL
   │
   ├─> SELECT * FROM users WHERE email = '...' AND company_id = 'uuid-abc'
   │
   ▼
5. API conecta ao BANCO DO TENANT (tenant_abc_db)
   │
   ├─> SELECT * FROM properties
   │
   ▼
6. API retorna dados filtrados para o frontend
```

---

## 💰 Planos de Assinatura

### Tabela Comparativa

| Característica | Prime | K | K2 |
|----------------|-------|---|----|
| **Preço Mensal** | R$ 247 | R$ 397 | R$ 597 |
| **Preço Anual** | R$ 2.964 | R$ 4.764 | R$ 7.164 |
| **Usuários Inclusos** | 2 | 5 | 12 |
| **Usuário Adicional** | R$ 57/mês | R$ 37/mês | R$ 27/mês |
| **Limite de Imóveis** | 100 | 500 | Ilimitado |
| **Taxa de Ativação** | R$ 197 | R$ 197 | Grátis |
| **Treinamentos** | Pago (R$ 999) | 1 gratuito | 2 gratuitos |
| **App Mobile** | ✅ | ✅ | ✅ |
| **Landing Page** | ✅ | ✅ | ✅ |
| **Gestão de Atendimentos** | ✅ | ✅ | ✅ |
| **Transferência de Leads** | ❌ | ✅ | ✅ |
| **Blog Institucional** | ❌ | ✅ | ✅ |
| **Suporte VIP** | ❌ | ✅ | ✅ |
| **Customer Success** | ❌ | ❌ | ✅ |
| **API de Imóveis** | ❌ | ✅ | ✅ |
| **Portal do Corretor** | ❌ | ✅ | ✅ |

### Estrutura no Banco de Dados

#### subscription_plans
```sql
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE, -- 'prime', 'k', 'k2'
  display_name VARCHAR(100) NOT NULL, -- 'Prime', 'K', 'K2'
  price_monthly DECIMAL(10, 2) NOT NULL,
  price_yearly DECIMAL(10, 2),
  max_users INTEGER NOT NULL,
  max_properties INTEGER, -- NULL = ilimitado
  additional_user_price DECIMAL(10, 2) NOT NULL,
  activation_fee DECIMAL(10, 2) DEFAULT 0,
  features JSONB NOT NULL DEFAULT '{}'
);
```

#### tenant_subscriptions
```sql
CREATE TABLE tenant_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES companies(id),
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  status VARCHAR(50) DEFAULT 'active', -- active, suspended, cancelled
  started_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  current_users INTEGER DEFAULT 0,
  current_properties INTEGER DEFAULT 0,
  additional_users INTEGER DEFAULT 0
);
```

---

## 🔄 Fluxo de Dados

### 1. Criação de Nova Imobiliária (Tenant)

```
┌────────────────────────────────────────────────────────────────┐
│ 1. Cliente se cadastra no sistema                              │
└────────────────┬───────────────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────────────┐
│ 2. Sistema cria registro no BANCO CENTRAL                      │
│    INSERT INTO companies (name, email, database_name)          │
│    VALUES ('Imobiliária ABC', 'contato@abc.com', 'tenant_abc') │
└────────────────┬───────────────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────────────┐
│ 3. Sistema provisiona novo banco de dados                      │
│    CREATE DATABASE tenant_abc_db                               │
└────────────────┬───────────────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────────────┐
│ 4. Sistema executa migrations no novo banco                    │
│    - Cria tabelas: properties, clients, visits, etc.           │
│    - Insere dados iniciais (configurações padrão)              │
└────────────────┬───────────────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────────────┐
│ 5. Sistema cria usuário admin no BANCO CENTRAL                 │
│    INSERT INTO users (email, company_id, role)                 │
│    VALUES ('admin@abc.com', 'uuid-abc', 'admin')               │
└────────────────┬───────────────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────────────┐
│ 6. Sistema atribui plano padrão                                │
│    INSERT INTO tenant_subscriptions (tenant_id, plan_id)       │
│    VALUES ('uuid-abc', 'prime-plan-id')                        │
└────────────────┬───────────────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────────────┐
│ 7. Cliente pronto para usar o sistema! 🎉                      │
│    URL: https://imobiliaria-abc.com                            │
└────────────────────────────────────────────────────────────────┘
```

### 2. Usuário Cadastra um Imóvel

```
Frontend                  API                  Banco Central         Banco Tenant
   │                       │                         │                    │
   │  POST /properties     │                         │                    │
   ├──────────────────────>│                         │                    │
   │  { title: "Casa" }    │                         │                    │
   │                       │  1. Valida Token        │                    │
   │                       ├────────────────────────>│                    │
   │                       │  JWT contém user_id     │                    │
   │                       │                         │                    │
   │                       │<────────────────────────┤                    │
   │                       │  { user, company_id }   │                    │
   │                       │                         │                    │
   │                       │  2. Busca company info  │                    │
   │                       ├────────────────────────>│                    │
   │                       │  WHERE id = company_id  │                    │
   │                       │                         │                    │
   │                       │<────────────────────────┤                    │
   │                       │  { database_name: 'tenant_abc_db' }         │
   │                       │                         │                    │
   │                       │  3. Verifica limites    │                    │
   │                       ├────────────────────────>│                    │
   │                       │  get_tenant_limits()    │                    │
   │                       │                         │                    │
   │                       │<────────────────────────┤                    │
   │                       │  { current: 45, max: 100 } ✅               │
   │                       │                         │                    │
   │                       │  4. Conecta ao banco tenant                  │
   │                       ├─────────────────────────────────────────────>│
   │                       │  INSERT INTO properties                      │
   │                       │  (title, description, ...)                   │
   │                       │                         │                    │
   │                       │<─────────────────────────────────────────────┤
   │                       │  { id: 'new-property-id' }                   │
   │                       │                         │                    │
   │<──────────────────────┤                         │                    │
   │  { success: true }    │                         │                    │
```

### 3. Listagem de Imóveis

```
Frontend                  API                  Banco Central         Banco Tenant
   │                       │                         │                    │
   │  GET /properties      │                         │                    │
   ├──────────────────────>│                         │                    │
   │  ?page=1&limit=10     │                         │                    │
   │                       │  1. Extrai tenant_id    │                    │
   │                       │     do JWT/session      │                    │
   │                       │                         │                    │
   │                       │  2. Busca database_name │                    │
   │                       ├────────────────────────>│                    │
   │                       │                         │                    │
   │                       │<────────────────────────┤                    │
   │                       │  { database_name }      │                    │
   │                       │                         │                    │
   │                       │  3. Query no banco tenant                    │
   │                       ├─────────────────────────────────────────────>│
   │                       │  SELECT * FROM properties                    │
   │                       │  ORDER BY created_at DESC                    │
   │                       │  LIMIT 10 OFFSET 0                          │
   │                       │                         │                    │
   │                       │<─────────────────────────────────────────────┤
   │                       │  [{ id, title, ... }, ...]                   │
   │                       │                         │                    │
   │<──────────────────────┤                         │                    │
   │  { properties: [...] }│                         │                    │
```

---

## 🔒 Isolamento de Dados

### Camadas de Segurança

#### Nível 1: Autenticação
```javascript
// Middleware verifica JWT token
if (!validToken) {
  return res.status(401).json({ error: 'Unauthorized' });
}
```

#### Nível 2: Identificação do Tenant
```javascript
// Extrai company_id do usuário autenticado
const tenantId = req.user.company_id;
const { database_name } = await getCentralDB()
  .from('companies')
  .select('database_name')
  .eq('id', tenantId)
  .single();
```

#### Nível 3: Conexão ao Banco Correto
```javascript
// Conecta ao banco específico do tenant
const tenantDB = getTenantConnection(database_name);
```

#### Nível 4: Queries Isoladas
```javascript
// Todas as queries são executadas no banco isolado
const properties = await tenantDB
  .from('properties')
  .select('*');
// ✅ Impossível acessar dados de outro tenant
```

### Garantias de Isolamento

1. **Impossível Cross-Tenant por Erro de Código**
   - Cada tenant usa um banco de dados físico diferente
   - Mesmo com bug, não há como acessar dados de outro tenant

2. **Backup e Restore Independentes**
   - Cada banco pode ser restaurado sem afetar outros
   - Políticas de retenção personalizadas por tenant

3. **Performance Isolada**
   - Query pesada de um tenant não afeta outros
   - Cada banco pode ter configurações otimizadas

4. **Compliance e Regulamentação**
   - Facilita LGPD/GDPR (dados isolados fisicamente)
   - Possível armazenar dados em regiões específicas

---

## ⚙️ Implementação Técnica

### Estrutura de Conexões

```javascript
// src/infrastructure/database/connectionManager.js

class DatabaseConnectionManager {
  constructor() {
    this.centralDB = null;
    this.tenantConnections = new Map(); // Cache de conexões
  }

  // Conexão ao banco central (única)
  getCentralConnection() {
    if (!this.centralDB) {
      this.centralDB = createClient(
        process.env.CENTRAL_DB_URL,
        process.env.CENTRAL_DB_KEY
      );
    }
    return this.centralDB;
  }

  // Conexão ao banco do tenant (múltiplas, cacheadas)
  async getTenantConnection(tenantId) {
    // Verifica cache
    if (this.tenantConnections.has(tenantId)) {
      return this.tenantConnections.get(tenantId);
    }

    // Busca configuração do tenant no banco central
    const { database_name, database_url, database_key } = 
      await this.getCentralConnection()
        .from('companies')
        .select('database_name, database_url, database_key')
        .eq('id', tenantId)
        .single();

    // Cria conexão
    const connection = createClient(database_url, database_key);
    
    // Armazena no cache
    this.tenantConnections.set(tenantId, connection);
    
    return connection;
  }

  // Limpa conexão (útil para testes ou reset)
  closeTenantConnection(tenantId) {
    this.tenantConnections.delete(tenantId);
  }
}

module.exports = new DatabaseConnectionManager();
```

### Middleware de Tenant

```javascript
// src/presentation/middleware/tenantMiddleware.js

const connectionManager = require('../../infrastructure/database/connectionManager');

async function tenantContextMiddleware(req, res, next) {
  try {
    // 1. Extrai tenant_id do usuário autenticado
    const tenantId = req.user?.company_id;
    
    if (!tenantId) {
      return res.status(403).json({ 
        error: 'Tenant context required' 
      });
    }

    // 2. Obtém conexão ao banco do tenant
    const tenantDB = await connectionManager.getTenantConnection(tenantId);
    
    // 3. Injeta no request para uso nos controllers
    req.tenantDB = tenantDB;
    req.tenantId = tenantId;
    
    next();
  } catch (error) {
    console.error('Tenant context error:', error);
    res.status(500).json({ error: 'Failed to load tenant context' });
  }
}
```

### Repository Pattern

```javascript
// src/infrastructure/repositories/SupabasePropertyRepository.js

class SupabasePropertyRepository {
  constructor(tenantDB) {
    this.db = tenantDB; // Banco específico do tenant
  }

  async findAll(filters = {}) {
    let query = this.db.from('properties').select('*');
    
    // Aplica filtros
    if (filters.type) {
      query = query.eq('type', filters.type);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data.map(row => this._mapToEntity(row));
  }

  async findById(id) {
    const { data, error } = await this.db
      .from('properties')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return this._mapToEntity(data);
  }

  async create(property) {
    const row = this._mapToRow(property);
    
    const { data, error } = await this.db
      .from('properties')
      .insert(row)
      .select()
      .single();
    
    if (error) throw error;
    return this._mapToEntity(data);
  }

  // ... outros métodos
}
```

### Controller com Tenant Context

```javascript
// src/presentation/controllers/PropertyController.js

class PropertyController {
  async list(req, res) {
    try {
      // tenantDB já foi injetado pelo middleware
      const repository = new SupabasePropertyRepository(req.tenantDB);
      
      const properties = await repository.findAll(req.query);
      
      res.json({
        success: true,
        data: properties
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}
```

---

## 🚀 Provisionamento de Novos Tenants

### Script de Provisionamento

```javascript
// scripts/provision-new-tenant.js

const { createClient } = require('@supabase/supabase-js');

async function provisionNewTenant(tenantData) {
  const {
    companyName,
    companyEmail,
    adminEmail,
    adminPassword,
    planName = 'prime'
  } = tenantData;

  console.log(`📦 Provisionando novo tenant: ${companyName}...`);

  // 1. Conecta ao banco central
  const centralDB = createClient(
    process.env.CENTRAL_DB_URL,
    process.env.CENTRAL_DB_KEY
  );

  // 2. Cria registro da empresa no banco central
  const { data: company, error: companyError } = await centralDB
    .from('companies')
    .insert({
      name: companyName,
      email: companyEmail,
      database_name: `tenant_${Date.now()}`,
      database_url: process.env.TENANT_DB_URL, // Supabase project URL
      database_key: process.env.TENANT_DB_KEY, // Gerado dinamicamente
      is_active: true
    })
    .select()
    .single();

  if (companyError) throw companyError;
  console.log(`✅ Empresa criada: ${company.id}`);

  // 3. Busca plano de assinatura
  const { data: plan } = await centralDB
    .from('subscription_plans')
    .select('*')
    .eq('name', planName)
    .single();

  // 4. Cria assinatura para o tenant
  await centralDB
    .from('tenant_subscriptions')
    .insert({
      tenant_id: company.id,
      plan_id: plan.id,
      status: 'active'
    });

  console.log(`✅ Plano ${plan.display_name} atribuído`);

  // 5. Provisiona banco de dados do tenant
  // Nota: No Supabase, isso seria feito criando um novo projeto
  // ou schema. Exemplo simplificado:
  const tenantDB = createClient(
    company.database_url,
    company.database_key
  );

  // 6. Executa migrations no banco do tenant
  await runTenantMigrations(tenantDB);
  console.log(`✅ Schema do tenant criado`);

  // 7. Cria usuário admin no banco central
  const { data: adminUser } = await centralDB
    .from('users')
    .insert({
      email: adminEmail,
      password_hash: await hashPassword(adminPassword),
      company_id: company.id,
      role: 'admin',
      active: true
    })
    .select()
    .single();

  console.log(`✅ Usuário admin criado: ${adminUser.email}`);

  // 8. Insere dados iniciais no banco do tenant
  await seedTenantData(tenantDB, company);
  console.log(`✅ Dados iniciais inseridos`);

  console.log(`\n🎉 Tenant provisionado com sucesso!`);
  console.log(`   Empresa: ${company.name}`);
  console.log(`   ID: ${company.id}`);
  console.log(`   Database: ${company.database_name}`);
  console.log(`   Plano: ${plan.display_name}`);
  console.log(`   Admin: ${adminUser.email}`);

  return {
    company,
    plan,
    adminUser
  };
}

async function runTenantMigrations(tenantDB) {
  // Executa schema do tenant
  const schema = `
    CREATE TABLE properties (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title VARCHAR(255) NOT NULL,
      description TEXT,
      price DECIMAL(10, 2),
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE clients (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255),
      phone VARCHAR(50),
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE visits (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      property_id UUID REFERENCES properties(id),
      client_id UUID REFERENCES clients(id),
      scheduled_date TIMESTAMP NOT NULL,
      status VARCHAR(50) DEFAULT 'scheduled',
      created_at TIMESTAMP DEFAULT NOW()
    );

    -- Outras tabelas...
  `;

  // Executa usando o Supabase SQL editor ou migrations API
  // Implementação depende da estrutura do seu Supabase
}

async function seedTenantData(tenantDB, company) {
  // Insere configurações padrão
  await tenantDB
    .from('store_settings')
    .insert({
      company_name: company.name,
      primary_color: '#004AAD',
      secondary_color: '#FFA500'
    });
}

// Uso:
// node scripts/provision-new-tenant.js

provisionNewTenant({
  companyName: 'Imobiliária ABC',
  companyEmail: 'contato@abc.com',
  adminEmail: 'admin@abc.com',
  adminPassword: 'senha-segura-123',
  planName: 'prime'
});
```

---

## 🔐 Segurança

### 1. Autenticação e Autorização

```javascript
// JWT contém informações do tenant
const token = jwt.sign({
  user_id: user.id,
  email: user.email,
  company_id: user.company_id, // ← Tenant ID
  role: user.role
}, JWT_SECRET);
```

### 2. Validação de Acesso ao Tenant

```javascript
// Middleware verifica se usuário pertence ao tenant
function verifyTenantAccess(req, res, next) {
  const requestedTenantId = req.params.tenantId || req.tenantId;
  const userTenantId = req.user.company_id;

  if (requestedTenantId !== userTenantId) {
    return res.status(403).json({
      error: 'Access denied: You cannot access this tenant'
    });
  }

  next();
}
```

### 3. Limites de Plano

```javascript
// Middleware verifica limites antes de criar recurso
async function checkPropertyLimit(req, res, next) {
  const limits = await getTenantLimits(req.tenantId);

  if (limits.max_properties && 
      limits.current_properties >= limits.max_properties) {
    return res.status(403).json({
      error: 'Property limit reached',
      current: limits.current_properties,
      max: limits.max_properties,
      message: 'Upgrade your plan to add more properties'
    });
  }

  next();
}
```

### 4. Auditoria

```javascript
// Registra todas as ações importantes
async function auditLog(tenantId, userId, action, details) {
  await centralDB
    .from('tenant_audit_log')
    .insert({
      tenant_id: tenantId,
      user_id: userId,
      action: action,
      entity_type: details.entityType,
      entity_id: details.entityId,
      changes: details.changes,
      ip_address: details.ip,
      user_agent: details.userAgent
    });
}

// Uso:
await auditLog(req.tenantId, req.user.id, 'property.create', {
  entityType: 'property',
  entityId: newProperty.id,
  changes: { created: true },
  ip: req.ip,
  userAgent: req.get('user-agent')
});
```

---

## 📈 Escalabilidade

### Estratégias de Crescimento

#### 1. Distribuição de Tenants

```
┌─────────────────────────────────────────────────────────────┐
│                   Database Server 1                          │
│  ├─ tenant_001_db (100 properties)                          │
│  ├─ tenant_002_db (500 properties)                          │
│  ├─ tenant_003_db (200 properties)                          │
│  └─ tenant_004_db (150 properties)                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   Database Server 2                          │
│  ├─ tenant_005_db (800 properties) ← Cliente grande         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   Database Server 3                          │
│  ├─ tenant_006_db (50 properties)                           │
│  ├─ tenant_007_db (300 properties)                          │
│  └─ tenant_008_db (400 properties)                          │
└─────────────────────────────────────────────────────────────┘
```

#### 2. Migração de Tenant para Servidor Dedicado

```javascript
// Script para migrar tenant grande para servidor dedicado
async function migrateTenantToDedicatedServer(tenantId, newServerConfig) {
  console.log(`🚚 Migrando tenant ${tenantId}...`);

  // 1. Backup do banco atual
  await backupTenantDatabase(tenantId);

  // 2. Cria banco no novo servidor
  const newDB = await provisionDatabaseOnServer(newServerConfig);

  // 3. Restaura backup no novo servidor
  await restoreTenantDatabase(tenantId, newDB);

  // 4. Atualiza configuração no banco central
  await centralDB
    .from('companies')
    .update({
      database_url: newServerConfig.url,
      database_key: newServerConfig.key
    })
    .eq('id', tenantId);

  // 5. Valida migração
  await validateMigration(tenantId, newDB);

  // 6. Remove banco antigo (após confirmação)
  await dropOldTenantDatabase(tenantId);

  console.log(`✅ Migração concluída!`);
}
```

#### 3. Load Balancing de Queries

```javascript
// Distribuir queries de leitura entre réplicas
class TenantDatabasePool {
  constructor(tenantId) {
    this.primary = getTenantConnection(tenantId, 'primary');
    this.replicas = [
      getTenantConnection(tenantId, 'replica-1'),
      getTenantConnection(tenantId, 'replica-2')
    ];
    this.replicaIndex = 0;
  }

  // Writes vão para o primário
  getWriteConnection() {
    return this.primary;
  }

  // Reads podem usar réplicas (round-robin)
  getReadConnection() {
    const replica = this.replicas[this.replicaIndex];
    this.replicaIndex = (this.replicaIndex + 1) % this.replicas.length;
    return replica;
  }
}
```

---

## 📝 Resumo

### ✅ Vantagens da Arquitetura

1. **Isolamento Total**: Dados completamente separados fisicamente
2. **Segurança**: Zero chance de vazamento entre tenants
3. **Performance**: Queries não competem entre tenants
4. **Escalabilidade**: Cada tenant pode crescer independentemente
5. **Flexibilidade**: Fácil migrar tenant grande para servidor dedicado
6. **Backup**: Políticas independentes por tenant
7. **Compliance**: Facilita LGPD/GDPR

### ⚠️ Considerações

1. **Complexidade**: Gerenciar múltiplas conexões
2. **Migrations**: Precisa executar em todos os bancos
3. **Custo**: Cada banco pode ter custo separado (depende do provider)
4. **Monitoring**: Precisa monitorar múltiplos bancos

### 🎯 Casos de Uso Ideais

- ✅ SaaS B2B com clientes grandes
- ✅ Requisitos rígidos de isolamento de dados
- ✅ Clientes em regiões geográficas diferentes
- ✅ Necessidade de backup/restore independente
- ✅ Compliance com regulamentações de privacidade

---

## 📚 Próximos Passos

1. ✅ Entender a arquitetura proposta
2. ⏳ Executar migration do banco central
3. ⏳ Implementar ConnectionManager
4. ⏳ Implementar script de provisionamento
5. ⏳ Atualizar repositories para usar tenantDB
6. ⏳ Testar criação de novo tenant
7. ⏳ Testar isolamento de dados
8. ⏳ Documentar processo de onboarding
9. ⏳ Configurar monitoring

---

**Versão:** 1.0.0  
**Data:** 2026-01-11  
**Autor:** CRM Imobiliário Team
