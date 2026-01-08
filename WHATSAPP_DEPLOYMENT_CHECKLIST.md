# WhatsApp Keyword Filtering - Deployment Checklist

## Pre-Deployment

### 1. Database Migration ✅
**CRITICAL**: Must be run before deploying code changes

```sql
-- Run this in Supabase SQL Editor
-- File: migration-whatsapp-keywords.sql

ALTER TABLE whatsapp_messages 
ADD COLUMN IF NOT EXISTS has_keywords BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_keywords 
ON whatsapp_messages(company_id, has_keywords, is_group, is_from_me);

-- Optional: Update existing messages (only if you have existing data)
UPDATE whatsapp_messages
SET has_keywords = (
    LOWER(body) ~ 'imóvel|imovel|interessado|interessada|preço|preco|visita|aluguel|alugar|compra|comprar|vender|venda|fotos|foto|disponível|disponivel|valor|orçamento|orcamento|apartamento|apto|ap|casa|condomínio|condominio|condições|condicoes'
)
WHERE body IS NOT NULL;
```

**Verification**:
```sql
-- Check column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'whatsapp_messages' 
AND column_name = 'has_keywords';

-- Check index was created
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'whatsapp_messages' 
AND indexname = 'idx_whatsapp_messages_keywords';
```

### 2. Code Deployment ✅

**Files to Deploy**:
- ✅ `src/application/services/WhatsAppService.js`
- ✅ `src/infrastructure/repositories/SupabaseWhatsappMessageRepository.js`
- ✅ `src/presentation/routes/whatsappRoutes.js`
- ✅ `src/application/services/PublicSiteService.js` (Netlify fix)

**Build Command**:
```bash
npm install
npm run build
```

### 3. Environment Variables ✅

**No new variables needed**. Existing WhatsApp setup uses:
- ✅ `SUPABASE_URL`
- ✅ `SUPABASE_SERVICE_KEY`
- ✅ `PORT` (optional)

### 4. Dependencies ✅

**No new dependencies required**. Feature uses existing packages:
- ✅ `@whiskeysockets/baileys` (already installed)
- ✅ `@supabase/supabase-js` (already installed)
- ✅ `express` (already installed)

## Post-Deployment

### 1. API Endpoint Verification ✅

**Test the new endpoint**:
```bash
# Get filtered messages (requires auth token)
curl -X GET "https://your-api.com/api/whatsapp/filtered-messages?limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Expected response:
{
  "data": [
    {
      "remetente": "5511999999999",
      "nome_contato": "João Silva",
      "conteudo": "Olá, estou interessado no apartamento",
      "data_hora": "2024-01-15T14:30:00.000Z",
      "id": "uuid"
    }
  ],
  "limit": 10,
  "offset": 0,
  "total": 1
}
```

### 2. WhatsApp Integration Check ✅

**Verify WhatsApp is connected**:
```bash
# Check connection status
curl -X GET "https://your-api.com/api/whatsapp/status" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Expected response:
{
  "status": "connected",
  "is_connected": true,
  "phone_number": "5511999999999"
}
```

If not connected, initialize:
```bash
# Initialize WhatsApp
curl -X POST "https://your-api.com/api/whatsapp/initialize" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Then scan QR code from /status endpoint
```

### 3. Test Message Flow ✅

**Send test message** to WhatsApp:
1. From another phone, send: "Olá, estou interessado no apartamento"
2. Check server logs for keyword detection:
   ```
   [WhatsAppService] 📨 NOVA MENSAGEM RECEBIDA
   [WhatsAppService] 🔍 Contém palavras-chave imobiliárias: ✅ SIM
   [WhatsAppService] ✅ Mensagem salva com sucesso!
   ```
3. Verify in database:
   ```sql
   SELECT * FROM whatsapp_messages 
   WHERE has_keywords = true 
   ORDER BY timestamp DESC 
   LIMIT 1;
   ```
4. Check if lead was created:
   ```sql
   SELECT c.* FROM clients c
   JOIN whatsapp_auto_clients wac ON c.id = wac.client_id
   ORDER BY c.created_at DESC
   LIMIT 1;
   ```

### 4. Netlify Preview Domain Fix ✅

**Test preview domains work**:
```bash
# Should not throw error
curl -X GET "https://preview--crm-imobil.netlify.app/api/site-config?domain=preview--crm-imobil.netlify.app"

# Expected: Returns first company's config (not 404)
```

