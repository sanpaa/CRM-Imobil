# 🚀 Deploy no Render - Guia Completo

Este guia mostra como fazer deploy da aplicação CRM Imobil no Render com Supabase.

## 📋 Pré-requisitos

1. **Conta no Render**: Crie em https://render.com (gratuito)
2. **Conta no Supabase**: Crie em https://supabase.com (gratuito)
3. **Git**: Repositório deve estar no GitHub/GitLab/Bitbucket
4. **Configuração do Supabase**: Siga o guia [DATABASE_SETUP.md](./DATABASE_SETUP.md) primeiro

## ⚠️ IMPORTANTE: Configure o Supabase ANTES do Deploy

**ATENÇÃO**: Se você fizer deploy sem configurar o Supabase, você receberá erros 503:
- ❌ `503 Service Unavailable` ao criar imóveis
- ❌ `503 Service Unavailable` ao fazer upload de imagens
- ❌ "Serviço de armazenamento não disponível. Verifique se o bucket 'property-images' existe no Supabase Storage."
- ❌ "Database not available. Property cannot be created in offline mode."

**SOLUÇÃO**: Configure o Supabase seguindo [DATABASE_SETUP.md](./DATABASE_SETUP.md) e adicione as variáveis de ambiente no Render conforme instruções abaixo.

---

## 🎯 Passo a Passo

### 1. Preparar Supabase

Antes de fazer deploy no Render, você PRECISA configurar o Supabase. Siga o guia completo em [DATABASE_SETUP.md](./DATABASE_SETUP.md).

**Resumo rápido:**

1. Acesse https://supabase.com e crie uma conta
2. Crie um novo projeto
3. Vá em **Settings → API** e copie:
   - **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
   - **anon/public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
4. Crie a tabela `properties` (veja DATABASE_SETUP.md para schema completo)
5. Crie o bucket de storage:
   - Vá em **Storage**
   - Clique em **"Create Bucket"**
   - Nome: `property-images` (EXATAMENTE este nome!)
   - Marque como **PUBLIC** ✅
   - Clique em **"Create"**

⚠️ **Guarde suas credenciais do Supabase** - você vai precisar delas no passo 4!

---

### 2. Criar Web Service no Render

1. Acesse https://dashboard.render.com
2. Clique em **"New +"** → **"Web Service"**
3. Conecte seu repositório Git:
   - Se for a primeira vez, autorize o Render a acessar seu GitHub
   - Selecione o repositório `sanpaa/CRM-Imobil`

---

### 3. Configurar o Web Service

Na página de configuração, preencha:

**Name**: `crm-imobil` (ou outro nome de sua preferência)

**Region**: Selecione a região mais próxima (ex: Ohio - USA)

**Branch**: `main` (ou a branch que você quer fazer deploy)

**Root Directory**: (deixe em branco)

**Runtime**: `Node`

**Build Command**:
```bash
npm install && cd frontend && npm install && npm run build:prod && cd ..
```

**Start Command**:
```bash
node server.js
```

**Instance Type**: `Free` (ou escolha um plano pago se preferir)

---

### 4. Configurar Variáveis de Ambiente

**🔴 PASSO CRÍTICO**: Sem estas variáveis, você receberá erros 503!

Na seção **"Environment Variables"**, clique em **"Add Environment Variable"** e adicione:

#### Variáveis Obrigatórias:

| Key | Value | Observações |
|-----|-------|-------------|
| `SUPABASE_URL` | `https://xxxxxxxxxxxxx.supabase.co` | ⚠️ Use SEU URL do Supabase (passo 1) |
| `SUPABASE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | ⚠️ Use SUA chave do Supabase (passo 1) |
| `NODE_ENV` | `production` | Define o ambiente |
| `PORT` | `3000` | Porta do servidor |

#### Variáveis Opcionais (Segurança):

| Key | Value | Observações |
|-----|-------|-------------|
| `ADMIN_USERNAME` | `admin` | Usuário admin (padrão: admin) |
| `ADMIN_PASSWORD` | `sua-senha-forte` | ⚠️ Mude em produção! |

**⚠️ IMPORTANTE**:
- Substitua `xxxxxxxxxxxxx` pelo ID real do seu projeto Supabase
- Substitua a `SUPABASE_KEY` pela sua chave real (copie do Supabase)
- **NÃO USE** os valores de exemplo - use seus valores reais!
- Se não configurar corretamente, você receberá erros 503

---

### 5. Deploy

1. Clique em **"Create Web Service"** no final da página
2. Aguarde o build e deploy (leva ~3-5 minutos)
3. O Render mostrará os logs do build em tempo real
4. Quando concluído, você verá: **"Your service is live"** 🎉

---

### 6. Verificar o Deploy

1. Clique no URL gerado (ex: `https://crm-imobil.onrender.com`)
2. Você deve ver a página inicial do CRM
3. Teste o admin: `https://crm-imobil.onrender.com/admin/login`
4. Entre com suas credenciais
5. Teste criar um imóvel e fazer upload de imagem

**✅ Se tudo funcionar**: Parabéns! Seu deploy está completo!

**❌ Se você receber erro 503**:
- Verifique que o bucket `property-images` existe no Supabase
- Verifique que o bucket está marcado como **PUBLIC**
- Verifique que as variáveis `SUPABASE_URL` e `SUPABASE_KEY` estão corretas
- Reinicie o serviço no Render (Dashboard → Seu serviço → Manual Deploy → Deploy latest commit)

---

## 🔧 Troubleshooting

### Erro 503: "Serviço de armazenamento não disponível"

**Causa**: Bucket `property-images` não existe ou não está configurado corretamente no Supabase.

