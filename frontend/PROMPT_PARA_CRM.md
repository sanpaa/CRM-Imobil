# PROMPT PARA IMPLEMENTAR SISTEMA TOTALMENTE PERSONALIZÁVEL NO BACKEND DO CRM

## 🔴 CRÍTICO: TUDO DEVE SER EDITÁVEL PELO ADMIN

**NÃO PODE TER NENHUM VALOR HARDCODED NO FRONTEND!**  
O admin deve poder editar TUDO: textos, cores, ícones, número de itens, tamanhos, espaçamentos, etc.

---

## ⚙️ SISTEMA DE CONFIGURAÇÃO GLOBAL

### 1. Theme Colors (Cores Principais do Site)
```json
{
  "visualConfig": {
    "theme": {
      "primaryColor": "#004AAD",
      "secondaryColor": "#FFA500",
      "accentColor": "#2c7a7b",
      "textColor": "#333333",
      "backgroundColor": "#ffffff",
      "linkColor": "#004AAD",
      "successColor": "#10b981",
      "errorColor": "#ef4444",
      "warningColor": "#f59e0b",
      "fontFamily": "Inter, system-ui, sans-serif",
      "borderRadius": "8px"
    }
  }
}
```

**IMPORTANTE:** Essas cores devem estar disponíveis como variáveis CSS globais e podem ser usadas nos componentes via `config.primaryColor` ou diretamente nos estilos.

---

## COMPONENTES A IMPLEMENTAR:

### 1. FAQ Section (faq) - 100% PERSONALIZÁVEL
**Config Schema COMPLETO:**
```json
{
  "title": "Perguntas Frequentes",
  "subtitle": "Tire suas dúvidas sobre nossos serviços",
  "titleColor": "#1a202c",
  "subtitleColor": "#718096",
  "questionColor": "#2d3748",
  "answerColor": "#4a5568",
  "accentColor": "#2c7a7b",
  "items": [
    {
      "question": "Como funciona o processo de compra?",
      "answer": "O processo de compra envolve várias etapas..."
    },
    {
      "question": "Quais documentos são necessários?",
      "answer": "Você precisará de documentos pessoais..."
    },
    {
      "question": "Quanto tempo leva?",
      "answer": "O processo completo pode levar..."
    }
  ],
  "style": {
    "backgroundColor": "#f9fafb",
    "padding": "4rem 0"
  }
}
```

**Validação Backend:**
```python
faq_schema = {
    "title": {"type": "string", "required": True},
    "subtitle": {"type": "string", "required": False},
    "titleColor": {"type": "string", "pattern": "^#[0-9A-Fa-f]{6}$", "default": "#1a202c"},
    "subtitleColor": {"type": "string", "pattern": "^#[0-9A-Fa-f]{6}$", "default": "#718096"},
    "questionColor": {"type": "string", "pattern": "^#[0-9A-Fa-f]{6}$", "default": "#2d3748"},
    "answerColor": {"type": "string", "pattern": "^#[0-9A-Fa-f]{6}$", "default": "#4a5568"},
    "accentColor": {"type": "string", "pattern": "^#[0-9A-Fa-f]{6}$", "default": "#2c7a7b"},
    "items": {
        "type": "array",
        "required": True,
        "minItems": 1,
        "items": {
            "type": "object",
            "properties": {
                "question": {"type": "string", "required": True, "minLength": 5},
                "answer": {"type": "string", "required": True, "minLength": 10}
            }
        }
    }
}
```

**Interface do Admin:**
- Campo para título e subtítulo
- Color pickers para cada cor (título, subtítulo, pergunta, resposta, accent)
- Lista editável de itens (adicionar/remover perguntas)
- Cada item tem campos: question (text) e answer (textarea)

---

### 2. Features Grid (features-grid) - 100% PERSONALIZÁVEL
**Config Schema COMPLETO:**
```json
{
  "title": "Por que escolher a gente?",
  "subtitle": "Vantagens de trabalhar conosco",
  "titleColor": "#1a202c",
  "subtitleColor": "#718096",
  "iconBackground": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  "cardTitleColor": "#2d3748",
  "cardDescriptionColor": "#718096",
  "features": [
    {
      "icon": "fas fa-shield-alt",
      "title": "Segurança Total",
      "description": "Transações 100% seguras e garantidas"
    },
    {
      "icon": "fas fa-clock",
      "title": "Atendimento 24/7",
      "description": "Suporte disponível a qualquer momento"
    },
    {
      "icon": "fas fa-star",
      "title": "Avaliação Gratuita",
      "description": "Avaliamos seu imóvel sem custo"
    },
    {
      "icon": "fas fa-handshake",
      "title": "Consultoria Especializada",
      "description": "Corretores experientes e qualificados"
    }
  ],
  "style": {
    "backgroundColor": "white",
    "padding": "5rem 0"
  }
}
```

**Validação Backend:**
```python
features_grid_schema = {
    "title": {"type": "string", "required": True},
    "subtitle": {"type": "string", "required": False},
    "titleColor": {"type": "string", "pattern": "^#[0-9A-Fa-f]{6}$"},
    "subtitleColor": {"type": "string", "pattern": "^#[0-9A-Fa-f]{6}$"},
    "iconBackground": {"type": "string"},  # Aceita cor ou gradiente
    "cardTitleColor": {"type": "string", "pattern": "^#[0-9A-Fa-f]{6}$"},
    "cardDescriptionColor": {"type": "string", "pattern": "^#[0-9A-Fa-f]{6}$"},
    "features": {
        "type": "array",
        "required": True,
        "minItems": 1,
        "maxItems": 12,  # Limite razoável
        "items": {
            "type": "object",
            "properties": {
                "icon": {"type": "string", "required": True},  # Classes FontAwesome
                "title": {"type": "string", "required": True, "maxLength": 50},
                "description": {"type": "string", "required": True, "maxLength": 200}
            }
        }
    }
}
```

