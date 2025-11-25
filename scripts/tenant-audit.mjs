#!/usr/bin/env node
/* Tenant audit: repo-wide heuristics to prevent cross-tenant data leakage.
 *
 * - Scans for Supabase `.from('table')` calls.
 * - For tenant-owned tables, requires a tenant scope expression nearby:
 *     - .eq('organization_id', tenantId)
 *     - .match({ organization_id: tenantId })
 *     - or a tenant helper wrapper (fromTenant / withTenant / tenantQuery)
 * - Supports allowlists + per-call opt-out via comment:
 *     // TENANT-IGNORE(reason)
 *
 * Also checks React Query keys (warning-level by default):
 * - If a file uses useQuery/useInfiniteQuery and Supabase, ensure queryKey includes tenantId or tenantKey().
 */

import fs from "node:fs";
import path from "node:path";

const CWD = process.cwd();

const DEFAULT_CONFIG = {
  include: [
    "src/**/*.{ts,tsx,js,jsx}",
    "supabase/functions/**/*.{ts,js}",
  ],
  exclude: [
    "**/*.d.ts",
    "**/node_modules/**",
    "**/dist/**",
    "**/build/**",
    "**/.vercel/**",
    "**/coverage/**",
    "**/.git/**",
  ],

  // Tables that are NOT tenant-owned OR don't have org scope column.
  // Keep this SMALL and explicit.
  globalTables: [
    "organizations", // tenant resolution is allowed without org filter
  ],

  // Column name used for tenant scoping (default)
  tenantColumn: "organization_id",

  // If you have tables with nonstandard tenant column, map them here.
  // Example: { "some_table": "org_id" }
  tenantColumnByTable: {},

  // When true: React Query key warnings become errors.
  strictQueryKeys: false,
};

function loadConfig() {
  const configPath = path.join(CWD, "scripts", "tenant-audit.config.json");
  if (!fs.existsSync(configPath)) return { ...DEFAULT_CONFIG };
  try {
    const parsed = JSON.parse(fs.readFileSync(configPath, "utf8"));
    return { ...DEFAULT_CONFIG, ...parsed };
  } catch (e) {
    console.error("Failed to parse scripts/tenant-audit.config.json:", e);
    process.exit(2);
  }
}

function globToRegExp(glob) {
  let pattern = glob.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  pattern = pattern.replace(/\\\*\\\*/g, ".*");
  pattern = pattern.replace(/\\\*/g, "[^/]*");
  pattern = pattern.replace(/\\\?/g, ".");
  pattern = pattern.replace(/\\\{([^}]+)\\\}/g, (_, body) => {
    const parts = body.split(",").map((part) => part.trim().replace(/[.+^${}()|[\]\\]/g, "\\$&"));
    return `(${parts.join("|")})`;
  });
  return new RegExp(`^${pattern}$`);
}

function normalizePath(p) {
  return p.replaceAll("\\", "/");
}

function buildMatchers(config) {
  const include = config.include.map(globToRegExp);
  const exclude = config.exclude.map(globToRegExp);

  const matchesAny = (patterns, value) => patterns.some((re) => re.test(value));

  return {
    shouldInclude(file) {
      return matchesAny(include, file);
    },
    shouldExclude(file) {
      return matchesAny(exclude, file);
    },
  };
}

function listFiles(dir, matcher, out = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const ent of entries) {
    const fullPath = path.join(dir, ent.name);
    const rel = normalizePath(path.relative(CWD, fullPath));

    if (matcher.shouldExclude(ent.isDirectory() ? `${rel}/` : rel)) continue;

    if (ent.isDirectory()) {
      listFiles(fullPath, matcher, out);
    } else if (matcher.shouldInclude(rel)) {
      out.push(fullPath);
    }
  }
  return out;
}

function parseArgs(config) {
  const args = new Set(process.argv.slice(2));
  if (args.has("--help") || args.has("-h")) {
    console.log("Usage: node scripts/tenant-audit.mjs [--strict]\n");
    console.log("Flags:\n  --strict   Treat React Query key warnings as errors\n  -h, --help Show this message");
    process.exit(0);
  }
  if (args.has("--strict")) {
    config.strictQueryKeys = true;
  }
}

let config = loadConfig();
parseArgs(config);
const matcher = buildMatchers(config);

