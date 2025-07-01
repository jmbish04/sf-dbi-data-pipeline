const { execSync } = require('child_process');

const PIPELINES_TO_CHECK = [
  'sf-permits-ingestion',
  'sf-permit-events', 
  'sf-inspector-analytics'
];

/**
 * Performs health check on Cloudflare Pipelines
 */
function healthCheck() {
  console.log('🔍 Starting pipeline health check...\n');
  
  let allHealthy = true;
  const results = [];

  for (const pipelineName of PIPELINES_TO_CHECK) {
    console.log(`Checking pipeline: ${pipelineName}`);
    
    try {
      // Check if pipeline exists and get its status
      const cmd = `npx wrangler pipelines list`;
      const output = execSync(cmd, { encoding: 'utf8', stdio: 'pipe' });
      
      const isListed = output.includes(pipelineName);
      
      if (isListed) {
        console.log(`✅ ${pipelineName}: Pipeline found and listed`);
        results.push({ name: pipelineName, status: 'healthy', message: 'Pipeline found and listed' });
      } else {
        console.log(`❌ ${pipelineName}: Pipeline not found in list`);
        results.push({ name: pipelineName, status: 'unhealthy', message: 'Pipeline not found in list' });
        allHealthy = false;
      }
      
    } catch (err) {
      console.log(`❌ ${pipelineName}: Error checking pipeline - ${err.message}`);
      results.push({ name: pipelineName, status: 'error', message: err.message });
      allHealthy = false;
    }
    
    console.log(''); // Empty line for readability
  }

  // Summary
  console.log('📊 Health Check Summary:');
  console.log('========================');
  
  results.forEach(result => {
    const status = result.status === 'healthy' ? '✅' : '❌';
    console.log(`${status} ${result.name}: ${result.message}`);
  });
  
  console.log(`\nOverall Status: ${allHealthy ? '✅ All pipelines healthy' : '❌ Some pipelines have issues'}`);
  
  return allHealthy;
}

/**
 * Basic endpoint connectivity test
 */
function testBasicConnectivity() {
  try {
    console.log('🌐 Testing basic wrangler connectivity...');
    execSync('npx wrangler whoami', { stdio: 'pipe' });
    console.log('✅ Wrangler authentication successful');
    return true;
  } catch (err) {
    console.log(`❌ Wrangler authentication failed: ${err.message}`);
    return false;
  }
}

// Main execution
if (require.main === module) {
  console.log('🏥 SF DBI Data Pipeline Health Check');
  console.log('====================================\n');
  
  // Test basic connectivity first
  const hasConnectivity = testBasicConnectivity();
  console.log('');
  
  if (hasConnectivity) {
    const isHealthy = healthCheck();
    process.exit(isHealthy ? 0 : 1);
  } else {
    console.log('❌ Cannot proceed with health check due to connectivity issues');
    process.exit(1);
  }
}

module.exports = { healthCheck, testBasicConnectivity };