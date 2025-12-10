# Alancarmo Corretor - CRM Completo para Venda de Imóveis

Sistema CRM profissional completo para corretora especializada em venda de imóveis, com painel administrativo, busca avançada e mapas interativos.

## 🚀 Funcionalidades Implementadas

### 🏠 Website Principal (Cliente)
- ✅ Design responsivo moderno (mobile-first)
- ✅ Header fixo com navegação suave
- ✅ Hero section com call-to-action
- ✅ Seção Sobre (missão, visão, valores)
- ✅ Serviços (venda de imóveis, financiamento, seguros)
- ✅ Listagem dinâmica de imóveis
- ✅ Carrossel de depoimentos
- ✅ Formulário de contato
- ✅ Google Maps integrado
- ✅ Footer completo com links rápidos
- ✅ Botão flutuante WhatsApp

### 🔍 Página de Busca Avançada
- ✅ Busca por texto livre (título, descrição, localização)
- ✅ Filtros avançados:
  - Tipo de imóvel
  - Cidade/Bairro
  - Número de quartos (1+, 2+, 3+, 4+)
  - Faixa de preço (mín/máx)
- ✅ Ordenação (destaques, preço, mais recentes)
- ✅ Paginação (9 imóveis por página)
- ✅ Skeleton loading
- ✅ Grid responsivo

### 🗺️ Visualização em Mapa
- ✅ Mapa interativo Leaflet/OpenStreetMap
- ✅ Marcadores para todos os imóveis
- ✅ Marcadores personalizados (estrela dourada para destaques)
- ✅ Popups com informações completas
- ✅ Auto-fit para mostrar todos os imóveis
- ✅ Toggle entre visualização Grade/Mapa
- ✅ Botão WhatsApp direto no popup

### 🛠️ Painel Administrativo (CRM)
- ✅ Dashboard com estatísticas em tempo real:
  - Total de imóveis
  - Disponíveis para venda
  - Em destaque
  - Vendidos
- ✅ CRUD completo de imóveis
- ✅ CEP com auto-preenchimento (via ViaCEP):
  - Rua/Avenida
  - Bairro
  - Cidade
  - Estado
  - Coordenadas (lat/lng) automáticas
- ✅ Suporte a múltiplas imagens (galeria)
- ✅ Flags de destaque e vendido
- ✅ Interface moderna e intuitiva
- ✅ Validação de formulários
- ✅ Preview em tempo real

### 🔐 Sistema de Autenticação
- ✅ Login seguro com senha
- ✅ Hash de senha (bcryptjs)
- ✅ Gerenciamento de sessão
- ✅ Proteção de rotas administrativas
- ✅ Logout com limpeza de token
- ✅ UI de login moderna com animações

### ⚙️ Backend & API
- ✅ Node.js + Express
- ✅ 11 endpoints RESTful:
  - Propriedades (CRUD completo)
  - CEP lookup
  - Geocodificação
  - Autenticação
  - Estatísticas
- ✅ Rate limiting (100 req/15min API, 500 req/15min estáticos)
- ✅ CORS configurado
- ✅ Validação de campos
- ✅ Armazenamento JSON (fácil migração para banco de dados)
- ✅ Sanitização de inputs
- ✅ Proteção contra path traversal

### 🎨 Design & UI/UX
- ✅ Paleta de cores: Azul #004AAD, Branco, Cinza #F5F5F5
- ✅ Fonte: Poppins (Google Fonts)
- ✅ Ícones: Font Awesome 6.4.0
- ✅ Animações suaves (fade-in, slide, hover)
- ✅ Transições fluidas
- ✅ Cards com sombras e hover effects
- ✅ Dashboard premium style
- ✅ Componentes reutilizáveis

---

## 📋 Pré-requisitos

- Node.js v20.19.5 ou superior
- npm 10.8.2 ou superior

---

## 🔧 Instalação

1. **Clone o repositório:**
```bash
git clone https://github.com/sanpaa/sanpaa.git
cd sanpaa
```

2. **Instale as dependências:**
```bash
npm install
```

3. **Inicie o servidor:**
```bash
npm start
```

O servidor estará rodando em `http://localhost:3000`

---

## 🌐 Páginas Disponíveis

### Website Público (Angular SPA)
- **Página Principal**: `http://localhost:3000/`
- **Buscar Imóveis**: `http://localhost:3000/buscar`
- **Detalhes do Imóvel**: `http://localhost:3000/imovel/:id`

### Área Administrativa (Angular)
- **Login Admin**: `http://localhost:3000/admin/login`
- **Painel Admin**: `http://localhost:3000/admin` (protegido)

