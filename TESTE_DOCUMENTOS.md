# 📄 Guia de Testes - Anexo de Documentos em Imóveis

## 🎯 Objetivo

Este guia detalha como testar a funcionalidade de anexar documentos (PDF, DOC, DOCX, XLS, XLSX, TXT) no cadastro de imóveis.

## 📋 Pré-requisitos

### 1. Configuração do Banco de Dados
Execute a migração no Supabase SQL Editor:
```sql
-- Arquivo: migration-add-document-urls.sql
```

### 2. Configuração do Storage
1. Acesse o Supabase Dashboard
2. Vá para **Storage**
3. Clique em **Create a new bucket**
4. Configure:
   - **Name**: `property-documents`
   - **Public bucket**: ✅ **YES**
5. (Opcional) Execute as políticas RLS:
   ```sql
   -- Arquivo: storage-policies-property-documents.sql
   ```

### 3. Verificar Configuração
```bash
# Verificar se .env está configurado
cat .env

# Deve conter:
# SUPABASE_URL=https://xxxxx.supabase.co
# SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Reiniciar servidor
npm run dev
```

## 🧪 Casos de Teste

### Teste 1: Upload de Documento Único (PDF)
**Objetivo**: Verificar upload de um documento PDF

**Passos**:
1. Acesse a página de cadastro de imóvel
2. Preencha os campos obrigatórios (título, descrição, tipo, preço, contato)
3. Na seção "Documentos", clique em "Escolher arquivos"
4. Selecione um arquivo PDF (ex: contrato.pdf)
5. Verifique se o arquivo aparece na lista "Novos documentos"
6. Clique em "Salvar"

**Resultado Esperado**:
- ✅ Upload bem-sucedido
- ✅ URL do documento salva no banco de dados
- ✅ Documento visível na lista ao editar o imóvel
- ✅ Contador mostra "1/10 documentos"

### Teste 2: Upload de Múltiplos Documentos
**Objetivo**: Verificar upload de múltiplos documentos de uma vez

**Passos**:
1. Edite um imóvel existente
2. Na seção "Documentos", selecione 3 arquivos:
   - contrato.pdf
   - escritura.docx
   - planilha.xlsx
3. Verifique se todos aparecem na lista
4. Clique em "Salvar"

**Resultado Esperado**:
- ✅ Todos os 3 documentos são enviados
- ✅ URLs salvas corretamente
- ✅ Contador mostra "3/10 documentos"

### Teste 3: Validação de Tipo de Arquivo
**Objetivo**: Verificar que apenas extensões permitidas são aceitas

**Passos**:
1. Tente selecionar arquivo com extensão não permitida (ex: .zip, .exe, .mp4)
2. Tente fazer upload

**Resultado Esperado**:
- ✅ Mensagem de erro: "Tipo de arquivo não permitido"
- ✅ Lista de extensões permitidas exibida: PDF, DOC, DOCX, XLS, XLSX, TXT

### Teste 4: Limite de 10 Documentos
**Objetivo**: Verificar limite máximo de documentos por imóvel

**Passos**:
1. Edite um imóvel que já tem 8 documentos
2. Tente adicionar 3 novos documentos (total = 11)

**Resultado Esperado**:
- ✅ Mensagem de erro: "Limite de 10 documentos excedido"
- ✅ Upload bloqueado

### Teste 5: Remoção de Documento
**Objetivo**: Verificar remoção de documento antes de salvar

**Passos**:
1. Adicione 2 documentos novos
2. Clique no botão [×] ao lado de um documento
3. Verifique que o documento foi removido da lista
4. Salve o imóvel

**Resultado Esperado**:
- ✅ Documento removido não é enviado
- ✅ Apenas o documento restante é salvo

### Teste 6: Visualização de Documentos Existentes
**Objetivo**: Verificar que documentos já salvos são exibidos corretamente

**Passos**:
1. Edite um imóvel que tem documentos salvos
2. Verifique a seção "Documentos anexados"

**Resultado Esperado**:
- ✅ Lista de documentos existentes visível
- ✅ Ícone correto para cada tipo de arquivo:
  - 📄 PDF
  - 📝 DOC/DOCX
  - 📊 XLS/XLSX
  - 📋 TXT
- ✅ Nome do arquivo exibido
- ✅ Botão de remoção disponível

### Teste 7: Validação de Tamanho de Arquivo
**Objetivo**: Verificar limite de tamanho de arquivo (10MB)

**Passos**:
1. Tente fazer upload de arquivo maior que 10MB

**Resultado Esperado**:
- ✅ Mensagem de erro: "Arquivo excede o tamanho máximo de 10MB"
- ✅ Upload bloqueado

### Teste 8: Organização de Arquivos no Storage
**Objetivo**: Verificar que arquivos são organizados corretamente