**Interface do Admin:**
- Campos para título e subtítulo
- Color pickers para todas as cores
- Campo para background do ícone (suporte a gradiente)
- Lista editável de features (adicionar/remover/reordenar)
- Cada feature tem:
  - Icon picker (seletor de ícones FontAwesome)
  - Campo de título (max 50 caracteres)
  - Campo de descrição (textarea, max 200 caracteres)

---

### 3. Newsletter Section (newsletter) - 100% PERSONALIZÁVEL
**Config Schema COMPLETO:**
```json
{
  "title": "Fique por dentro das novidades",
  "subtitle": "Receba lançamentos e oportunidades exclusivas no seu email",
  "inputPlaceholder": "Seu melhor email",
  "buttonText": "Assinar Newsletter",
  "titleColor": "white",
  "subtitleColor": "white",
  "buttonBackground": "white",
  "buttonColor": "#667eea",
  "style": {
    "background": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    "padding": "5rem 0",
    "color": "white"
  }
}
```

**Validação Backend:**
```python
newsletter_schema = {
    "title": {"type": "string", "required": True},
    "subtitle": {"type": "string", "required": False},
    "inputPlaceholder": {"type": "string", "default": "Seu melhor email"},
    "buttonText": {"type": "string", "required": True, "maxLength": 30},
    "titleColor": {"type": "string", "pattern": "^#[0-9A-Fa-f]{6}$|^[a-z]+$"},
    "subtitleColor": {"type": "string"},
    "buttonBackground": {"type": "string"},
    "buttonColor": {"type": "string"}
}
```

**Ação do Newsletter:**
Quando o usuário se inscrever, fazer POST para:
```
POST /api/newsletter/subscribe
{
  "email": "usuario@email.com",
  "company_id": "uuid",
  "source": "website"
}
```

---

### 4. Mortgage Calculator (mortgage-calculator) - 100% PERSONALIZÁVEL
**Config Schema COMPLETO:**
```json
{
  "title": "Calculadora de Financiamento",
  "subtitle": "Simule as parcelas do seu financiamento imobiliário",
  "titleColor": "#1a202c",
  "subtitleColor": "#718096",
  "primaryColor": "#667eea",
  "secondaryColor": "#764ba2",
  "defaultPropertyValue": 300000,
  "defaultDownPayment": 60000,
  "defaultInterestRate": 9.5,
  "defaultLoanTerm": 30,
  "currency": "BRL",
  "labels": {
    "propertyValue": "Valor do Imóvel",
    "downPayment": "Entrada",
    "interestRate": "Taxa de Juros (% ao ano)",
    "loanTerm": "Prazo (anos)",
    "monthlyPayment": "Parcela Mensal",
    "totalAmount": "Total a Pagar",
    "totalInterest": "Juros Totais"
  },
  "style": {
    "backgroundColor": "#f9fafb",
    "padding": "5rem 0"
  }
}
```

**Validação Backend:**
```python
mortgage_calculator_schema = {
    "title": {"type": "string", "required": True},
    "subtitle": {"type": "string", "required": False},
    "titleColor": {"type": "string", "pattern": "^#[0-9A-Fa-f]{6}$"},
    "subtitleColor": {"type": "string", "pattern": "^#[0-9A-Fa-f]{6}$"},
    "primaryColor": {"type": "string", "pattern": "^#[0-9A-Fa-f]{6}$"},
    "secondaryColor": {"type": "string", "pattern": "^#[0-9A-Fa-f]{6}$"},
    "defaultPropertyValue": {"type": "number", "min": 10000, "max": 100000000},
    "defaultDownPayment": {"type": "number", "min": 0, "max": 100000000},
    "defaultInterestRate": {"type": "number", "min": 0.1, "max": 50},
    "defaultLoanTerm": {"type": "number", "min": 1, "max": 50},
    "currency": {"type": "string", "enum": ["BRL", "USD", "EUR"]},
    "labels": {"type": "object"}  # Permite personalização de todos os textos
}
```

**Interface do Admin:**
- Campos para título e subtítulo
- Color pickers para cores (título, subtítulo, primária, secundária)
- Campos numéricos para valores padrão
- Campos de texto para personalizar todos os labels

---

### 5. 🔥 Custom Code Section (custom-code)
**Descrição:** Permite inserir HTML, CSS e JavaScript customizado (PERIGO: só para admins!)

**Config Schema COMPLETO:**
```json
{
  "html": "<div class='custom-widget'><h3>Meu Widget</h3></div>",
  "css": ".custom-widget { background: #f0f0f0; padding: 20px; border-radius: 8px; }",
  "js": "console.log('Widget carregado!'); document.querySelector('.custom-widget').addEventListener('click', () => alert('Clicou!'));",
  "enableJs": false,
  "style": {
    "padding": "2rem 0"
  }
}
```

