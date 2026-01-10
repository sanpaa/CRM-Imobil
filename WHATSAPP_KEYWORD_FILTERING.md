# WhatsApp Message Filtering - Real Estate Keywords

## Visão Geral

Este sistema filtra automaticamente mensagens recebidas no WhatsApp, identificando apenas aquelas relacionadas a imóveis e leads qualificados. Mensagens de grupos são excluídas automaticamente.

## Funcionalidades

✅ **Captura automática** de todas as mensagens RECEBIDAS no WhatsApp  
✅ **Filtra mensagens de grupos** (considera apenas mensagens de pessoas físicas)  
✅ **Identifica palavras-chave** relacionadas a imóveis  
✅ **Retorna informações completas**: remetente, nome do contato, conteúdo, data e hora  
✅ **Criação automática de leads** apenas para mensagens com palavras-chave relevantes

## Palavras-Chave Monitoradas

O sistema identifica mensagens contendo qualquer uma das seguintes palavras-chave:

| Categoria | Palavras-Chave |
|-----------|----------------|
| **Imóvel** | imóvel, imovel |
| **Interesse** | interessado, interessada |
| **Preço** | preço, preco, valor, orçamento, orcamento |
| **Ação** | visita, aluguel, alugar, compra, comprar, vender, venda |
| **Mídia** | fotos, foto |
| **Disponibilidade** | disponível, disponivel |
| **Tipos de Imóvel** | apartamento, apto, ap, casa, condomínio, condominio |
| **Condições** | condições, condicoes |

## API Endpoint

### GET `/api/whatsapp/filtered-messages`

Retorna apenas mensagens que contêm palavras-chave relacionadas a imóveis.

**Autenticação**: Requer token JWT (Bearer Token)

**Query Parameters**:
- `limit` (opcional): Número de mensagens a retornar (padrão: 50, máximo: 100)
- `offset` (opcional): Offset para paginação (padrão: 0)

**Exemplo de Request**:
```bash
curl -X GET "http://localhost:3000/api/whatsapp/filtered-messages?limit=10&offset=0" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Exemplo de Response**:
```json
{
  "data": [
    {
      "remetente": "5511999999999",
      "nome_contato": "João Silva",
      "conteudo": "Olá, estou interessado no apartamento que você anunciou",
      "data_hora": "2024-01-15T14:30:00.000Z",
      "id": "uuid-do-registro"
    },
    {
      "remetente": "5511988888888",
      "nome_contato": "Maria Santos",
      "conteudo": "Qual o valor do aluguel?",
      "data_hora": "2024-01-15T13:45:00.000Z",
      "id": "uuid-do-registro-2"
    }
  ],
  "limit": 10,
  "offset": 0,
  "total": 2
}
```

**Campos Retornados**:
- `remetente`: Número de telefone do remetente (sem formatação)
- `nome_contato`: Nome do contato no WhatsApp
- `conteudo`: Texto completo da mensagem
- `data_hora`: Data e hora da mensagem (ISO 8601)
- `id`: ID único do registro no banco de dados

## Configuração do Banco de Dados

### Migração Necessária

Execute o seguinte SQL no seu Supabase dashboard:

```sql
-- Adiciona coluna has_keywords à tabela whatsapp_messages
ALTER TABLE whatsapp_messages 
ADD COLUMN IF NOT EXISTS has_keywords BOOLEAN DEFAULT false;

-- Cria índice para otimizar queries de filtragem
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_keywords 
ON whatsapp_messages(company_id, has_keywords, is_group, is_from_me);

