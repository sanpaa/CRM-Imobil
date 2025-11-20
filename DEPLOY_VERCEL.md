# 🚀 Deploy no Vercel - Guia Completo

Este guia mostra como fazer deploy da aplicação Angular no Vercel.

## 📋 Pré-requisitos

1. **Conta no Vercel**: Crie em https://vercel.com
2. **Vercel CLI** (opcional): `npm install -g vercel`
3. **Git**: Repositório deve estar no GitHub/GitLab/Bitbucket

## 🎯 Método 1: Deploy via Dashboard Vercel (Recomendado)

### Passo 1: Conectar Repositório

1. Acesse https://vercel.com/new
2. Clique em **"Import Git Repository"**
3. Selecione seu repositório `sanpaa/sanpaa`
4. Clique em **"Import"**

### Passo 2: Configurar Build

O Vercel detectará automaticamente, mas confirme as configurações:

**Framework Preset**: `Other`

**Build Command**: Vercel detectará automaticamente o script `vercel-build`
```bash
npm run vercel-build
```

**Output Directory**: Não necessário - o server.js servirá o build
```
(deixe vazio)
```

**Install Command**:
```bash
npm install
```

**Root Directory**: `./` (deixe vazio ou raiz)

### Passo 3: Variáveis de Ambiente (Opcional)

Se você quiser customizar:

- `NODE_ENV` → `production`
- `PORT` → `3000` (Vercel usa porta automática)

### Passo 4: Deploy

1. Clique em **"Deploy"**
2. Aguarde o build (leva ~2-5 minutos)
3. ✅ Aplicação estará disponível em `https://seu-projeto.vercel.app`

## 🖥️ Método 2: Deploy via CLI

### Instalação

```bash
npm install -g vercel
```

### Login

```bash
vercel login
```

### Deploy

Na raiz do projeto:

```bash
# O script vercel-build já cuida de tudo
npm run vercel-build

# Deploy no Vercel
vercel
```

Siga as instruções:
- **Set up and deploy?** → Yes
- **Which scope?** → Selecione sua conta
- **Link to existing project?** → No (primeira vez) ou Yes (se já existe)
- **Project name?** → sanpaa (ou outro nome)
- **Directory?** → `./` (raiz)

### Deploy em Produção

```bash
vercel --prod
```

## ⚙️ Configuração Detalhada

### vercel.json

O arquivo `vercel.json` já está configurado com:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/server.js"
    },
    {
      "src": "/uploads/(.*)",
      "dest": "/server.js"
    },
    {
      "src": "/admin-legacy/(.*)",
      "dest": "/server.js"
    },
    {
      "src": "/(.*)",
      "dest": "/server.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

### Build Script

O `package.json` raiz já tem o script `vercel-build` que:
1. Navega para o diretório `frontend`
2. Instala as dependências do Angular
3. Faz o build de produção

```json
{
  "scripts": {
    "build": "cd frontend && ng build",
    "build:prod": "cd frontend && ng build --configuration production",
    "vercel-build": "cd frontend && npm install && npm run build:prod",
    "start": "npm run build:prod && node server.js"
  }
}
```

## 🔧 Troubleshooting

### Problema: Build falha

**Solução**: Verifique que todas as dependências estão no `package.json` correto:
- Root `package.json`: Express, backend deps
- `frontend/package.json`: Angular, frontend deps

### Problema: Rotas Angular não funcionam

**Solução**: O `vercel.json` já está configurado para redirecionar todas as rotas para `server.js`, que serve o Angular SPA.

### Problema: Uploads não funcionam

**Solução**: O Vercel é stateless. Para uploads:
1. Use Vercel Blob Storage: https://vercel.com/docs/storage/vercel-blob
2. Ou use Cloudinary/AWS S3 para armazenar imagens

### Problema: Dados não persistem

**Solução**: O sistema de arquivos no Vercel é efêmero. Para produção:
1. Use MongoDB Atlas (grátis): https://www.mongodb.com/cloud/atlas
2. Ou PostgreSQL no Vercel: https://vercel.com/docs/storage/vercel-postgres
3. Ou Supabase: https://supabase.com

## 📊 Monitoramento

Após o deploy:

1. **Logs**: https://vercel.com/dashboard → Seu projeto → Deployments → Logs
2. **Analytics**: Vercel fornece analytics gratuito
3. **Domínio Custom**: Configure em Settings → Domains

## 🔐 Segurança

⚠️ **IMPORTANTE**: Antes de fazer deploy em produção:

1. **Mude a senha do admin** em `server.js`:
   ```javascript
   const ADMIN_PASSWORD_HASH = bcrypt.hashSync('SUA_SENHA_FORTE', 10);
   ```

2. **Configure variáveis de ambiente** para senhas e tokens

3. **Use HTTPS** (Vercel fornece automaticamente)

## 🌐 URLs do Projeto

Após deploy, você terá:

- **Produção**: `https://seu-projeto.vercel.app`
- **Admin**: `https://seu-projeto.vercel.app/admin/login`
- **Admin Legado**: `https://seu-projeto.vercel.app/admin-legacy`
- **API**: `https://seu-projeto.vercel.app/api/*`

## 🔄 Atualizações

Para atualizar o projeto em produção:

**Via Dashboard**:
- Faça push no GitHub → Vercel faz deploy automático

**Via CLI**:
```bash
git push origin main
vercel --prod
```

## 💾 Persistência de Dados (Produção)

### Opção 1: MongoDB Atlas (Recomendado)

```bash
npm install mongodb
```

Altere `server.js` para usar MongoDB ao invés de arquivos JSON.

### Opção 2: Vercel Postgres

```bash
npm install @vercel/postgres
```

Configure em: https://vercel.com/docs/storage/vercel-postgres

### Opção 3: Supabase

```bash
npm install @supabase/supabase-js
```

Crie conta em: https://supabase.com

## 📞 Suporte

- Documentação Vercel: https://vercel.com/docs
- Vercel Support: https://vercel.com/support
- Issues no GitHub: https://github.com/sanpaa/sanpaa/issues

## ✅ Checklist de Deploy

- [ ] Build local funciona: `npm run build:prod`
- [ ] Servidor local funciona: `npm start`
- [ ] vercel.json configurado
- [ ] Senha do admin alterada
- [ ] Variáveis de ambiente configuradas
- [ ] Repositório no GitHub
- [ ] Deploy no Vercel
- [ ] Teste todas as rotas
- [ ] Teste painel admin
- [ ] Configure domínio personalizado (opcional)

---

**Status**: Pronto para deploy! 🚀

Para dúvidas, consulte a documentação do Vercel ou abra uma issue.