**SEGURANÇA CRÍTICA:**
```python
def validate_custom_code(config: dict, user: User) -> dict:
    """
    🔴 ATENÇÃO: Custom Code pode ser usado para XSS e outros ataques!
    Apenas super admins confiáveis devem ter acesso a enableJs=true
    """
    
    # Apenas super admins podem habilitar JS
    if config.get('enableJs', False) and not user.is_superuser:
        config['enableJs'] = False
        config['js'] = ''
        log_security_warning(user.id, "Tentativa de habilitar JS sem permissão")
        
    # Sanitizar HTML se JS não habilitado
    if not config.get('enableJs', False):
        import bleach
        config['html'] = bleach.clean(
            config.get('html', ''),
            tags=['div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
                  'a', 'img', 'ul', 'ol', 'li', 'br', 'strong', 'em', 'table', 
                  'tr', 'td', 'th', 'thead', 'tbody'],
            attributes={
                '*': ['class', 'id', 'style'],
                'a': ['href', 'target', 'rel'],
                'img': ['src', 'alt', 'width', 'height']
            }
        )
    
    # Validar CSS (remover @import e url() com domínios suspeitos)
    config['css'] = sanitize_css(config.get('css', ''))
    
    # Limite de tamanho
    if len(config.get('html', '')) > 50000:  # 50KB limite
        raise ValidationError("HTML muito grande (máximo 50KB)")
    
    if len(config.get('css', '')) > 50000:
        raise ValidationError("CSS muito grande (máximo 50KB)")
        
    if len(config.get('js', '')) > 50000:
        raise ValidationError("JavaScript muito grande (máximo 50KB)")
    
    return config

def sanitize_css(css: str) -> str:
    """Remove código CSS perigoso"""
    # Remover @import
    css = re.sub(r'@import\s+.*?;', '', css, flags=re.IGNORECASE)
    
    # Remover url() com javascript:
    css = re.sub(r'url\s*\(\s*["\']?\s*javascript:', 'url(about:blank', css, flags=re.IGNORECASE)
    
    # Remover expression (IE specific)
    css = re.sub(r'expression\s*\(', '', css, flags=re.IGNORECASE)
    
    return css
```

**Validação Backend:**
```python
custom_code_schema = {
    "html": {"type": "string", "required": False, "maxLength": 50000},
    "css": {"type": "string", "required": False, "maxLength": 50000},
    "js": {"type": "string", "required": False, "maxLength": 50000},
    "enableJs": {
        "type": "boolean",
        "default": False,
        "permission": "superuser_only"  # Flag especial
    }
}
```

**Interface do Admin:**
- Editor de código para HTML (com syntax highlighting)
- Editor de código para CSS
- Editor de código para JS (desabilitado se não for superuser)
- Toggle "Habilitar JavaScript" (só aparece para superusers)
- Preview em tempo real
- **AVISO VERMELHO**: "CUIDADO: Código JavaScript pode comprometer a segurança do site"

---

### 6. 🎨 Flex Container (flex-container)
**Descrição:** Container flexbox que pode conter outros componentes dentro

**Config Schema COMPLETO:**
```json
{
  "direction": "row",
  "justifyContent": "space-between",
  "alignItems": "center",
  "wrap": "wrap",
  "gap": "2rem",
  "children": [
    {
      "type": "text-block",
      "config": {
        "content": "<h3>Coluna 1</h3><p>Conteúdo da primeira coluna</p>"
      }
    },
    {
      "type": "text-block",
      "config": {
        "content": "<h3>Coluna 2</h3><p>Conteúdo da segunda coluna</p>"
      }
    }
  ],
  "style": {
    "padding": "3rem 0",
    "backgroundColor": "#f9fafb"
  }
}
```

**Validação Backend:**
```python
flex_container_schema = {
    "direction": {
        "type": "string",
        "enum": ["row", "row-reverse", "column", "column-reverse"],
        "default": "row"
    },
    "justifyContent": {
        "type": "string",
        "enum": ["flex-start", "flex-end", "center", "space-between", "space-around", "space-evenly"],
        "default": "flex-start"
    },
    "alignItems": {
        "type": "string",
        "enum": ["flex-start", "flex-end", "center", "stretch", "baseline"],
        "default": "stretch"
    },
    "wrap": {
        "type": "string",
        "enum": ["nowrap", "wrap", "wrap-reverse"],
        "default": "wrap"
    },
    "gap": {"type": "string", "pattern": r"^\d+(\.\d+)?(px|rem|em|%)$"},
    "children": {
        "type": "array",
        "required": True,
        "minItems": 1,
        "maxItems": 20,  # Limite razoável
        "items": {
            "type": "object",
            "properties": {
                "type": {"type": "string", "required": True},
                "config": {"type": "object", "required": True}
            }
        }
    }
}

def validate_container_nesting(children: list, depth: int = 0) -> bool:
    """Previne recursão infinita - máximo 3 níveis de profundidade"""
    if depth > 3:
        raise ValidationError("Máximo de 3 níveis de containers aninhados")
    
    for child in children:
        if child['type'] in ['flex-container', 'grid-container']:
            validate_container_nesting(child['config'].get('children', []), depth + 1)
    
    return True
```

**Interface do Admin:**
- Dropdowns para direction, justifyContent, alignItems, wrap
- Campo para gap (com unidade: px, rem, %)
- **ÁREA DE DRAG-AND-DROP:**
  - Lista de componentes disponíveis para arrastar
  - Preview visual do container
  - Botões para adicionar/remover/reordenar filhos
  - Cada filho pode ser configurado clicando nele

---

