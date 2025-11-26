#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import process from 'process';

const DEFAULT_CONFIG = {
  rootDirs: ['src', 'supabase'],
  includeExtensions: ['.ts', '.tsx'],
  skipPaths: ['node_modules', 'dist', 'build', '.next', '.vercel', '.git', 'coverage', 'storybook-static'],
  systemTables: ['tax_rates'],
  userScopedTables: ['notification_preferences', 'push_subscriptions', 'user_roles'],
  ignoreFiles: ['supabase-helpers.ts'],
  requireOrgHook: true,
  rpcOrgKeys: ['org_id', 'organizationId', 'organization_id'],
};

const colors = {
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  dim: (text) => `\x1b[2m${text}\x1b[0m`,
};

function loadConfig() {
  const configFlagIndex = process.argv.indexOf('--config');
  const configPath = configFlagIndex !== -1 ? process.argv[configFlagIndex + 1] : 'config/tenant-audit.config.json';

  if (!fs.existsSync(configPath)) {
    console.warn(colors.yellow(`⚠️  Config file not found at ${configPath}. Using defaults.`));
    return { ...DEFAULT_CONFIG };
  }

  try {
    const fileContents = fs.readFileSync(configPath, 'utf8');
    const userConfig = JSON.parse(fileContents);
    return {
      ...DEFAULT_CONFIG,
      ...userConfig,
      rootDirs: userConfig.rootDirs ?? DEFAULT_CONFIG.rootDirs,
      includeExtensions: userConfig.includeExtensions ?? DEFAULT_CONFIG.includeExtensions,
      skipPaths: userConfig.skipPaths ?? DEFAULT_CONFIG.skipPaths,
      systemTables: userConfig.systemTables ?? DEFAULT_CONFIG.systemTables,
      userScopedTables: userConfig.userScopedTables ?? DEFAULT_CONFIG.userScopedTables,
      ignoreFiles: userConfig.ignoreFiles ?? DEFAULT_CONFIG.ignoreFiles,
      rpcOrgKeys: userConfig.rpcOrgKeys ?? DEFAULT_CONFIG.rpcOrgKeys,
    };
  } catch (error) {
    console.error(colors.red('Failed to parse tenant audit config.'));
    console.error(error);
    process.exit(1);
  }
}

function isExcluded(filePath, config) {
  return config.skipPaths.some((skip) => filePath.includes(`${path.sep}${skip}${path.sep}`) || filePath.endsWith(`${path.sep}${skip}`));
}

function collectFiles(root, config, bucket = []) {
  if (!fs.existsSync(root)) return bucket;

  const entries = fs.readdirSync(root);

  for (const entry of entries) {
    const fullPath = path.join(root, entry);
    const stat = fs.statSync(fullPath);

    if (isExcluded(fullPath, config)) continue;

    if (stat.isDirectory()) {
      collectFiles(fullPath, config, bucket);
    } else if (config.includeExtensions.includes(path.extname(entry))) {
      bucket.push(fullPath);
    }
  }

  return bucket;
}

function sliceAhead(lines, startIndex, depth = 10) {
  return lines.slice(startIndex, Math.min(startIndex + depth, lines.length)).join('\n');
}