### Legacy Admin (Somente para referência)
- **Admin Legacy**: `http://localhost:3000/admin-legacy`

---

## 🔑 Credenciais Padrão

**Login Administrativo:**
- **Usuário**: `admin`
- **Senha**: `admin123`

⚠️ **IMPORTANTE:** Altere estas credenciais em produção!

Para alterar a senha, edite o arquivo `server.js` e modifique:
```javascript
const ADMIN_PASSWORD_HASH = bcrypt.hashSync('sua_nova_senha', 10);
```

---

## 📖 Como Usar

### 1. Adicionar um Imóvel

1. Acesse o painel admin: `http://localhost:3000/admin/login.html`
2. Faça login com as credenciais
3. Clique em "Adicionar Imóvel"
4. Preencha os campos obrigatórios:
   - Tipo de Imóvel
   - Título
   - Descrição (opcional mas recomendado)
   - Preço
   - **CEP** (será auto-preenchido ao sair do campo)
   - Endereço, bairro, cidade, estado (preenchidos automaticamente)
   - Coordenadas (geradas automaticamente)
   - Quartos, Banheiros, Área, Vagas
   - URLs das Imagens (uma por linha)
   - Contato (telefone WhatsApp)
5. Marque flags (opcional):
   - "Imóvel em Destaque" - aparecerá com badge dourado
   - "Marcar como Vendido" - remove da listagem pública
6. Clique em "Salvar"

### 2. Buscar Imóveis (Usuário)

1. Acesse: `http://localhost:3000/buscar`
2. Use os filtros:
   - Busca livre (texto)
   - Tipo de imóvel
   - Cidade
   - Número de quartos
   - Faixa de preço
3. Clique em "Buscar"
4. Alterne entre visualização Grade/Mapa
5. Clique em "Tenho Interesse" para contatar via WhatsApp

### 3. Visualizar Estatísticas

As estatísticas aparecem automaticamente no topo do painel admin:
- **Total de Imóveis**: Todos os cadastrados
- **Disponíveis**: Não vendidos
- **Em Destaque**: Com flag de destaque
- **Vendidos**: Marcados como vendidos

---

## 🗺️ Integração de Mapas

### CEP Auto-Fill
Ao digitar um CEP válido e sair do campo:
1. Sistema consulta a API ViaCEP
2. Preenche automaticamente:
   - Rua/Avenida
   - Bairro
   - Cidade
   - Estado
3. Envia para geocodificação (Nominatim/OpenStreetMap)
4. Recebe latitude e longitude
5. Campos ficam read-only (gerados automaticamente)

### Visualização no Mapa
- Imóveis com coordenadas válidas aparecem no mapa
- Marcadores dourados para imóveis em destaque
- Click no marcador abre popup com:
  - Imagem do imóvel
  - Título
  - Localização
  - Preço
  - Detalhes (quartos, área)
  - Botão WhatsApp

---

## 🔌 API Endpoints

### Propriedades
```
GET    /api/properties        # Listar todos
GET    /api/properties/:id    # Buscar por ID
POST   /api/properties        # Criar novo
PUT    /api/properties/:id    # Atualizar
DELETE /api/properties/:id    # Deletar
```

### Utilitários
```
GET    /api/cep/:cep          # Buscar endereço por CEP
POST   /api/geocode           # Converter endereço em coordenadas
```

### Autenticação
```
POST   /api/auth/login        # Login admin
POST   /api/auth/logout       # Logout admin
GET    /api/auth/verify       # Verificar token
```

### Estatísticas
```
GET    /api/stats             # Dashboard stats
```

---

## 📂 Estrutura de Arquivos

```
/
├── frontend/              # Angular SPA
│   ├── src/
│   │   ├── app/          # Componentes e páginas Angular
│   │   └── styles.css    # Estilos globais
│   └── dist/             # Build de produção
├── server.js              # Backend Node.js/Express
├── package.json           # Dependências
├── netlify.toml          # Configuração Netlify
├── .gitignore            # Arquivos ignorados
├── README_ADMIN.md        # Esta documentação
├── README_ANGULAR.md      # Documentação Angular
├── admin/                 # Admin Legacy (referência)
│   ├── index.html        # Painel administrativo legacy
│   ├── admin.js          # Lógica do admin legacy
│   └── login.html        # Página de login legacy
├── src/                   # Backend (Onion Architecture)
│   ├── domain/           # Entidades e interfaces
│   ├── application/      # Serviços
│   ├── infrastructure/   # Repositórios
│   └── presentation/     # Rotas e controllers
└── data/
    └── properties.json    # Banco de dados (auto-criado)
```