### 7. 📐 Grid Container (grid-container)
**Descrição:** Container CSS Grid que pode conter outros componentes

**Config Schema COMPLETO:**
```json
{
  "columns": "repeat(3, 1fr)",
  "rows": "auto",
  "gap": "2rem",
  "autoFlow": "row",
  "children": [
    {
      "type": "text-block",
      "config": {
        "content": "<h3>Card 1</h3>"
      },
      "gridColumn": "1 / 2",
      "gridRow": "1 / 2"
    },
    {
      "type": "text-block",
      "config": {
        "content": "<h3>Card 2</h3>"
      },
      "gridColumn": "2 / 3",
      "gridRow": "1 / 2"
    }
  ],
  "style": {
    "padding": "3rem 0"
  }
}
```

**Validação Backend:**
```python
grid_container_schema = {
    "columns": {
        "type": "string",
        "required": True,
        "examples": ["repeat(3, 1fr)", "200px 1fr 2fr", "auto auto auto"]
    },
    "rows": {
        "type": "string",
        "default": "auto",
        "examples": ["repeat(2, 200px)", "auto 1fr auto"]
    },
    "gap": {"type": "string", "pattern": r"^\d+(\.\d+)?(px|rem|em)$"},
    "autoFlow": {
        "type": "string",
        "enum": ["row", "column", "row dense", "column dense"],
        "default": "row"
    },
    "children": {
        "type": "array",
        "required": True,
        "minItems": 1,
        "items": {
            "type": "object",
            "properties": {
                "type": {"type": "string", "required": True},
                "config": {"type": "object", "required": True},
                "gridColumn": {"type": "string"},  # "1 / 3" ou "span 2"
                "gridRow": {"type": "string"}
            }
        }
    }
}
```

**Interface do Admin:**
- Campo para definir colunas (com exemplos)
- Campo para definir linhas
- Campo para gap
- Dropdown para autoFlow
- **GRID VISUAL BUILDER:**
  - Preview do grid com linhas e colunas visíveis
  - Drag-and-drop de componentes
  - Cada célula pode ser clicada para adicionar componente
  - Permite spanning (ocupar múltiplas células)

---

## 🔴 ATUALIZAÇÕES NECESSÁRIAS EM COMPONENTES EXISTENTES:

### Hero Section - PRECISA DE MAIS CORES
**ADICIONAR ao config existente:**
```json
{
  "titleColor": "#1a202c",
  "subtitleColor": "#4a5568",
  "buttonBackground": "#667eea",
  "buttonColor": "white",
  "buttonHoverBackground": "#5a67d8",
  "overlayColor": "rgba(0, 0, 0, 0.3)",
  "overlayBlur": "none"
}
```

### Text Block - PRECISA DE CORES E TAMANHOS
**ADICIONAR ao config existente:**
```json
{
  "textColor": "#333333",
  "linkColor": "#004AAD",
  "headingColor": "#1a202c",
  "fontSize": "1rem",
  "fontWeight": "400",
  "lineHeight": "1.6",
  "textAlign": "left"
}
```

### Property Grid - PRECISA DE PERSONALIZAÇÃO DE CARD
**ADICIONAR ao config existente:**
```json
{
  "titleColor": "#1a202c",
  "subtitleColor": "#718096",
  "cardBackground": "white",
  "cardBorderColor": "#e2e8f0",
  "priceColor": "#2c7a7b",
  "buttonBackground": "#667eea",
  "buttonColor": "white"
}
```

---

## 🎯 INTERFACE DO ADMIN - REQUISITOS:

### 1. Editor Visual de Seções
- **Sidebar:** Lista de componentes disponíveis (arrastar para adicionar)
- **Canvas:** Preview em tempo real do site
- **Properties Panel:** Edição de propriedades do componente selecionado

