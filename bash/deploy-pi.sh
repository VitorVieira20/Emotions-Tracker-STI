#!/bin/bash

CYAN='\033[0;36m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}[START] Starting Deployment on Raspberry Pi 5...${NC}"

echo -e "${BLUE}[INFO] Installing/Updating NPM dependencies...${NC}"
npm install

echo -e "${BLUE}[INFO] Starting Docker containers (Postgres & pgAdmin)...${NC}"
docker-compose up -d

echo -e "${BLUE}[INFO] Waiting for Database to be ready...${NC}"
sleep 5

echo -e "${BLUE}[INFO] Syncing Database schema...${NC}"
npx prisma db push

echo -e "${BLUE}[INFO] Running Master Setup (Seeds & Audio Generation)...${NC}"
npm run setup

echo -e "${BLUE}[INFO] Building Next.js for production...${NC}"
npm run build

echo -e "${GREEN}[SUCCESS] Deployment complete!${NC}"
echo -e "${GREEN}[DONE] App running on port 3000${NC}"
echo -e "${GREEN}[DONE] pgAdmin running on port 5050${NC}"