# 📊 Pricing Plans Component - Guia de Uso

## 🎯 Visão Geral

O componente **Pricing Plans Section** foi desenvolvido para apresentar os planos de assinatura do CRM Imobiliário de forma clara, profissional e orientada à conversão. O design segue as melhores práticas de UX/UI do mercado SaaS e é inspirado em plataformas líderes como Kenlo e Imobzi.

## ✨ Características Principais

### 1. Três Planos Estruturados

#### **Prime** (Entrada)
- **Preço**: A partir de R$ 247/mês
- **Usuários**: 2 inclusos
- **Público**: Imobiliárias iniciantes
- **Diferencial**: Ponto de entrada acessível

#### **K** (Intermediário) - ⭐ MAIS POPULAR
- **Preço**: R$ 397/mês
- **Usuários**: 5 inclusos
- **Público**: Imobiliárias em crescimento
- **Diferencial**: Melhor custo-benefício + 1 treinamento gratuito

#### **K2** (Completo)
- **Preço**: R$ 597/mês
- **Usuários**: 12 inclusos
- **Público**: Imobiliárias estruturadas
- **Diferencial**: Todos os recursos + 2 treinamentos + Customer Success

### 2. Recursos por Plano

| Recurso | Prime | K | K2 |
|---------|-------|---|-----|
| Gestão de atendimentos | ✅ | ✅ | ✅ |
| Transferência automática de leads | ❌ | ✅ | ✅ |
| Aplicativo mobile | ✅ | ✅ | ✅ |
| Landing page integrada | ✅ | ✅ | ✅ |
| Treinamento online | Pago (R$ 999) | 1 gratuito | 2 gratuitos |
| Blog institucional | ❌ | ✅ | ✅ |
| Suporte VIP | ❌ | ✅ | ✅ |
| Customer Success dedicado | ❌ | ❌ | ✅ |
| Acesso à API de imóveis | ❌ | ✅ | ✅ |
| Portal do Corretor | ❌ | ✅ | ✅ |

### 3. Política de Usuários

#### Prime
- 2 usuários inclusos
- Usuário adicional: R$ 57/mês
- Treinamento: R$ 999 (pago)
- Ativação: R$ 197

#### K
- 5 usuários inclusos
- Usuário adicional: R$ 37/mês
- 1 treinamento gratuito
- Ativação: R$ 197

#### K2
- 12 usuários inclusos
- Usuário adicional: R$ 27/mês
- 2 treinamentos gratuitos
- Ativação: Gratuita

## 🚀 Como Usar o Componente

### Método 1: Via Painel Administrativo (Recomendado)

1. Acesse o painel administrativo do CRM
2. Vá para **Website Builder** ou **Configurações do Site**
3. Adicione uma nova seção
4. Selecione o tipo: **"pricing-plans"**
5. Configure as opções desejadas (opcional)
6. Salve e publique

### Método 2: Via Configuração JSON

Adicione a seção no arquivo de configuração do site:

```json
{
  "type": "pricing-plans",
  "order": 3,
  "config": {
    "title": "Escolha o Plano Ideal para sua Imobiliária",
    "subtitle": "Planos flexíveis com recursos completos para gestão imobiliária",
    "showComparisonTable": true,
    "showImplementationNotice": true,
    "ctaText": "Fale com um especialista",
    "whatsappNumber": "5535997383030"
  }
}
```

### Método 3: Personalização Avançada

Para personalizar completamente os planos:

```json
{
  "type": "pricing-plans",
  "order": 3,
  "config": {
    "title": "Seu Título Personalizado",
    "subtitle": "Sua descrição",
    "plans": [
      {
        "id": "prime",
        "name": "Prime",
        "description": "Descrição customizada",
        "basePrice": 247,
        "priceLabel": "a partir de R$ 247/mês",
        "priceDescription": "Detalhes do preço",
        "users": 2,
        "additionalUserPrice": 57,
        "freeTrainings": 0,
        "activationFee": 197,
        "trainingPrice": 999,
        "isPopular": false,
        "features": [
          { "name": "Recurso 1", "included": true },
          { "name": "Recurso 2", "included": false, "tooltip": "Informação adicional" }
        ]
      }
    ]
  }
}
```

## 🎨 Customização Visual

### Cores e Estilos

O componente usa as cores padrão do tema, mas você pode customizar via `styleConfig`:

```json
{
  "type": "pricing-plans",
  "order": 3,
  "style": {
    "backgroundColor": "#f5f7fa",
    "padding": "5rem 0"
  },
  "config": {
    // ... configurações
  }
}
```

