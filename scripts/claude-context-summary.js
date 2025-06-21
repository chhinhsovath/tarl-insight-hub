#!/usr/bin/env node

/**
 * Claude Context Summary Generator
 * Run this script to generate a quick context summary for new Claude Code conversations
 */

const fs = require('fs');
const path = require('path');

function generateContextSummary() {
  const projectRoot = path.resolve(__dirname, '..');
  const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
  
  console.log(`
🤖 CLAUDE CODE CONTEXT SUMMARY
================================

PROJECT: ${packageJson.name || 'TaRL Insight Hub'}
TECH STACK: Next.js 15 + React 19 + TypeScript + PostgreSQL + Tailwind CSS

📋 QUICK CONTEXT FOR NEW CONVERSATIONS:
--------------------------------------

1. 🎨 FONTS: Hanuman font standardized for both English/Khmer
2. 🌐 LANGUAGES: Global language switching (English/Khmer) implemented
3. 🎓 TRAINING: 100% complete training management system
4. 💾 DATABASE: Digital Ocean PostgreSQL (production) + Local (dev)
5. 🎯 LOADING: UniversalLoading component with favicon glare effects
6. 📱 MOBILE: Responsive sidebar with overlay functionality
7. 🔐 AUTH: Role-based access (Admin/Director/Teacher/Coordinator/etc.)

📁 KEY FILES TO KNOW:
---------------------
- CLAUDE_CONTEXT.md          # Comprehensive project knowledge
- CLAUDE.md                  # Development commands & setup
- components/sidebar.tsx     # Main navigation with language support
- lib/global-language-context.tsx  # Language switching system
- components/universal-loading.tsx  # Standardized loading
- app/globals.css           # Hanuman font configuration

🚨 RECENT CHANGES:
------------------
- Font standardization (Hanuman everywhere)
- Training system audit complete (100% functional)
- Loading component standardization
- Enhanced Khmer translations

🛠️ COMMON TASKS:
-----------------
- npm run dev       # Start development
- npm run build     # Production build
- npm run lint      # Code quality check

🌐 DEPLOYMENT:
--------------
- Platform: Vercel
- Domain: openplp.com
- Database: Digital Ocean PostgreSQL

💡 FOR NEW CONVERSATIONS:
-------------------------
1. Copy this entire summary to Claude Code
2. Ask Claude to read CLAUDE_CONTEXT.md for full details
3. Mention specific areas you want to work on

Generated: ${new Date().toLocaleString()}
`);
}

if (require.main === module) {
  generateContextSummary();
}

module.exports = { generateContextSummary };