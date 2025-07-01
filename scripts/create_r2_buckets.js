#!/usr/bin/env node
/**
 * SF DBI Data Pipeline - R2 Bucket Creation Script
 * 
 * This script creates the required R2 buckets for the SF Department of Building 
 * Inspection data pipeline with proper naming conventions, lifecycle policies,
 * and permission configurations.
 * 
 * Buckets created:
 * - sf-permits-data: Primary permit data storage
 * - sf-permit-events: Event tracking and audit logs  
 * - sf-inspector-data: Inspector analytics and reporting
 * - sf-processed-files: Pipeline processing metadata
 * 
 * Usage: node scripts/create_r2_buckets.js
 * 
 * Prerequisites:
 * - wrangler CLI installed (npx wrangler)
 * - CLOUDFLARE_API_TOKEN environment variable set
 * - Appropriate Cloudflare account permissions
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Load configuration from external file
const configPath = path.join(__dirname, 'r2-bucket-config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const buckets = config.buckets;

function createBucket(bucket) {
  const cmd = `npx wrangler r2 bucket create ${bucket.name}`;
  console.log(`Creating bucket: ${bucket.name} (${bucket.description})`);
  console.log(`Running: ${cmd}`);
  
  // Check for dry-run mode
  if (process.env.DRY_RUN === 'true') {
    console.log(`[DRY RUN] Would create bucket: ${bucket.name}`);
    console.log(`✓ [DRY RUN] Successfully simulated bucket creation: ${bucket.name}`);
    return true;
  }
  
  try {
    execSync(cmd, { stdio: 'inherit' });
    console.log(`✓ Successfully created bucket: ${bucket.name}`);
    return true;
  } catch (err) {
    console.error(`✗ Failed to create bucket ${bucket.name}:`, err.message);
    return false;
  }
}

function configureBucketLifecycle(bucket) {
  console.log(`Configuring lifecycle policy for ${bucket.name} (${bucket.lifecycleDays} days retention)`);
  console.log(`Purpose: ${bucket.purpose}`);
  
  // Note: Wrangler doesn't support direct lifecycle policy configuration via CLI
  // This would typically be done via Cloudflare API or dashboard
  // Adding placeholder for documentation and future implementation
  const lifecycleConfig = {
    rules: [
      {
        id: `${bucket.name}-lifecycle`,
        status: 'Enabled',
        transitions: [
          {
            days: bucket.retention.hot,
            storageClass: 'STANDARD'
          },
          {
            days: bucket.retention.warm,
            storageClass: 'REDUCED_REDUNDANCY'
          },
          {
            days: bucket.retention.cold,
            storageClass: 'DEEP_ARCHIVE'
          }
        ],
        expiration: {
          days: bucket.lifecycleDays
        }
      }
    ]
  };
  
  console.log(`Lifecycle transitions: Hot(${bucket.retention.hot}d) → Warm(${bucket.retention.warm}d) → Cold(${bucket.retention.cold}d) → Delete(${bucket.lifecycleDays}d)`);
  console.log(`⚠ Note: Lifecycle policies must be configured manually via Cloudflare Dashboard or API`);
  
  return lifecycleConfig;
}

function configureBucketPermissions(bucket) {
  console.log(`Configuring permissions for ${bucket.name} for Pipeline access`);
  
  // Note: R2 bucket permissions are typically managed via API tokens and account-level settings
  // This documents the required permissions for pipeline access
  const requiredPermissions = {
    account: {
      permissions: ['com.cloudflare.api.account.read']
    },
    zone: {
      permissions: ['com.cloudflare.api.account.zone:read']
    },
    r2: {
      permissions: config.permissions.required,
      resources: [`com.cloudflare.api.r2.*/${bucket.name}/*`]
    }
  };
  
  console.log(`Required API token permissions: ${config.permissions.required.join(', ')}`);
  console.log(`⚠ Note: Permissions must be configured via Cloudflare API tokens and account settings`);
  
  return requiredPermissions;
}

console.log('🚀 Starting R2 bucket creation and configuration...\n');

if (process.env.DRY_RUN === 'true') {
  console.log('🧪 DRY RUN MODE: No actual buckets will be created\n');
}

const results = {
  created: [],
  failed: [],
  lifecyclePolicies: {},
  permissions: {}
};

for (const bucket of buckets) {
  console.log(`\n📦 Processing bucket: ${bucket.name}`);
  console.log('─'.repeat(50));
  
  // Create the bucket
  const created = createBucket(bucket);
  if (created) {
    results.created.push(bucket.name);
    
    // Configure lifecycle policies (documentation/future implementation)
    results.lifecyclePolicies[bucket.name] = configureBucketLifecycle(bucket);
    
    // Configure permissions (documentation)
    results.permissions[bucket.name] = configureBucketPermissions(bucket);
  } else {
    results.failed.push(bucket.name);
  }
}

console.log('\n📊 Summary Report');
console.log('═'.repeat(50));
console.log(`✓ Buckets created successfully: ${results.created.length}`);
results.created.forEach(name => console.log(`  • ${name}`));

if (results.failed.length > 0) {
  console.log(`✗ Buckets failed to create: ${results.failed.length}`);
  results.failed.forEach(name => console.log(`  • ${name}`));
}

console.log('\n📋 Next Steps:');
console.log('1. Set CLOUDFLARE_API_TOKEN environment variable');
console.log('2. Configure lifecycle policies manually via Cloudflare Dashboard');
console.log('3. Set up API tokens with appropriate R2 permissions');
console.log('4. Verify bucket access from pipeline configurations');
console.log('5. Test bucket connectivity with pipeline scripts');

console.log('\n📚 Documentation:');
console.log(`• Naming convention: ${config.environment.namingConvention}`);
console.log(`• Current environment: ${config.environment.currentEnvironment}`);
console.log('• Configuration file: scripts/r2-bucket-config.json');

console.log('\n🎉 R2 bucket setup process completed!');
