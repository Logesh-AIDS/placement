#!/bin/bash

# Script to test CSP configuration

echo "🔍 Testing Content Security Policy Configuration..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test 1: Check if backend is running
echo -e "${BLUE}1️⃣  Checking backend health...${NC}"
HEALTH=$(curl -s http://localhost:5000/health)
if echo "$HEALTH" | grep -q "success"; then
    echo -e "${GREEN}✓ Backend is running${NC}"
else
    echo -e "${RED}✗ Backend is not running. Start it with: cd backend && npm run dev${NC}"
    exit 1
fi
echo ""

# Test 2: Check CSP headers on a PDF
echo -e "${BLUE}2️⃣  Checking CSP headers on PDF...${NC}"
PDF_FILE=$(ls backend/uploads/resumes/*.pdf 2>/dev/null | head -1)

if [ -z "$PDF_FILE" ]; then
    echo -e "${YELLOW}⚠ No PDF files found. Upload a resume first.${NC}"
else
    PDF_NAME=$(basename "$PDF_FILE")
    PDF_URL="http://localhost:5000/uploads/resumes/$PDF_NAME"
    
    echo "   Testing: $PDF_URL"
    echo ""
    
    # Get headers
    HEADERS=$(curl -s -I "$PDF_URL")
    
    # Check CSP header
    CSP=$(echo "$HEADERS" | grep -i "content-security-policy:")
    if [ -n "$CSP" ]; then
        echo -e "${GREEN}✓ CSP header found:${NC}"
        echo "   $CSP"
        
        # Check if localhost:3000 is in frame-ancestors
        if echo "$CSP" | grep -q "frame-ancestors.*localhost:3000"; then
            echo -e "${GREEN}✓ frame-ancestors includes localhost:3000${NC}"
        else
            echo -e "${RED}✗ frame-ancestors does NOT include localhost:3000${NC}"
            echo -e "${YELLOW}   This will cause iframe blocking!${NC}"
        fi
    else
        echo -e "${YELLOW}⚠ No CSP header found (might be okay)${NC}"
    fi
    echo ""
    
    # Check CORS header
    CORS=$(echo "$HEADERS" | grep -i "access-control-allow-origin:")
    if [ -n "$CORS" ]; then
        echo -e "${GREEN}✓ CORS header found:${NC}"
        echo "   $CORS"
    else
        echo -e "${RED}✗ CORS header missing${NC}"
    fi
    echo ""
    
    # Check Content-Type
    CONTENT_TYPE=$(echo "$HEADERS" | grep -i "content-type:")
    if echo "$CONTENT_TYPE" | grep -q "application/pdf"; then
        echo -e "${GREEN}✓ Content-Type is application/pdf${NC}"
    else
        echo -e "${YELLOW}⚠ Content-Type: $CONTENT_TYPE${NC}"
    fi
    echo ""
    
    # Check HTTP status
    STATUS=$(echo "$HEADERS" | head -1 | awk '{print $2}')
    if [ "$STATUS" = "200" ]; then
        echo -e "${GREEN}✓ HTTP Status: 200 OK${NC}"
    else
        echo -e "${RED}✗ HTTP Status: $STATUS${NC}"
    fi
fi
echo ""

# Test 3: Check environment variables
echo -e "${BLUE}3️⃣  Checking environment configuration...${NC}"
if [ -f "backend/.env" ]; then
    CLIENT_URL=$(grep "^CLIENT_URL=" backend/.env | cut -d '=' -f2)
    BASE_URL=$(grep "^BASE_URL=" backend/.env | cut -d '=' -f2)
    
    echo "   CLIENT_URL: $CLIENT_URL"
    echo "   BASE_URL: $BASE_URL"
    
    if [ "$CLIENT_URL" = "http://localhost:3000" ]; then
        echo -e "${GREEN}✓ CLIENT_URL is correctly set${NC}"
    else
        echo -e "${YELLOW}⚠ CLIENT_URL might need adjustment${NC}"
    fi
else
    echo -e "${RED}✗ .env file not found${NC}"
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}📋 SUMMARY${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ WHAT TO CHECK IN BROWSER:"
echo "   1. Open http://localhost:3000/dashboard/student/profile"
echo "   2. Upload a resume (if not already uploaded)"
echo "   3. Click 'Preview' button"
echo "   4. Open browser console (F12)"
echo "   5. Check for CSP errors"
echo ""
echo "✅ EXPECTED RESULT:"
echo "   - PDF loads in iframe"
echo "   - No 'frame-ancestors' errors in console"
echo "   - Can scroll through PDF"
echo ""
echo "❌ IF STILL NOT WORKING:"
echo "   1. Restart backend: pkill -f node && cd backend && npm run dev"
echo "   2. Clear browser cache: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)"
echo "   3. Try incognito/private mode"
echo "   4. Check backend logs for errors"
echo ""
