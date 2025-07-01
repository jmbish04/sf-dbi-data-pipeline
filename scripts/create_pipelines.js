const { execSync } = require('child_process');

const pipelines = [
  {
    name: 'sf-permits-ingestion',
    r2: 'sf-permits-data',
    seconds: 60,
    mb: 50,
    shards: 3,
  },
  {
    name: 'sf-permit-events',
    r2: 'sf-permit-events',
    seconds: 30,
    mb: 25,
    shards: 2,
  },
  {
    name: 'sf-inspector-analytics',
    r2: 'sf-inspector-data',
    seconds: 300,
    mb: 100,
    shards: 1,
  }
];

/**
 * Create pipeline with retry logic
 */
function createPipelineWithRetry(pipeline, maxRetries = 3) {
  const cmd = `npx wrangler pipelines create ${pipeline.name} --r2-bucket ${pipeline.r2} --batch-max-seconds ${pipeline.seconds} --batch-max-mb ${pipeline.mb} --compression gzip --shard-count ${pipeline.shards}`;
  
  console.log(`Creating pipeline: ${pipeline.name}`);
  console.log(`Command: ${cmd}`);
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt}/${maxRetries}...`);
      execSync(cmd, { stdio: 'inherit' });
      console.log(`✅ Successfully created pipeline: ${pipeline.name}\n`);
      return true;
    } catch (err) {
      console.error(`❌ Attempt ${attempt} failed for pipeline ${pipeline.name}:`);
      
      if (err.message.includes('already exists') || err.message.includes('name is already taken')) {
        console.log(`⚠️  Pipeline ${pipeline.name} already exists, skipping creation\n`);
        return true;
      }
      
      if (attempt === maxRetries) {
        console.error(`💥 All ${maxRetries} attempts failed for pipeline ${pipeline.name}:`);
        console.error(`Error: ${err.message}`);
        console.error('Full error details:', err);
        console.log(''); // Empty line for readability
        return false;
      } else {
        console.log(`⏳ Waiting 2 seconds before retry...`);
        execSync('sleep 2');
      }
    }
  }
  return false;
}

// Create pipelines with enhanced error handling
console.log('🚀 Starting pipeline creation process...\n');

let successCount = 0;
let failureCount = 0;

for (const p of pipelines) {
  const success = createPipelineWithRetry(p);
  if (success) {
    successCount++;
  } else {
    failureCount++;
  }
}

// Summary
console.log('📊 Pipeline Creation Summary:');
console.log('============================');
console.log(`✅ Successful: ${successCount}`);
console.log(`❌ Failed: ${failureCount}`);
console.log(`📋 Total: ${pipelines.length}`);

if (failureCount > 0) {
  console.log('\n⚠️  Some pipelines failed to create. Check the errors above.');
  process.exit(1);
} else {
  console.log('\n🎉 All pipelines created successfully!');
}
