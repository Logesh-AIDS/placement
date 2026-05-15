#!/bin/bash

# Script to stop both backend and frontend servers

echo "🛑 Stopping Placement Portal Servers..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to kill process on port
kill_port() {
    local port=$1
    local name=$2
    local pid=$(lsof -ti:$port)
    if [ ! -z "$pid" ]; then
        echo -e "Stopping $name on port $port (PID: $pid)..."
        kill -9 $pid 2>/dev/null
        sleep 1
        echo -e "${GREEN}✓ $name stopped${NC}"
    else
        echo -e "${RED}✗ No process found on port $port${NC}"
    fi
}

# Stop servers
kill_port 5000 "Backend"
kill_port 3000 "Frontend"

echo ""
echo -e "${GREEN}✅ All servers stopped${NC}"
