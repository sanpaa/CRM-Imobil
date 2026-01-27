# 🎨 SISTEMA DE COMPONENTES ALTAMENTE PERSONALIZÁVEIS

## ✅ IMPLEMENTADO NO FRONTEND

### 1. Sistema de Estilos Universal
**TODOS os componentes agora aceitam `style` com qualquer propriedade CSS:**
```json
{
  "style": {
    "backgroundColor": "#fff",
    "padding": "3rem",
    "fontSize": "1.2rem",
    "transform": "scale(1.05)",
    "transition": "all 0.3s",
    // ... QUALQUER CSS válido
  }
}
```

### 2. Componentes de Conteúdo
✅ **FAQ Section** - Perguntas frequentes com accordion  
✅ **Features Grid** - Grid de benefícios com ícones  
✅ **Newsletter** - Inscrição em newsletter  
✅ **Mortgage Calculator** - Calculadora de financiamento  
✅ **Text Block** - Blocos de texto (já existia)  
✅ **Divider** - Linhas divisórias  
✅ **Spacer** - Espaçamentos

### 3. Componentes de Layout
✅ **Flex Container** - Container Flexbox que aceita filhos
  - `direction`: row, column, row-reverse, column-reverse
  - `justifyContent`: flex-start, center, space-between, etc
  - `alignItems`: flex-start, center, stretch, etc
  - `wrap`: nowrap, wrap, wrap-reverse
  - `gap`: espaçamento entre itens

✅ **Grid Container** - Container CSS Grid que aceita filhos
  - `columns`: "repeat(3, 1fr)", "300px 1fr 2fr", etc
  - `rows`: "auto", "200px 1fr", etc
  - `gap`: espaçamento entre itens
  - Suporta layouts complexos

### 4. Componente Avançado
✅ **Custom Code Section** - Permite inserir HTML, CSS e JS customizado
  - Campo `html`: código HTML
  - Campo `css`: estilos CSS
  - Campo `js`: JavaScript (apenas para admins)
  - Campo `enableJs`: habilitar/desabilitar JS

---

## 🎯 CASOS DE USO

### Layout em 2 Colunas (70/30)
```json
{
  "type": "flex-container",
  "config": {
    "direction": "row",
    "gap": "2rem",
    "children": [
      {
        "type": "text-block",
        "config": { "title": "Coluna Principal" },
        "style": { "flex": "7" }
      },
      {
        "type": "newsletter",
        "config": { "title": "Newsletter" },
        "style": { "flex": "3" }
      }
    ]
  }
}
```

### Grid de 3 Colunas Responsivo
```json
{
  "type": "grid-container",
  "config": {
    "columns": "repeat(auto-fit, minmax(300px, 1fr))",
    "gap": "2rem",
    "children": [
      { "type": "features-grid", "config": {...} },
      { "type": "faq", "config": {...} },
      { "type": "mortgage-calculator", "config": {...} }
    ]
  }
}
```

### Seção Hero Customizada
```json
{
  "type": "hero",
  "config": {
    "title": "Encontre seu lar",
    "subtitle": "Os melhores imóveis"
  },
  "style": {
    "background": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    "minHeight": "70vh",
    "color": "white",
    "display": "flex",
    "alignItems": "center",
    "justifyContent": "center",
    "textAlign": "center"
  }
}
```

### Widget de Chat Customizado
```json
{
  "type": "custom-code",
  "config": {
    "html": "<div id='chat-widget'>...</div>",
    "css": ".chat-widget { ... }",
    "js": "// código do chat",
    "enableJs": true
  }
}
```

---

## 📋 CHECKLIST PARA O BACKEND

### Prioridade ALTA (Implementar AGORA):
- [ ] Validar campo `style` aceitar qualquer propriedade CSS
- [ ] Adicionar tipos: faq, features-grid, newsletter, mortgage-calculator
- [ ] Adicionar tipos: custom-code, flex-container, grid-container
- [ ] Validar campo `children` em containers (flex/grid)
- [ ] Validar profundidade máxima de aninhamento (3 níveis)
- [ ] Sistema de permissões para `enableJs` (apenas admins)
- [ ] Interface de edição de estilos no admin

### Prioridade MÉDIA:
- [ ] Editor visual de estilos CSS
- [ ] Preview em tempo real das mudanças
- [ ] Templates prontos de layouts
- [ ] Biblioteca de widgets customizados

### Prioridade BAIXA:
- [ ] Sistema de versionamento de layouts
- [ ] A/B testing de componentes
- [ ] Analytics de componentes

---

## 🚀 ARQUIVOS CRIADOS NO FRONTEND

```
src/app/components/sections/
├── faq-section/
│   ├── faq-section.ts
│   ├── faq-section.html
│   └── faq-section.css
├── features-grid-section/
│   ├── features-grid-section.ts
│   ├── features-grid-section.html
│   └── features-grid-section.css
├── newsletter-section/
│   ├── newsletter-section.ts
│   ├── newsletter-section.html
│   └── newsletter-section.css
├── mortgage-calculator-section/
│   ├── mortgage-calculator-section.ts
│   ├── mortgage-calculator-section.html
│   └── mortgage-calculator-section.css
├── custom-code-section/
│   ├── custom-code-section.ts
│   ├── custom-code-section.html
│   └── custom-code-section.css
├── flex-container-section/
│   ├── flex-container-section.ts
│   ├── flex-container-section.html
│   └── flex-container-section.css
└── grid-container-section/
    ├── grid-container-section.ts
    ├── grid-container-section.html
    └── grid-container-section.css
```

Todos registrados em: `dynamic-section.ts`

---

## 💡 PRÓXIMOS PASSOS

1. **Enviar PROMPT_PARA_CRM.md** para o time do backend
2. **Testar** os componentes no frontend
3. **Aguardar** implementação do backend
4. **Criar** templates prontos usando os novos componentes
5. **Documentar** casos de uso e exemplos

---

## ⚠️ IMPORTANTE - SEGURANÇA

### Custom Code Section:
- ❌ NÃO permitir JavaScript por padrão
- ✅ Apenas admins podem habilitar `enableJs: true`
- ✅ Sanitizar HTML se JS não estiver habilitado
- ✅ Implementar CSP (Content Security Policy) no futuro

### Validação de Estilos:
- ✅ Aceitar qualquer propriedade CSS válida
- ❌ NÃO executar JavaScript através de CSS (ex: expression(), url(javascript:))
- ✅ Validar valores para evitar injeção de código

### Aninhamento de Componentes:
- ✅ Limitar profundidade máxima a 3 níveis
- ✅ Prevenir recursão infinita
- ✅ Validar estrutura de `children`
