#!/bin/bash
# Script to replace all .single() calls with .maybeSingle() for multi-tenant safety

echo "🔍 Searching for .single() calls in the codebase..."

# Find all TypeScript/TSX files with .single() calls
FILES=$(grep -rl "\.single()" src --include="*.ts" --include="*.tsx" --exclude-dir=node_modules --exclude-dir=dist --exclude="*.test.ts")

if [ -z "$FILES" ]; then
  echo "✅ No .single() calls found. Multi-tenant safety check passed!"
  exit 0
fi

echo "📝 Found .single() calls in the following files:"
echo "$FILES"
echo ""
echo "🔄 Replacing .single() with .maybeSingle()..."

# Perform the replacement
for file in $FILES; do
  sed -i.bak 's/\.single()/\.maybeSingle()/g' "$file"
  rm "${file}.bak" 2>/dev/null || true
  echo "  ✓ $file"
done

echo ""
echo "✅ All .single() calls have been replaced with .maybeSingle()"
echo "⚠️  Please review the changes and ensure error handling checks for !data"
echo ""
echo "Next steps:"
echo "1. Run: npm run test:multi-tenant"
echo "2. Verify all components handle null/undefined data gracefully"
echo "3. Commit changes"