// --- Heuristics ---
const FROM_RE = /\.from\s*\(\s*['"`]([a-zA-Z0-9_]+)['"`]\s*\)/g;

// Tenant scoping patterns
function tenantScopeRegex(tenantColumn) {
  const col = tenantColumn.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const quoteClass = "[\'\"`]";
  return new RegExp(
    [
      `\\.eq\\(\\s*${quoteClass}${col}${quoteClass}\\s*,`,
      `\\.match\\(\\s*\\{[^}]*\\b${col}\\b\\s*:\\s*`,
      `\\bfromTenant\\b\\s*\\(`,
      `\\bwithTenant\\b\\s*\\(`,
      `\\btenantQuery\\b\\s*\\(`,
      `\\bTENANT-SCOPED\\b`,
    ].join("|"),
    "m"
  );
}

const IGNORE_RE = /TENANT-IGNORE\s*\(/;

// React Query key patterns (warning-level default)
const RQ_RE = /\buse(Query|InfiniteQuery)\b/g;
const RQ_KEY_OK_RE = /\btenantKey\s*\(|\btenantId\b|\brequireTenantId\b/g;

function getTenantColumn(table) {
  return config.tenantColumnByTable?.[table] || config.tenantColumn;
}

function isGlobalTable(table) {
  return config.globalTables.includes(table);
}

function snippet(text, start, end) {
  return text.slice(Math.max(0, start), Math.min(text.length, end));
}

function lineNumberAt(text, index) {
  return text.slice(0, index).split("\n").length;
}

// --- Scan ---
const allFiles = listFiles(CWD, matcher);

const errors = [];
const warnings = [];
let totalFromCalls = 0;

for (const file of allFiles) {
  const rel = normalizePath(path.relative(CWD, file));
  const text = fs.readFileSync(file, "utf8");

  const hasSupabaseFrom = text.includes(".from(");
  const hasReactQuery = /\b@tanstack\/react-query\b/.test(text) || RQ_RE.test(text);
  RQ_RE.lastIndex = 0;

  let rqKeyIssue = false;
  if (hasSupabaseFrom && hasReactQuery) {
    if ((text.match(/\buse(Query|InfiniteQuery)\b/g) || []).length > 0) {
      if (!RQ_KEY_OK_RE.test(text)) rqKeyIssue = true;
    }
  }

  let m;
  while ((m = FROM_RE.exec(text)) !== null) {
    totalFromCalls += 1;
    const table = m[1];
    if (isGlobalTable(table)) continue;

    const tenantCol = getTenantColumn(table);

    const ln = lineNumberAt(text, m.index);
    const lines = text.split("\n");
    const startLine = Math.max(0, ln - 4);
    const header = lines.slice(startLine, ln).join("\n");
    if (IGNORE_RE.test(header)) continue;

    const startIdx = m.index;
    const lookAhead = snippet(text, startIdx, startIdx + 4000);
    const scopeOk = tenantScopeRegex(tenantCol).test(lookAhead);

    if (!scopeOk) {
      errors.push({
        file: rel,
        line: ln,
        table,
        tenantCol,
        context: snippet(text, m.index, m.index + 220).replace(/\s+/g, " ").trim(),
      });
    }
  }

  if (rqKeyIssue) {
    warnings.push({
      file: rel,
      kind: "react-query-key",
      message:
        "File uses Supabase + React Query but no tenantKey()/tenantId found. Ensure queryKey includes tenantId.",
    });
  }
}

// --- Report ---
const red = (s) => `\x1b[31m${s}\x1b[0m`;
const yellow = (s) => `\x1b[33m${s}\x1b[0m`;
const green = (s) => `\x1b[32m${s}\x1b[0m`;

console.log("\nTenant Audit");
console.log("-----------");
console.log(`Files scanned: ${allFiles.length}`);
console.log(`.from() calls: ${totalFromCalls}`);

if (warnings.length) {
  const header = config.strictQueryKeys ? red : yellow;
  console.log("\n" + header(`Warnings (${warnings.length})`));
  for (const w of warnings.slice(0, 40)) {
    console.log(`- ${w.file}: ${w.message}`);
  }
  if (warnings.length > 40) console.log(`... +${warnings.length - 40} more`);
}

if (errors.length) {
  console.log("\n" + red(`Errors (${errors.length})`));
  for (const e of errors.slice(0, 60)) {
    console.log(
      `- ${e.file}:${e.line} table=\"${e.table}\" missing \"${e.tenantCol}\" scope\n  ${e.context}`
    );
  }
  if (errors.length > 60) console.log(`... +${errors.length - 60} more`);

  console.log(
    "\nFix options:\n" +
      "1) Add tenant scope: .eq('organization_id', tenantId)\n" +
      "2) Use helper wrapper: fromTenant()/withTenant()/tenantQuery()\n" +
      "3) If truly global: add to scripts/tenant-audit.config.json globalTables\n" +
      "4) If one-off exception: add comment above call: // TENANT-IGNORE(reason)\n"
  );

  process.exit(1);
}

if (config.strictQueryKeys && warnings.length) {
  console.log(red("\nStrict mode enabled: treating warnings as errors."));
  process.exit(1);
}

console.log("\n" + green("✅ Tenant audit passed.\n"));
process.exit(0);
