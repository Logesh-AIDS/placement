#!/bin/bash

# Script to restart both backend and frontend servers
# Run this after applying fixes to ensure all changes take effect

echo "🔄 Restarting Placement Portal Servers..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to kill process on port
kill_port() {
    local port=$1
    local pid=$(lsof -ti:$port)
    if [ ! -z "$pid" ]; then
        echo -e "${YELLOW}Killing process on port $port (PID: $pid)${NC}"
        kill -9 $pid 2>/dev/null
        sleep 1
    fi
}

# Stop existing servers
echo -e "${BLUE}1️⃣  Stopping existing servers...${NC}"
kill_port 5000  # Backend
kill_port 3000  # Frontend
echo ""

# Clear Next.js cache
echo -e "${BLUE}2️⃣  Clearing Next.js cache...${NC}"
if [ -d "frontend/.next" ]; then
    rm -rf frontend/.next
    echo -e "${GREEN}✓ Next.js cache cleared${NC}"
else
    echo "No cache to clear"
fi
echo ""

# Start backend
echo -e "${BLUE}3️⃣  Starting backend server...${NC}"
cd backend
npm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..
echo -e "${GREEN}✓ Backend started (PID: $BACKEND_PID)${NC}"
echo "   Logs: backend.log"
echo ""

# Wait for backend to be ready
echo -e "${BLUE}4️⃣  Waiting for backend to be ready...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:5000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Backend is ready!${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${YELLOW}⚠ Backend might not be ready yet. Check backend.log${NC}"
    fi
    sleep 1
done
echo ""

# Start frontend
echo -e "${BLUE}5️⃣  Starting frontend server...${NC}"
cd frontend
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..
echo -e "${GREEN}✓ Frontend started (PID: $FRONTEND_PID)${NC}"
echo "   Logs: frontend.log"
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ SERVERS STARTED${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend:  http://localhost:5000"
echo ""
echo "📋 Process IDs:"
echo "   Backend:  $BACKEND_PID"
echo "   Frontend: $FRONTEND_PID"
echo ""
echo "📝 Logs:"
echo "   Backend:  tail -f backend.log"
echo "   Frontend: tail -f frontend.log"
echo ""
echo "🛑 To stop servers:"
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo "   or run: ./stop-servers.sh"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: Clear your browser cache!${NC}"
echo "   Chrome/Edge: Ctrl+Shift+Delete (Windows) or Cmd+Shift+Delete (Mac)"
echo "   Or use Incognito/Private mode"
echo ""