**Solução**:
1. Acesse seu projeto no Supabase
2. Vá em **Storage**
3. Verifique se existe um bucket chamado **exatamente** `property-images`
4. Certifique-se que o bucket está marcado como **PUBLIC**
5. Se não existir, crie o bucket conforme instruções no passo 1
6. Reinicie o serviço no Render

### Erro 503: "Database not available"

**Causa**: Variáveis de ambiente `SUPABASE_URL` ou `SUPABASE_KEY` não estão configuradas ou estão incorretas.

**Solução**:
1. No Render Dashboard, vá em seu serviço
2. Clique em **"Environment"** no menu lateral
3. Verifique se `SUPABASE_URL` e `SUPABASE_KEY` existem
4. Verifique se os valores estão corretos (sem espaços extras)
5. Caso tenha alterado, clique em **"Save Changes"**
6. O Render reiniciará automaticamente o serviço

### Build falha

**Solução**:
1. Verifique os logs do build no Render
2. Certifique-se que `package.json` e `frontend/package.json` existem
3. Verifique se o comando de build está correto
4. Tente fazer build local: `npm install && cd frontend && npm install && npm run build:prod`

### Aplicação não inicia

**Solução**:
1. Verifique os logs em **Logs** no menu lateral
2. Certifique-se que a porta está correta (3000)
3. Verifique se as dependências foram instaladas
4. Tente manual deploy: **Manual Deploy → Deploy latest commit**

### Rotas Angular não funcionam (404)

**Solução**: O servidor Express já está configurado para servir o Angular SPA. Se ainda assim tiver problemas:
1. Verifique se o build do Angular foi bem-sucedido
2. Verifique se a pasta `frontend/dist/frontend/browser` existe após o build
3. Verifique os logs do servidor

---

## 📊 Monitoramento e Logs

### Ver Logs
1. Acesse Render Dashboard → Seu serviço
2. Clique em **"Logs"** no menu lateral
3. Veja logs em tempo real

### Ver Métricas
1. Acesse **"Metrics"** no menu lateral
2. Veja CPU, memória, requests

### Ver Deploys Anteriores
1. Acesse **"Events"** no menu lateral
2. Veja histórico de deploys

---

## 🔄 Atualizar a Aplicação

### Deploy Automático (Recomendado)
1. Faça push no GitHub:
   ```bash
   git add .
   git commit -m "Sua mensagem"
   git push origin main
   ```
2. O Render detectará e fará deploy automaticamente
3. Acompanhe o progresso em **"Events"**

### Deploy Manual
1. No Render Dashboard, vá em seu serviço
2. Clique em **"Manual Deploy"**
3. Clique em **"Deploy latest commit"**
4. Aguarde o deploy

---

## 🌐 Domínio Personalizado

### Adicionar Domínio Próprio
1. No Render Dashboard, vá em seu serviço
2. Clique em **"Settings"** → **"Custom Domains"**
3. Clique em **"Add Custom Domain"**
4. Digite seu domínio (ex: `www.minhaImobiliaria.com.br`)
5. Configure os DNS conforme instruções do Render
6. Aguarde propagação (até 24h)

---

## 🔐 Segurança em Produção

### ⚠️ Checklist de Segurança:

- [ ] **Altere a senha do admin**: Configure `ADMIN_PASSWORD` nas variáveis de ambiente
- [ ] **Proteja variáveis sensíveis**: Nunca commite `.env` no Git
- [ ] **Use HTTPS**: Render fornece SSL/TLS automaticamente
- [ ] **Configure RLS no Supabase**: Ative Row Level Security nas tabelas
- [ ] **Limite acesso ao admin**: Use autenticação forte
- [ ] **Monitore logs**: Fique atento a acessos suspeitos

---

## 💡 Plano Gratuito do Render

O plano gratuito do Render tem algumas limitações:

- ⏸️ **Spin down após inatividade**: Serviço "dorme" após 15 minutos sem uso
- 🐌 **Primeiro acesso lento**: Leva ~30 segundos para "acordar"
- 💾 **750h/mês grátis**: Suficiente para projetos pessoais
- 📊 **Monitoramento básico**: Logs e métricas básicas

**Para sites comerciais**, considere um plano pago ($7/mês) para:
- ✅ Sempre ativo (sem spin down)
- ✅ Melhor performance
- ✅ Mais recursos

---

## 📞 Suporte

### Documentação
- [Render Docs](https://render.com/docs)
- [Supabase Docs](https://supabase.com/docs)
- [DATABASE_SETUP.md](./DATABASE_SETUP.md)
- [QUICKSTART.md](./QUICKSTART.md)

### Problemas?
1. Verifique os logs no Render
2. Verifique a configuração do Supabase
3. Consulte a documentação acima
4. Abra uma issue no GitHub: https://github.com/sanpaa/CRM-Imobil/issues

---

## ✅ Checklist Final de Deploy

Antes de considerar o deploy completo, verifique:

- [ ] Conta no Render criada
- [ ] Conta no Supabase criada
- [ ] Projeto Supabase configurado com tabela `properties`
- [ ] Bucket `property-images` criado e **PUBLIC** no Supabase
- [ ] Web Service criado no Render
- [ ] Variável `SUPABASE_URL` configurada corretamente
- [ ] Variável `SUPABASE_KEY` configurada corretamente
- [ ] Variável `NODE_ENV=production` configurada
- [ ] Build concluído com sucesso
- [ ] Aplicação acessível via URL do Render
- [ ] Página inicial carrega corretamente
- [ ] Login do admin funciona
- [ ] É possível criar imóveis (sem erro 503)
- [ ] É possível fazer upload de imagens (sem erro 503)
- [ ] Senha do admin alterada (produção)

---

**Status**: Pronto para deploy! 🚀

Siga este guia passo a passo e sua aplicação estará online em minutos!
