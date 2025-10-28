#!/usr/bin/env node

/**
 * Environment Variable Seed Script for PortaPro
 * 
 * This script helps new developers set up their .env file
 * by prompting for required values.
 * 
 * Usage: node scripts/seed-env.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  bold: '\x1b[1m',
  dim: '\x1b[2m'
};

const REQUIRED_VARS = [
  {
    key: 'VITE_APP_URL',
    description: 'Your application URL (e.g., https://app.portaprosoftware.com)',
    default: 'http://localhost:5173',
    required: true
  },
  {
    key: 'VITE_CLERK_PUBLISHABLE_KEY',
    description: 'Clerk publishable key (get from Clerk dashboard)',
    default: '',
    required: true
  },
  {
    key: 'VITE_SUPABASE_URL',
    description: 'Supabase project URL',
    default: '',
    required: true
  },
  {
    key: 'VITE_SUPABASE_PUBLISHABLE_KEY',
    description: 'Supabase anon/publishable key',
    default: '',
    required: true
  },
  {
    key: 'VITE_SUPABASE_PROJECT_ID',
    description: 'Supabase project ID',
    default: '',
    required: true
  },
  {
    key: 'VITE_MAPBOX_TOKEN',
    description: 'Mapbox public token (or leave empty to use edge function)',
    default: '',
    required: false
  }
];

const SERVER_VARS = [
  {
    key: 'CLERK_SECRET_KEY',
    description: 'Clerk secret key (server-side only)',
    required: true
  },
  {
    key: 'SUPABASE_SERVICE_ROLE_KEY',
    description: 'Supabase service role key (admin access)',
    required: true
  },
  {
    key: 'STRIPE_SECRET_KEY',
    description: 'Stripe secret key (optional)',
    required: false
  },
  {
    key: 'RESEND_API_KEY',
    description: 'Resend API key for emails (optional)',
    required: false
  }
];

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function seedEnv() {
  console.log(`\n${colors.bold}${colors.blue}📝 PortaPro Environment Setup${colors.reset}\n`);
  console.log(`${colors.dim}This wizard will help you create a .env file for local development.${colors.reset}\n`);

  const envPath = path.join(process.cwd(), '.env');
  
  if (fs.existsSync(envPath)) {
    const overwrite = await question(`${colors.yellow}⚠️  .env file already exists. Overwrite? (y/N): ${colors.reset}`);
    if (overwrite.toLowerCase() !== 'y') {
      console.log('\n👋 Exiting without changes.\n');
      rl.close();
      process.exit(0);
    }
  }

  const envVars = {};

  // Client-side variables (VITE_*)
  console.log(`${colors.bold}\n📦 Public Variables (exposed to browser)${colors.reset}\n`);
  
  for (const varConfig of REQUIRED_VARS) {
    const required = varConfig.required ? `${colors.yellow}*${colors.reset}` : '';
    const defaultValue = varConfig.default ? ` [${colors.dim}${varConfig.default}${colors.reset}]` : '';
    const value = await question(`${required} ${varConfig.key}${defaultValue}\n   ${colors.dim}${varConfig.description}${colors.reset}\n   > `);
    
    envVars[varConfig.key] = value.trim() || varConfig.default;
    console.log('');
  }

  // Server-side variables
  console.log(`${colors.bold}\n🔒 Server-Only Variables (never exposed to browser)${colors.reset}\n`);
  console.log(`${colors.dim}These will be used in Vercel/edge functions only.${colors.reset}\n`);
  
  const includeServer = await question(`Set up server variables now? (Y/n): `);
  console.log('');
  
  if (includeServer.toLowerCase() !== 'n') {
    for (const varConfig of SERVER_VARS) {
      const required = varConfig.required ? `${colors.yellow}*${colors.reset}` : '';
      const value = await question(`${required} ${varConfig.key}\n   ${colors.dim}${varConfig.description}${colors.reset}\n   > `);
      
      if (value.trim()) {
        envVars[varConfig.key] = value.trim();
      }
      console.log('');
    }
  }

  // Optional analytics
  console.log(`${colors.bold}\n📊 Optional Analytics & Monitoring${colors.reset}\n`);
  
  const addAnalytics = await question(`Add analytics variables? (y/N): `);
  console.log('');
  
  if (addAnalytics.toLowerCase() === 'y') {
    const posthogKey = await question(`${colors.dim}VITE_POSTHOG_KEY (optional): ${colors.reset}`);
    if (posthogKey.trim()) envVars['VITE_POSTHOG_KEY'] = posthogKey.trim();
    
    const sentryDsn = await question(`${colors.dim}VITE_SENTRY_DSN (optional): ${colors.reset}`);
    if (sentryDsn.trim()) envVars['VITE_SENTRY_DSN'] = sentryDsn.trim();
    
    const gaId = await question(`${colors.dim}VITE_GA_MEASUREMENT_ID (optional): ${colors.reset}`);
    if (gaId.trim()) envVars['VITE_GA_MEASUREMENT_ID'] = gaId.trim();
    console.log('');
  }

  // Write .env file
  const envContent = Object.entries(envVars)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  fs.writeFileSync(envPath, envContent + '\n');

  console.log(`${colors.green}${colors.bold}✅ .env file created successfully!${colors.reset}\n`);
  console.log(`${colors.dim}Location: ${envPath}${colors.reset}\n`);
  console.log(`${colors.yellow}⚠️  Remember:${colors.reset}`);
  console.log(`   • Never commit .env to version control`);
  console.log(`   • Add server variables to Vercel dashboard for deployment`);
  console.log(`   • Update .env.example if you add new required variables\n`);
  
  rl.close();
}

seedEnv().catch(err => {
  console.error(`\n${colors.red}Error:${colors.reset}`, err.message);
  rl.close();
  process.exit(1);
});
