# 🚨 Solução: Erro "Bucket not found" no Upload de Imagens

## Problema

Você está recebendo o seguinte erro ao tentar fazer upload de imagens:

```
Upload failed for ri6x2hldkz5kouwysd6c.webp: Bucket not found
Upload failed for casa-com-4-dormitorios-a-venda-190-m-por-r-1-090-000-00-vila-medeiros-sao-paulo-sp1699385187312ijyvv.jpg: Bucket not found
Upload failed for ksusqe2ntmxnge3othjyzm0_sm.jpg: Bucket not found
```

## Causa

O bucket de armazenamento `property-images` não existe no Supabase Storage. Você criou as tabelas do banco de dados, mas não criou o bucket para armazenar as imagens.

## Solução Rápida (3 Passos)

### 1️⃣ Verificar o Status Atual

Execute no terminal:

```bash
npm run storage:setup
```

Este comando irá verificar se o bucket existe e fornecer instruções específicas.

### 2️⃣ Criar o Bucket Manualmente

**Método Recomendado:**

1. Acesse o dashboard do Supabase: https://supabase.com/dashboard
2. Selecione seu projeto
3. No menu lateral, clique em **"Storage"**
4. Clique em **"New bucket"** (botão verde)
5. Configure o bucket:
   - **Name**: `property-images` ⚠️ (exatamente este nome!)
   - **Public bucket**: ✅ **MARQUE ESTA OPÇÃO** (muito importante!)
   - File size limit: 5 MB
6. Clique em **"Create bucket"**

### 3️⃣ Verificar a Instalação

Execute no terminal:

```bash
npm run verify
```

Você deve ver:

```
✅ Storage bucket "property-images": Found
✅ Bucket is PUBLIC (correct)
```

## Solução Alternativa (SQL)

Se preferir criar o bucket usando SQL:

1. Acesse: https://supabase.com/dashboard (seu projeto)
2. Vá em **SQL Editor** → **New query**
3. Cole e execute este SQL:

```sql
-- Criar o bucket de armazenamento
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'property-images',
  'property-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

-- Criar políticas de acesso
CREATE POLICY "Allow public uploads"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'property-images');

CREATE POLICY "Allow public reads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'property-images');

CREATE POLICY "Allow authenticated deletes"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'property-images');
```

## Como Testar

Depois de criar o bucket:

1. Acesse o painel admin do CRM: http://localhost:3000/admin
2. Tente adicionar um novo imóvel
3. Faça upload de uma ou mais imagens
4. O upload deve funcionar sem erros!

## ⚠️ Problemas Comuns

### Erro persiste após criar o bucket

**Possível causa**: O bucket não está público

**Solução**:
1. Vá em Storage no dashboard do Supabase
2. Clique no bucket `property-images`
3. Clique em configurações/editar
4. ✅ Marque "Public bucket"
5. Salve as alterações

### Erro: "Invalid credentials" ou "Unauthorized"

**Possível causa**: Variáveis de ambiente não configuradas

**Solução**:
1. Verifique se existe um arquivo `.env` na raiz do projeto
2. Confirme que contém:
   ```
   SUPABASE_URL=https://seu-projeto.supabase.co
   SUPABASE_KEY=sua-chave-anon
   ```
3. Obtenha as credenciais em: Settings → API no dashboard do Supabase

### Upload lento ou timeout

**Possível causa**: Imagens muito grandes

**Solução**: 
- Redimensione as imagens antes do upload
- Limite: 5 MB por imagem
- Formatos permitidos: JPEG, PNG, GIF, WebP

## Comandos Úteis

```bash
# Verificar configuração completa
npm run verify

# Configurar storage
npm run storage:setup

# Ver instruções de setup do banco de dados
npm run db:init

# Iniciar o servidor
npm run dev
```

## Documentação Adicional

- **Setup completo**: Ver [STORAGE_SETUP.md](STORAGE_SETUP.md)
- **Início rápido**: Ver [QUICKSTART.md](QUICKSTART.md)
- **Database setup**: Ver [DATABASE_SETUP.md](DATABASE_SETUP.md)

## Resumo Visual

```
┌─────────────────────────────────────────────┐
│  1. Você tem as TABELAS ✅                  │
│     - properties                            │
│     - store_settings                        │
│     - users                                 │
│                                             │
│  2. Você NÃO tem o BUCKET ❌                │
│     - property-images (faltando!)           │
│                                             │
│  SOLUÇÃO:                                   │
│  Criar bucket "property-images" no          │
│  Supabase Storage e torná-lo PÚBLICO        │
└─────────────────────────────────────────────┘
```

## Precisa de Ajuda?

1. Execute `npm run verify` para diagnóstico completo
2. Execute `npm run storage:setup` para verificar storage
3. Veja os logs do servidor para erros específicos
4. Consulte [STORAGE_SETUP.md](STORAGE_SETUP.md) para guia detalhado

---

**Status após seguir este guia**: ✅ Uploads de imagens funcionando perfeitamente!