### 2. Color Picker Universal
- Suporte a:
  - Hex (#FF5733)
  - RGB (rgb(255, 87, 51))
  - RGBA (rgba(255, 87, 51, 0.8))
  - Named colors (white, black, red)
  - Gradientes (linear-gradient, radial-gradient)
- Palette de cores do tema visível
- Histórico de cores usadas

### 3. Icon Picker
- Biblioteca FontAwesome completa
- Busca por nome ou categoria
- Preview do ícone

### 4. Array Editor (para FAQ items, Features, etc.)
- Adicionar novo item
- Remover item
- Reordenar (drag-and-drop)
- Duplicar item
- Expandir/Colapsar cada item

### 5. Style Editor
- **Modo Básico:** Campos comuns (padding, margin, background, color)
- **Modo Avançado:** Campo de texto JSON para `style` completo
- Toggle entre modos

---

## 🔒 VALIDAÇÃO E SEGURANÇA:

### 1. Validação de Cores
```python
def validate_color(color: str) -> bool:
    """Valida se é uma cor CSS válida"""
    patterns = [
        r'^#[0-9A-Fa-f]{6}$',  # Hex
        r'^#[0-9A-Fa-f]{3}$',  # Hex curto
        r'^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$',  # RGB
        r'^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)$',  # RGBA
        r'^[a-z]+$',  # Named colors
        r'^linear-gradient\(',  # Gradients
        r'^radial-gradient\('
    ]
    return any(re.match(pattern, color, re.IGNORECASE) for pattern in patterns)
```

### 2. Sanitização de HTML (para text-block e custom-code)
```python
import bleach

def sanitize_html(html: str, allow_js: bool = False) -> str:
    """Remove tags perigosas do HTML"""
    if allow_js:
        # Se JS permitido, apenas log (responsabilidade do superuser)
        log_html_with_js(html)
        return html
    
    return bleach.clean(
        html,
        tags=['div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
              'a', 'img', 'ul', 'ol', 'li', 'br', 'strong', 'em', 'table', 
              'tr', 'td', 'th', 'thead', 'tbody', 'section', 'article'],
        attributes={
            '*': ['class', 'id', 'style'],
            'a': ['href', 'target', 'rel'],
            'img': ['src', 'alt', 'width', 'height']
        }
    )
```

### 3. Validação de Nesting de Containers
```python
def validate_container_depth(section: dict, depth: int = 0, max_depth: int = 3) -> None:
    """Previne recursão infinita em containers aninhados"""
    if depth > max_depth:
        raise ValidationError(f"Containers não podem ter mais de {max_depth} níveis de profundidade")
    
    if section.get('type') in ['flex-container', 'grid-container']:
        for child in section.get('config', {}).get('children', []):
            validate_container_depth(child, depth + 1, max_depth)
```

---

## 📊 ENDPOINTS DA API:

### 1. GET /api/website/:company_id/layout
**Retorna:** Estrutura completa do layout com todos os componentes

### 2. PUT /api/website/:company_id/layout
**Body:**
```json
{
  "layout": [
    {
      "type": "hero",
      "config": { ... }
    },
    {
      "type": "flex-container",
      "config": {
        "children": [
          { "type": "text-block", "config": {...} },
          { "type": "text-block", "config": {...} }
        ]
      }
    }
  ]
}
```

### 3. POST /api/newsletter/subscribe
**Body:**
```json
{
  "email": "usuario@email.com",
  "company_id": "uuid"
}
```

### 4. GET /api/website/:company_id/theme
**Retorna:** Cores e estilos globais do tema
```json
{
  "primaryColor": "#004AAD",
  "secondaryColor": "#FFA500",
  "fontFamily": "Inter, sans-serif",
  ...
}
```

### 5. PUT /api/website/:company_id/theme
**Body:** Objeto com as cores do tema

---

## 🧪 EXEMPLOS DE LAYOUTS COMPLETOS:

### Exemplo 1: Homepage Simples
```json
{
  "layout": [
    {
      "type": "hero",
      "config": {
        "title": "Encontre o Imóvel dos Seus Sonhos",
        "subtitle": "Milhares de opções em todo o Brasil",
        "buttonText": "Ver Imóveis",
        "buttonLink": "/search",
        "backgroundImage": "https://cdn.example.com/hero.jpg",
        "titleColor": "white",
        "overlayColor": "rgba(0, 0, 0, 0.5)"
      }
    },
    {
      "type": "property-grid",
      "config": {
        "title": "Imóveis em Destaque",
        "subtitle": "Confira as melhores oportunidades",
        "limit": 6
      }
    },
    {
      "type": "features-grid",
      "config": {
        "title": "Por que escolher a gente?",
        "features": [
          {
            "icon": "fas fa-shield-alt",
            "title": "Segurança Total",
            "description": "Transações 100% seguras"
          },
          {
            "icon": "fas fa-clock",
            "title": "Atendimento 24/7",
            "description": "Sempre disponíveis"
          }
        ]
      }
    },
    {
      "type": "newsletter",
      "config": {
        "title": "Receba Novidades",
        "subtitle": "Fique por dentro dos lançamentos"
      }
    }
  ]
}
```

### Exemplo 2: Landing Page com Layout Avançado
```json
{
  "layout": [
    {
      "type": "hero",
      "config": {...}
    },
    {
      "type": "flex-container",
      "config": {
        "direction": "row",
        "justifyContent": "space-between",
        "gap": "2rem",
        "children": [
          {
            "type": "text-block",
            "config": {
              "content": "<h2>Sobre Nós</h2><p>Texto sobre a empresa...</p>",
              "textColor": "#333"
            }
          },
          {
            "type": "grid-container",
            "config": {
              "columns": "repeat(2, 1fr)",
              "gap": "1rem",
              "children": [
                {
                  "type": "text-block",
                  "config": {
                    "content": "<h3>Missão</h3><p>Nossa missão...</p>"
                  }
                },
                {
                  "type": "text-block",
                  "config": {
                    "content": "<h3>Visão</h3><p>Nossa visão...</p>"
                  }
                }
              ]
            }
          }
        ]
      }
    },
    {
      "type": "faq",
      "config": {
        "title": "Dúvidas Frequentes",
        "items": [...]
      }
    }
  ]
}
```

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO:

### Backend:
- [ ] Criar tabela `website_themes` (cores globais por company)
- [ ] Criar tabela `newsletter_subscribers`
- [ ] Adicionar suporte aos 7 novos tipos de componente no modelo `WebsiteSection`
- [ ] Implementar validação de containers aninhados (max 3 níveis)
- [ ] Implementar sanitização de HTML/CSS/JS para custom-code
- [ ] Criar endpoint POST /api/newsletter/subscribe
- [ ] Adicionar validação de permissão para enableJs (apenas superuser)
- [ ] Implementar schemas de validação para cada tipo de componente
- [ ] Adicionar suporte ao objeto `style` (aceitar qualquer propriedade CSS)

### Admin Frontend:
- [ ] Criar editor visual de layout com drag-and-drop
- [ ] Implementar color picker universal (hex, rgb, rgba, gradientes)
- [ ] Criar icon picker (FontAwesome)
- [ ] Implementar array editor para FAQ items e Features
- [ ] Criar editor de código para custom-code (HTML/CSS/JS)
- [ ] Adicionar preview em tempo real
- [ ] Implementar editor de tema global (cores principais)
- [ ] Criar interface para flex-container (visual builder)
- [ ] Criar interface para grid-container (grid visual)
- [ ] Adicionar avisos de segurança para custom-code com JS

### Testes:
- [ ] Testar validação de cores (hex, rgb, rgba, gradientes)
- [ ] Testar sanitização de HTML (remover tags perigosas)
- [ ] Testar validação de nesting (containers com mais de 3 níveis)
- [ ] Testar permissões (apenas superuser pode enableJs=true)
- [ ] Testar newsletter subscribe endpoint
- [ ] Testar criação de layouts complexos com containers
- [ ] Testar renderização de custom-code com e sem JS

---

## 🚨 AVISOS IMPORTANTES:

1. **Custom Code é PERIGOSO:**
   - Apenas super admins confiáveis devem ter acesso
   - enableJs=false por padrão
   - Sanitizar SEMPRE o HTML quando JS desabilitado
   - Limitar tamanho dos códigos (50KB)

2. **Container Nesting:**
   - Máximo 3 níveis de profundidade
   - Validar no backend antes de salvar
   - Frontend deve prevenir adição além do limite

3. **Performance:**
   - Limitar número de itens em arrays (FAQ: max 50, Features: max 12)
   - Otimizar imagens em backgroundImage
   - Lazy loading de componentes pesados

4. **SEO:**
   - Garantir que text-blocks tenham HTML semântico
   - Preservar h1, h2, h3 na ordem correta
   - Adicionar alt text em todas as imagens

---

## 📚 DOCUMENTAÇÃO ADICIONAL:

### CSS Grid - Exemplos de `columns`:
```
"repeat(3, 1fr)"          → 3 colunas iguais
"200px 1fr 2fr"           → 200px, resto dividido 1:2
"auto auto auto"          → 3 colunas auto-ajustáveis
"minmax(200px, 1fr) 1fr"  → Mínimo 200px, máximo proporcional
```

### Flexbox - Combinações Úteis:
```json
// Centralizado vertical e horizontal
{"justifyContent": "center", "alignItems": "center"}

// Espaçamento igual entre itens
{"justifyContent": "space-between", "alignItems": "stretch"}

// Coluna com itens centralizados
{"direction": "column", "alignItems": "center"}
```

### FontAwesome - Categorias Úteis:
- **Imóveis:** fa-home, fa-building, fa-key, fa-door-open
- **Segurança:** fa-shield-alt, fa-lock, fa-check-circle
- **Contato:** fa-phone, fa-envelope, fa-map-marker-alt
- **Financeiro:** fa-dollar-sign, fa-calculator, fa-chart-line

---

## 🎨 PALETA DE CORES SUGERIDA (para visualConfig.theme):

```json
{
  "visualConfig": {
    "theme": {
      "primaryColor": "#004AAD",      // Azul principal
      "secondaryColor": "#FFA500",    // Laranja secundário
      "accentColor": "#2c7a7b",       // Verde-azulado accent
      "textColor": "#333333",         // Texto padrão
      "textLightColor": "#718096",    // Texto secundário
      "backgroundColor": "#ffffff",   // Fundo branco
      "backgroundDark": "#1a202c",    // Fundo escuro
      "borderColor": "#e2e8f0",       // Bordas suaves
      "successColor": "#10b981",      // Verde sucesso
      "errorColor": "#ef4444",        // Vermelho erro
      "warningColor": "#f59e0b",      // Amarelo aviso
      "infoColor": "#3b82f6"          // Azul informação
    }
  }
}
```

---

## 🔧 MIGRAÇÕES DE BANCO DE DADOS:

```sql
-- Adicionar coluna para custom theme
ALTER TABLE companies ADD COLUMN visual_config JSONB DEFAULT '{"theme": {}}';

-- Criar tabela de newsletter
CREATE TABLE newsletter_subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    subscribed_at TIMESTAMP DEFAULT NOW(),
    source VARCHAR(50) DEFAULT 'website',
    active BOOLEAN DEFAULT TRUE,
    UNIQUE(email, company_id)
);

-- Índices
CREATE INDEX idx_newsletter_company ON newsletter_subscribers(company_id);
CREATE INDEX idx_newsletter_email ON newsletter_subscribers(email);
```

---

**FIM DO DOCUMENTO**

Qualquer dúvida sobre implementação, entre em contato!
  "css": ".custom-widget { background: #f0f0f0; padding: 20px; border-radius: 8px; }",
  "js": "console.log('Widget carregado!'); document.querySelector('.custom-widget').addEventListener('click', () => alert('Clicou!'));",
  "enableJs": true,
  "style": {
    "padding": "2rem 0"
  }
}
```
**Segurança:** O campo `enableJs` deve ser `false` por padrão. Apenas administradores devem poder habilitar JavaScript.

### 6. 🎨 Flex Container (flex-container)
**Descrição:** Container flexbox para organizar outros componentes
**IMPORTANTE:** Este é um container que pode conter outros componentes filhos
**Config Schema:**
```json
{
  "direction": "row",
  "justifyContent": "space-between",
  "alignItems": "center",
  "wrap": "wrap",
  "gap": "2rem",
  "padding": "3rem",
  "backgroundColor": "#ffffff",
  "children": [
    {
      "type": "text-block",
      "config": { "title": "Coluna 1" }
    },
    {
      "type": "text-block",
      "config": { "title": "Coluna 2" }
    }
  ],
  "style": {
    "maxWidth": "1400px",
    "margin": "0 auto"
  }
}
```
**Propriedades Flexbox:**
- `direction`: 'row' | 'column' | 'row-reverse' | 'column-reverse'
- `justifyContent`: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly'
- `alignItems`: 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline'
- `wrap`: 'nowrap' | 'wrap' | 'wrap-reverse'

### 7. 📐 Grid Container (grid-container)
**Descrição:** Container CSS Grid para layouts complexos
**IMPORTANTE:** Este é um container que pode conter outros componentes filhos
**Config Schema:**
```json
{
  "columns": "repeat(3, 1fr)",
  "rows": "auto",
  "gap": "2rem",
  "padding": "3rem",
  "backgroundColor": "#f9fafb",
  "children": [
    {
      "type": "text-block",
      "config": { "title": "Item 1" }
    },
    {
      "type": "text-block",
      "config": { "title": "Item 2" }
    },
    {
      "type": "text-block",
      "config": { "title": "Item 3" }
    }
  ],
  "style": {
    "maxWidth": "1400px"
  }
}
```
**Propriedades Grid:**
- `columns`: Valor CSS válido para grid-template-columns (ex: "repeat(3, 1fr)", "300px 1fr 2fr")
- `rows`: Valor CSS válido para grid-template-rows (ex: "auto", "200px 1fr")
- `gap`: Espaçamento entre itens (ex: "1rem", "20px 30px")

---

## TAREFAS NECESSÁRIAS NO BACKEND:

### 1. Sistema de Estilos Flexível
```python
# Exemplo de validação de estilos (Python/Django)
def validate_style_config(style: dict) -> bool:
    """
    Valida se os estilos fornecidos são propriedades CSS válidas.
    Não restrinja - aceite qualquer propriedade CSS.
    """
    # Lista de propriedades CSS comuns (não exaustiva)
    # Aceitar QUALQUER string como chave
    return isinstance(style, dict)

