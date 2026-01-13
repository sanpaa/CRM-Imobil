# WhatsApp Session Restoration Fix

## Problem Description

WhatsApp connection was showing as "disconnected" even after being connected successfully. The connection would be lost after:
- Page refresh (F5)
- Server restart  
- Some time passing
- Any action on the page

### Root Cause

The WhatsApp session is saved to disk using Baileys `useMultiFileAuthState`, but there was no logic to restore these sessions when:
1. The server restarts
2. The `/status` endpoint is called
3. In-memory client instances are lost

The `getStatus()` method only checked the in-memory `clients` Map. If no instance existed in memory, it would report "disconnected" even though valid session files existed on disk.

## Solution Implemented

### 1. Session File Detection (`hasSessionFiles`)

Added a method to check if valid Baileys session files exist for a company:

```javascript
async hasSessionFiles(companyId) {
    const sessionPath = path.join(this.sessionsPath, `session-${companyId}`);
    const credsPath = path.join(sessionPath, 'creds.json');
    
    // Check if creds.json exists (indicates a saved Baileys session)
    await fs.access(credsPath);
    return true;
}
```

**Note:** Baileys sessions are identified by the presence of `creds.json` in the session directory.

### 2. Session Restoration (`restoreSession`)

Added a method to restore a WhatsApp connection from saved session files:

```javascript
async restoreSession(companyId, userId) {
    // Check if session files exist
    const hasSession = await this.hasSessionFiles(companyId);
    if (!hasSession) return false;

    // Initialize client with existing session (no forceClean)
    await this.initializeClient(
        companyId,
        userId,
        null,  // callbacks handled by connection.update events
        null,
        null,
        null,
        false, // forceClean = false to keep existing session
        0
    );
    
    return true;
}
```

### 3. Modified Status Check (`getStatus`)

Updated the status check to detect and restore sessions:

```javascript
async getStatus(companyId) {
    const instance = this.clients.get(companyId);
    
    if (!instance) {
        // Check if session files exist on disk
        const hasSession = await this.hasSessionFiles(companyId);
        
        if (hasSession) {
            const connection = await this.whatsappConnectionRepository.findByCompanyId(companyId);
            const userId = connection?.user_id;
            
            if (userId) {
                // Start restoration asynchronously
                this.restoreSession(companyId, userId).catch(err => {
                    console.error(`[WhatsApp] Session restore failed: ${err.message}`);
                });
                
                // Return connecting status while restoration happens
                return {
                    status: 'connecting',
                    is_connected: false,
                    message: 'Restoring connection from saved session...'
                };
            }
        }
        
        return {
            status: 'disconnected',
            is_connected: false,
            message: 'Not connected. Click "Connect WhatsApp" to start.'
        };
    }
    
    // ... rest of status checks
}
```

### 4. Server Startup Restoration (`restoreAllSessions`)

Added automatic restoration of all saved sessions when the server starts:

```javascript
async restoreAllSessions() {
    // Read all session directories
    const entries = await fs.readdir(this.sessionsPath, { withFileTypes: true });
    const sessionDirs = entries.filter(entry => 
        entry.isDirectory() && entry.name.startsWith('session-')
    );
    
    // Get all connections from database
    const connections = await this.whatsappConnectionRepository.findAll();
    const connectionMap = new Map(connections.map(conn => [conn.company_id, conn]));
    
    // Restore each session
    for (const sessionDir of sessionDirs) {
        const companyId = sessionDir.name.replace('session-', '');
        const credsPath = path.join(sessionPath, 'creds.json');
        
        // Only restore if creds.json exists (valid Baileys session)
        await fs.access(credsPath);
        
        const connection = connectionMap.get(companyId);
        if (connection?.user_id) {
            this.restoreSession(companyId, connection.user_id).catch(err => {
                console.error(`[WhatsApp] Failed to restore: ${err.message}`);
            });
            
            // Small delay between restorations
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
}
```

This is called in `server.js` during startup:

