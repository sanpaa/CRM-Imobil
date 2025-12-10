# Alancarmo Corretor - Angular Migration

## Overview

This project has been migrated from vanilla JavaScript to Angular for better structure, maintainability, and scalability.

## Architecture

- **Frontend**: Angular 19+ (Single Page Application)
- **Backend**: Express.js API server
- **Database**: JSON file storage (data/properties.json)
- **AI Integration**: GROQ SDK for property suggestions

## Project Structure

```
sanpaa/
├── frontend/               # Angular application
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/    # Reusable components (header, footer, property-card)
│   │   │   ├── pages/         # Page components (home, search, admin, property-details)
│   │   │   ├── services/      # Services (property, ai, auth)
│   │   │   ├── models/        # TypeScript interfaces
│   │   │   └── interceptors/  # HTTP interceptors
│   │   ├── styles.css         # Global styles
│   │   └── index.html         # Main HTML file
│   └── angular.json           # Angular configuration
├── server.js               # Express API server
├── package.json           # Root package.json with scripts
└── README_ANGULAR.md      # This file
```

## Features

### Completed
- ✅ Angular project setup with CLI
- ✅ Component-based architecture
- ✅ TypeScript models and interfaces
- ✅ HTTP client with interceptors for authentication
- ✅ Routing configuration
- ✅ Property service with API integration
- ✅ AI service for property suggestions
- ✅ Authentication service
- ✅ Home page with property listing
- ✅ Header and footer components
- ✅ Property card component
- ✅ Responsive design with mobile menu
- ✅ Global styles migration

### In Progress
- 🔄 Search page with filters and map integration
- 🔄 Property details page
- 🔄 Admin panel (legacy version still available at `/admin-legacy`)

### Planned
- ⏳ Full admin panel in Angular with authentication guard
- ⏳ Advanced search with Leaflet maps
- ⏳ Image carousel for property photos
- ⏳ Forms with validation
- ⏳ Enhanced AI integration

## Installation

### Prerequisites
- Node.js 20+ and npm
- Angular CLI 19+

### Setup

1. Install dependencies:
```bash
npm install
cd frontend && npm install
```

2. Build the Angular app:
```bash
npm run build:prod
```

3. Start the server:
```bash
npm start
```

The application will be available at `http://localhost:3000`

## Development

### Run Angular dev server (with API proxy):
```bash
npm run dev:angular
```
This starts Angular on port 4200 with proxy to backend on port 3000.

### Run backend API server:
```bash
npm run dev
```
This starts the Express server on port 3000.

### Build Angular for production:
```bash
npm run build:prod
```

## Available Scripts

- `npm start` - Build Angular and start production server
- `npm run dev` - Start backend server only
- `npm run dev:angular` - Start Angular dev server with proxy
- `npm run build` - Build Angular app
- `npm run build:prod` - Build Angular app for production
- `npm run ng` - Run Angular CLI commands

## API Endpoints

### Properties
- `GET /api/properties` - Get all properties
- `GET /api/properties/:id` - Get single property
- `POST /api/properties` - Create property
- `PUT /api/properties/:id` - Update property
- `DELETE /api/properties/:id` - Delete property

### AI
- `POST /api/ai/suggest` - Get AI suggestions for property data

### Upload
- `POST /api/upload` - Upload property images

### Geocoding
- `POST /api/geocode` - Convert address to coordinates
- `GET /api/cep/:cep` - Lookup Brazilian ZIP code

### Authentication
- `POST /api/auth/login` - Admin login
- `POST /api/auth/logout` - Admin logout
- `GET /api/auth/verify` - Verify auth token

## Migration Notes

### Changes from Original
1. **Single Page Application**: All pages are now part of the Angular SPA with client-side routing
2. **TypeScript**: All JavaScript code has been converted to TypeScript
3. **Component Architecture**: Code is now organized into reusable components
4. **Reactive Programming**: Uses RxJS observables for async operations
5. **HTTP Interceptors**: Automatic token injection for authenticated requests
6. **Build Process**: Angular build outputs to `frontend/dist/frontend/browser`

### Legacy Code
The original vanilla JavaScript files are backed up in the `backup/` directory. The old admin panel is still accessible at `/admin-legacy`.

## Deployment

### Netlify (Frontend Only)

Para deploy do frontend Angular no Netlify:

1. Siga o guia completo em [DEPLOY_NETLIFY.md](./DEPLOY_NETLIFY.md)
2. O arquivo `netlify.toml` já está configurado na raiz do projeto
3. Todas as rotas Angular funcionarão corretamente com SPA redirects

**Nota:** O Netlify serve apenas o frontend. Para usar com backend, considere deploy separado (ex: Render, Railway, Vercel).

### Vercel (Full Stack)

Para deploy completo (frontend + backend):

1. Siga o guia em [DEPLOY_VERCEL.md](./DEPLOY_VERCEL.md)
2. O arquivo `vercel.json` já está configurado

### Production Build (Local)
```bash
npm run build:prod
npm start
```

### Environment Variables
- `PORT` - Server port (default: 3000)

## Contributing

When adding new features:
1. Create new components in `frontend/src/app/components/`
2. Create new pages in `frontend/src/app/pages/`
3. Add new services in `frontend/src/app/services/`
4. Update models in `frontend/src/app/models/`
5. Update routes in `frontend/src/app/app.routes.ts`

## License

ISC

## Author

Alancarmo Corretor