### Responsividade

O componente é **100% responsivo** e se adapta automaticamente para:
- 📱 **Mobile** (< 768px): Layout em coluna única
- 💻 **Tablet** (768px - 1024px): Layout em 2 colunas
- 🖥️ **Desktop** (> 1024px): Layout em 3 colunas

## 💡 Melhores Práticas de UX

### 1. Comunicação Clara
- ✅ Preço visível imediatamente
- ✅ Descrição do público-alvo
- ✅ Recursos listados de forma objetiva
- ✅ Tooltips para informações adicionais

### 2. Hierarquia Visual
- ✅ Plano mais popular destacado com badge
- ✅ Tamanho ligeiramente maior para o plano K
- ✅ Cores consistentes com a identidade da marca

### 3. Call-to-Actions
- ✅ Botões primários para ação principal
- ✅ Link direto para WhatsApp
- ✅ CTA secundário no final da seção

### 4. Transparência
- ✅ Aviso sobre valor de implantação
- ✅ Explicação clara sobre plano anual
- ✅ Tooltips para políticas de usuário

## 🔧 Funcionalidades Técnicas

### Tooltips Interativos
Os tooltips aparecem ao clicar no ícone de informação e mostram:
- Detalhes sobre treinamentos
- Informações sobre políticas
- Esclarecimentos adicionais

### Tabela Comparativa
A tabela comparativa pode ser ativada/desativada:
- Mostra todos os recursos lado a lado
- Facilita a comparação entre planos
- Responsiva para mobile

### Seção de Confiança
Quatro cards destacam os diferenciais do CRM:
- Multi-tenant e Seguro
- Escalável
- API Aberta
- Suporte Especializado

## 📱 Integração com WhatsApp

O componente tem integração direta com WhatsApp:
- Link pré-formatado com mensagem
- Abre conversa automaticamente
- Personalizável via configuração

## 🎯 Estratégia Comercial

### Posicionamento
1. **Prime**: Porta de entrada acessível
2. **K**: Melhor valor (destacado propositalmente)
3. **K2**: Premium completo

### Ancoragem de Preço
- Preço inicial "a partir de R$ 247/mês"
- Disclaimer sobre plano anual
- Valorização incremental entre planos

### Escalabilidade
- Política clara de usuários adicionais
- Preço por usuário decresce com plano maior
- Incentivo para upgrade

## 📊 Métricas Sugeridas

Para acompanhar o sucesso da página de preços:

1. **Taxa de cliques nos CTAs**
2. **Tempo de permanência na página**
3. **Taxa de abertura do WhatsApp**
4. **Conversões por plano**
5. **Interações com tooltips**

## 🔐 Segurança e Dados

O componente:
- ✅ Não coleta dados automaticamente
- ✅ Não usa cookies
- ✅ Links externos abrem em nova aba
- ✅ Código validado e testado

## 📚 Exemplos de Uso

### Exemplo 1: Página de Preços Principal
```typescript
// Adicionar no array de components da home page
{
  type: 'pricing-plans',
  order: 3,
  config: {
    title: 'Escolha o Plano Ideal',
    showComparisonTable: true
  }
}
```

### Exemplo 2: Landing Page Específica
```typescript
// Criar página específica de preços
{
  slug: 'planos',
  name: 'Planos e Preços',
  pageType: 'pricing',
  components: [
    { type: 'header', order: 0 },
    { type: 'hero', order: 1, config: { title: 'Planos que Cabem no seu Bolso' } },
    { type: 'pricing-plans', order: 2 },
    { type: 'faq', order: 3 },
    { type: 'footer', order: 4 }
  ]
}
```

## 🛠️ Troubleshooting

### Problema: Componente não aparece
**Solução**: Verifique se o tipo está correto: `'pricing-plans'` (com hífen)

### Problema: Estilos não aplicados
**Solução**: Certifique-se de que o CSS foi importado corretamente

### Problema: Tooltips não funcionam
**Solução**: Verifique se o CommonModule foi importado

## 📞 Suporte

Para dúvidas ou customizações:
- 📧 Email: suporte@crmimobiliario.com.br
- 💬 WhatsApp: (35) 99738-3030
- 📚 Documentação: /docs

## 🎉 Conclusão

O componente de Pricing Plans está pronto para uso e segue as melhores práticas de:
- ✅ UX/UI Design
- ✅ Comunicação comercial
- ✅ Arquitetura de software
- ✅ Acessibilidade
- ✅ Performance

**Versão**: 1.0.0  
**Última atualização**: Janeiro 2026  
**Autor**: CRM Imobiliário Team
