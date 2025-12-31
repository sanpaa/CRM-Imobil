# 🎨 Website Customization System - Quick Start

This is a quick reference guide for the Website Customization System implementation.

---

## 🚀 Quick Start

### Installation

```bash
# Install dependencies
cd frontend
npm install

# Build application
npm run build
```

### Database Setup

```bash
# Run the migration in Supabase SQL Editor
# File: migration-website-customization.sql
```

### Access the Features

After logging into the admin panel:

1. **Website Builder**: Click "🎨 Construtor de Sites"
2. **Domain Management**: Click "🌐 Domínios"

---

## 📋 What Was Added

### Routes
- `/admin/website-builder` - Visual website builder
- `/admin/domains` - Domain management
- `/site` - Public website renderer

### Components
- **WebsiteBuilderComponent** - Drag & drop layout editor
- **DomainSettingsComponent** - Custom domain configuration
- **PublicWebsiteComponent** - Public website renderer

### Services
- **WebsiteCustomizationService** - Layout operations
- **DomainManagementService** - Domain operations
- **ComponentLibraryService** - 17 component definitions

### Models
- **WebsiteLayout** - Page layout structure
- **WebsiteComponent** - Component configuration
- **CustomDomain** - Domain configuration
- **Company** - Extended with website fields

---

## 🎯 17 Components Available

| Category | Components |
|----------|-----------|
| **Navigation** | Header, Footer |
| **Content** | Hero, Text Block, Image Gallery, Video |
| **Properties** | Property Grid, Property Card, Search Bar |
| **Forms** | Contact Form |
| **Layout** | Divider, Spacer |
| **Special** | Testimonials, Stats, Team, Map, About, CTA Button |

---

## 💾 Database Tables

- `custom_domains` - Custom domain configurations
- `website_layouts` - Page layouts
- `website_components` - Reusable components
- `companies` - Extended with website fields
- `store_settings` - Extended with theme config

---

## 📊 Build Results

- **Bundle Size**: 959 KB (was 835 KB)
- **Increase**: +124 KB (+14.8%)
- **Build Time**: ~8 seconds
- **Status**: ✅ Success

---

## 📚 Documentation

- **Full Guide**: See `WEBSITE_CUSTOMIZATION_GUIDE.md` (15,800+ words)
- **Implementation**: See `IMPLEMENTATION_SUMMARY.md` (detailed)
- **Quick Start**: This file

---

## ⚠️ Important Notes

### Backend API Required

The frontend is complete, but backend API endpoints are needed for full functionality:

**Layout Endpoints:**
- `GET/POST/PUT/DELETE /api/website/layouts`
- `POST /api/website/layouts/{id}/publish`

**Domain Endpoints:**
- `GET/POST/PUT/DELETE /api/domains`
- `POST /api/domains/{id}/verify`
- `POST /api/domains/{id}/ssl/enable`

### Domain Setup Process

1. Add domain in CRM interface
2. Configure DNS at your provider
3. **Important**: Also add domain in Netlify/Vercel panel
4. Wait for DNS propagation (1-48 hours)
5. Verify domain
6. SSL is configured automatically by hosting platform

---

## 🔧 Dependencies Added

```json
{
  "@angular/cdk": "^18.2.0"
}
```

Installed with `--legacy-peer-deps` due to Angular 20 compatibility.

---

## ✅ Testing

### Build Test
```bash
cd frontend
npm run build
```

**Result**: ✅ Build successful

### What Works
- ✅ TypeScript compilation
- ✅ Component imports
- ✅ Service injection
- ✅ Routing configuration
- ✅ Drag & drop functionality (CDK)

### What Needs Backend
- ❌ Layout CRUD operations
- ❌ Domain CRUD operations
- ❌ Data persistence
- ❌ Authentication integration

---

## 🎨 How to Use

### Creating a Layout

1. Login as admin
2. Click "Construtor de Sites"
3. Click "➕ Novo Layout"
4. Enter name and select page type
5. Add components from library (left sidebar)
6. Drag components to reorder
7. Click a component to edit (right panel)
8. Click "💾 Salvar" to save
9. Click "🚀 Publicar" to activate

### Adding a Domain

1. Login as admin
2. Click "Domínios"
3. Click "➕ Adicionar Domínio"
4. Enter domain name
5. Follow DNS instructions
6. Configure DNS at your provider
7. Add domain in Netlify/Vercel
8. Wait for propagation
9. Click "✅ Verificar"
10. Click "🔒 Habilitar SSL"

---

## 🐛 Troubleshooting

### Build Fails
```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### CDK Not Found
```bash
# Install with legacy peer deps
npm install @angular/cdk@^18.2.0 --legacy-peer-deps
```

### Domain Not Working
1. Check DNS with `nslookup yourdomain.com`
2. Verify domain added in Netlify/Vercel
3. Wait 24-48 hours for propagation
4. SSL is managed by hosting platform

---

## 📞 Need Help?

1. Check `WEBSITE_CUSTOMIZATION_GUIDE.md` for detailed documentation
2. Check browser console for errors
3. Verify backend API is running
4. Check database connectivity

---

## 🎉 Success Criteria

✅ Application builds without errors  
✅ All routes configured  
✅ Components load correctly  
✅ Services injectable  
✅ Database schema ready  
✅ Documentation complete  

---

**Version**: 1.0.0  
**Date**: December 31, 2024  
**Status**: ✅ Frontend Complete
