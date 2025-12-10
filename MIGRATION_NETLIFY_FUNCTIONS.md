# Migration to Netlify Serverless Functions - Summary

## What Was Done

This migration converts the CRM Imobil application from an Express.js backend to Netlify Serverless Functions, enabling deployment on Netlify's platform.

## Changes Made

### 1. Created Serverless Functions (`netlify/functions/`)

Nine serverless functions were created to replace the Express.js API:

1. **properties.js** - Property CRUD operations
2. **geocode.js** - Address geocoding
3. **cep.js** - Brazilian postal code lookup
4. **upload.js** - Image upload to Supabase Storage
5. **ai-suggest.js** - AI-powered property suggestions
6. **stats.js** - Property statistics
7. **auth.js** - Authentication (login, logout, verify token)
8. **users.js** - User management
9. **store-settings.js** - Store settings management

Each function:
- Handles HTTP methods (GET, POST, PUT, DELETE)
- Includes CORS headers
- Reuses existing service layer code
- Returns JSON responses
- Includes error handling

### 2. Updated Configuration

**netlify.toml**:
- Removed `base` directory to fix path resolution
- Updated build command: `npm install && cd frontend && npm install && npm run build:prod`
- Updated publish directory: `frontend/dist/frontend/browser`
- Added functions configuration:
  - Directory: `netlify/functions`
  - Bundler: esbuild
  - External modules: `@supabase/supabase-js`
- Added API route redirects to map `/api/*` to serverless functions
- Kept SPA redirect for Angular routing

**package.json**:
- Added `parse-multipart-data` dependency for file uploads

### 3. Documentation

Created/updated:
- **NETLIFY_SERVERLESS.md** - Comprehensive technical documentation
- **DEPLOY_NETLIFY.md** - Updated deployment instructions

## How It Works

### Request Flow

```
Browser Request → Netlify CDN → Redirect Rule → Serverless Function → Response
```

Example:
```
GET /api/properties
  ↓
Netlify redirect: /api/properties → /.netlify/functions/properties
  ↓
Execute: netlify/functions/properties.js
  ↓
Service: PropertyService.getAllProperties()
  ↓
Repository: SupabasePropertyRepository
  ↓
Supabase Database
  ↓
JSON Response
```

### Architecture

The serverless functions integrate seamlessly with the existing Onion Architecture:

```
Serverless Function (Presentation Layer)
    ↓
Service (Application Layer)
    ↓
Repository (Infrastructure Layer)
    ↓
Supabase (Database)
```

## Key Features

✅ **Zero Breaking Changes**: API interface remains identical
✅ **Code Reuse**: Uses existing service/repository layers
✅ **CORS Enabled**: All functions support cross-origin requests
✅ **Authentication**: Token-based auth works as before
✅ **File Uploads**: Multipart form data handled correctly
✅ **Rate Limiting**: Basic rate limiting for auth endpoints
✅ **Error Handling**: Proper error responses
✅ **Environment Variables**: Uses Netlify's env var system

## What Didn't Change

- Frontend (Angular) - No changes needed
- Service layer - Reused as-is
- Repository layer - Reused as-is
- Database schema - Same as before
- API interface - Same endpoints and responses
- Authentication - Same token-based system

## Deployment Requirements

### Environment Variables (Required)

Must be configured in Netlify Dashboard → Site Settings → Environment Variables:

- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_KEY` - Supabase anon key
- Any other variables from `.env.example`

### Build Process

Netlify will:
1. Install root dependencies (for serverless functions)
2. Install frontend dependencies
3. Build Angular app
4. Deploy serverless functions
5. Configure redirects

## Testing Checklist

After deployment, verify:

- [ ] Angular app loads (`/`)
- [ ] Properties list loads (`/api/properties`)
- [ ] Property details work (`/imovel/:id`)
- [ ] Search works (`/buscar`)
- [ ] Admin login works (`/admin/login`)
- [ ] Image upload works (if configured)
- [ ] Geocoding works (if configured)
- [ ] CEP lookup works

## Performance

- **Cold Start**: ~1-3 seconds (first request after idle)
- **Warm Start**: ~100-300ms (subsequent requests)
- **Bundle Size**: Optimized with esbuild
- **Timeout**: 10 seconds (Netlify default)

## Limitations

- Functions are stateless (no in-memory sessions)
- 10-second execution limit
- 1GB memory limit
- Cold starts on first request

## Benefits Over Express

✅ **Scalability**: Auto-scales with traffic
✅ **Cost**: Pay per execution (free tier available)
✅ **Maintenance**: No server management needed
✅ **Global**: Deployed to CDN edge locations
✅ **Reliability**: Netlify's infrastructure
✅ **Security**: Isolated execution environment

## Local Development

For local development, continue using the Express server:

```bash
npm run dev          # Express server
npm run dev:angular  # Angular with proxy to Express
```

The Express server (`server.js`) remains for local development.

## Migration Notes

### Why Serverless?

Netlify only hosts static files. To run backend code, we must use:
- Netlify Functions (serverless) ← **We chose this**
- External API server (e.g., Render, Heroku)

### Alternative Platforms

If Netlify Functions don't work:
- **Vercel**: Similar platform with Edge Functions
- **Render**: Can run Express.js server directly
- **Railway**: Can run full Node.js apps
- **Heroku**: Traditional PaaS option

## Troubleshooting

### Common Issues

**Functions not working**:
- Check environment variables are set in Netlify
- Check function logs in Netlify dashboard
- Verify build succeeded

**404 on API routes**:
- Check `netlify.toml` redirects
- Verify functions deployed correctly

**CORS errors**:
- Verify CORS headers in function responses
- Check browser console for details

**Build failures**:
- Check build logs in Netlify
- Verify all dependencies are in `package.json`
- Check Node.js version compatibility

## Next Steps

1. Deploy to Netlify
2. Configure environment variables
3. Test all endpoints
4. Monitor function logs
5. Optimize as needed

## Support

- **Technical Docs**: [NETLIFY_SERVERLESS.md](NETLIFY_SERVERLESS.md)
- **Deployment Guide**: [DEPLOY_NETLIFY.md](DEPLOY_NETLIFY.md)
- **Netlify Docs**: https://docs.netlify.com/functions/overview/

---

**Date**: December 2024
**Version**: 2.0.0
**Status**: Ready for deployment
