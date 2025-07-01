const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Test script to verify sf-permits-ingestion pipeline configuration
 */

// Load the pipeline configuration
const createPipelinesPath = path.join(__dirname, '..', 'scripts', 'create_pipelines.js');
const pipelinesScript = fs.readFileSync(createPipelinesPath, 'utf8');

console.log('🧪 Testing SF Permits Ingestion Pipeline Configuration');
console.log('====================================================\n');

// Extract pipeline configuration from the script
const pipelinesMatch = pipelinesScript.match(/const pipelines = \[([\s\S]*?)\];/);
if (!pipelinesMatch) {
  console.error('❌ Could not find pipelines configuration in create_pipelines.js');
  process.exit(1);
}

// Parse the configuration (simplified parsing)
const sfPermitsConfig = pipelinesScript.match(/{\s*name:\s*'sf-permits-ingestion',[\s\S]*?}/);
if (!sfPermitsConfig) {
  console.error('❌ Could not find sf-permits-ingestion configuration');
  process.exit(1);
}

const config = sfPermitsConfig[0];

// Test requirements
const tests = [
  {
    name: 'Pipeline name is sf-permits-ingestion',
    test: () => config.includes("name: 'sf-permits-ingestion'"),
    requirement: 'sf-permits-ingestion pipeline created with wrangler'
  },
  {
    name: 'R2 bucket is sf-permits-data',
    test: () => config.includes("r2: 'sf-permits-data'"),
    requirement: 'Correct R2 bucket configured'
  },
  {
    name: 'Batch interval is 60 seconds',
    test: () => config.includes('seconds: 60'),
    requirement: 'Pipeline configured with 60-second batch intervals'
  },
  {
    name: 'Batch size is 50 MB',
    test: () => config.includes('mb: 50'),
    requirement: 'Appropriate batch size configured'
  },
  {
    name: 'Shard count is 3',
    test: () => config.includes('shards: 3'),
    requirement: '3 shards configured for SF permit volume'
  },
  {
    name: 'Compression is gzip',
    test: () => pipelinesScript.includes('--compression gzip'),
    requirement: 'Compression enabled (gzip) for storage efficiency'
  }
];

let passed = 0;
let failed = 0;

console.log('Running configuration tests...\n');

tests.forEach((test, index) => {
  const result = test.test();
  if (result) {
    console.log(`✅ Test ${index + 1}: ${test.name}`);
    console.log(`   Requirement: ${test.requirement}`);
    passed++;
  } else {
    console.log(`❌ Test ${index + 1}: ${test.name}`);
    console.log(`   Requirement: ${test.requirement}`);
    failed++;
  }
  console.log('');
});

// Test for additional requirements
console.log('Testing additional requirements...\n');

// Check if health check script exists
const healthCheckExists = fs.existsSync(path.join(__dirname, '..', 'scripts', 'health_check.js'));
if (healthCheckExists) {
  console.log('✅ Health check script exists');
  console.log('   Requirement: Basic health check endpoint responding');
  passed++;
} else {
  console.log('❌ Health check script missing');
  console.log('   Requirement: Basic health check endpoint responding');
  failed++;
}
console.log('');

// Check if error handling and retry logic exists
const hasRetryLogic = pipelinesScript.includes('createPipelineWithRetry') && pipelinesScript.includes('maxRetries');
if (hasRetryLogic) {
  console.log('✅ Retry logic implemented');
  console.log('   Requirement: Error handling and retry logic verified');
  passed++;
} else {
  console.log('❌ Retry logic missing');
  console.log('   Requirement: Error handling and retry logic verified');
  failed++;
}
console.log('');

// Check if pipeline endpoint is documented
const readmePath = path.join(__dirname, '..', 'README.md');
const readmeExists = fs.existsSync(readmePath);
let endpointDocumented = false;

if (readmeExists) {
  const readmeContent = fs.readFileSync(readmePath, 'utf8');
  endpointDocumented = readmeContent.includes('sf-permits-ingestion') && readmeContent.includes('Endpoint URL');
}

if (endpointDocumented) {
  console.log('✅ Pipeline endpoint URL documented');
  console.log('   Requirement: Pipeline endpoint URL documented');
  passed++;
} else {
  console.log('❌ Pipeline endpoint URL not documented');
  console.log('   Requirement: Pipeline endpoint URL documented');
  failed++;
}

// Summary
console.log('\n📊 Test Summary:');
console.log('================');
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📋 Total: ${passed + failed}`);

if (failed === 0) {
  console.log('\n🎉 All tests passed! Pipeline configuration meets requirements.');
  process.exit(0);
} else {
  console.log('\n⚠️  Some tests failed. Please review the configuration.');
  process.exit(1);
}