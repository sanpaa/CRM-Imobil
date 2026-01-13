#!/bin/bash

# WhatsApp Session Restoration Verification Script
# This script verifies the implementation and helps with testing

echo "=================================================="
echo "WhatsApp Session Restoration Verification"
echo "=================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if sessions directory exists
echo "1. Checking sessions directory..."
if [ -d "sessions" ]; then
    echo -e "${GREEN}✓${NC} Sessions directory exists"
    
    # Count session directories
    session_count=$(find sessions -maxdepth 1 -type d -name "session-*" | wc -l)
    echo "  Found $session_count session(s)"
    
    # Check each session for Baileys format
    for session_dir in sessions/session-*; do
        if [ -d "$session_dir" ]; then
            company_id=$(basename "$session_dir" | sed 's/session-//')
            echo ""
            echo "  Session: $company_id"
            
            if [ -f "$session_dir/creds.json" ]; then
                creds_size=$(stat -f%z "$session_dir/creds.json" 2>/dev/null || stat -c%s "$session_dir/creds.json" 2>/dev/null)
                echo -e "    ${GREEN}✓${NC} Valid Baileys session (creds.json: $creds_size bytes)"
            else
                echo -e "    ${RED}✗${NC} Not a Baileys session (no creds.json found)"
                echo -e "    ${YELLOW}⚠${NC}  This is likely an old WhatsApp-Web.js session"
                echo "    To fix: Remove this directory and reconnect WhatsApp"
            fi
        fi
    done
else
    echo -e "${YELLOW}⚠${NC} Sessions directory does not exist"
    echo "  This is normal if WhatsApp has never been connected"
fi

echo ""
echo "=================================================="
echo "2. Verifying code implementation..."
echo "=================================================="
echo ""

# Check if the modified files have the new methods
if grep -q "hasSessionFiles(companyId)" src/utils/whatsappClientManager.js; then
    echo -e "${GREEN}✓${NC} hasSessionFiles() method implemented"
else
    echo -e "${RED}✗${NC} hasSessionFiles() method NOT found"
fi

if grep -q "restoreSession(companyId, userId" src/utils/whatsappClientManager.js; then
    echo -e "${GREEN}✓${NC} restoreSession() method implemented"
else
    echo -e "${RED}✗${NC} restoreSession() method NOT found"
fi

if grep -q "restoreAllSessions()" src/utils/whatsappClientManager.js; then
    echo -e "${GREEN}✓${NC} restoreAllSessions() method implemented"
else
    echo -e "${RED}✗${NC} restoreAllSessions() method NOT found"
fi

if grep -q "SESSION_RESTORE_DELAY_MS" src/utils/whatsappClientManager.js; then
    echo -e "${GREEN}✓${NC} Configuration constants added"
else
    echo -e "${RED}✗${NC} Configuration constants NOT found"
fi

if grep -q "restoreAllSessions()" server.js; then
    echo -e "${GREEN}✓${NC} Server startup integration implemented"
else
    echo -e "${RED}✗${NC} Server startup integration NOT found"
fi

if grep -q "async findAll()" src/infrastructure/repositories/SupabaseWhatsappConnectionRepository.js; then
    echo -e "${GREEN}✓${NC} Repository findAll() method implemented"
else
    echo -e "${RED}✗${NC} Repository findAll() method NOT found"
fi

echo ""
echo "=================================================="
echo "3. Next Steps"
echo "=================================================="
echo ""
echo "To test the session restoration:"
echo ""
echo "1. Start the server:"
echo "   npm start"
echo ""
echo "2. Connect WhatsApp through the web interface:"
echo "   - Go to WhatsApp settings"
echo "   - Click 'Connect WhatsApp'"
echo "   - Scan the QR code"
echo ""
echo "3. Verify session files were created:"
echo "   ls -la sessions/session-*/creds.json"
echo ""
echo "4. Test page refresh (F5):"
echo "   - Refresh the page"
echo "   - Status should show 'Restoring connection...'"
echo "   - Then automatically connect"
echo ""
echo "5. Test server restart:"
echo "   - Restart the server"
echo "   - Check logs for: '📱 WhatsApp: Restaurando sessões salvas...'"
echo "   - Connection should restore automatically"
echo ""
echo "=================================================="
echo "Documentation: WHATSAPP_SESSION_RESTORATION.md"
echo "=================================================="
