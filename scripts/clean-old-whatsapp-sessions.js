/**
 * Script to clean up old WhatsApp session files
 * 
 * This script removes old browser-based session files (from whatsapp-web.js/Puppeteer)
 * and keeps only valid Baileys session files (containing creds.json).
 * 
 * Run this if you're migrating from an old WhatsApp library to Baileys.
 * 
 * Usage: node scripts/clean-old-whatsapp-sessions.js
 */

const fs = require('fs').promises;
const path = require('path');

const SESSIONS_PATH = path.join(process.cwd(), 'sessions');

async function cleanOldSessions() {
    console.log('🧹 Starting cleanup of old WhatsApp session files...\n');
    
    try {
        // Check if sessions directory exists
        try {
            await fs.access(SESSIONS_PATH);
        } catch (error) {
            console.log('ℹ️  No sessions directory found. Nothing to clean.');
            return;
        }
        
        // Read all session directories
        const entries = await fs.readdir(SESSIONS_PATH, { withFileTypes: true });
        const sessionDirs = entries.filter(entry => 
            entry.isDirectory() && entry.name.startsWith('session-')
        );
        
        if (sessionDirs.length === 0) {
            console.log('ℹ️  No session directories found.');
            return;
        }
        
        console.log(`📂 Found ${sessionDirs.length} session directory(ies)\n`);
        
        let cleanedCount = 0;
        let keptCount = 0;
        
        for (const sessionDir of sessionDirs) {
            const sessionPath = path.join(SESSIONS_PATH, sessionDir.name);
            const companyId = sessionDir.name.replace('session-', '');
            const credsPath = path.join(sessionPath, 'creds.json');
            
            console.log(`Checking ${sessionDir.name}...`);
            
            try {
                // Check if creds.json exists (valid Baileys session)
                await fs.access(credsPath);
                console.log(`  ✅ Valid Baileys session (has creds.json) - KEEPING`);
                keptCount++;
            } catch (error) {
                // No creds.json - this is an old browser-based session
                console.log(`  ❌ Old browser-based session (no creds.json) - REMOVING`);
                
                // List what's inside
                const contents = await fs.readdir(sessionPath);
                console.log(`  📋 Contents: ${contents.join(', ')}`);
                
                // Remove the directory
                await fs.rm(sessionPath, { recursive: true, force: true });
                console.log(`  🗑️  Removed successfully`);
                cleanedCount++;
            }
            
            console.log('');
        }
        
        console.log('='.repeat(60));
        console.log('✅ Cleanup completed!');
        console.log(`   - Removed: ${cleanedCount} old session(s)`);
        console.log(`   - Kept: ${keptCount} valid session(s)`);
        console.log('='.repeat(60));
        
        if (cleanedCount > 0) {
            console.log('\n⚠️  IMPORTANT: Users will need to reconnect WhatsApp');
            console.log('   by scanning the QR code again in the CRM interface.');
        }
        
    } catch (error) {
        console.error('❌ Error during cleanup:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run the cleanup
cleanOldSessions().then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
}).catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
});
