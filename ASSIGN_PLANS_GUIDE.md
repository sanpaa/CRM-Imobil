# 📋 Guia de Atribuição de Planos para Tenants Existentes

## 🎯 Objetivo

Este guia explica como atribuir planos de assinatura para empresas (tenants) que já existem no sistema mas ainda não possuem um plano ativo.

## 📌 Contexto

Quando o sistema foi migrado para arquitetura multi-tenant com planos de assinatura, algumas empresas já existiam no banco de dados mas não tinham planos atribuídos. Este script resolve esse problema automaticamente.

## 🚀 Como Usar

### Método Rápido (Recomendado)

```bash
npm run migrate:assign-plans
```

### Método Alternativo

```bash
node scripts/assign-plans-to-existing-tenants.js
```

## 📊 O que o Script Faz

1. **Verifica credenciais do Supabase**
   - Confirma que `SUPABASE_URL` e `SUPABASE_ANON_KEY` estão configurados
   - Falha com instruções claras se não estiverem

2. **Busca planos disponíveis**
   - Lista todos os planos ativos no sistema (Prime, K, K2)
   - Seleciona o plano padrão (Prime - plano de entrada)

3. **Identifica empresas sem plano**
   - Lista todas as empresas ativas
   - Verifica quais já têm assinaturas ativas
   - Identifica quais precisam de plano

4. **Atribui planos automaticamente**
   - Cria assinaturas com status "active" para o plano Prime
   - Atualiza assinaturas inativas existentes se houver

5. **Gera relatório detalhado**
   - Mostra quantas empresas foram processadas
   - Lista sucessos e erros
   - Fornece próximos passos

## 📋 Pré-requisitos

### 1. Variáveis de Ambiente

Certifique-se de ter o arquivo `.env` configurado:

```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-chave-anon-aqui
```

### 2. Migração Multi-Tenant

O script de migração multi-tenant deve ter sido executado primeiro:

```bash
# Execute este SQL no Supabase SQL Editor:
migration-multi-tenant.sql
```

Este SQL cria as tabelas necessárias:
- `subscription_plans` - Planos disponíveis (Prime, K, K2)
- `tenant_subscriptions` - Assinaturas dos tenants
- `companies` - Empresas/Tenants

## 📈 Estratégia de Atribuição

### Plano Padrão: Prime

Todas as empresas sem plano receberão o plano **Prime** por padrão:

- **Preço**: R$ 247/mês
- **Usuários**: 2 inclusos
- **Imóveis**: 100 máximo
- **Recursos**: Básicos para começar
- **Justificativa**: Ponto de entrada acessível para todos

### Por que Prime?

1. **Menor Custo**: Não sobrecarrega empresas existentes
2. **Funcional**: Permite uso completo do sistema
3. **Upgrade Fácil**: Empresas podem fazer upgrade depois
4. **Migração Suave**: Mantém todas as empresas ativas

## 📊 Exemplo de Saída

```
======================================================================
Assign Subscription Plans to Existing Tenants
======================================================================

✓ Supabase URL: https://seu-projeto.supabase.co
✓ Supabase credentials found

======================================================================
Step 1: Fetching Available Plans
======================================================================

✓ Found 3 active subscription plans:
  - Prime (prime): R$ 247/mês
  - K (k): R$ 397/mês
  - K2 (k2): R$ 597/mês

✓ Default plan selected: Prime (prime)

======================================================================
Step 2: Fetching Companies (Tenants)
======================================================================

✓ Found 5 active companies:
  1. Imobiliária ABC (contato@abc.com)
  2. Imóveis XYZ (xyz@imoveis.com)
  3. Real Estate Master (master@realestate.com)
  4. Corretora Premium (premium@corretora.com)
  5. Tenant Padrão (admin@crm.local)

======================================================================
Step 3: Checking Existing Subscriptions
======================================================================

✓ 2 companies already have active subscriptions:
  - Imobiliária ABC: K
  - Imóveis XYZ: Prime

⚠️  Found 3 companies WITHOUT active subscriptions:
  1. Real Estate Master
  2. Corretora Premium
  3. Tenant Padrão

======================================================================
Step 4: Assigning Default Plans
======================================================================

Processing: Real Estate Master...
  → Creating new subscription with Prime plan...
  ✓ Successfully created subscription with Prime

Processing: Corretora Premium...
  → Creating new subscription with Prime plan...
  ✓ Successfully created subscription with Prime

Processing: Tenant Padrão...
  → Creating new subscription with Prime plan...
  ✓ Successfully created subscription with Prime

======================================================================
Migration Summary
======================================================================

📊 Results:
  • Total companies processed: 3
  • Successfully assigned: 3
  • Errors: 0
  • Companies already with subscriptions: 2

✅ Migration completed successfully!

3 companies now have active subscriptions with the Prime plan.

💡 Next steps:
  1. Verify subscriptions in the Supabase dashboard
  2. Users can upgrade their plans through the CRM interface
  3. Run: npm run verify to check system status
```

