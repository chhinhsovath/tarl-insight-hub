// Claude Context Bookmarklet
// Save this as a bookmark in your browser with the URL below

javascript:(function(){
  const contextText = `🤖 CLAUDE CODE CONTEXT SUMMARY
================================

PROJECT: TaRL Insight Hub (Teaching at the Right Level Management System)
TECH STACK: Next.js 15 + React 19 + TypeScript + PostgreSQL + Tailwind CSS

📋 QUICK CONTEXT:
1. 🎨 FONTS: Hanuman font standardized for both English/Khmer
2. 🌐 LANGUAGES: Global language switching (English/Khmer) implemented  
3. 🎓 TRAINING: 100% complete training management system
4. 💾 DATABASE: Digital Ocean PostgreSQL (production) + Local (dev)
5. 🎯 LOADING: UniversalLoading component with favicon glare effects
6. 📱 MOBILE: Responsive sidebar with overlay functionality
7. 🔐 AUTH: Role-based access (Admin/Director/Teacher/Coordinator/etc.)

📁 KEY FILES:
- CLAUDE_CONTEXT.md (comprehensive project knowledge)
- components/sidebar.tsx (main navigation)
- lib/global-language-context.tsx (language switching)
- components/universal-loading.tsx (standardized loading)
- app/globals.css (Hanuman font config)

🚨 RECENT: Font standardization, Training system complete, Loading standardized

Please read CLAUDE_CONTEXT.md and CLAUDE.md for full context.

TASK: `;
  
  navigator.clipboard.writeText(contextText).then(() => {
    alert('✅ Claude context copied to clipboard!');
  }).catch(() => {
    prompt('Copy this manually:', contextText);
  });
})();

// To create the bookmarklet:
// 1. Copy the entire JavaScript code above (including javascript:)
// 2. Create a new bookmark in your browser
// 3. Set the name to "Claude Context"  
// 4. Set the URL to the JavaScript code
// 5. Click the bookmark when you need the context copied