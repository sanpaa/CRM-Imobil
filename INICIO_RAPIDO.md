# 🏠 CRM Imobil - Início Rápido

## 🚀 Como Começar em 2 Minutos

### 1. Instalar Dependências
```bash
npm install
```

### 2. Iniciar o Servidor
```bash
npm run dev
```

### 3. Acessar o Sistema
Abra seu navegador em: **http://localhost:3000**

**Pronto!** O sistema já está funcionando em modo demonstração. ✅

---

## 📊 Modo Demonstração vs. Modo Completo

### Modo Demonstração (Padrão)
- ✅ Visualizar imóveis de exemplo
- ✅ Buscar e filtrar imóveis
- ✅ Ver detalhes dos imóveis
- ❌ Não pode criar/editar imóveis
- ❌ Não pode fazer upload de imagens

### Modo Completo (Com Banco de Dados)
Para habilitar **todas** as funcionalidades:

1. **Crie um arquivo `.env`:**
   ```bash
   cp .env.example .env
   ```

2. **Configure o Supabase:**
   - Acesse https://supabase.com
   - Crie uma conta grátis
   - Crie um novo projeto
   - Copie suas credenciais
   - Cole no arquivo `.env`

3. **Instruções Detalhadas:**
   Veja o arquivo `DATABASE_SETUP.md` para o passo a passo completo.

---

## 🔐 Acesso Admin

**Usuário:** `admin`  
**Senha:** `admin123`

**URL Admin:** http://localhost:3000/admin-legacy

---

## ❓ Problemas Comuns

### "Cannot find module 'dotenv'"
**Solução:** Execute `npm install`

### "Servidor não inicia"
**Solução:** 
1. Certifique-se de ter o Node.js instalado (versão 18+)
2. Execute `npm install`
3. Execute `npm run dev`

### "Modo somente leitura"
**Isso é normal!** O sistema funciona sem banco de dados para demonstração.
Para habilitar todas as funcionalidades, configure o Supabase (veja acima).

---

## 📚 Documentação Completa

- **DATABASE_SETUP.md** - Como configurar o banco de dados
- **DEPLOY_RENDER.md** - Como fazer deploy em produção
- **QUICKSTART.md** - Guia de início rápido (inglês)

---

## 🆘 Precisa de Ajuda?

O sistema está funcionando corretamente se você ver:
```
✅ Servidor rodando em http://localhost:3000
📊 Status: 📘 Modo somente leitura (demonstração)
```

Qualquer mensagem de erro diferente disso, verifique:
1. ✅ Node.js instalado
2. ✅ `npm install` executado
3. ✅ Porta 3000 disponível