# Schema do componente deve aceitar:
component_schema = {
    "config": {
        "type": "object",
        "properties": {
            # ... configurações específicas do componente
        }
    },
    "style": {
        "type": "object",
        "additionalProperties": True,  # Permitir qualquer propriedade
        "description": "Aceita qualquer propriedade CSS válida"
    }
}
```

### 2. Adicionar Novos Tipos de Componentes
```typescript
// Enum de tipos de componentes
enum ComponentType {
  // ... tipos existentes
  FAQ = 'faq',
  FEATURES_GRID = 'features-grid',
  NEWSLETTER = 'newsletter',
  MORTGAGE_CALCULATOR = 'mortgage-calculator',
  CUSTOM_CODE = 'custom-code',
  FLEX_CONTAINER = 'flex-container',
  GRID_CONTAINER = 'grid-container'
}
```

### 3. Validação de Componentes Aninhados
Para `flex-container` e `grid-container`, validar que:
- O campo `children` é um array
- Cada item em `children` tem os campos `type` e `config`
- Não permitir aninhamento infinito (limite de 3 níveis)

```python
def validate_children_depth(children: list, current_depth: int = 0, max_depth: int = 3) -> bool:
    if current_depth > max_depth:
        raise ValidationError("Aninhamento muito profundo (máximo 3 níveis)")
    
    for child in children:
        if 'children' in child.get('config', {}):
            validate_children_depth(child['config']['children'], current_depth + 1, max_depth)
    
    return True
