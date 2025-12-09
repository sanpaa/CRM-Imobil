# Setup Verification Guide

## ✅ Environment Variables Configured

Your `.env` file has been created with the following configuration:

- ✅ SUPABASE_URL: Configured
- ✅ SUPABASE_KEY: Configured  
- ✅ ADMIN_USERNAME: Configured (admin)
- ✅ ADMIN_PASSWORD: Configured (admin123)
- ✅ PORT: Configured (3000)

## 🔍 Quick Verification

Run this command to verify your setup:

```bash
npm run verify
```

This will check:
- ✅ Environment variables are set
- ✅ Supabase connection works
- ✅ Database tables exist
- ✅ Storage bucket exists and is public

## 🔍 Next Steps to Complete Setup

### 1. Create Database Tables in Supabase

The environment variables are configured, but you need to create the database tables in your Supabase project:

**Option A: Using Supabase SQL Editor (Recommended)**

1. Go to: https://supabase.com/dashboard
2. Select your project (ogixrlwohcwdhitigpta)
3. Click on "SQL Editor" in the left sidebar
4. Click "New Query"
5. Copy and paste the SQL from `src/infrastructure/database/init.js`
6. Click "Run" to execute the SQL

**Option B: View the SQL Schema**

Run this command to see the exact SQL you need to execute:

```bash
node src/infrastructure/database/init.js
```

The SQL will create these tables:
- `properties` - For property listings
- `users` - For user authentication
- `store_settings` - For application settings

### 2. Create Storage Bucket for Images

1. In Supabase Dashboard, go to "Storage"
2. Click "Create a new bucket"
3. Name it: `property-images`
4. Make it **PUBLIC** (very important!)
5. Click "Create bucket"

### 3. Verify Everything Works

After completing steps 1 and 2, start the server:

```bash
npm run dev
```

You should see:
```
✅ Supabase configured successfully
Database: ✅ Supabase connected
Storage: ✅ Images can be uploaded
```

If you still see "offline mode" messages, it means the tables don't exist yet.

## 🔐 Authentication

**Default Admin Login:**
- Username: `admin`
- Password: `admin123`

Access the admin panel at: http://localhost:3000/admin-legacy

## 🐛 Troubleshooting

### "Database connection failed - running in offline mode"

This means:
- ✅ Supabase credentials are valid
- ❌ Tables don't exist in your Supabase project

**Solution:** Run the SQL schema (see step 1 above)

### "Storage not configured" when uploading images

This means:
- ❌ The `property-images` bucket doesn't exist

**Solution:** Create the bucket (see step 2 above)

### "Invalid credentials" when logging in

This means:
- The admin user hasn't been created in the database yet
- Fallback credentials are used: username=`admin`, password=`admin123`

**Solution:** 
- Use the fallback credentials, or
- After creating tables, the default admin will be created automatically on server start

## 📝 Important Notes

1. **Never commit the `.env` file** - It contains sensitive credentials and is already in `.gitignore`

2. **For production deployment (Render, Vercel, etc.):**
   - Set environment variables in your hosting platform's dashboard
   - Don't rely on the `.env` file

3. **Security:**
   - Change the default admin password after first login
   - Use strong passwords in production
   - Enable Row Level Security (RLS) in Supabase for production

## 🆘 Still Having Issues?

If the problem persists after following all steps:

1. Check Supabase project status at https://status.supabase.com
2. Verify your SUPABASE_KEY is the "anon/public" key (not the service role key)
3. Check the browser console for detailed error messages
4. Review server logs for specific error messages
