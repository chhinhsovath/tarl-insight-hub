#!/bin/bash

echo "🚀 Deploying TaRL Insight Hub to Vercel..."
echo ""

# Check if vercel is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
    echo "✅ Vercel CLI installed!"
    echo ""
fi

# Deploy to Vercel
echo "🌐 Starting deployment..."
echo ""
echo "📋 You'll be asked a few questions:"
echo "   1. Link to existing project? → Choose 'No' (N)"
echo "   2. Project name? → Keep default or type: tarl-insight-hub"
echo "   3. Deploy? → Choose 'Yes' (Y)"
echo ""

vercel

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🔧 Next steps:"
echo "   1. Copy your deployment URL"
echo "   2. Go to Vercel dashboard → Settings → Environment Variables"
echo "   3. Add your database environment variables:"
echo "      - PGUSER=postgres"
echo "      - PGHOST=your_database_host"
echo "      - PGDATABASE=pratham_tarl"
echo "      - PGPASSWORD=your_password"
echo "      - PGPORT=5432"
echo ""
echo "🎉 Your TaRL Insight Hub will be fully functional!"