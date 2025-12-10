# 🗂️ Supabase Storage Setup Guide

## Problema: "Bucket not found"

Se você está recebendo o erro `"Upload failed: Bucket not found"`, significa que o bucket de armazenamento do Supabase não foi criado.

## Solução Rápida

### 1️⃣ Verificar se o bucket existe

Execute o comando:

```bash
npm run storage:setup
```

Este script irá:
- ✅ Verificar se o bucket `property-images` existe
- ✅ Verificar se o bucket está público
- ✅ Fornecer instruções de como criar o bucket se não existir

### 2️⃣ Criar o bucket manualmente (Método Recomendado)

1. Acesse o dashboard do Supabase:
   ```
   https://supabase.com/dashboard
   ```

2. Selecione seu projeto

3. No menu lateral, clique em **"Storage"**

4. Clique em **"New bucket"** ou **"+ New bucket"**

5. Preencha os dados:
   - **Name**: `property-images` (exatamente este nome!)
   - **Public bucket**: ✅ **MARQUE ESTA OPÇÃO** (muito importante!)
   - File size limit: 5 MB (padrão)

6. Clique em **"Create bucket"**

### 3️⃣ Criar o bucket usando SQL (Método Avançado)

Se preferir usar SQL, acesse o SQL Editor do Supabase e execute:

```sql
-- Criar o bucket de armazenamento
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'property-images',
  'property-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

-- Criar política para permitir uploads públicos
CREATE POLICY "Allow public uploads"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'property-images');

-- Criar política para permitir leitura pública
CREATE POLICY "Allow public reads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'property-images');

-- Criar política para permitir deleção por usuários autenticados
CREATE POLICY "Allow authenticated deletes"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'property-images');
```

## Verificação

Depois de criar o bucket, execute:

```bash
npm run verify
```

Você deve ver:
```
✅ Storage bucket "property-images": Found
✅ Bucket is PUBLIC (correct)
```

## ⚠️ Problemas Comuns

### Bucket existe mas upload ainda falha

**Causa**: O bucket está privado

**Solução**:
1. Vá em Storage no dashboard do Supabase
2. Clique no bucket `property-images`
3. Clique em "Edit bucket" ou configurações
4. ✅ Marque "Public bucket"
5. Salve as alterações

### Erro: "storage/unauthorized"

**Causa**: Políticas de acesso não configuradas

**Solução**: Execute o SQL da seção 3️⃣ para criar as políticas

### Erro: "Invalid credentials"

**Causa**: Variáveis de ambiente não configuradas

**Solução**: 
1. Crie um arquivo `.env` na raiz do projeto
2. Adicione:
   ```
   SUPABASE_URL=https://seu-projeto.supabase.co
   SUPABASE_KEY=sua-chave-anon-aqui
   ```
3. Obtenha as credenciais em: Settings → API no dashboard do Supabase

## Comandos Úteis

```bash
# Verificar setup completo (banco de dados + storage)
npm run verify

# Configurar apenas storage
npm run storage:setup

# Ver instruções de setup do banco de dados
npm run db:init

# Iniciar o servidor
npm run dev
```

## Estrutura do Storage

Depois de configurado, o bucket `property-images` irá armazenar todas as imagens dos imóveis:

```
storage/
└── property-images/
    ├── 1234567890-image1.jpg
    ├── 1234567891-image2.png
    ├── 1234567892-image3.webp
    └── ...
```

As URLs públicas das imagens serão no formato:
```
https://seu-projeto.supabase.co/storage/v1/object/public/property-images/1234567890-image1.jpg
```

## Limites e Configurações

- **Tamanho máximo por arquivo**: 5 MB
- **Formatos permitidos**: JPEG, JPG, PNG, GIF, WebP
- **Acesso**: Público (qualquer pessoa pode ver as imagens)
- **Upload**: Aberto (qualquer pessoa pode fazer upload)
- **Deleção**: Apenas usuários autenticados

## Precisa de Ajuda?

1. Execute `npm run verify` para diagnóstico completo
2. Execute `npm run storage:setup` para instruções específicas de storage
3. Veja DATABASE_SETUP.md para configuração completa
4. Verifique os logs do servidor para erros específicos

---

**Nota**: Este bucket é essencial para o funcionamento do sistema de upload de imagens. Sem ele, você não conseguirá fazer upload de fotos dos imóveis.
