# Netlify Deployment with Serverless Functions

## What Was Changed

The application has been migrated to work on Netlify by converting the Express.js backend into **Netlify Serverless Functions**.

### Problem

Netlify is a static hosting platform and cannot run Node.js servers (like Express.js). When deployed, all API calls were returning HTML (the Angular index.html) instead of JSON, causing errors:
- `Error loading properties: ...`
- `SyntaxError: Unexpected token '<', "<!doctype "... is not valid JSON`
- `POST /api/geocode 404 (Not Found)`

### Solution

All backend API endpoints have been converted to Netlify Functions (serverless functions):

## Serverless Functions Created

| Function | Purpose | Routes |
|----------|---------|--------|
| `properties.js` | Property CRUD operations | `GET/POST /api/properties`, `GET/PUT/DELETE /api/properties/:id` |
| `geocode.js` | Address to coordinates | `POST /api/geocode` |
| `cep.js` | Brazilian postal code lookup | `GET /api/cep/:cep` |
| `upload.js` | Image upload to Supabase | `POST /api/upload` |
| `ai-suggest.js` | AI property suggestions | `POST /api/ai/suggest` |
| `stats.js` | Property statistics | `GET /api/stats` |
| `auth.js` | Authentication (login/logout/verify) | `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/verify` |
| `users.js` | User management | `GET/POST /api/users`, `GET/PUT/DELETE /api/users/:id` |
| `store-settings.js` | Store settings | `GET/PUT /api/store-settings`, `POST /api/store-settings/initialize` |

## Configuration Files

### netlify.toml

The `netlify.toml` file has been updated with:

1. **Build Configuration**
   - Installs root dependencies (for serverless functions)
   - Installs frontend dependencies
   - Builds Angular app

2. **Functions Configuration**
   - Directory: `netlify/functions`
   - Bundler: esbuild
   - External modules: `@supabase/supabase-js`

3. **Redirects**
   - All `/api/*` routes redirect to corresponding serverless functions
   - All other routes redirect to `index.html` (Angular SPA routing)

### package.json

Added `parse-multipart-data` dependency for file upload handling in serverless functions.

## How It Works

### Traditional Server (Before)
```
Browser → Netlify → Express.js Server → Response
                    ❌ Cannot run on Netlify!
```

### Serverless Functions (Now)
```
Browser → Netlify → Serverless Function → Response
                    ✅ Runs on demand!
```

### Example Request Flow

1. **Browser makes request**: `GET https://crm-imobil.netlify.app/api/properties`
2. **Netlify redirect rule** matches: `/api/properties → /.netlify/functions/properties`
3. **Function executes**: `netlify/functions/properties.js` handler runs
4. **Function connects** to Supabase database
5. **Function returns** JSON response
6. **Browser receives** the data

## Environment Variables

The serverless functions use the same environment variables as the Express server:

- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_KEY` - Supabase anon key
- Other variables from `.env.example`

**IMPORTANT**: Configure these in Netlify Dashboard → Site Settings → Environment Variables

## Deployment Steps

### 1. Configure Environment Variables

In Netlify Dashboard:
1. Go to Site Settings → Environment Variables
2. Add all required variables from `.env.example`:
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - etc.

### 2. Deploy

#### Option A: Automatic (Recommended)
1. Push changes to GitHub
2. Netlify will automatically build and deploy

#### Option B: Manual Deploy
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
netlify deploy --prod
```

### 3. Verify Deployment

After deployment, test the API endpoints:

```bash
# Test properties endpoint
curl https://your-site.netlify.app/api/properties

# Test stats endpoint
curl https://your-site.netlify.app/api/stats

# Test CEP lookup
curl https://your-site.netlify.app/api/cep/01310100
```

## Features

### ✅ What Works

- **Angular SPA Routing**: All Angular routes work (`/`, `/buscar`, `/imovel/:id`, `/admin`, etc.)
- **API Endpoints**: All backend functionality works as serverless functions
- **Image Upload**: Files upload to Supabase Storage
- **Authentication**: Login/logout/token verification
- **Database**: All Supabase operations work
- **CORS**: Enabled for all functions
- **Rate Limiting**: Basic rate limiting for auth endpoints

### ⚠️ Limitations

- **Cold Starts**: First request after inactivity may be slower (serverless cold start)
- **Execution Time**: Functions timeout after 10 seconds (Netlify limit)
- **Memory**: Limited to 1GB (Netlify limit)
- **State**: Functions are stateless (no in-memory session storage between requests)

### 💡 Optimizations

- **esbuild bundler**: Fast builds and smaller function bundles
- **External modules**: Large dependencies like Supabase are not bundled
- **Code reuse**: All functions share the same service layer code

## Local Development

For local development, continue using the Express server:

```bash
# Development mode (Express server)
npm run dev

# Or Angular dev server with proxy
npm run dev:angular
```

The Express server (`server.js`) is still used for local development. Only production uses serverless functions.

## Troubleshooting

### Function Errors

Check function logs in Netlify Dashboard:
1. Go to Functions tab
2. Click on a function
3. View logs

### Build Failures

Check build logs in Netlify Dashboard:
1. Go to Deploys tab
2. Click on the failed deploy
3. View build logs

### Common Issues

**Issue**: `Module not found` error in function
- **Solution**: Make sure dependencies are in root `package.json`

**Issue**: Function timeout
- **Solution**: Optimize database queries or increase timeout (requires Netlify Pro)

**Issue**: CORS errors
- **Solution**: Verify CORS headers are set in function responses

**Issue**: 404 on API routes
- **Solution**: Check redirect rules in `netlify.toml`

## Migration Notes

### What Changed

- ✅ All API endpoints work the same way
- ✅ Same database (Supabase)
- ✅ Same authentication
- ✅ Same file upload (Supabase Storage)
- ❌ No Express.js server in production
- ❌ No in-memory rate limiting (uses simple per-function tracking)

### Code Structure

The serverless functions reuse the existing code:
- **Domain Layer**: Entity definitions (unchanged)
- **Application Layer**: Service classes (unchanged)
- **Infrastructure Layer**: Repositories, Storage (unchanged)
- **Presentation Layer**: Serverless functions (NEW, replaces Express routes)

### Compatibility

The API is 100% compatible with the Angular frontend. No frontend changes needed.

## Performance

### Cold Start Times
- **First request**: ~1-3 seconds
- **Warm requests**: ~100-300ms

### Optimization Tips
1. Keep functions small and focused
2. Minimize dependencies
3. Use connection pooling for database
4. Cache responses when possible

## Security

All serverless functions include:
- ✅ CORS headers
- ✅ Input validation
- ✅ Authentication where required
- ✅ Rate limiting (basic)
- ✅ Error handling

## Future Improvements

Potential optimizations:
1. **Edge Functions**: Move to Netlify Edge for even faster responses
2. **Caching**: Add response caching for public endpoints
3. **Bundling**: Optimize bundle sizes further
4. **Monitoring**: Add application monitoring (e.g., Sentry)

## Support

For issues or questions:
1. Check Netlify documentation: https://docs.netlify.com/functions/overview/
2. Check serverless function logs in Netlify Dashboard
3. Review this documentation

---

**Last Updated**: December 2024
**Version**: 2.0.0
