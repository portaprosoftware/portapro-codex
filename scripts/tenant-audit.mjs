#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import process from 'process';

const TARGET_TABLES = [
  'customers',
  'jobs',
  'invoices',
  'payments',
  'routes',
  'units',
  'vehicle',
  'maintenance',
  'fuel_logs',
  'job_items',
  'product_items',
  'products',
];

const IGNORED_SEGMENTS = [
  'node_modules',
  '.git',
  '.next',
  '.vercel',
  'dist',
  'build',
  'coverage',
  'storybook-static',
  'supabase',
  'test',
];

const SUPPORTED_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const repoRoot = process.cwd();
const allowlistPath = path.join(repoRoot, 'scripts', 'tenant-audit-allowlist.json');

const colors = {
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  dim: (text) => `\x1b[2m${text}\x1b[0m`,
};

function globToRegExp(glob) {
  const escaped = glob
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '::DOUBLE_STAR::')
    .replace(/\*/g, '[^/]*')
    .replace(/::DOUBLE_STAR::/g, '.*');
  return new RegExp(`^${escaped}$`);
}

function loadAllowlist() {
  if (!fs.existsSync(allowlistPath)) {
    return { paths: [], patterns: [] };
  }

  try {
    const raw = fs.readFileSync(allowlistPath, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      paths: parsed.paths ?? [],
      patterns: parsed.patterns ?? [],
    };
  } catch (error) {
    console.warn(colors.yellow(`⚠️  Failed to parse allowlist at ${allowlistPath}. Ignoring allowlist.`));
    return { paths: [], patterns: [] };
  }
}

function isIgnoredDirectory(direntName) {
  return IGNORED_SEGMENTS.includes(direntName);
}

function shouldSkipFile(filePath) {
  const ext = path.extname(filePath);
  if (!SUPPORTED_EXTENSIONS.has(ext)) return true;
  if (ext === '.sql') return true;

  const normalized = filePath.split(path.sep).join(path.sep);
  if (normalized.includes(`${path.sep}supabase${path.sep}`)) return true;
  if (normalized.includes(`${path.sep}test${path.sep}`)) return true;
  return false;
}

function walk(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (isIgnoredDirectory(entry.name)) continue;
      walk(fullPath, files);
      continue;
    }

    if (!shouldSkipFile(fullPath)) {
      files.push(fullPath);
    }
  }

  return files;
}

function getLineNumber(content, index) {
  return content.slice(0, index).split(/\r?\n/).length;
}

function matchesAllowlist(relativePath, snippet, allowlist) {
  const matchesPath = allowlist.paths.some((pattern) => globToRegExp(pattern).test(relativePath));
  if (!matchesPath) return false;
  return allowlist.patterns.some((pattern) => snippet.includes(pattern));
}

function findRawFromViolations(content) {
  const tablesPattern = TARGET_TABLES.join('|');
  const rawFromPattern = String.raw`supabase\.from\(\s*['"](?:${tablesPattern})['"]`;
  const regex = new RegExp(rawFromPattern, 'g');
  const violations = [];

  for (const match of content.matchAll(regex)) {
    const snippet = match[0];
    const tableMatch = snippet.match(/['"`]([^'"`]+)['"`]/);
    const table = tableMatch ? tableMatch[1] : 'unknown';

    const before = content.slice(0, match.index);
    if (/tenantTable\s*\(/.test(before)) {
      continue;
    }

    violations.push({
      type: 'raw-from',
      table,
      index: match.index,
      snippet,
      message: `Direct supabase.from('${table}') detected without tenantTable() guard.`,
      recommendation: `Use supabase.from(tenantTable('${table}')) and rely on org_id scoping.`,
    });
  }

  return violations;
}

function findJoinViolations(content) {
  const regex = /\.select\(\s*(['"`])([\s\S]*?)\1\s*\)/g;
  const violations = [];

  for (const match of content.matchAll(regex)) {
    const selection = match[2];
    const tableWithJoin = TARGET_TABLES.find((table) => selection.includes(`${table}(`));
    if (!tableWithJoin) continue;

    violations.push({
      type: 'client-join',
      table: tableWithJoin,
      index: match.index,
      snippet: match[0],
      message: `Client-side join on '${tableWithJoin}' detected inside select()`,
      recommendation: 'Move joins behind tenant-safe RPC or server-side view that enforces org filters.',
    });
  }

  return violations;
}

function findRpcViolations(content) {
  const regex = /supabase\.rpc\(\s*(['"`])([^'"`]+)\1\s*,\s*\{([\s\S]*?)\}\s*\)/g;
  const violations = [];

  for (const match of content.matchAll(regex)) {
    const argsBlock = match[3];
    if (/p_organization_id\s*:/.test(argsBlock)) continue;

    violations.push({
      type: 'rpc',
      table: match[2],
      index: match.index,
      snippet: match[0],
      message: `RPC '${match[2]}' is missing p_organization_id parameter.`,
      recommendation: 'Pass p_organization_id to rpc payload to enforce tenant isolation.',
    });
  }

  return violations;
}

function analyzeFile(filePath, allowlist) {
  const content = fs.readFileSync(filePath, 'utf8');
  const relativePath = path.relative(repoRoot, filePath);
  const fileViolations = [];

  const rawFrom = findRawFromViolations(content);
  const joins = findJoinViolations(content);
  const rpc = findRpcViolations(content);

  for (const violation of [...rawFrom, ...joins, ...rpc]) {
    const line = getLineNumber(content, violation.index);
    const snippet = violation.snippet;

    if (matchesAllowlist(relativePath, snippet, allowlist)) {
      continue;
    }

    fileViolations.push({
      ...violation,
      file: relativePath,
      line,
    });
  }

  return fileViolations;
}

function main() {
  const allowlist = loadAllowlist();
  const files = walk(repoRoot, []);

  let totalViolations = [];
  for (const file of files) {
    const violations = analyzeFile(file, allowlist);
    totalViolations = totalViolations.concat(violations);
  }

  if (totalViolations.length > 0) {
    console.error(colors.red('\n🚫 Tenant audit violations detected:'));
    for (const violation of totalViolations) {
      console.error(
        ` - ${colors.red(violation.file)}:${violation.line} | ${violation.message}\n   Snippet: ${colors.dim(violation.snippet.trim())}\n   Fix: ${violation.recommendation}\n`
      );
    }
  }

  console.log(colors.dim('------------------------------------------------------'));
  console.log(`Files scanned: ${files.length}`);
  console.log(`Violations: ${totalViolations.length}`);
  console.log(`Status: ${totalViolations.length === 0 ? colors.green('PASS') : colors.red('FAIL')}`);
  console.log(colors.dim('------------------------------------------------------'));

  if (totalViolations.length > 0) {
    process.exit(1);
  }
}

main();
