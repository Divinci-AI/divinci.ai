#!/bin/bash

# Emergency deployment script to fix infinite loading loops
# This script deploys the critical fixes to stop the production issue

echo "🚨 DEPLOYING EMERGENCY FIX FOR INFINITE LOADING LOOPS"
echo "=================================================="

# Check if we're in the right directory
if [ ! -f "index.html" ]; then
    echo "❌ Error: Not in the correct directory. Please run from the website root."
    exit 1
fi

# Check if emergency fix file exists
if [ ! -f "js/emergency-loop-fix.js" ]; then
    echo "❌ Error: Emergency fix file not found at js/emergency-loop-fix.js"
    exit 1
fi

echo "✅ Emergency fix files found"

# Show what files will be deployed
echo ""
echo "📁 Files to be deployed:"
echo "  - js/emergency-loop-fix.js (NEW - stops infinite loops)"
echo "  - js/include-html.js (FIXED - removed recursive calls)"
echo "  - index.html (UPDATED - loads emergency fix first)"
echo "  - internships.html (UPDATED - loads emergency fix first)"

echo ""
echo "🔧 Changes made:"
echo "  1. Created emergency-loop-fix.js to immediately stop all infinite loops"
echo "  2. Fixed include-html.js to prevent recursive initializeIncludedComponents calls"
echo "  3. Added emergency fix script as first script in main HTML files"
echo "  4. Emergency fix disables problematic functions and prevents duplicate loading"

echo ""
echo "⚡ This fix will:"
echo "  - Immediately stop the infinite loading of styles.min.css"
echo "  - Stop the infinite 'Loading feature...' and 'Loading language...' messages"
echo "  - Prevent duplicate script and stylesheet loading"
echo "  - Stabilize the website header and language switcher"

echo ""
read -p "🚀 Deploy these emergency fixes to production? (y/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 Deploying emergency fixes..."
    
    # If using git for deployment
    if [ -d ".git" ]; then
        echo "📝 Committing emergency fixes..."
        git add js/emergency-loop-fix.js js/include-html.js index.html internships.html
        git commit -m "🚨 EMERGENCY FIX: Stop infinite loading loops in production

- Add emergency-loop-fix.js to immediately disable problematic functions
- Fix include-html.js recursive calls causing infinite loops
- Load emergency fix first in main HTML files
- Prevent duplicate resource loading that was causing rapid reloads

Critical production issue: styles.min.css and language/feature loading
were stuck in infinite loops causing performance issues."
        
        echo "🌐 Pushing to production..."
        git push origin main
        
        echo ""
        echo "✅ EMERGENCY FIX DEPLOYED!"
        echo ""
        echo "🔍 Monitor the production site for:"
        echo "  - Console should show '🚨 EMERGENCY LOOP FIX ACTIVATED'"
        echo "  - No more rapid 'Loading: styles.min.css' messages"
        echo "  - No more infinite 'Loading feature...' or 'Loading language...' messages"
        echo "  - Website should load normally without performance issues"
        echo ""
        echo "📊 Check browser console for status reports every 5 seconds"
        
    else
        echo "⚠️  No git repository found. Please deploy these files manually:"
        echo "  - js/emergency-loop-fix.js"
        echo "  - js/include-html.js"
        echo "  - index.html"
        echo "  - internships.html"
    fi
    
else
    echo "❌ Deployment cancelled"
    exit 1
fi

echo ""
echo "🎯 Next steps after deployment:"
echo "1. Check production site immediately"
echo "2. Monitor browser console for emergency fix messages"
echo "3. Verify language switcher and features work normally"
echo "4. Plan proper long-term fix to remove emergency patches"

echo ""
echo "📞 If issues persist, the emergency fix provides detailed logging"
echo "   Check browser console for diagnostic information"
