# Guia de Deploy no Netlify

Este guia explica como fazer deploy da aplicação Angular no Netlify com Serverless Functions.

> **⚠️ IMPORTANTE**: Este projeto agora usa **Netlify Serverless Functions** para o backend. Veja [NETLIFY_SERVERLESS.md](NETLIFY_SERVERLESS.md) para detalhes técnicos.

## 🚀 Deploy Automático (Recomendado)

### Configuração Inicial

1. **Conecte seu repositório GitHub ao Netlify:**
   - Acesse https://app.netlify.com/
   - Clique em "Add new site" → "Import an existing project"
   - Escolha "GitHub" e autorize o acesso
   - Selecione o repositório `sanpaa/CRM-Imobil`

2. **Configure as Build Settings:**
   
   O Netlify irá detectar automaticamente as configurações do arquivo `netlify.toml`, que agora incluem:

   - **Build command:** `npm install && cd frontend && npm install && npm run build:prod`
   - **Publish directory:** `frontend/dist/frontend/browser`
   - **Functions directory:** `netlify/functions` (serverless functions)

3. **⚠️ Variáveis de Ambiente (OBRIGATÓRIO):**
   
   Em "Site settings" → "Environment variables", adicione TODAS as variáveis do arquivo `.env.example`:
   
   - `SUPABASE_URL` - URL do projeto Supabase
   - `SUPABASE_KEY` - Chave pública do Supabase
   - Outras variáveis conforme necessário
   
   **IMPORTANTE**: Sem essas variáveis, os endpoints da API não funcionarão!

4. **Deploy:**
   - Clique em "Deploy site"
   - O Netlify irá automaticamente:
     - Instalar dependências do backend (para serverless functions)
     - Instalar dependências do frontend
     - Construir a aplicação Angular
     - Configurar as serverless functions
     - Publicar tudo

## 📋 Arquivos de Configuração

### netlify.toml

O arquivo `netlify.toml` na raiz do projeto contém todas as configurações necessárias:

```toml
[build]
  base = "frontend"
  command = "npm install && npm run build:prod"
  publish = "dist/frontend/browser"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### _redirects

O arquivo `frontend/public/_redirects` é copiado automaticamente para o build e garante que todas as rotas do Angular funcionem corretamente:

```
/* /index.html 200
```

Este arquivo é essencial para Single Page Applications (SPA) funcionarem corretamente no Netlify.

## 🔧 Troubleshooting

### Problema: Página 404 em rotas Angular

**Sintoma:** URLs como `/imovel/123` retornam 404 quando acessadas diretamente

**Solução:** 
- Verifique se o arquivo `_redirects` está presente em `frontend/public/`
- Verifique se o `netlify.toml` está configurado corretamente
- Faça um novo deploy após adicionar/atualizar esses arquivos

### Problema: Build falha

**Possíveis causas:**
1. **Dependências não instaladas:** O comando de build já inclui `npm install`
2. **Caminho errado:** Verifique se a base directory está definida como `frontend`
3. **Node.js version:** Netlify usa Node.js 18+ por padrão. Se necessário, adicione ao `netlify.toml`:
   ```toml
   [build.environment]
     NODE_VERSION = "20"
   ```

### Problema: Assets não carregam

**Solução:**
- Verifique se o publish directory está definido como `dist/frontend/browser`
- Confirme que os assets estão sendo copiados durante o build (configurado em `angular.json`)

## 🌐 Configuração de Domínio Customizado

1. Em "Site settings" → "Domain management"
2. Clique em "Add custom domain"
3. Siga as instruções para configurar DNS
4. Netlify fornecerá certificado SSL automaticamente

## 📊 Features Habilitadas

O arquivo `netlify.toml` já inclui:

✅ **Redirecionamentos para SPA:** Todas as rotas redirecionam para `index.html`
✅ **Cabeçalhos de Segurança:** Proteção contra XSS, clickjacking, etc.
✅ **Cache de Recursos:** Otimização de performance para arquivos estáticos
✅ **Build otimizado:** Angular production build com minificação

## 🔒 Segurança

Headers de segurança configurados automaticamente:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

## 📱 Preview de Deploy

Netlify cria automaticamente:
- **Production deploys:** Para commits na branch principal
- **Deploy previews:** Para pull requests
- **Branch deploys:** Para outras branches (se configurado)

## 🚨 Importante

### Rotas que DEVEM funcionar:
- `/` - Home page
- `/buscar` - Página de busca
- `/imovel/:id` - Detalhes do imóvel
- `/admin/login` - Login admin
- `/admin` - Painel admin

### Verificação Pós-Deploy:
1. Teste todas as rotas acima
2. Verifique se o refresh funciona em cada rota
3. Teste navegação entre páginas
4. Confirme que os assets carregam corretamente

## 💡 Dicas

1. **Deploy Preview:** Use para testar mudanças antes do merge
2. **Rollback:** Netlify permite voltar para deploys anteriores facilmente
3. **Analytics:** Ative Netlify Analytics para monitorar tráfego
4. **Forms:** Netlify Forms pode ser útil para o formulário de contato

## 📚 Recursos

- [Netlify Docs](https://docs.netlify.com/)
- [SPA Configuration](https://docs.netlify.com/routing/redirects/rewrites-proxies/#history-pushstate-and-single-page-apps)
- [Angular Deployment](https://angular.dev/tools/cli/deployment)

---

**Última atualização:** Dezembro 2024
