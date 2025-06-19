#!/bin/bash

# TaRL Insight Hub Deployment Script

echo "🚀 Starting TaRL Insight Hub Deployment..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo -e "${RED}❌ .env.production file not found!${NC}"
    echo "Please copy .env.production.example to .env.production and configure it."
    exit 1
fi

# Build the application
echo -e "${YELLOW}📦 Building application...${NC}"
NODE_ENV=production npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build completed successfully!${NC}"

# Check if standalone build was created
if [ -d ".next/standalone" ]; then
    echo -e "${GREEN}✅ Standalone build created${NC}"
    
    # Copy static files
    cp -r .next/static .next/standalone/.next/
    cp -r public .next/standalone/
    
    echo -e "${YELLOW}📋 Deployment files ready in .next/standalone${NC}"
    echo ""
    echo "To deploy:"
    echo "1. Copy .next/standalone to your server"
    echo "2. Copy .env.production to your server"
    echo "3. Run: NODE_ENV=production node server.js"
else
    echo -e "${YELLOW}📋 Standard build created${NC}"
    echo ""
    echo "To deploy:"
    echo "1. Copy entire project to your server"
    echo "2. Run: npm install --production"
    echo "3. Run: NODE_ENV=production npm start"
fi

echo ""
echo -e "${GREEN}✅ Deployment preparation complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Deploy files to your server"
echo "2. Set up database using scripts/99_master_schema.sql"
echo "3. Run permission setup scripts"
echo "4. Configure your web server (nginx/apache)"
echo "5. Set up SSL certificates"
echo ""
echo "See DEPLOYMENT.md for detailed instructions."