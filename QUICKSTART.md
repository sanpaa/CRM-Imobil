# Quick Start Guide - Alancarmo Corretor Angular App

## Prerequisites
- Node.js 20+ and npm
- Git

## Installation & Running

### 1. Install Dependencies
```bash
# Install root dependencies (Express server)
npm install

# Install Angular dependencies
cd frontend
npm install
cd ..
```

### 2. Build & Run Production

```bash
# Build Angular and start server (single command)
npm start
```

The app will be available at: **http://localhost:3000**

### 3. Development Mode

For development with hot reload:

#### Terminal 1 - Start Backend Server
```bash
npm run dev
```

#### Terminal 2 - Start Angular Dev Server
```bash
npm run dev:angular
```

- Backend API: **http://localhost:3000**
- Angular Dev: **http://localhost:4200** (with proxy to backend)

## Access Points

### Public Site
- **Home**: http://localhost:3000/
- **Search**: http://localhost:3000/buscar
- **Property Details**: http://localhost:3000/imovel/:id

### Admin Panel
- **Login**: http://localhost:3000/admin/login
- **Dashboard**: http://localhost:3000/admin (requires login)

### Default Admin Credentials
- **Username**: `admin`
- **Password**: `admin123`
- ⚠️ **IMPORTANT**: Change these in production!

## Features Overview

### ✅ Complete Features

#### Public Pages
- **Home Page**: Property listings, services, contact
- **Search Page**: Advanced filters, sorting, pagination
- **Responsive Design**: Mobile & desktop optimized

#### Admin Panel
- **Authentication**: Login/logout with JWT-like tokens
- **Dashboard**: Real-time statistics
- **Property Management**: Full CRUD operations
- **Image Upload**: Multiple images per property
- **AI Integration**: Smart property suggestions
- **Form Validation**: Required fields & data validation

#### AI Features
- Automatic title generation from description
- Intelligent property data extraction
- Price estimation based on area and location
- Feature detection from text
- Smart form auto-fill

## Available Commands

### Root Directory Commands

| Command | Description |
|---------|-------------|
| `npm start` | Build Angular + start production server |
| `npm run dev` | Start backend API server only |
| `npm run dev:angular` | Start Angular dev server with hot reload |
| `npm run build` | Build Angular app |
| `npm run build:prod` | Build Angular for production |
| `npm run vercel-build` | Install deps + build for Vercel deployment |

### Frontend Directory Commands

Navigate to `frontend/` directory first:

| Command | Description |
|---------|-------------|
| `npm start` | Start Angular dev server with auto-open |
| `npm run build` | Build Angular for production |
| `npm run build:prod` | Build Angular for production |
| `npm test` | Run Angular unit tests |
| `npm run watch` | Build in development mode with watch |

## Project Structure

```
sanpaa/
├── frontend/          # Angular application
│   ├── src/app/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── services/      # Business logic services
│   │   ├── models/        # TypeScript interfaces
│   │   ├── guards/        # Route guards
│   │   └── interceptors/  # HTTP interceptors
│   └── dist/          # Build output (generated)
├── data/              # JSON database
├── uploads/           # Uploaded images
├── server.js          # Express API server
└── package.json       # Project scripts
```

## API Endpoints

### Properties
- `GET /api/properties` - List all properties
- `GET /api/properties/:id` - Get single property
- `POST /api/properties` - Create property (auth required)
- `PUT /api/properties/:id` - Update property (auth required)
- `DELETE /api/properties/:id` - Delete property (auth required)

### AI
- `POST /api/ai/suggest` - Get AI suggestions for property data

### Upload
- `POST /api/upload` - Upload property images

### Auth
- `POST /api/auth/login` - Admin login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/verify` - Verify token

### Stats
- `GET /api/stats` - Get dashboard statistics

## Using the Admin Panel

### 1. Login
1. Navigate to http://localhost:3000/admin/login
2. Enter username: `admin`
3. Enter password: `admin123`
4. Click "Entrar"

### 2. Create Property
1. Click "Novo Imóvel" button
2. Fill required fields (Title, Price, Contact)
3. **Optional**: Click "IA - Sugestões" for AI help
4. Upload images (optional)
5. Click "Salvar"

### 3. AI Suggestions
1. In property form, enter a title or description
2. Click "IA - Sugestões" button
3. Review AI-generated suggestions
4. Click "Aplicar" to auto-fill form
5. Adjust as needed and save

### 4. Edit/Delete
1. In properties table, click edit icon (📝)
2. Modify fields and save
3. Or click delete icon (🗑️) and confirm

## Troubleshooting

### Build fails
```bash
# Clear cache and rebuild
cd frontend
rm -rf node_modules package-lock.json .angular
npm install
npm run build
```

### Server won't start
```bash
# Check if dependencies are installed
npm install

# Check if port 3000 is available
lsof -i :3000

# Kill process if needed
kill -9 $(lsof -t -i :3000)
```

### Angular dev server issues
```bash
# Clear Angular cache
cd frontend
rm -rf .angular/cache
npm run ng serve -- --proxy-config proxy.conf.json
```

### Admin login not working
1. Check if backend server is running
2. Verify credentials are correct
3. Clear browser localStorage
4. Check browser console for errors

## Next Steps

1. **Customize Content**: Update property information, contact details
2. **Add Properties**: Use admin panel to add real properties
3. **Configure WhatsApp**: Update phone numbers in components
4. **Deploy**: Follow deployment guide in README_ANGULAR.md
5. **Security**: Change admin password in production

## Documentation

- **README_ANGULAR.md**: Full technical documentation
- **MIGRATION_SUMMARY.md**: Migration details and metrics
- **QUICKSTART.md**: This file

## Support

For issues or questions:
- Check documentation files
- Review code comments
- Test with sample data

---

**Version**: 2.0.0 (Angular - Complete)
**Last Updated**: November 2024
**Status**: ✅ Production Ready