```

### 4. Segurança para Custom Code
```python
def validate_custom_code(config: dict, user: User) -> dict:
    """
    Validar código customizado por questões de segurança
    """
    # JavaScript só pode ser habilitado por admins
    if config.get('enableJs', False):
        if not user.is_superuser:
            config['enableJs'] = False
            config['js'] = ''  # Remover JS se não for admin
    
    # Sanitizar HTML (remover scripts inline se JS não habilitado)
    if not config.get('enableJs', False):
        config['html'] = sanitize_html(config.get('html', ''))
    
    return config
```

### 5. Interface do Admin - Editor de Estilos
Crie uma interface no admin para editar estilos visualmente:

```javascript
// Exemplo de campos comuns de estilo no admin
const styleFields = [
  // Layout
  { name: 'display', type: 'select', options: ['block', 'flex', 'grid', 'inline-block'] },
  { name: 'padding', type: 'text', placeholder: '2rem 0' },
  { name: 'margin', type: 'text', placeholder: '1rem 0' },
  
  // Cores
  { name: 'backgroundColor', type: 'color' },
  { name: 'color', type: 'color' },
  
  // Texto
  { name: 'fontSize', type: 'text', placeholder: '1rem' },
  { name: 'fontWeight', type: 'select', options: ['400', '500', '600', '700', '800'] },
  { name: 'textAlign', type: 'select', options: ['left', 'center', 'right'] },
  
  // Dimensões
  { name: 'width', type: 'text', placeholder: '100%' },
  { name: 'maxWidth', type: 'text', placeholder: '1200px' },
  { name: 'minHeight', type: 'text', placeholder: '300px' },
  
  // Visual
  { name: 'borderRadius', type: 'text', placeholder: '8px' },
  { name: 'boxShadow', type: 'text', placeholder: '0 4px 8px rgba(0,0,0,0.1)' },
  
  // Avançado (campo de texto livre para propriedades customizadas)
  { name: 'customCSS', type: 'textarea', placeholder: 'transform: scale(1.05);\ntransition: all 0.3s ease;' }
];
```

### 6. Biblioteca de Componentes Atualizada
```json
{
  "components": [
    {
      "type": "faq",
      "name": "FAQ / Perguntas Frequentes",
      "icon": "fas fa-question-circle",
      "category": "Content",
      "description": "Seção de perguntas e respostas com accordion",
      "defaultConfig": {
        "title": "Perguntas Frequentes",
        "items": []
      },
      "styleOptions": ["backgroundColor", "padding", "textColor"]
    },
    {
      "type": "custom-code",
      "name": "Código Customizado",
      "icon": "fas fa-code",
      "category": "Advanced",
      "description": "Insira HTML, CSS e JavaScript customizado",
      "requiresAdmin": true,
      "defaultConfig": {
        "html": "<div>Meu código aqui</div>",
        "css": "",
        "js": "",
        "enableJs": false
      }
    },
    {
      "type": "flex-container",
      "name": "Container Flexbox",
      "icon": "fas fa-columns",
      "category": "Layout",
      "description": "Organize componentes com Flexbox",
      "defaultConfig": {
        "direction": "row",
        "justifyContent": "space-between",
        "children": []
      }
    },
    {
      "type": "grid-container",
      "name": "Container Grid",
      "icon": "fas fa-th",
      "category": "Layout",
      "description": "Organize componentes com CSS Grid",
      "defaultConfig": {
        "columns": "repeat(3, 1fr)",
        "gap": "2rem",
        "children": []
      }
    }
  ]
}
```

---

## EXEMPLOS DE USO - ALTA PERSONALIZAÇÃO:

### Exemplo 1: Hero com Gradiente Customizado
```json
{
  "type": "hero",
  "config": {
    "title": "Bem-vindo",
    "subtitle": "Encontre seu lar"
  },
  "style": {
    "background": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    "minHeight": "600px",
    "display": "flex",
    "alignItems": "center",
    "justifyContent": "center",
    "color": "white",
    "textShadow": "0 2px 4px rgba(0,0,0,0.2)"
  }
}
```

### Exemplo 2: Seção com Animação
```json
{
  "type": "text-block",
  "config": {
    "title": "Título Animado",
    "content": "Conteúdo"
  },
  "style": {
    "padding": "4rem 2rem",
    "transform": "translateY(0)",
    "transition": "all 0.3s ease",
    "opacity": "1"
  }
}
```

### Exemplo 3: Layout Complexo com Grid
```json
{
  "type": "grid-container",
  "config": {
    "columns": "2fr 1fr",
    "rows": "auto 300px",
    "gap": "2rem",
    "children": [
      {
        "type": "text-block",
        "config": { "title": "Conteúdo Principal" }
      },
      {
        "type": "newsletter",
        "config": { "title": "Newsletter" }
      },
      {
        "type": "property-grid",
        "config": { "limit": 3 }
      },
      {
        "type": "faq",
        "config": { "title": "FAQ" }
      }
    ]
  },
  "style": {
    "maxWidth": "1400px",
    "margin": "0 auto",
    "padding": "3rem"
  }
}
```

### Exemplo 4: Widget Customizado com JavaScript
```json
{
  "type": "custom-code",
  "config": {
    "html": "<div id='contador'>0</div><button onclick='incrementar()'>Clique</button>",
    "css": "#contador { font-size: 3rem; font-weight: bold; text-align: center; color: #667eea; } button { padding: 1rem 2rem; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer; }",
    "js": "let count = 0; function incrementar() { count++; document.getElementById('contador').textContent = count; }",
    "enableJs": true
  },
  "style": {
    "padding": "3rem",
    "backgroundColor": "#f9fafb"
  }
}
```

---

## COMPONENTES ADICIONAIS SUGERIDOS (IMPLEMENTAR DEPOIS):

### Nível Básico:
- **Logo Grid** (logo-grid) - Grade de logos de parceiros/clientes
- **Social Media Links** (social-media) - Links para redes sociais
- **Pricing Table** (pricing-table) - Tabela de preços/planos

### Nível Intermediário:
- **Property Comparison** (property-comparison) - Comparação lado-a-lado de imóveis
- **Neighborhood Info** (neighborhood-info) - Informações sobre o bairro
- **Agent Profile** (agent-profile) - Card de perfil do corretor
- **Review/Rating** (review-section) - Avaliações e estrelas

### Nível Avançado:
- **Schedule Visit** (schedule-visit) - Calendário para agendar visitas
- **Virtual Tour** (virtual-tour) - Integração com tour 360°
- **Property Favorites** (property-favorites) - Lista de favoritos do usuário
- **Advanced Search** (advanced-search) - Busca com múltiplos filtros
- **Property Value Estimator** (property-estimator) - Estimador de valor de imóvel

---

## FORMATO DE RESPOSTA ESPERADO:

Para cada componente implementado, confirme:
1. ✅ Tipo adicionado ao sistema
2. ✅ Schema de validação criado
3. ✅ Disponível na biblioteca de componentes
4. ✅ Endpoints testados

Implemente primeiro os 4 componentes principais (FAQ, Features Grid, Newsletter, Mortgage Calculator) e depois podemos adicionar os outros conforme necessário.
