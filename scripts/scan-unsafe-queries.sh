#!/bin/bash
# Script to scan for unsafe Supabase query patterns that violate multi-tenant safety

echo "🔍 Multi-Tenant Safety Scanner"
echo "=============================="
echo ""

VIOLATIONS=0

# Check for .single() calls
echo "1. Checking for .single() calls (should use .maybeSingle())..."
SINGLE_COUNT=$(grep -r "\.single()" src --include="*.ts" --include="*.tsx" --exclude-dir=node_modules --exclude="*.test.ts" | wc -l)
if [ $SINGLE_COUNT -gt 0 ]; then
  echo "   ❌ Found $SINGLE_COUNT .single() calls"
  VIOLATIONS=$((VIOLATIONS + SINGLE_COUNT))
  grep -rn "\.single()" src --include="*.ts" --include="*.tsx" --exclude-dir=node_modules --exclude="*.test.ts" | head -10
  echo "   ... (showing first 10)"
else
  echo "   ✅ No .single() calls found"
fi
echo ""

# Check for direct .insert() calls
echo "2. Checking for direct .insert() calls (should use safeInsert())..."
INSERT_COUNT=$(grep -r "supabase\.from.*\.insert(" src --include="*.ts" --include="*.tsx" --exclude-dir=node_modules --exclude="*.test.ts" --exclude="supabase-helpers.ts" | wc -l)
if [ $INSERT_COUNT -gt 0 ]; then
  echo "   ⚠️  Found $INSERT_COUNT direct .insert() calls"
  VIOLATIONS=$((VIOLATIONS + INSERT_COUNT))
else
  echo "   ✅ No direct .insert() calls found"
fi
echo ""

# Check for direct .update() calls
echo "3. Checking for direct .update() calls (should use safeUpdate())..."
UPDATE_COUNT=$(grep -r "\.from.*\.update(" src --include="*.ts" --include="*.tsx" --exclude-dir=node_modules --exclude="*.test.ts" --exclude="supabase-helpers.ts" | wc -l)
if [ $UPDATE_COUNT -gt 0 ]; then
  echo "   ⚠️  Found $UPDATE_COUNT direct .update() calls"
  VIOLATIONS=$((VIOLATIONS + UPDATE_COUNT))
else
  echo "   ✅ No direct .update() calls found"
fi
echo ""

# Check for direct .delete() calls
echo "4. Checking for direct .delete() calls (should use safeDelete())..."
DELETE_COUNT=$(grep -r "\.from.*\.delete(" src --include="*.ts" --include="*.tsx" --exclude-dir=node_modules --exclude="*.test.ts" --exclude="supabase-helpers.ts" | wc -l)
if [ $DELETE_COUNT -gt 0 ]; then
  echo "   ⚠️  Found $DELETE_COUNT direct .delete() calls"
  VIOLATIONS=$((VIOLATIONS + DELETE_COUNT))
else
  echo "   ✅ No direct .delete() calls found"
fi
echo ""

echo "=============================="
if [ $VIOLATIONS -eq 0 ]; then
  echo "✅ Multi-tenant safety check PASSED"
  echo "No violations found."
  exit 0
else
  echo "❌ Multi-tenant safety check FAILED"
  echo "Total violations: $VIOLATIONS"
  echo ""
  echo "To fix:"
  echo "1. Run: npm run fix:single-calls"
  echo "2. Manually refactor direct insert/update/delete to use safe helpers"
  echo "3. Run this scanner again"
  exit 1
fi
