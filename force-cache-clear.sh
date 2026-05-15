#!/bin/bash

# Nuclear option to clear all caches and restart everything

echo "🔥 NUCLEAR CACHE CLEAR - This will fix the CSP issue"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Step 1: Kill all Node processes
echo -e "${BLUE}1️⃣  Stopping all Node processes...${NC}"
pkill -f node
sleep 2
echo -e "${GREEN}✓ All Node processes stopped${NC}"
echo ""

# Step 2: Clear Chrome cache (Mac)
echo -e "${BLUE}2️⃣  Clearing Chrome cache...${NC}"
if [ -d ~/Library/Caches/Google/Chrome ]; then
    echo "   Closing Chrome..."
    osascript -e 'quit app "Google Chrome"' 2>/dev/null
    sleep 2
    
    echo "   Deleting cache files..."
    rm -rf ~/Library/Caches/Google/Chrome/Default/Cache/* 2>/dev/null
    rm -rf ~/Library/Application\ Support/Google/Chrome/Default/Service\ Worker/CacheStorage/* 2>/dev/null
    
    echo -e "${GREEN}✓ Chrome cache cleared${NC}"
else
    echo -e "${YELLOW}⚠ Chrome cache directory not found (might be Windows or Linux)${NC}"
fi
echo ""

# Step 3: Restart backend
echo -e "${BLUE}3️⃣  Starting backend with NO-CACHE headers...${NC}"
cd backend
npm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..
echo -e "${GREEN}✓ Backend started (PID: $BACKEND_PID)${NC}"
echo ""

# Step 4: Wait for backend
echo -e "${BLUE}4️⃣  Waiting for backend to be ready...${NC}"
for i in {1..15}; do
    if curl -s http://localhost:5000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Backend is ready!${NC}"
        break
    fi
    sleep 1
done
echo ""

# Step 5: Test CSP headers
echo -e "${BLUE}5️⃣  Testing new CSP headers...${NC}"
PDF_FILE=$(ls backend/uploads/resumes/*.pdf 2>/dev/null | head -1)

if [ -n "$PDF_FILE" ]; then
    PDF_NAME=$(basename "$PDF_FILE")
    PDF_URL="http://localhost:5000/uploads/resumes/$PDF_NAME"
    
    echo "   Testing: $PDF_URL"
    
    # Get CSP header
    CSP=$(curl -s -I "$PDF_URL" | grep -i "content-security-policy:")
    
    if echo "$CSP" | grep -q "frame-ancestors.*localhost:3000"; then
        echo -e "${GREEN}✓ CSP is CORRECT!${NC}"
        echo "   $CSP"
    else
        echo -e "${RED}✗ CSP is still wrong${NC}"
        echo "   $CSP"
    fi
    
    # Get Cache-Control header
    CACHE=$(curl -s -I "$PDF_URL" | grep -i "cache-control:")
    echo ""
    echo "   Cache-Control: $CACHE"
    
    if echo "$CACHE" | grep -q "no-cache"; then
        echo -e "${GREEN}✓ Cache is DISABLED (good for dev)${NC}"
    fi
fi
echo ""

# Step 6: Instructions
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ CACHE CLEARED & BACKEND RESTARTED${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${YELLOW}📋 NEXT STEPS:${NC}"
echo ""
echo "1️⃣  Open a NEW Chrome window (or use different browser)"
echo ""
echo "2️⃣  Go to: http://localhost:3000"
echo ""
echo "3️⃣  Login as student"
echo ""
echo "4️⃣  Go to profile page"
echo ""
echo "5️⃣  Click 'Preview' on resume"
echo ""
echo "6️⃣  Open DevTools (F12) and check console"
echo ""
echo -e "${GREEN}✅ EXPECTED: No CSP errors, PDF loads in iframe${NC}"
echo ""
echo -e "${YELLOW}⚠️  If still not working, try Firefox or Safari:${NC}"
echo "   open -a Firefox http://localhost:3000"
echo "   open -a Safari http://localhost:3000"
echo ""
