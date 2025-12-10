# Quick Start Guide - Alancarmo Corretor Angular App

## Prerequisites
- Node.js 20+ and npm
- Git
- (Optional) Supabase account for database and file storage

## Installation & Running

### 1. Configure Environment Variables

```bash
# Copy the environment example file
cp .env.example .env
```

Then edit `.env` file and configure:

**For local development without Supabase (Offline Mode):**
- Leave `SUPABASE_URL` and `SUPABASE_KEY` with default values
- The app will run in offline mode using local JSON files
- ⚠️ **Note**: In offline mode, you cannot create/update/delete properties or upload images

**For full functionality with Supabase:**
1. Create a free Supabase account at https://supabase.com
2. Create a new project
3. Get your project URL and anon key from Settings > API
4. Update `.env` file:
   ```
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_KEY=your-anon-key-here
   ```
5. Create database tables:
   - Go to Supabase Dashboard > SQL Editor
   - Run the SQL from `src/infrastructure/database/init.js`
   - Or run: `npm run db:init` to see the SQL commands
6. **Create a public storage bucket** named `property-images` in Supabase:
   - **OPTION A - Manual (Recommended)**:
     - Go to Storage > New Bucket
     - Name: `property-images`
     - ✅ Check "Public bucket" (REQUIRED!)
     - Click Create
   - **OPTION B - Automatic Check**:
     - Run: `npm run storage:setup`
     - Follow the instructions provided
   - See [STORAGE_SETUP.md](STORAGE_SETUP.md) for detailed instructions

**Verify your setup:**
```bash
npm run verify
```

This will check if everything is configured correctly.

### 2. Install Dependencies
```bash
# Install root dependencies (Express server)
npm install

# Install Angular dependencies
cd frontend
npm install
cd ..
```

### 3. Build & Run Production

```bash
# Build Angular and start server (single command)
npm start
```

The app will be available at: **http://localhost:3000**

**Important Notes:**
- If running in **offline mode** (without Supabase), the application will display read-only data from local JSON files
- To enable full functionality (create/edit/delete properties, upload images), configure Supabase as described above

### 4. Development Mode

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

### Database not available / Cannot create property

**Error**: "Database not available. Property cannot be created in offline mode. Please configure SUPABASE_URL and SUPABASE_KEY environment variables."

**Solution**:
1. Create a `.env` file if it doesn't exist:
   ```bash
   cp .env.example .env
   ```
2. Configure Supabase credentials in `.env`:
   - Sign up at https://supabase.com
   - Create a new project
   - Get your URL and KEY from Settings > API
   - Update `.env` with your credentials
3. Create the `property-images` bucket in Supabase Storage (Storage > Create Bucket > Make public)
4. Restart the server

### Image upload errors

**Error**: "Erro ao fazer upload das imagens. Continuando com URLs fornecidas."

**Solution**:
1. Verify Supabase is configured (see above)
2. Ensure the `property-images` bucket exists in Supabase Storage
3. Verify the bucket is set to **public**
4. Check that SUPABASE_URL and SUPABASE_KEY are correct in `.env`
5. Restart the server after configuration changes

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
4. **Deploy**: 
   - For Render: See [DEPLOY_RENDER.md](./DEPLOY_RENDER.md)
   - For Vercel: See [DEPLOY_VERCEL.md](./DEPLOY_VERCEL.md)
5. **Security**: Change admin password in production

## Documentation

- **QUICKSTART.md**: This file - Quick start for local development
- **DATABASE_SETUP.md**: Complete Supabase configuration guide
- **DEPLOY_RENDER.md**: Deploy to Render hosting (recommended)
- **DEPLOY_VERCEL.md**: Deploy to Vercel hosting
- **README_ANGULAR.md**: Full technical documentation
- **MIGRATION_SUMMARY.md**: Migration details and metrics

## Support

For issues or questions:
- Check documentation files
- Review code comments
- Test with sample data

---

**Version**: 2.0.0 (Angular - Complete)
**Last Updated**: November 2024
**Status**: ✅ Production Ready