function hasOrgFilter(lines, index) {
  const lookahead = sliceAhead(lines, index, 12);
  return /\.eq\(['"`]organization_id['"`]/.test(lookahead) || /\.eq\(['"`]organizationId['"`]/.test(lookahead);
}

function hasUserFilter(lines, index) {
  const lookahead = sliceAhead(lines, index, 12);
  return /\.eq\(['"`]user_id['"`]/.test(lookahead) || /\.eq\(['"`]userId['"`]/.test(lookahead);
}

function analyzeFile(filePath, config) {
  const relativePath = path.relative(process.cwd(), filePath);

  if (config.ignoreFiles.some((ignore) => relativePath.endsWith(ignore))) {
    return { findings: [], stats: { queries: 0, secureQueries: 0, rpcCalls: 0, secureRpcCalls: 0 } };
  }

  const contents = fs.readFileSync(filePath, 'utf8');
  const lines = contents.split(/\r?\n/);

  const findings = [];
  let totalQueries = 0;
  let secureQueries = 0;
  let totalRpc = 0;
  let secureRpc = 0;

  const hasOrgHook = /useOrganizationId/.test(contents);
  const hasSupabaseOps = /supabase\.(from|rpc)/.test(contents) || /safe(Insert|Update|Delete)/.test(contents);

  lines.forEach((line, index) => {
    const lineNumber = index + 1;

    for (const match of line.matchAll(/\.from\(['"`]([^'"`]+)['"`]\)/g)) {
      const table = match[1];
      totalQueries += 1;

      if (config.systemTables.includes(table)) {
        secureQueries += 1;
        continue;
      }

      if (config.userScopedTables.includes(table)) {
        if (hasUserFilter(lines, index)) {
          secureQueries += 1;
        } else {
          findings.push({
            severity: 'ERROR',
            file: relativePath,
            line: lineNumber,
            issue: `Query on user scoped table '${table}' missing user filter`,
            recommendation: "Add .eq('user_id', userId) to enforce user scoping.",
          });
        }
        continue;
      }

      if (hasOrgFilter(lines, index)) {
        secureQueries += 1;
      } else {
        findings.push({
          severity: 'ERROR',
          file: relativePath,
          line: lineNumber,
          issue: `Query on table '${table}' missing organization filter`,
          recommendation: "Add .eq('organization_id', orgId) to the query chain.",
        });
      }
    }

    if (/\.rpc\(['"`]([^'"`]+)['"`]/.test(line)) {
      totalRpc += 1;
      const lookahead = sliceAhead(lines, index, 6);
      const hasOrgParam = config.rpcOrgKeys.some((key) => new RegExp(`${key}\s*:`).test(lookahead));

      if (hasOrgParam) {
        secureRpc += 1;
      } else {
        findings.push({
          severity: 'ERROR',
          file: relativePath,
          line: lineNumber,
          issue: 'RPC call missing organization context',
          recommendation: `Pass { ${config.rpcOrgKeys[0]}: orgId } to the RPC payload.`,
        });
      }
    }

    if (/\.insert\(/.test(line) && !/safeInsert/.test(contents)) {
      if (!hasOrgFilter(lines, index) && !config.systemTables.some((table) => line.includes(table))) {
        findings.push({
          severity: 'WARN',
          file: relativePath,
          line: lineNumber,
          issue: 'Insert call missing explicit organization filter or safeInsert()',
          recommendation: "Use safeInsert or add .eq('organization_id', orgId).",
        });
      }
    }

    if (/\.update\(/.test(line) && !/safeUpdate/.test(contents)) {
      if (!hasOrgFilter(lines, index)) {
        findings.push({
          severity: 'WARN',
          file: relativePath,
          line: lineNumber,
          issue: 'Update call missing organization filter or safeUpdate()',
          recommendation: "Use safeUpdate or add .eq('organization_id', orgId).",
        });
      }
    }

    if (/\.delete\(/.test(line) && !/safeDelete/.test(contents)) {
      if (!hasOrgFilter(lines, index)) {
        findings.push({
          severity: 'WARN',
          file: relativePath,
          line: lineNumber,
          issue: 'Delete call missing organization filter or safeDelete()',
          recommendation: "Use safeDelete or add .eq('organization_id', orgId).",
        });
      }
    }
  });

  if (config.requireOrgHook && hasSupabaseOps && !hasOrgHook && !filePath.includes('supabase-helpers')) {
    findings.push({
      severity: 'WARN',
      file: relativePath,
      line: 1,
      issue: 'File includes database operations but does not use useOrganizationId()',
      recommendation: 'Import useOrganizationId and ensure orgId is threaded through operations.',
    });
  }

  return {
    findings,
    stats: {
      queries: totalQueries,
      secureQueries,
      rpcCalls: totalRpc,
      secureRpcCalls: secureRpc,
    },
  };
}

function formatFinding(finding) {
  const marker = finding.severity === 'ERROR' ? colors.red('●') : colors.yellow('●');
  return `${marker} ${finding.file}:${finding.line}\n   Issue: ${finding.issue}\n   Fix: ${finding.recommendation}\n`;
}

function run() {
  const config = loadConfig();
  const filesToScan = config.rootDirs.flatMap((root) => collectFiles(root, config));

  let allFindings = [];
  const aggregate = { queries: 0, secureQueries: 0, rpcCalls: 0, secureRpcCalls: 0 };

  for (const file of filesToScan) {
    const { findings, stats } = analyzeFile(file, config);
    allFindings = allFindings.concat(findings);
    aggregate.queries += stats.queries;
    aggregate.secureQueries += stats.secureQueries;
    aggregate.rpcCalls += stats.rpcCalls;
    aggregate.secureRpcCalls += stats.secureRpcCalls;
  }

  const errors = allFindings.filter((f) => f.severity === 'ERROR');
  const warnings = allFindings.filter((f) => f.severity === 'WARN');

  console.log('\n🔎 Tenant Audit Report');
  console.log('='.repeat(80));
  console.log(`Scanned files: ${filesToScan.length}`);
  console.log(`Queries secured: ${aggregate.secureQueries}/${aggregate.queries}`);
  console.log(`RPC calls secured: ${aggregate.secureRpcCalls}/${aggregate.rpcCalls}`);

  if (errors.length === 0 && warnings.length === 0) {
    console.log(colors.green('\n✅ No tenant isolation issues detected.'));
    return process.exit(0);
  }

  if (errors.length) {
    console.log(`\n${colors.red('Errors')}: ${errors.length}\n`);
    errors.forEach((finding) => console.log(formatFinding(finding)));
  }

  if (warnings.length) {
    console.log(`\n${colors.yellow('Warnings')}: ${warnings.length}\n`);
    warnings.forEach((finding) => console.log(formatFinding(finding)));
  }

  const exitCode = errors.length > 0 ? 1 : 0;
  if (exitCode === 0) {
    console.log(colors.yellow('⚠️  Warnings detected. Please review before merging.'));
  }

  process.exit(exitCode);
}

run();
