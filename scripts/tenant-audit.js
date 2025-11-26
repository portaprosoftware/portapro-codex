#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const TYPES_PATH = path.join(ROOT, 'src', 'integrations', 'supabase', 'types.ts');
const BASELINE_PATH = path.join(ROOT, 'config', 'tenant-audit-baseline.json');

const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  '.vercel',
  'coverage',
  'storybook-static',
  'config',
]);

const ALLOWED_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);

function readTenantTables() {
  if (!fs.existsSync(TYPES_PATH)) {
    console.error(`Supabase types not found at ${TYPES_PATH}.`);
    process.exit(1);
  }

  const content = fs.readFileSync(TYPES_PATH, 'utf8');
  const tablesBlockMatch = content.match(/Tables:\s*{([\s\S]*?)Views:/);

  if (!tablesBlockMatch) {
    return new Set();
  }

  const block = tablesBlockMatch[1];
  const regex = /\n\s*([a-zA-Z0-9_]+):\s*{[\s\S]*?organization_id[\s\S]*?}\s*,/g;
  const tables = new Set();
  let match;

  while ((match = regex.exec(block)) !== null) {
    tables.add(match[1]);
  }

  return tables;
}

function shouldSkipDir(dir) {
  return IGNORED_DIRS.has(path.basename(dir));
}

function collectFiles(dir, bucket = []) {
  if (shouldSkipDir(dir)) return bucket;
  const entries = fs.readdirSync(dir);

  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (!shouldSkipDir(entry)) {
        collectFiles(fullPath, bucket);
      }
      continue;
    }

    if (ALLOWED_EXTENSIONS.has(path.extname(entry))) {
      bucket.push(fullPath);
    }
  }

  return bucket;
}

function loadBaseline() {
  if (!fs.existsSync(BASELINE_PATH)) return new Set();

  try {
    const data = JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8'));
    return new Set(data.map((entry) => `${entry.file}:${entry.line}:${entry.rule}`));
  } catch (error) {
    console.error('Failed to parse tenant audit baseline.');
    console.error(error);
    process.exit(1);
  }
}

function saveBaseline(violations) {
  const payload = violations.map((v) => ({
    file: v.file,
    line: v.line,
    rule: v.rule,
    detail: v.detail,
  }));

  fs.writeFileSync(BASELINE_PATH, JSON.stringify(payload, null, 2));
  console.log(`Baseline written with ${payload.length} entries to ${BASELINE_PATH}`);
}

function buildSignature(violation) {
  return `${violation.file}:${violation.line}:${violation.rule}`;
}

function addViolation(list, file, line, rule, detail) {
  list.push({ file, line, rule, detail });
}

function getLineNumber(content, index) {
  return content.slice(0, index).split(/\r?\n/).length;
}

function hasOrganizationGuard(snippet) {
  return /organization_id/.test(snippet) || /tenantTable\s*\(/.test(snippet);
}

function analyzeFile(filePath, tenantTables, baselineSignatures, newViolations, allViolations) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);
  const relativePath = path.relative(ROOT, filePath);

  const fromRegex = /supabase\.from\(\s*['"]([a-zA-Z0-9_]+)['"]\s*\)/g;
  let match;

  while ((match = fromRegex.exec(content)) !== null) {
    const table = match[1];
    if (!tenantTables.has(table)) continue;

    const lineNumber = getLineNumber(content, match.index);
    const context = lines.slice(Math.max(0, lineNumber - 1), lineNumber + 6).join('\n');

    const hasTenantWrapper = /tenantTable\s*\(/.test(context);
    const hasOrgFilter = /organization_id/.test(context);
    const idLookup = /\.eq\(\s*['"]id['"]/i.test(context);
    const insertCall = /\.insert\(/.test(context);
    const payloadHasOrg = /organization_id\s*:/.test(context);

    if (!hasTenantWrapper && !hasOrgFilter) {
      const violation = { file: relativePath, line: lineNumber, rule: 'missing-tenant-wrapper', detail: `Query on tenant table "${table}" should use tenantTable() or include organization_id filter.` };
      allViolations.push(violation);
      if (!baselineSignatures.has(buildSignature(violation))) newViolations.push(violation);
    }

    if (idLookup && !hasOrgFilter) {
      const violation = { file: relativePath, line: lineNumber, rule: 'id-without-org', detail: `ID-based query on "${table}" missing organization_id guard.` };
      allViolations.push(violation);
      if (!baselineSignatures.has(buildSignature(violation))) newViolations.push(violation);
    }

    if (insertCall && !payloadHasOrg && !hasOrgFilter) {
      const violation = { file: relativePath, line: lineNumber, rule: 'insert-missing-org', detail: `Insert into "${table}" should include organization_id in payload or tenantTable() wrapper.` };
      allViolations.push(violation);
      if (!baselineSignatures.has(buildSignature(violation))) newViolations.push(violation);
    }
  }
}

function main() {
  const tenantTables = readTenantTables();
  if (tenantTables.size === 0) {
    console.warn('No tenant tables detected from Supabase types.');
  }

  const baselineSignatures = loadBaseline();
  const allViolations = [];
  const newViolations = [];

  const files = collectFiles(ROOT);
  files.forEach((file) => analyzeFile(file, tenantTables, baselineSignatures, newViolations, allViolations));

  if (process.env.WRITE_TENANT_BASELINE === '1') {
    saveBaseline(allViolations);
    process.exit(0);
  }

  if (newViolations.length > 0) {
    console.error('\n❌ Tenant audit found potential isolation issues:\n');
    newViolations.forEach((v, idx) => {
      console.error(`${idx + 1}. ${v.file}:${v.line}`);
      console.error(`   ${v.detail}`);
    });
    console.error(`\n${newViolations.length} violation(s) must be resolved or added to the baseline before merging.`);
    process.exit(1);
  }

  console.log('✅ Tenant audit passed. No new isolation bypasses detected.');
}

main();
