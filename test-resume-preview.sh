#!/bin/bash

# Quick script to test resume preview after cache clear

echo "🧪 Testing Resume Preview..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Step 1: Check backend
echo -e "${BLUE}1️⃣  Checking backend...${NC}"
if curl -s http://localhost:5000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend is running${NC}"
else
    echo -e "${YELLOW}⚠ Backend not running. Starting...${NC}"
    cd backend
    npm run dev > ../backend.log 2>&1 &
    cd ..
    sleep 3
fi
echo ""

# Step 2: Check frontend
echo -e "${BLUE}2️⃣  Checking frontend...${NC}"
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Frontend is running${NC}"
else
    echo -e "${YELLOW}⚠ Frontend not running. Start it with: cd frontend && npm run dev${NC}"
fi
echo ""

# Step 3: Test PDF headers
echo -e "${BLUE}3️⃣  Testing PDF CSP headers...${NC}"
PDF_FILE=$(ls backend/uploads/resumes/*.pdf 2>/dev/null | head -1)

if [ -n "$PDF_FILE" ]; then
    PDF_NAME=$(basename "$PDF_FILE")
    PDF_URL="http://localhost:5000/uploads/resumes/$PDF_NAME"
    
    CSP=$(curl -s -I "$PDF_URL" | grep -i "content-security-policy:")
    
    if echo "$CSP" | grep -q "frame-ancestors.*localhost:3000"; then
        echo -e "${GREEN}✓ CSP is correctly configured${NC}"
        echo "   frame-ancestors includes localhost:3000"
    else
        echo -e "${YELLOW}⚠ CSP might not be correct${NC}"
        echo "   $CSP"
    fi
else
    echo -e "${YELLOW}⚠ No PDF found. Upload a resume first.${NC}"
fi
echo ""

# Instructions
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}📋 NEXT STEPS TO CLEAR CACHE:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${GREEN}OPTION 1: Incognito Mode (Recommended)${NC}"
echo "   1. Open Incognito window:"
echo "      Mac: Cmd+Shift+N"
echo "      Windows: Ctrl+Shift+N"
echo "   2. Go to: http://localhost:3000"
echo "   3. Login and test resume preview"
echo ""
echo -e "${GREEN}OPTION 2: Clear Cache${NC}"
echo "   1. Open Clear Browsing Data:"
echo "      Mac: Cmd+Shift+Delete"
echo "      Windows: Ctrl+Shift+Delete"
echo "   2. Check 'Cached images and files'"
echo "   3. Click 'Clear data'"
echo "   4. Reload page: Cmd+Shift+R or Ctrl+Shift+R"
echo ""
echo -e "${GREEN}OPTION 3: DevTools Disable Cache${NC}"
echo "   1. Open DevTools: F12"
echo "   2. Go to Network tab"
echo "   3. Check ☑️ 'Disable cache'"
echo "   4. Keep DevTools open while testing"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT:${NC}"
echo "   After clearing cache, test at:"
echo "   http://localhost:3000/dashboard/student/profile"
echo ""