### 5. Performance Monitoring ✅

**Key metrics to monitor**:

1. **Keyword Detection Rate**:
   ```sql
   SELECT 
       has_keywords,
       COUNT(*) as total,
       COUNT(*) * 100.0 / SUM(COUNT(*)) OVER () as percentage
   FROM whatsapp_messages
   WHERE is_group = false AND is_from_me = false
   GROUP BY has_keywords;
   ```

2. **Lead Creation Rate**:
   ```sql
   SELECT 
       COUNT(DISTINCT wm.from_number) as unique_senders,
       COUNT(DISTINCT wac.phone_number) as leads_created,
       COUNT(DISTINCT wac.phone_number) * 100.0 / COUNT(DISTINCT wm.from_number) as conversion_rate
   FROM whatsapp_messages wm
   LEFT JOIN whatsapp_auto_clients wac ON wm.from_number = wac.phone_number
   WHERE wm.has_keywords = true;
   ```

3. **API Response Time**:
   - Target: < 200ms for `/filtered-messages` endpoint
   - Monitor in application logs or APM tool

## Rollback Plan

If issues arise:

### Quick Rollback (Code Only)
```bash
# Revert to previous commit
git revert HEAD~3..HEAD
git push origin main
```

### Database Rollback (if needed)
```sql
-- Remove the column (only if absolutely necessary)
ALTER TABLE whatsapp_messages DROP COLUMN IF EXISTS has_keywords;

-- Remove the index
DROP INDEX IF EXISTS idx_whatsapp_messages_keywords;
```

**Note**: Database rollback will lose keyword filtering data but won't affect existing messages.

## Troubleshooting

### Issue: Endpoint returns 404
**Solution**: 
- Verify route is registered in main server file
- Check server logs for startup errors
- Ensure server restarted after deployment

### Issue: No messages being filtered
**Solution**:
```sql
-- Check if column exists
SELECT * FROM whatsapp_messages LIMIT 1;

-- Manually test keyword detection
SELECT body, has_keywords 
FROM whatsapp_messages 
WHERE body ILIKE '%apartamento%' 
LIMIT 5;
```

### Issue: Keywords not detected in new messages
**Solution**:
- Check server logs for errors in `handleIncomingMessage`
- Verify WhatsApp connection is active
- Test keyword detection logic with test script:
  ```bash
  node test-whatsapp-keyword-filter.js
  ```

### Issue: Performance degradation
**Solution**:
```sql
-- Check index is being used
EXPLAIN ANALYZE 
SELECT * FROM whatsapp_messages 
WHERE company_id = 'uuid' 
  AND has_keywords = true 
  AND is_group = false 
  AND is_from_me = false;

-- Should show "Index Scan" on idx_whatsapp_messages_keywords
```

## Success Criteria

Deployment is successful when:

- ✅ Database migration completed without errors
- ✅ `/api/whatsapp/filtered-messages` endpoint returns 200 OK
- ✅ Test message with keyword is correctly filtered
- ✅ Test message without keyword is correctly excluded
- ✅ Lead is auto-created for message with keywords
- ✅ No lead created for message without keywords
- ✅ Netlify preview domains work without errors
- ✅ No increase in error rates
- ✅ Response time < 200ms
- ✅ All automated tests passing: `node test-whatsapp-keyword-filter.js`

## Maintenance

### Weekly Tasks
- Review filtered messages for quality
- Check false positive rate
- Monitor lead conversion rate

### Monthly Tasks
- Analyze most common keywords
- Review negative cases (missed messages)
- Consider adding/removing keywords

### Quarterly Tasks
- Performance optimization review
- Consider ML classification enhancement
- Update documentation if needed

## Support Resources

- **User Guide**: `WHATSAPP_KEYWORD_FILTERING.md`
- **Implementation**: `WHATSAPP_FILTERING_IMPLEMENTATION.md`
- **Design Decisions**: `WHATSAPP_KEYWORD_MATCHING_DESIGN.md`
- **Migration File**: `migration-whatsapp-keywords.sql`
- **Test Suite**: `test-whatsapp-keyword-filter.js`

## Contact

For issues or questions:
1. Check documentation files listed above
2. Review server logs for error messages
3. Run test suite to verify logic
4. Check database for data consistency

---

**Deployment Date**: _______________  
**Deployed By**: _______________  
**Verification Completed**: ☐ Yes ☐ No  
**Issues Found**: _______________
