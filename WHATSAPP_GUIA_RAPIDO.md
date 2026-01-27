# Guia Rápido: WhatsApp CRM Imobil

## 🚀 Como Conectar (Primeira Vez)

### Passo 1: Acessar a Interface WhatsApp
1. Faça login no CRM
2. Vá para a seção de configurações WhatsApp
3. Clique em "**Conectar WhatsApp**"

### Passo 2: Escanear QR Code
1. O sistema gerará um QR Code
2. Abra WhatsApp no seu celular
3. Toque em **⋮** (menu) → **Dispositivos conectados**
4. Toque em **"Conectar um dispositivo"**
5. Escaneie o QR Code mostrado no CRM

### Passo 3: Pronto! ✅
- O WhatsApp estará conectado
- A conexão ficará ativa **indefinidamente**
- Você **não precisará** escanear novamente (a menos que desvincule)

## 🔄 Reconexão Automática

### O sistema reconecta automaticamente quando:
- ✅ Você reinicia o servidor
- ✅ Você atualiza a página (F5)
- ✅ Você faz um novo deploy
- ✅ Há uma queda temporária de conexão

**Você não precisa fazer nada!** O sistema usa as credenciais salvas.

## 📱 Uso Diário

### Receber Mensagens
- Todas as mensagens recebidas são **automaticamente**:
  - Salvas no banco de dados
  - Analisadas para palavras-chave imobiliárias
  - Convertidas em clientes (se relevantes)

### Enviar Mensagens
Use a API ou interface do CRM:
```javascript
POST /api/whatsapp/send
{
  "to": "5511999999999",
  "message": "Olá! Vi que você se interessou pelo imóvel..."
}
```

### Ver Histórico de Conversas
- Acesse a seção "Conversas WhatsApp"
- Veja todas as mensagens recebidas
- Filtre por cliente ou data

## 🔧 Comandos Úteis

### Limpar sessões antigas (se tiver problemas)
```bash
npm run whatsapp:clean-sessions
```

**Quando usar:**
- Conexão caindo frequentemente
- Precisando escanear QR Code toda hora
- Migrando de outra biblioteca WhatsApp

### Iniciar servidor
```bash
npm run dev
```

O WhatsApp reconecta automaticamente ao iniciar.

## 🚪 Como Desconectar

### Opção 1: Pelo Celular
1. Abra WhatsApp no celular
2. Toque em **⋮** → **Dispositivos conectados**
3. Encontre o CRM na lista
4. Toque nele
5. Toque em **"Desconectar"**

### Opção 2: Pelo CRM
1. Acesse configurações do WhatsApp
2. Clique em **"Desconectar WhatsApp"**

**Após desconectar:** Para reconectar, você precisará escanear o QR Code novamente.

## ❓ Perguntas Frequentes

### 1. Preciso escanear o QR Code toda vez?
**Não!** Apenas na primeira conexão (ou após desvincular).

### 2. A conexão fica ativa 24/7?
**Sim!** Até você desvincular manualmente.

### 3. E se reiniciar o servidor?
**Reconecta automaticamente** em ~5 segundos.

### 4. Posso conectar múltiplas empresas?
**Sim!** Cada empresa tem sua própria conexão WhatsApp separada.

### 5. Os arquivos de sessão são seguros?
**Sim!** Eles estão:
- No diretório `sessions/` (excluído do Git)
- Protegidos por permissões do sistema
- Necessários para manter você conectado

### 6. Por que existem arquivos de sessão?
**Para não precisar escanear QR Code toda hora!**
- Sem os arquivos: Escaneia QR Code em cada reinício ❌
- Com os arquivos: Escaneia uma vez, fica conectado para sempre ✅

## 🐛 Problemas Comuns

### Problema: Conexão cai toda hora
**Solução:**
```bash
npm run whatsapp:clean-sessions
# Depois reconecte escaneando novo QR Code
```

### Problema: Precisa escanear QR Code sempre
**Solução:** Mesma acima. Provavelmente há sessões antigas corrompidas.

### Problema: QR Code não aparece
**Solução:**
1. Verifique se o servidor está rodando
2. Verifique os logs do servidor
3. Tente desconectar e conectar novamente

### Problema: "WhatsApp is not connected"
**Solução:**
1. Aguarde alguns segundos (pode estar reconectando)
2. Atualize a página
3. Se persistir, reconecte manualmente

## 📊 Monitoramento

### Ver logs do WhatsApp
```bash
npm run dev | grep WhatsApp
```

### Logs importantes:
```
✅ [WhatsApp] Connected successfully!
🔄 [WhatsApp] Restoring session for company: xxx
📱 [WhatsApp] Session restoration completed
❌ [WhatsApp] Disconnected (reason: xxx)
```

## 📚 Documentação Completa

Para mais detalhes, consulte:
- `WHATSAPP_CONEXAO_PERSISTENTE.md` - Documentação técnica completa
- `RESPOSTA_WHATSAPP_BIBLIOTECA.md` - Explicação sobre a biblioteca
- `WHATSAPP_README.md` - Guia de integração detalhado

## 🎉 Resumo

1. **Conecte uma vez** (escaneando QR Code)
2. **Use normalmente** (recebe e envia mensagens)
3. **Esqueça** (fica conectado automaticamente)

Simples assim! 🚀
