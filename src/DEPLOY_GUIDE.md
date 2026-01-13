# 🚀 Guia Rápido de Deploy - Correções WhatsApp

## 📋 Checklist Pré-Deploy

### 1. Verificar Banco de Dados
Antes de fazer deploy, execute este SQL no Supabase:

```sql
-- Verificar se a coluna company_id existe
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'company_id';

-- Se não existir, criar a coluna
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);

-- Verificar usuário específico
SELECT id, username, email, company_id 
FROM users 
WHERE id = 'dcffbe62-4247-4e6d-98dc-50097c0d6a64';

-- Se company_id estiver NULL, atualizar
UPDATE users 
SET company_id = '3b1bee0c-cbee-4de1-88f1-d6e890f4c995' 
WHERE id = 'dcffbe62-4247-4e6d-98dc-50097c0d6a64';
```

### 2. Testar Localmente (Opcional)
```bash
cd C:\Users\paulo\OneDrive\Desktop\CRM-Imobil
node src/test-whatsapp-fix.js
```

Se todos os testes passarem, pode prosseguir.

---

## 🔄 Fazer Deploy

### Passo 1: Commit e Push
```bash
cd C:\Users\paulo\OneDrive\Desktop\CRM-Imobil

git add .

git commit -m "fix(whatsapp): QR code not returned and status 500 error

- Added company_id field to User entity
- Modified initializeConnection to wait for QR code generation
- Enhanced error logging in getConnectionStatus
- Updated SupabaseUserRepository to map company_id field

Fixes:
- /api/whatsapp/initialize now returns qr_code in base64
- /api/whatsapp/status no longer returns 500 error"

git push origin main
```

### Passo 2: Aguardar Deploy no Render
- Acesse: https://dashboard.render.com
- Selecione o serviço `crm-imobil`
- Aguarde o deploy (3-5 minutos)
- Monitore os logs

### Passo 3: Verificar Logs
Procure por estas mensagens nos logs do Render:

✅ **Sucesso:**
```
[WhatsApp] Initialization started for company: ...
[WhatsApp] QR Code generated for company: ...
[WhatsAppService] Getting status for user: ...
[WhatsAppService] User found: Yes
```

❌ **Problemas:**
```
[WhatsAppService] User found: No
[WhatsAppService] User not found or missing company_id
Error: User or company not found
```

---

## 🧪 Testar Endpoints

### Teste 1: Initialize (deve retornar QR code)
```bash
curl -X POST https://crm-imobil.onrender.com/api/whatsapp/initialize \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Resposta esperada:**
```json
{
  "message": "WhatsApp initialization started. Please scan the QR code.",
  "status": "qr_ready",
  "qr_code": "data:image/png;base64,iVBORw0KGgo..."
}
```

### Teste 2: Status (deve retornar 200)
```bash
curl https://crm-imobil.onrender.com/api/whatsapp/status \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**Resposta esperada:**
```json
{
  "status": "disconnected",
  "is_connected": false,
  "message": "Not connected"
}
```

ou

```json
{
  "status": "qr_ready",
  "is_connected": false,
  "qr_code": "data:image/png;base64,..."
}
```

---

## 🔧 Troubleshooting

### Problema: "User or company not found"

**Causa:** O usuário não tem `company_id` no banco.

**Solução:**
1. Conectar ao Supabase
2. Executar SQL:
```sql
UPDATE users 
SET company_id = '3b1bee0c-cbee-4de1-88f1-d6e890f4c995' 
WHERE id = 'dcffbe62-4247-4e6d-98dc-50097c0d6a64';
```

### Problema: QR Code não gerado

**Causa:** Puppeteer pode não funcionar no Render sem buildpack.

**Solução:**
1. No Render, vá em Settings > Build & Deploy
2. Adicionar buildpack para Puppeteer:
   - URL: `https://github.com/jontewks/puppeteer-heroku-buildpack`
3. Redeploy

### Problema: Status 500 persiste

**Verificar:**
1. Logs do Render para erro específico
2. Se o Supabase está respondendo
3. Se o token JWT é válido
4. Se o middleware `authMiddleware` está funcionando

**Debug:**
```bash
# Ver logs em tempo real
# (no dashboard do Render)
```

---

## 📊 Monitoramento Pós-Deploy

### 1. Verificar Health do Serviço
```bash
curl https://crm-imobil.onrender.com/
```

Deve retornar a página HTML do Angular.

### 2. Verificar API Status
```bash
curl https://crm-imobil.onrender.com/api/stats
```

Deve retornar estatísticas sem erro.

### 3. Testar Autenticação
```bash
curl -X POST https://crm-imobil.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"seu_usuario","password":"sua_senha"}'
```

Deve retornar token JWT.

---

## ✅ Checklist Final

- [ ] SQL executado no Supabase
- [ ] company_id atualizado para o usuário
- [ ] Código commitado e pushed
- [ ] Deploy concluído no Render (sem erros)
- [ ] Logs verificados (sem erros de User not found)
- [ ] Endpoint `/initialize` testado (retorna QR code)
- [ ] Endpoint `/status` testado (retorna 200)
- [ ] Frontend testado (conecta e exibe QR code)

---

## 📞 Suporte

Se ainda houver problemas:

1. **Verifique os logs completos** no Render
2. **Teste localmente** com `npm run dev`
3. **Verifique variáveis de ambiente** no Render:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `JWT_SECRET`

---

**Última atualização:** 5 de Janeiro de 2026  
**Versão:** 1.0
