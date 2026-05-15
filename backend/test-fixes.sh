#!/bin/bash

# Test script to verify all fixes are working

echo "🔍 Testing Placement Portal Fixes..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Check if backend is running
echo "1️⃣  Testing backend health..."
HEALTH=$(curl -s http://localhost:5000/health)
if echo "$HEALTH" | grep -q "success"; then
    echo -e "${GREEN}✓ Backend is running${NC}"
else
    echo -e "${RED}✗ Backend is not running${NC}"
    exit 1
fi
echo ""

# Test 2: Check if uploads directory exists and has correct permissions
echo "2️⃣  Testing uploads directory..."
if [ -d "backend/uploads/photos" ] && [ -d "backend/uploads/resumes" ]; then
    echo -e "${GREEN}✓ Upload directories exist${NC}"
    
    # Check permissions
    PHOTO_PERMS=$(ls -ld backend/uploads/photos | awk '{print $1}')
    RESUME_PERMS=$(ls -ld backend/uploads/resumes | awk '{print $1}')
    echo "   Photos dir: $PHOTO_PERMS"
    echo "   Resumes dir: $RESUME_PERMS"
else
    echo -e "${RED}✗ Upload directories missing${NC}"
fi
echo ""

# Test 3: Check if uploaded files are accessible
echo "3️⃣  Testing file accessibility..."
PHOTO_COUNT=$(ls -1 backend/uploads/photos/*.{jpg,jpeg,png,gif,webp} 2>/dev/null | wc -l)
RESUME_COUNT=$(ls -1 backend/uploads/resumes/*.{pdf,doc,docx} 2>/dev/null | wc -l)

echo "   Photos uploaded: $PHOTO_COUNT"
echo "   Resumes uploaded: $RESUME_COUNT"

if [ $PHOTO_COUNT -gt 0 ]; then
    PHOTO_FILE=$(ls backend/uploads/photos/*.{jpg,jpeg,png,gif,webp} 2>/dev/null | head -1)
    PHOTO_NAME=$(basename "$PHOTO_FILE")
    PHOTO_URL="http://localhost:5000/uploads/photos/$PHOTO_NAME"
    
    echo "   Testing photo URL: $PHOTO_URL"
    PHOTO_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$PHOTO_URL")
    
    if [ "$PHOTO_STATUS" = "200" ]; then
        echo -e "${GREEN}✓ Photo is accessible (HTTP $PHOTO_STATUS)${NC}"
    else
        echo -e "${RED}✗ Photo is not accessible (HTTP $PHOTO_STATUS)${NC}"
    fi
fi

if [ $RESUME_COUNT -gt 0 ]; then
    RESUME_FILE=$(ls backend/uploads/resumes/*.{pdf,doc,docx} 2>/dev/null | head -1)
    RESUME_NAME=$(basename "$RESUME_FILE")
    RESUME_URL="http://localhost:5000/uploads/resumes/$RESUME_NAME"
    
    echo "   Testing resume URL: $RESUME_URL"
    RESUME_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$RESUME_URL")
    
    if [ "$RESUME_STATUS" = "200" ]; then
        echo -e "${GREEN}✓ Resume is accessible (HTTP $RESUME_STATUS)${NC}"
    else
        echo -e "${RED}✗ Resume is not accessible (HTTP $RESUME_STATUS)${NC}"
    fi
fi
echo ""

# Test 4: Check CORS headers
echo "4️⃣  Testing CORS headers..."
if [ $PHOTO_COUNT -gt 0 ]; then
    PHOTO_FILE=$(ls backend/uploads/photos/*.{jpg,jpeg,png,gif,webp} 2>/dev/null | head -1)
    PHOTO_NAME=$(basename "$PHOTO_FILE")
    PHOTO_URL="http://localhost:5000/uploads/photos/$PHOTO_NAME"
    
    CORS_HEADER=$(curl -s -I "$PHOTO_URL" | grep -i "access-control-allow-origin")
    
    if [ -n "$CORS_HEADER" ]; then
        echo -e "${GREEN}✓ CORS headers are set${NC}"
        echo "   $CORS_HEADER"
    else
        echo -e "${YELLOW}⚠ CORS headers not found (might cause issues in browser)${NC}"
    fi
fi
echo ""

# Test 5: Environment variables
echo "5️⃣  Testing environment configuration..."
if [ -f "backend/.env" ]; then
    BASE_URL=$(grep "^BASE_URL=" backend/.env | cut -d '=' -f2)
    echo "   BASE_URL: $BASE_URL"
    
    if [ "$BASE_URL" = "http://localhost:5000" ]; then
        echo -e "${GREEN}✓ BASE_URL is correctly configured${NC}"
    else
        echo -e "${YELLOW}⚠ BASE_URL might need adjustment${NC}"
    fi
else
    echo -e "${RED}✗ .env file not found${NC}"
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ FIXES APPLIED:"
echo "   1. Removed cache-busting query parameters from photo URLs"
echo "   2. Added explicit score update in test submission"
echo "   3. Profile page now reloads data after uploads"
echo "   4. Added proper CORS headers for static files"
echo ""
echo "🔧 NEXT STEPS:"
echo "   1. Restart the backend server: cd backend && npm run dev"
echo "   2. Clear browser cache (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)"
echo "   3. Test photo upload in the profile page"
echo "   4. Test resume upload in the profile page"
echo "   5. Take a test and verify score updates"
echo ""
