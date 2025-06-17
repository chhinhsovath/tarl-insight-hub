#!/bin/bash

echo "🏗️  Building TaRL Insight Hub for Shared Hosting..."

# Step 1: Install dependencies
echo "📦 Installing dependencies..."
npm install

# Step 2: Create static-compatible environment
echo "🔧 Setting up static environment..."
cp .env.local .env.local.backup 2>/dev/null || true

# Create static environment file
cat > .env.local << EOF
# Static build environment
NEXT_PUBLIC_APP_MODE=static
NEXT_PUBLIC_API_URL=https://your-api-backend.com
EOF

# Step 3: Build static site
echo "🚀 Building static site..."
npm run build

# Step 4: Check if build was successful
if [ -d "out" ]; then
    echo "✅ Build successful!"
    echo ""
    echo "📁 Your static files are in the 'out' directory"
    echo "📤 Upload the contents of 'out' folder to your shared hosting"
    echo ""
    echo "⚠️  IMPORTANT LIMITATIONS:"
    echo "   - No database functionality"
    echo "   - No user authentication"
    echo "   - No API endpoints"
    echo "   - Limited to static content only"
    echo ""
    echo "🎯 For full functionality, use Vercel (free) instead:"
    echo "   1. npm install -g vercel"
    echo "   2. vercel"
    echo ""
else
    echo "❌ Build failed. Check the errors above."
    echo "💡 This project requires server-side features."
    echo "🎯 Recommended: Use Vercel for full functionality"
fi

# Restore original environment
mv .env.local.backup .env.local 2>/dev/null || true