-- Atualiza mensagens existentes (opcional - apenas se já tiver dados)
UPDATE whatsapp_messages
SET has_keywords = (
    LOWER(body) ~ 'imóvel|imovel|interessado|interessada|preço|preco|visita|aluguel|alugar|compra|comprar|vender|venda|fotos|foto|disponível|disponivel|valor|orçamento|orcamento|apartamento|apto|ap|casa|condomínio|condominio|condições|condicoes'
)
WHERE body IS NOT NULL;
```

O arquivo completo da migração está em: `migration-whatsapp-keywords.sql`

## Como Funciona

### 1. Recebimento de Mensagem

Quando uma mensagem é recebida no WhatsApp:

1. ✅ Sistema verifica se **NÃO** é mensagem de grupo (`isGroup = false`)
2. ✅ Sistema verifica se **NÃO** é mensagem enviada pelo próprio usuário (`fromMe = false`)
3. ✅ Sistema analisa o conteúdo em busca de **palavras-chave**
4. ✅ Mensagem é salva no banco com flag `has_keywords = true/false`

### 2. Filtragem

- Mensagens **COM** palavras-chave: `has_keywords = true`
  - ✅ Salva no banco de dados
  - ✅ Cria lead automaticamente (se número não existir)
  - ✅ Fica disponível no endpoint `/filtered-messages`

- Mensagens **SEM** palavras-chave: `has_keywords = false`
  - ✅ Salva no banco de dados (para histórico completo)
  - ❌ NÃO cria lead automaticamente
  - ❌ NÃO aparece no endpoint `/filtered-messages`

### 3. Criação Automática de Leads

**Importante**: Leads são criados APENAS para mensagens com palavras-chave relevantes.

Quando uma mensagem relevante é recebida de um número desconhecido:
- ✅ Sistema verifica se já existe cliente com aquele telefone
- ✅ Se não existir, cria novo cliente automaticamente
- ✅ Cliente é registrado na tabela `whatsapp_auto_clients`
- ✅ Cliente fica vinculado à empresa (company_id)

## Testando o Filtro

Execute o script de teste para validar a lógica de filtragem:

```bash
node test-whatsapp-keyword-filter.js
```

Este script testa 21 cenários diferentes, incluindo:
- ✅ Mensagens com palavras-chave (devem ser filtradas)
- ✅ Mensagens sem palavras-chave (não devem ser filtradas)
- ✅ Variações com e sem acentos
- ✅ Abreviações (apto, ap)

## Exemplos de Uso

### Cenário 1: Cliente Interessado em Imóvel
```
Mensagem recebida: "Olá, estou interessado no apartamento"
✅ Filtrada: SIM
✅ Lead criado: SIM (se número novo)
✅ Disponível em /filtered-messages: SIM
```

### Cenário 2: Conversa Genérica
```
Mensagem recebida: "Olá, tudo bem? Como vai?"
❌ Filtrada: NÃO
❌ Lead criado: NÃO
❌ Disponível em /filtered-messages: NÃO
```

### Cenário 3: Mensagem de Grupo
```
Mensagem recebida: "Quero comprar uma casa" (em grupo)
❌ Processada: NÃO (grupos são ignorados)
❌ Lead criado: NÃO
❌ Disponível em /filtered-messages: NÃO
```

## Consultas Úteis

### Ver todas as mensagens filtradas

```sql
SELECT 
    from_number as remetente,
    contact_name as nome,
    body as mensagem,
    timestamp as data_hora
FROM whatsapp_messages
WHERE has_keywords = true
  AND is_group = false
  AND is_from_me = false
ORDER BY timestamp DESC;
```

### Contar mensagens relevantes por dia

```sql
SELECT 
    DATE(timestamp) as dia,
    COUNT(*) as total_mensagens_relevantes
FROM whatsapp_messages
WHERE has_keywords = true
  AND is_group = false
  AND is_from_me = false
GROUP BY DATE(timestamp)
ORDER BY dia DESC;
```

### Ver leads criados automaticamente

```sql
SELECT 
    c.name as nome_cliente,
    c.phone as telefone,
    wac.created_at as data_criacao,
    COUNT(wm.id) as total_mensagens
FROM whatsapp_auto_clients wac
JOIN clients c ON wac.client_id = c.id
LEFT JOIN whatsapp_messages wm ON wm.from_number = wac.phone_number
GROUP BY c.id, c.name, c.phone, wac.created_at
ORDER BY wac.created_at DESC;
```

## Logs e Monitoramento

O sistema registra logs detalhados no console:

```
[WhatsAppService] 📨 NOVA MENSAGEM RECEBIDA
[WhatsAppService] Company ID: uuid-da-empresa
[WhatsAppService] Is Group: false
[WhatsAppService] From Me: false
[WhatsAppService] 🔍 Contém palavras-chave imobiliárias: ✅ SIM
[WhatsAppService] ✅ Mensagem salva com sucesso!
[WhatsAppService] 🔍 Verificando se cliente já existe...
[WhatsAppService] 🆕 Cliente NÃO existe. Criando novo...
[WhatsAppService] ✅ Cliente criado com ID: uuid-do-cliente
```

## Segurança

- ✅ Todas as rotas requerem autenticação JWT
- ✅ Usuários só acessam dados da própria empresa
- ✅ Números de telefone são armazenados sem formatação
- ✅ Mensagens não são processadas em grupos

## Próximos Passos (Opcional)

Melhorias futuras que podem ser implementadas:

1. **Webhook em tempo real** para notificações
2. **Resposta automática** para mensagens com palavras-chave
3. **Score de qualificação** baseado nas palavras-chave encontradas
4. **Dashboard** com métricas de mensagens filtradas
5. **IA para análise de sentimento** e intenção de compra

## Suporte

Para problemas ou dúvidas:
1. Verifique os logs do servidor
2. Execute o script de teste: `node test-whatsapp-keyword-filter.js`
3. Consulte a documentação completa em `WHATSAPP_README.md`
4. Verifique se a migração do banco foi executada

## Arquivos Relacionados

- `/src/application/services/WhatsAppService.js` - Lógica de negócio
- `/src/infrastructure/repositories/SupabaseWhatsappMessageRepository.js` - Acesso ao banco
- `/src/presentation/routes/whatsappRoutes.js` - Rotas HTTP
- `/migration-whatsapp-keywords.sql` - Migração do banco
- `/test-whatsapp-keyword-filter.js` - Testes automatizados