```javascript
app.listen(PORT, async () => {
    // ... other startup code
    
    console.log('📱 WhatsApp: Restaurando sessões salvas...');
    await whatsappClientManager.restoreAllSessions();
});
```

### 5. Repository Enhancement

Added `findAll()` method to `SupabaseWhatsappConnectionRepository`:

```javascript
async findAll() {
    const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*');

    if (error) throw error;
    return data || [];
}
```

This allows the restoration process to find all connection records, not just active ones.

## Expected Behavior

### Scenarios Where Connection WILL Persist:
- ✅ Server restarts (sessions restored automatically)
- ✅ Page refresh (F5) - status check triggers restoration
- ✅ Time passing (keepalive maintains active connections)
- ✅ Normal operations

### Scenarios Where Connection Will Need Reconnection:
- 🚪 User manually logs out from WhatsApp on their phone
- 🚪 User scans QR on another device (multi-device conflict)  
- 🚪 Session becomes invalid or corrupted
- ⚠️ Session files don't exist (first-time setup)

## Important Notes

### Session File Format

**Baileys sessions** are stored in the format:
```
sessions/
  session-{company_id}/
    creds.json          ← Authentication credentials
    app-state-sync-*.json  ← App state (optional)
```

**Old WhatsApp-Web.js/Puppeteer sessions** look like:
```
sessions/
  session-{company_id}/
    Crashpad/
    Default/
    DevToolsActivePort
```

If you have old session directories without `creds.json`, they need to be removed and WhatsApp needs to be reconnected using the Baileys implementation.

### Migration from Old Sessions

If you have existing sessions from WhatsApp-Web.js or Puppeteer:

1. **Delete old session directory:**
   ```bash
   rm -rf sessions/session-{company_id}
   ```

2. **Reconnect WhatsApp:**
   - Go to WhatsApp settings in the CRM
   - Click "Connect WhatsApp"
   - Scan the QR code with your phone
   - The new Baileys session will be saved automatically

3. **Verify persistence:**
   - Refresh the page (F5)
   - Status should show "Restoring connection from saved session..."
   - Then automatically connect

### Troubleshooting

If sessions aren't being restored:

1. **Check session files exist:**
   ```bash
   ls -la sessions/session-{company_id}/creds.json
   ```

2. **Check logs for restoration attempts:**
   ```bash
   # Look for these messages in server logs:
   # "📱 WhatsApp: Restaurando sessões salvas..."
   # "🔄 Restoring session for company: {id}"
   # "✅ Session restoration process completed"
   ```

3. **Check database connection record:**
   ```sql
   SELECT * FROM whatsapp_connections WHERE company_id = '{id}';
   ```
   Make sure `user_id` is populated.

4. **Force clean reconnection:**
   ```bash
   # Via API:
   POST /api/whatsapp/reconnect
   ```

### Testing

To verify the fix works:

1. **Connect WhatsApp** via the CRM interface
2. **Verify session files created:**
   ```bash
   ls -la sessions/session-*/creds.json
   ```
3. **Test page refresh:** Press F5, connection should restore
4. **Test server restart:** Restart server, connection should restore automatically
5. **Monitor logs:** Watch for restoration messages

## Benefits

1. **Persistent Connections:** WhatsApp stays connected across server restarts
2. **Better UX:** No need to reconnect after every page refresh
3. **Reduced QR Scans:** Users don't need to scan QR code repeatedly
4. **Automatic Recovery:** Transient network issues are handled automatically
5. **Production-Ready:** Suitable for production environments where server restarts are common

## Files Modified

1. `src/utils/whatsappClientManager.js` - Added restoration logic
2. `src/infrastructure/repositories/SupabaseWhatsappConnectionRepository.js` - Added findAll() method
3. `server.js` - Added startup restoration call

## Compatibility

- ✅ Baileys v7.0.0-rc.9 and above
- ✅ Node.js 14+
- ✅ Works with multi-tenant architecture
- ✅ Compatible with existing keepalive mechanism