**Passos**:
1. Faça upload de um documento
2. No Supabase Storage, vá para o bucket `property-documents`
3. Verifique a estrutura de pastas

**Resultado Esperado**:
- ✅ Arquivos organizados em: `{company_id}/{property_id}/{timestamp}-{random}.{ext}`
- ✅ Estrutura hierárquica mantida

### Teste 9: Upload Sem Bucket Configurado
**Objetivo**: Verificar mensagem de erro quando bucket não existe

**Passos**:
1. Delete o bucket `property-documents` no Supabase (ou renomeie)
2. Tente fazer upload de documento

**Resultado Esperado**:
- ✅ Mensagem de erro clara: "Bucket 'property-documents' não encontrado"
- ✅ Instruções de como criar o bucket
- ✅ Código de status HTTP 503

### Teste 10: API Endpoint Direto
**Objetivo**: Testar o endpoint via API diretamente

**Passos**:
```bash
# Criar arquivo de teste
curl -X POST http://localhost:3000/api/upload-documents \
  -H "Content-Type: multipart/form-data" \
  -F "documents=@/path/to/test.pdf" \
  -F "company_id=test-company" \
  -F "property_id=test-property"
```

**Resultado Esperado**:
```json
{
  "documentUrls": [
    "https://xxxxx.supabase.co/storage/v1/object/public/property-documents/test-company/test-property/1234567890-123456789.pdf"
  ],
  "allowedExtensions": [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".txt"]
}
```

## 🐛 Troubleshooting

### Erro: "Bucket não encontrado"
**Solução**:
1. Verifique se o bucket `property-documents` existe no Supabase Storage
2. Verifique se está configurado como público
3. Execute: `storage-policies-property-documents.sql`

### Erro: "Tipo de arquivo não permitido"
**Solução**:
1. Verifique a extensão do arquivo
2. Extensões permitidas: `.pdf`, `.doc`, `.docx`, `.xls`, `.xlsx`, `.txt`
3. Certifique-se de que o arquivo tem a extensão correta

### Documentos não aparecem após salvar
**Solução**:
1. Verifique a migração: `migration-add-document-urls.sql`
2. Confirme que a coluna `document_urls` existe na tabela `properties`
3. Verifique os logs do console do navegador
4. Verifique os logs do servidor

### Upload muito lento
**Solução**:
1. Verifique o tamanho dos arquivos (limite: 10MB)
2. Verifique sua conexão com a internet
3. Verifique a latência com o Supabase

## ✅ Checklist de Validação Completa

- [ ] Migração do banco executada
- [ ] Bucket `property-documents` criado e público
- [ ] Variáveis de ambiente configuradas
- [ ] Servidor reiniciado após configuração
- [ ] Upload de PDF funciona
- [ ] Upload de DOC/DOCX funciona
- [ ] Upload de XLS/XLSX funciona
- [ ] Upload de TXT funciona
- [ ] Validação de extensão funciona
- [ ] Validação de tamanho funciona
- [ ] Limite de 10 documentos funciona
- [ ] Remoção de documentos funciona
- [ ] Documentos existentes são exibidos
- [ ] Contador de documentos atualiza
- [ ] Ícones corretos por tipo de arquivo
- [ ] Organização no storage está correta
- [ ] Mensagens de erro são claras

## 📊 Formatos de Arquivo Suportados

| Extensão | Tipo | MIME Type | Ícone |
|----------|------|-----------|-------|
| .pdf | PDF | application/pdf | 📄 |
| .doc | Word 97-2003 | application/msword | 📝 |
| .docx | Word | application/vnd.openxmlformats-officedocument.wordprocessingml.document | 📝 |
| .xls | Excel 97-2003 | application/vnd.ms-excel | 📊 |
| .xlsx | Excel | application/vnd.openxmlformats-officedocument.spreadsheetml.sheet | 📊 |
| .txt | Texto | text/plain | 📋 |

## 🔒 Segurança

### Validações Implementadas
- ✅ Validação de extensão de arquivo
- ✅ Validação de tamanho de arquivo (10MB)
- ✅ Limite de quantidade (10 documentos)
- ✅ Organização por company_id/property_id
- ✅ Verificação de bucket disponível

### Recomendações Adicionais
- Configure políticas RLS no Supabase Storage
- Implemente varredura de vírus em produção
- Configure rate limiting no servidor
- Monitore uso de storage

## 📞 Suporte

Para problemas ou dúvidas:
1. Verifique este guia de testes
2. Consulte os logs do servidor (`npm run dev`)
3. Verifique o console do navegador (F12)
4. Consulte a documentação do Supabase Storage

---

**Última atualização**: 2026-01-06
**Versão**: 1.0.0
