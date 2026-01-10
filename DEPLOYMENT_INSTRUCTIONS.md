# Deployment Instructions for Netlify

## Quick Start

This application is now ready to deploy on Netlify with serverless functions.

## Prerequisites

- GitHub account
- Netlify account (free at https://netlify.com)
- Supabase project (free at https://supabase.com)

## Step 1: Configure Supabase

1. Create a Supabase project at https://supabase.com
2. Note your:
   - Project URL (e.g., `https://xxxxx.supabase.co`)
   - Anon/Public Key (starts with `eyJ...`)

## Step 2: Deploy to Netlify

### Option A: Automatic Deploy (Recommended)

1. **Connect GitHub to Netlify:**
   - Go to https://app.netlify.com/
   - Click "Add new site" → "Import an existing project"
   - Select "GitHub" and authorize access
   - Choose the repository

2. **Configure Build Settings:**
   Netlify will auto-detect settings from `netlify.toml`, but verify:
   - Build command: `npm install && cd frontend && npm install && npm run build:prod`
   - Publish directory: `frontend/dist/frontend/browser`
   - Functions directory: `netlify/functions`

3. **Add Environment Variables:**
   
   **CRITICAL:** Go to Site settings → Environment variables and add:
   
   ```
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_KEY=your_supabase_anon_key
   ```
   
   Without these, the API endpoints won't work!

4. **Deploy:**
   - Click "Deploy site"
   - Wait 2-5 minutes for build to complete

### Option B: Manual Deploy with CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Link to site
netlify link

# Set environment variables
netlify env:set SUPABASE_URL "your_supabase_url"
netlify env:set SUPABASE_KEY "your_supabase_key"

# Deploy
netlify deploy --prod
```

## Step 3: Verify Deployment

After deployment, test these URLs (replace `your-site` with your Netlify domain):

### Frontend (Angular)
- Home: `https://your-site.netlify.app/`
- Search: `https://your-site.netlify.app/buscar`
- Property: `https://your-site.netlify.app/imovel/{id}`

### API (Serverless Functions)
```bash
# Test properties endpoint
curl https://your-site.netlify.app/api/properties

# Test stats endpoint
curl https://your-site.netlify.app/api/stats

# Test CEP lookup
curl https://your-site.netlify.app/api/cep/01310100
```

Expected: JSON responses (not HTML)

## Step 4: Create Admin User (Optional)

If using Supabase:

1. Go to your Supabase project dashboard
2. Open SQL Editor
3. Run this SQL to create an admin user:

```sql
INSERT INTO users (username, email, password_hash, role, active)
VALUES (
  'admin',
  'admin@example.com',
  '$2a$10$YourBcryptHashHere',  -- Generate with bcryptjs
  'admin',
  true
);
```

To generate the password hash:
```javascript
const bcrypt = require('bcryptjs');
console.log(bcrypt.hashSync('your_password', 10));
```

## Troubleshooting

### Build Failed

**Check build logs** in Netlify dashboard → Deploys → Click on failed build

Common issues:
- Missing dependencies: Check `package.json`
- Node version mismatch: Add `.nvmrc` file with Node version
- Build command error: Verify command syntax

### API Returns HTML Instead of JSON

**Problem:** Environment variables not set

**Solution:** 
1. Go to Site settings → Environment variables
2. Add `SUPABASE_URL` and `SUPABASE_KEY`
3. Redeploy the site

### Functions Not Working

**Check function logs:**
1. Go to Functions tab in Netlify dashboard
2. Click on function name
3. View execution logs

**Common issues:**
- Missing env vars
- Database connection error
- Function timeout (10s limit)

### 404 on Routes

**Problem:** SPA routing not working

**Solution:** Already configured in `netlify.toml`. If still happens:
1. Check `netlify.toml` has the redirect rule:
```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```
2. Ensure this is the LAST redirect rule

## Environment Variables Reference

Required variables for full functionality:

```bash
# Supabase (Required for database)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional: Add more as needed from .env.example
```

## Performance Tips

### Reduce Cold Starts

- Keep functions warm with scheduled pings (if needed)
- Minimize dependencies in functions
- Use connection pooling

### Optimize Build Time

- Cache node_modules between builds (Netlify does this automatically)
- Use workspace dependencies if sharing packages

### Monitor Usage

- Check Netlify analytics for function execution time
- Monitor Supabase usage for database queries
- Watch for rate limit warnings

## Next Steps

1. **Custom Domain:** Configure in Site settings → Domain management
2. **SSL:** Automatically configured by Netlify
3. **Analytics:** Enable in Site settings → Analytics
4. **Forms:** Configure if using Netlify Forms
5. **Monitoring:** Set up alerts for function errors

## Cost Estimate

### Netlify (Free Tier)
- 125K serverless function requests/month
- 300 build minutes/month
- 100GB bandwidth/month

### Supabase (Free Tier)
- 500MB database
- 1GB file storage
- 2GB bandwidth

**Total:** $0/month for small projects!

## Support Resources

- **Netlify Docs:** https://docs.netlify.com/
- **Supabase Docs:** https://supabase.com/docs
- **This Project:**
  - Technical docs: `NETLIFY_SERVERLESS.md`
  - Migration guide: `MIGRATION_NETLIFY_FUNCTIONS.md`
  - Deploy guide: `DEPLOY_NETLIFY.md`

## Migration from Other Platforms

### From Vercel
Similar setup - use `vercel.json` instead

### From Render
Render can run the Express server directly without serverless functions

### From Heroku
Similar to Render - can use `server.js` directly

## Local Development

For local development, continue using the Express server:

```bash
# Install dependencies
npm install
cd frontend && npm install && cd ..

# Development mode (Express server)
npm run dev

# Or Angular dev server with proxy
npm run dev:angular
```

The Express server (`server.js`) is only for local development. Production uses serverless functions.

---

**Ready to Deploy?** Push to GitHub and Netlify will handle the rest! 🚀

**Need Help?** Check the documentation files or Netlify support.

**Date:** December 2024  
**Version:** 2.0.0  
**Status:** ✅ Ready for Production
