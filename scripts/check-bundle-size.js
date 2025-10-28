#!/usr/bin/env node

/**
 * Bundle Size Checker for PortaPro
 * 
 * Thresholds:
 * - Target: ≤ 200 KB gzipped
 * - Fail: > 250 KB gzipped
 * 
 * This prevents bundle bloat and ensures fast load times for all deployments.
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Bundle size thresholds in bytes
const THRESHOLDS = {
  target: 200 * 1024,      // 200 KB - ideal target
  fail: 250 * 1024,        // 250 KB - hard limit
  warning: 220 * 1024      // 220 KB - warning threshold
};

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  bold: '\x1b[1m'
};

function getGzipSize(filePath) {
  const content = fs.readFileSync(filePath);
  const gzipped = zlib.gzipSync(content);
  return gzipped.length;
}

function formatBytes(bytes) {
  return (bytes / 1024).toFixed(2) + ' KB';
}

function analyzeBundle() {
  const distPath = path.join(process.cwd(), 'dist', 'assets');
  
  if (!fs.existsSync(distPath)) {
    console.error(`${colors.red}❌ Error: dist/assets directory not found. Run 'npm run build' first.${colors.reset}`);
    process.exit(1);
  }

  const files = fs.readdirSync(distPath)
    .filter(file => file.endsWith('.js') || file.endsWith('.css'))
    .map(file => {
      const filePath = path.join(distPath, file);
      const stats = fs.statSync(filePath);
      return {
        name: file,
        path: filePath,
        size: stats.size,
        gzipSize: getGzipSize(filePath)
      };
    })
    .sort((a, b) => b.gzipSize - a.gzipSize);

  // Calculate totals
  const totalSize = files.reduce((sum, f) => sum + f.size, 0);
  const totalGzipSize = files.reduce((sum, f) => sum + f.gzipSize, 0);

  // Main bundle (largest JS file)
  const mainBundle = files.find(f => f.name.endsWith('.js'));
  
  console.log(`\n${colors.bold}📦 Bundle Size Analysis${colors.reset}\n`);
  console.log('─'.repeat(70));
  console.log(`${'File'.padEnd(40)} ${'Size'.padStart(12)} ${'Gzipped'.padStart(12)}`);
  console.log('─'.repeat(70));

  files.forEach(file => {
    const isLarge = file.gzipSize > THRESHOLDS.warning;
    const color = isLarge ? colors.yellow : colors.reset;
    console.log(
      `${color}${file.name.padEnd(40)} ${formatBytes(file.size).padStart(12)} ${formatBytes(file.gzipSize).padStart(12)}${colors.reset}`
    );
  });

  console.log('─'.repeat(70));
  console.log(`${'TOTAL'.padEnd(40)} ${formatBytes(totalSize).padStart(12)} ${formatBytes(totalGzipSize).padStart(12)}`);
  console.log('─'.repeat(70));

  // Main bundle size check
  if (mainBundle) {
    console.log(`\n${colors.bold}📊 Main Bundle Analysis${colors.reset}\n`);
    console.log(`Main bundle: ${mainBundle.name}`);
    console.log(`Gzipped size: ${formatBytes(mainBundle.gzipSize)}`);
    console.log(`Target: ${formatBytes(THRESHOLDS.target)}`);
    console.log(`Hard limit: ${formatBytes(THRESHOLDS.fail)}`);

    const percentage = (mainBundle.gzipSize / THRESHOLDS.fail) * 100;
    
    if (mainBundle.gzipSize <= THRESHOLDS.target) {
      console.log(`\n${colors.green}✅ PASS: Bundle size is within target (${percentage.toFixed(1)}% of limit)${colors.reset}`);
      process.exit(0);
    } else if (mainBundle.gzipSize <= THRESHOLDS.warning) {
      console.log(`\n${colors.yellow}⚠️  WARNING: Bundle size exceeds target but within acceptable range (${percentage.toFixed(1)}% of limit)${colors.reset}`);
      process.exit(0);
    } else if (mainBundle.gzipSize <= THRESHOLDS.fail) {
      console.log(`\n${colors.yellow}⚠️  WARNING: Bundle size approaching hard limit (${percentage.toFixed(1)}% of limit)${colors.reset}`);
      console.log(`${colors.yellow}Consider code-splitting or lazy-loading to reduce bundle size.${colors.reset}`);
      process.exit(0);
    } else {
      console.log(`\n${colors.red}❌ FAIL: Bundle size exceeds hard limit (${percentage.toFixed(1)}% of limit)${colors.reset}`);
      console.log(`${colors.red}Bundle is ${formatBytes(mainBundle.gzipSize - THRESHOLDS.fail)} over the limit.${colors.reset}`);
      console.log(`\n${colors.bold}Recommendations:${colors.reset}`);
      console.log('  1. Use dynamic imports for large libraries (jspdf, mapbox-gl, recharts)');
      console.log('  2. Review and remove unused dependencies');
      console.log('  3. Enable tree-shaking in Vite config');
      console.log('  4. Split vendor chunks in rollup options');
      process.exit(1);
    }
  }

  // If no main bundle found, check total
  if (totalGzipSize > THRESHOLDS.fail) {
    console.log(`\n${colors.red}❌ FAIL: Total bundle size exceeds limit${colors.reset}`);
    process.exit(1);
  }

  console.log(`\n${colors.green}✅ PASS: Bundle size within acceptable limits${colors.reset}`);
  process.exit(0);
}

analyzeBundle();
