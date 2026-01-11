# 🚀 Quick Start: Assign Plans to Existing Tenants

## Run the Migration

```bash
npm run migrate:assign-plans
```

## What It Does

- ✅ Finds companies without active subscription plans
- ✅ Assigns the **Prime** plan (R$ 247/mês) as default
- ✅ Shows detailed progress and results
- ✅ Safe to run multiple times

## Requirements

1. **Environment configured**: `.env` file with Supabase credentials
2. **Multi-tenant migration run**: Tables must exist (run `migration-multi-tenant.sql` first)

## Expected Output

```
======================================================================
Assign Subscription Plans to Existing Tenants
======================================================================

✓ Found 3 active subscription plans
✓ Default plan selected: Prime
✓ Found 5 active companies
⚠️  Found 3 companies WITHOUT active subscriptions

Processing companies...
✓ Successfully created 3 subscriptions

✅ Migration completed successfully!
```

## Troubleshooting

| Error | Solution |
|-------|----------|
| Credentials not found | Configure `.env` with Supabase URL and key |
| No plans found | Run `migration-multi-tenant.sql` in Supabase |
| Network error | Check internet connection and Supabase URL |
| Permission error | Verify Supabase key has correct permissions |

## Next Steps

After running:

1. Verify in Supabase dashboard → `tenant_subscriptions` table
2. Test via API: `GET /api/subscriptions/current`
3. Users can upgrade plans through the CRM

## Documentation

See `ASSIGN_PLANS_GUIDE.md` for complete documentation.

---

**Script**: `scripts/assign-plans-to-existing-tenants.js`  
**Command**: `npm run migrate:assign-plans`  
**Version**: 1.0.0