## 🔍 Verificação

### Verificar no Supabase Dashboard

1. Acesse seu projeto Supabase
2. Vá para **Table Editor**
3. Abra a tabela `tenant_subscriptions`
4. Verifique que todos os tenants têm registros com `status = 'active'`

### Verificar via API

```bash
# Get tenant subscription
curl http://localhost:3000/api/subscriptions/current \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Verificar limites do tenant

```bash
# Get tenant limits
curl http://localhost:3000/api/subscriptions/limits \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🔧 Troubleshooting

### Erro: "Supabase credentials not found"

**Solução**: Configure as variáveis de ambiente no arquivo `.env`

```bash
cp .env.example .env
# Edite .env e adicione suas credenciais do Supabase
```

### Erro: "No active subscription plans found"

**Solução**: Execute primeiro a migração multi-tenant

```bash
# No Supabase SQL Editor, execute:
migration-multi-tenant.sql
```

### Erro: "Failed to create subscription"

**Possíveis causas**:
1. **Permissões RLS**: Verifique políticas Row Level Security no Supabase
2. **Chave incorreta**: Confirme que está usando a chave correta (anon ou service_role)
3. **Constraints**: Pode haver duplicatas ou violações de chave única

**Solução**: Verifique os logs de erro detalhados e ajuste as políticas RLS se necessário.

### Script não encontra empresas

**Solução**: Verifique se há empresas na tabela `companies`

```sql
-- Execute no Supabase SQL Editor:
SELECT id, name, email, is_active FROM companies;
```

## 🔄 Executar Novamente

O script é **idempotente** - pode ser executado múltiplas vezes com segurança:

- Empresas que já têm planos ativos são ignoradas
- Apenas empresas sem planos são processadas
- Não duplica assinaturas

```bash
# Seguro executar novamente
npm run migrate:assign-plans
```

## 📝 Estrutura das Tabelas

### subscription_plans

```
id              | UUID (PK)
name            | VARCHAR - 'prime', 'k', 'k2'
display_name    | VARCHAR - Nome apresentável
price_monthly   | DECIMAL - Preço mensal
max_users       | INTEGER - Usuários inclusos
features        | JSONB - Recursos do plano
```

### tenant_subscriptions

```
id              | UUID (PK)
tenant_id       | UUID (FK -> companies)
plan_id         | UUID (FK -> subscription_plans)
status          | VARCHAR - 'active', 'suspended', 'cancelled'
started_at      | TIMESTAMP
current_users   | INTEGER
current_properties | INTEGER
```

### companies

```
id              | UUID (PK)
name            | VARCHAR - Nome da empresa
email           | VARCHAR - Email de contato
is_active       | BOOLEAN - Status da empresa
```

## 🎯 Próximos Passos

Após executar o script com sucesso:

1. **Verificar Assinaturas**
   ```bash
   npm run verify
   ```

2. **Testar API de Assinaturas**
   - GET `/api/subscriptions/plans` - Ver planos disponíveis
   - GET `/api/subscriptions/current` - Ver assinatura atual
   - GET `/api/subscriptions/limits` - Ver limites do tenant

3. **Comunicar Usuários**
   - Informar que todos têm plano Prime
   - Explicar como fazer upgrade para planos K ou K2
   - Compartilhar benefícios dos planos superiores

4. **Monitorar Uso**
   - Acompanhar uso de recursos por tenant
   - Identificar tenants próximos dos limites
   - Sugerir upgrades quando apropriado

## 💡 Dicas

### Upgrade de Planos

Usuários podem fazer upgrade via API:

```bash
# Upgrade para plano K
curl -X PUT http://localhost:3000/api/subscriptions/change-plan \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"planId": "UUID_DO_PLANO_K"}'
```

### Atribuir Plano Específico

Para atribuir um plano diferente do Prime, edite o script:

```javascript
// Linha ~93, altere:
const defaultPlan = plans.find(p => p.name === 'k') || plans[0];
```

### Testar em Desenvolvimento

```bash
# Use banco de desenvolvimento
# Configure .env.development
npm run migrate:assign-plans
```

## 📞 Suporte

Para dúvidas ou problemas:

- 📧 Email: suporte@crmimobiliario.com.br
- 💬 WhatsApp: (35) 99738-3030
- 📚 Documentação: `/docs`

## 🎉 Conclusão

O script de atribuição de planos:

✅ **Automatiza** a atribuição de planos para tenants existentes
✅ **Garante** que todas as empresas tenham assinatura ativa
✅ **Mantém** histórico e auditoria
✅ **Permite** execução múltipla segura
✅ **Fornece** feedback detalhado do processo

**Versão**: 1.0.0  
**Data**: Janeiro 2026  
**Autor**: CRM Imobiliário Team