---

## 🔒 Segurança

### Implementado
- ✅ Rate limiting em todas as rotas
- ✅ Hash de senhas com bcryptjs (10 salt rounds)
- ✅ Autenticação baseada em token
- ✅ Validação de sessão
- ✅ Proteção contra path traversal
- ✅ Whitelist de arquivos estáticos
- ✅ CORS configurado
- ✅ Sanitização de inputs
- ✅ CodeQL analysis: 0 vulnerabilidades

### Recomendações para Produção
1. Altere as credenciais padrão
2. Use HTTPS (SSL/TLS)
3. Configure variáveis de ambiente
4. Migre para banco de dados real (MongoDB, PostgreSQL)
5. Implemente JWT ao invés de tokens simples
6. Configure limites de upload de imagens
7. Adicione logs de auditoria
8. Configure backup automático

---

## 🎨 Personalização

### Cores
Edite as variáveis CSS em `styles.css`:
```css
:root {
    --primary-color: #004AAD;    /* Azul principal */
    --secondary-color: #0066CC;   /* Azul secundário */
    --white: #FFFFFF;
    --light-gray: #F5F5F5;
    /* ... */
}
```

### WhatsApp
Atualize o número em todos os arquivos (procure por `5511999999999`):
```javascript
// Formato: Código do país + DDD + Número
const whatsappNumber = '5511999999999';
```

### Google Maps
Para usar Google Maps no lugar do OpenStreetMap, configure a API key no ambiente do Angular e atualize o componente de mapa em `frontend/src/app/components/`.

---

## 📱 Responsividade

**Breakpoints:**
- Desktop: 1280px+
- Tablet: 768px - 1279px
- Mobile: até 767px

**Testado em:**
- ✅ Desktop (Chrome, Firefox, Safari)
- ✅ Tablet (iPad)
- ✅ Mobile (iPhone, Android)

---

## 🚀 Deploy

### GitHub Pages (Apenas Frontend Estático)
Não é possível usar o GitHub Pages para este projeto pois requer backend Node.js.

### Plataformas Recomendadas
- **Heroku** (fácil deploy, free tier disponível)
- **Railway** (moderno, bom suporte Node.js)
- **Render** (free tier generoso)
- **Vercel** (excelente para Node.js)
- **DigitalOcean App Platform**

### Deploy Heroku (Exemplo)
```bash
# 1. Criar app
heroku create seu-app-name

# 2. Push código
git push heroku main

# 3. Abrir
heroku open
```

---

## 🐛 Troubleshooting

### CEP não preenche automaticamente
- Verifique conexão com internet
- API ViaCEP pode estar temporariamente indisponível
- Teste com CEPs válidos (ex: 01310-100)

### Mapa não aparece
- Verifique se há imóveis com coordenadas válidas
- Leaflet requer conexão com internet
- Aguarde alguns segundos para carregar tiles

### Erro ao fazer login
- Verifique credenciais (usuário: admin, senha: admin123)
- Limpe localStorage do navegador
- Reinicie o servidor

### Imagens não carregam
- Verifique URLs das imagens
- Algumas URLs podem estar bloqueadas por CORS
- Use URLs públicas válidas

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Abra uma issue no GitHub
2. Entre em contato via WhatsApp
3. Consulte a documentação da API

---

## 📄 Licença

ISC License

---

## 👨‍💻 Desenvolvimento

**Stack Tecnológica:**
- Frontend: HTML5, CSS3, JavaScript (Vanilla)
- Backend: Node.js, Express.js
- Maps: Leaflet + OpenStreetMap
- Auth: bcryptjs
- APIs: ViaCEP (CEP), Nominatim (Geocoding)
- Icons: Font Awesome 6.4.0
- Fonts: Google Fonts (Poppins)

**Dependências:**
```json
{
  "express": "^5.1.0",
  "body-parser": "^2.2.0",
  "cors": "^2.8.5",
  "express-rate-limit": "^7.x",
  "axios": "^1.x",
  "bcryptjs": "^2.x"
}
```

---

## ✨ Recursos Adicionais

### Próximas Melhorias Sugeridas
- [ ] Upload local de imagens (multer)
- [ ] Migração para MongoDB
- [ ] JWT authentication
- [ ] Email notifications
- [ ] Analytics dashboard
- [ ] Exportação de relatórios (PDF)
- [ ] Integração com CRMs externos
- [ ] Chat em tempo real
- [ ] Notificações push
- [ ] App mobile (React Native)

---

**Desenvolvido com ❤️ para Alancarmo Corretor**

Sistema CRM completo e profissional, pronto para uso em produção! 🎉
