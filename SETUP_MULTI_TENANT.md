# 🚀 Guia de Configuração - Arquitetura Multi-Tenant

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Configuração do Banco Central](#configuração-do-banco-central)
3. [Provisionamento do Primeiro Tenant](#provisionamento-do-primeiro-tenant)
4. [Configuração do Backend](#configuração-do-backend)
5. [Configuração do Frontend](#configuração-do-frontend)
6. [Testes](#testes)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Pré-requisitos

### Software Necessário

- ✅ Node.js 16+ e npm
- ✅ PostgreSQL 14+ (ou conta Supabase)
- ✅ Git
- ✅ Editor de código (VS Code recomendado)

### Contas e Serviços

- ✅ Conta no Supabase (gratuita ou paga)
- ✅ 2 projetos Supabase:
  - 1 para o banco **central**
  - 1 para o banco **template de tenants**

### Conhecimentos Recomendados

- Node.js e Express
- PostgreSQL e SQL
- Angular (para frontend)
- Conceitos de multi-tenancy

---

## 🗄️ Configuração do Banco Central

### Passo 1: Criar Projeto Central no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Clique em "New Project"
3. Configure:
   - **Name**: CRM-Imobil-Central
   - **Database Password**: [senha segura]
   - **Region**: South America (São Paulo) - mais próximo do Brasil
4. Aguarde a criação (2-3 minutos)

### Passo 2: Obter Credenciais do Banco Central

1. No painel do Supabase, vá em **Settings** → **API**
2. Copie:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: `eyJhbGciOi...`
3. Salve essas informações

### Passo 3: Executar Migration do Banco Central

1. No painel do Supabase, vá em **SQL Editor**
2. Clique em **New Query**
3. Cole o conteúdo do arquivo `migration-central-database.sql`
4. Clique em **Run**
5. Aguarde a execução (pode levar 30-60 segundos)

### Passo 4: Verificar Tabelas Criadas

Execute no SQL Editor:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

Você deve ver:
- ✅ companies
- ✅ users
- ✅ subscription_plans
- ✅ tenant_subscriptions
- ✅ custom_domains
- ✅ tenant_audit_log

### Passo 5: Verificar Planos Criados

Execute no SQL Editor:

```sql
SELECT name, display_name, price_monthly, max_users, max_properties
FROM subscription_plans
ORDER BY price_monthly;
```

Você deve ver os 3 planos:
- ✅ Prime (R$ 247, 2 users, 100 properties)
- ✅ K (R$ 397, 5 users, 500 properties)
- ✅ K2 (R$ 597, 12 users, unlimited properties)

---

## 🏢 Configuração de Projeto Template para Tenants

### Passo 1: Criar Projeto Template no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Clique em "New Project"
3. Configure:
   - **Name**: CRM-Imobil-Tenant-Template
   - **Database Password**: [senha segura]
   - **Region**: South America (São Paulo)
4. Aguarde a criação

### Passo 2: Obter Credenciais do Tenant Template

1. No painel do Supabase, vá em **Settings** → **API**
2. Copie:
   - **Project URL**: `https://yyyyy.supabase.co`
   - **anon/public key**: `eyJhbGciOi...`
3. Salve essas informações

### Passo 3: Executar Migration do Tenant

1. No painel do Supabase, vá em **SQL Editor**
2. Clique em **New Query**
3. Cole o conteúdo do arquivo `migration-tenant-database.sql`
4. Clique em **Run**
5. Aguarde a execução

### Passo 4: Verificar Tabelas do Tenant

Execute no SQL Editor:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

Você deve ver:
- ✅ properties
- ✅ clients
- ✅ visits
- ✅ store_settings
- ✅ website_layouts
- ✅ whatsapp_messages
- ✅ activity_log

---

## ⚙️ Provisionamento do Primeiro Tenant

### Passo 1: Configurar Variáveis de Ambiente

Crie ou edite o arquivo `.env` na raiz do projeto:

```env
# Banco Central
CENTRAL_DB_URL=https://xxxxx.supabase.co
CENTRAL_DB_KEY=eyJhbGciOi...

# Template de Tenant (usado para novos tenants)
TENANT_DB_URL=https://yyyyy.supabase.co
TENANT_DB_KEY=eyJhbGciOi...

# Configuração do Servidor
PORT=3000

# JWT Secret (gere uma chave segura)
JWT_SECRET=sua-chave-secreta-super-segura-aqui
```

💡 **Dica**: Gere uma chave JWT segura com:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Passo 2: Instalar Dependências

```bash
npm install
```

### Passo 3: Provisionar Primeiro Tenant

Execute o script de provisionamento:

```bash
node scripts/provision-tenant.js \
  --name "Imobiliária Demo" \
  --email "contato@demo.com" \
  --admin-email "admin@demo.com" \
  --admin-password "SenhaSegura123!" \
  --plan "k" \
  --custom-domain "demo.imobiliaria.com"
```

Você verá output similar a:

```
╔════════════════════════════════════════════════════════════╗
║   CRM Imobiliário - Tenant Provisioning                   ║
╚════════════════════════════════════════════════════════════╝

📋 Configuration:
   Company: Imobiliária Demo
   Email: contato@demo.com
   Admin: admin@demo.com
   Plan: k

🔌 Step 1: Connecting to central database...
   ✓ Connected

🔍 Step 2: Checking for existing company...
   ✓ No conflicts found

... [mais logs]

╔════════════════════════════════════════════════════════════╗
║   ✅ TENANT PROVISIONED SUCCESSFULLY!                      ║
╚════════════════════════════════════════════════════════════╝

📊 Summary:
─────────────────────────────────────────────────────────────
Company ID:       [uuid]
Company Name:     Imobiliária Demo
Database:         tenant_imobiliaria_demo_[timestamp]
Plan:             K (R$ 397/mês)
Max Users:        5
Max Properties:   500
─────────────────────────────────────────────────────────────
Admin Email:      admin@demo.com
Admin Password:   SenhaSegura123!
─────────────────────────────────────────────────────────────
Domain:           demo.imobiliaria.com (pending verification)
─────────────────────────────────────────────────────────────
```

### Passo 4: Verificar Tenant no Banco Central

Execute no SQL Editor do banco central:

```sql
-- Ver companies
SELECT id, name, email, database_name, is_active
FROM companies;

-- Ver subscriptions
SELECT ts.*, sp.display_name, sp.price_monthly
FROM tenant_subscriptions ts
JOIN subscription_plans sp ON ts.plan_id = sp.id;

-- Ver users
SELECT u.email, u.role, c.name as company_name
FROM users u
JOIN companies c ON u.company_id = c.id;
```

---

## 🔧 Configuração do Backend

### Passo 1: Criar Connection Manager

O arquivo já foi criado, verifique em: `src/infrastructure/database/connectionManager.js`

Este gerenciador:
- Mantém conexão única com banco central
- Cria e cacheia conexões com bancos de tenants
- Roteia queries para o banco correto

### Passo 2: Atualizar Middleware

O middleware de tenant já existe em: `src/presentation/middleware/tenantMiddleware.js`

Ele:
- Extrai `company_id` do JWT
- Busca configuração do tenant no banco central
- Injeta conexão do banco do tenant no request

### Passo 3: Atualizar Repositories

Os repositories precisam aceitar a conexão do tenant:

**Antes:**
```javascript
class SupabasePropertyRepository {
  constructor() {
    this.db = require('../../database/supabase');
  }
}
```

**Depois:**
```javascript
class SupabasePropertyRepository {
  constructor(tenantDB = null) {
    this.db = tenantDB || require('../../database/supabase');
  }
}
```

### Passo 4: Atualizar Controllers

Controllers devem usar a conexão injetada:

```javascript
async list(req, res) {
  try {
    // Usa conexão do tenant injetada pelo middleware
    const repository = new SupabasePropertyRepository(req.tenantDB);
    const properties = await repository.findAll();
    
    res.json({ success: true, data: properties });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
```

### Passo 5: Atualizar Routes

Aplique o middleware nas rotas protegidas:

```javascript
const { tenantMiddleware, requireTenant } = require('../middleware/tenantMiddleware');

// Aplicar em rotas de tenant
router.use('/api/properties', tenantMiddleware, requireTenant);
router.use('/api/clients', tenantMiddleware, requireTenant);
router.use('/api/visits', tenantMiddleware, requireTenant);
```

---

## 🎨 Configuração do Frontend

### Passo 1: Atualizar Serviço de Autenticação

O serviço deve armazenar `company_id` do JWT:

```typescript
// auth.service.ts
login(email: string, password: string) {
  return this.http.post('/api/auth/login', { email, password })
    .pipe(
      tap((response: any) => {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        localStorage.setItem('company_id', response.user.company_id);
      })
    );
}
```

### Passo 2: Adicionar Interceptor de Tenant

Crie um interceptor que adiciona `company_id` nos headers:

```typescript
// tenant.interceptor.ts
export class TenantInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler) {
    const companyId = localStorage.getItem('company_id');
    
    if (companyId) {
      req = req.clone({
        setHeaders: {
          'X-Tenant-ID': companyId
        }
      });
    }
    
    return next.handle(req);
  }
}
```

### Passo 3: Registrar Interceptor

```typescript
// app.module.ts
providers: [
  {
    provide: HTTP_INTERCEPTORS,
    useClass: TenantInterceptor,
    multi: true
  }
]
```

---

## 🧪 Testes

### Teste 1: Autenticação

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@demo.com",
    "password": "SenhaSegura123!"
  }'
```

Deve retornar:
```json
{
  "success": true,
  "token": "eyJhbGciOi...",
  "user": {
    "id": "...",
    "email": "admin@demo.com",
    "company_id": "...",
    "role": "admin"
  }
}
```

### Teste 2: Criar Imóvel

```bash
TOKEN="[token do teste anterior]"

curl -X POST http://localhost:3000/api/properties \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Casa Teste",
    "description": "Casa para teste do sistema",
    "type": "casa",
    "category": "venda",
    "price": 500000
  }'
```

### Teste 3: Listar Imóveis

```bash
curl -X GET http://localhost:3000/api/properties \
  -H "Authorization: Bearer $TOKEN"
```

### Teste 4: Isolamento de Tenants

1. Crie um segundo tenant:
```bash
node scripts/provision-tenant.js \
  --name "Imobiliária Teste 2" \
  --email "contato@teste2.com" \
  --admin-email "admin@teste2.com" \
  --plan "prime"
```

2. Faça login com admin do tenant 2
3. Crie um imóvel no tenant 2
4. Verifique que o tenant 1 NÃO vê o imóvel do tenant 2

---

## 🐛 Troubleshooting

### Erro: "Database not configured"

**Causa**: Variáveis de ambiente não configuradas

**Solução**:
```bash
# Verifique o arquivo .env
cat .env

# Deve conter CENTRAL_DB_URL, CENTRAL_DB_KEY, etc.
```

### Erro: "Tenant context required"

**Causa**: Middleware não está injetando tenant_id

**Solução**:
1. Verifique se o token JWT contém `company_id`
2. Verifique se middleware está aplicado na rota
3. Verifique logs do servidor

### Erro: "Property limit reached"

**Causa**: Tenant atingiu limite do plano

**Solução**:
```sql
-- Verificar limites atuais
SELECT * FROM get_tenant_limits('[tenant_id]');

-- Fazer upgrade de plano ou remover imóveis antigos
```

### Erro: "User limit reached"

**Causa**: Tenant atingiu limite de usuários

**Solução**:
```sql
-- Adicionar usuários extras
UPDATE tenant_subscriptions
SET additional_users = additional_users + 1
WHERE tenant_id = '[tenant_id]' AND status = 'active';
```

### Queries Lentas

**Causa**: Índices não criados corretamente

**Solução**:
```sql
-- Verificar índices
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename IN ('properties', 'clients', 'visits');

-- Recriar índices se necessário
```

---

## 📚 Próximos Passos

Após completar a configuração:

1. ✅ **Teste completo do sistema**
   - Criar, editar, deletar imóveis
   - Gerenciar clientes
   - Agendar visitas

2. ✅ **Configure domínios customizados**
   - DNS
   - SSL
   - Verificação

3. ✅ **Implemente monitoring**
   - Logs
   - Métricas
   - Alertas

4. ✅ **Documente processos**
   - Onboarding de clientes
   - Suporte
   - Billing

5. ✅ **Prepare para produção**
   - Backups automáticos
   - Disaster recovery
   - Scaling strategy

---

## 📞 Suporte

Dúvidas ou problemas?

- 📧 Email: suporte@crmimobiliario.com.br
- 💬 WhatsApp: (35) 99738-3030
- 📚 Documentação: Veja `ARQUITETURA_MULTI_TENANT.md`

---

**Versão:** 1.0.0  
**Data:** 2026-01-11  
**Autor:** CRM Imobiliário Team
