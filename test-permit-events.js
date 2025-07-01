const fs = require('fs');
const path = require('path');

/**
 * Validates permit events against the required schema
 */
function validatePermitEvent(event) {
  const requiredFields = ['eventId', 'permitId', 'eventType', 'timestamp', 'eventData'];
  const supportedEventTypes = [
    'status_change',
    'inspector_assigned', 
    'inspector_unassigned',
    'inspection_scheduled',
    'inspection_completed',
    'inspection_cancelled',
    'payment_received',
    'document_uploaded',
    'comment_added'
  ];

  const errors = [];

  // Check required fields
  for (const field of requiredFields) {
    if (!(field in event)) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Validate field types and formats
  if (event.eventId && typeof event.eventId !== 'string') {
    errors.push('eventId must be a string');
  }

  if (event.permitId && typeof event.permitId !== 'string') {
    errors.push('permitId must be a string');
  }

  if (event.permitId && !/^PRM\d{4}-\d{6}$/.test(event.permitId)) {
    errors.push('permitId must match format PRM[YEAR]-[NUMBER] (e.g., PRM2024-001234)');
  }

  if (event.eventType && !supportedEventTypes.includes(event.eventType)) {
    errors.push(`eventType must be one of: ${supportedEventTypes.join(', ')}`);
  }

  if (event.timestamp && !isValidISO8601(event.timestamp)) {
    errors.push('timestamp must be a valid ISO 8601 date string');
  }

  if (event.eventData && typeof event.eventData !== 'object') {
    errors.push('eventData must be an object');
  }

  return errors;
}

/**
 * Validates ISO 8601 timestamp format
 */
function isValidISO8601(dateString) {
  try {
    const date = new Date(dateString);
    // Check if it's a valid date and the original string parses correctly
    return !isNaN(date.getTime()) && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(dateString);
  } catch {
    return false;
  }
}

/**
 * Validates pipeline configuration
 */
function validatePipelineConfig() {
  console.log('🔍 Validating sf-permit-events pipeline configuration...\n');

  const pipelineScript = path.join(__dirname, 'scripts', 'create_pipelines.js');
  const content = fs.readFileSync(pipelineScript, 'utf8');
  
  // Extract pipeline configuration
  const pipelineMatch = content.match(/{\s*name:\s*['"](sf-permit-events)['"],[^}]+}/);
  if (!pipelineMatch) {
    console.error('❌ sf-permit-events pipeline not found in configuration');
    return false;
  }

  // Check specific requirements
  const config = pipelineMatch[0];
  const requirements = [
    { field: 'seconds: 30', description: '30-second batch intervals' },
    { field: 'mb: 25', description: '25MB batch size limit' },
    { field: 'shards: 2', description: '2 shards for event volume' },
    { field: 'r2: [\'"]sf-permit-events[\'"]', description: 'sf-permit-events R2 bucket' }
  ];

  let allValid = true;
  
  for (const req of requirements) {
    const regex = new RegExp(req.field);
    if (regex.test(config)) {
      console.log(`✅ ${req.description}`);
    } else {
      console.log(`❌ ${req.description}`);
      allValid = false;
    }
  }

  // Check R2 bucket configuration
  const r2Script = path.join(__dirname, 'scripts', 'create_r2_buckets.js');
  const r2Content = fs.readFileSync(r2Script, 'utf8');
  
  if (r2Content.includes("'sf-permit-events'")) {
    console.log('✅ sf-permit-events R2 bucket configured');
  } else {
    console.log('❌ sf-permit-events R2 bucket not configured');
    allValid = false;
  }

  return allValid;
}

/**
 * Tests sample permit events data
 */
function testSampleData() {
  console.log('\n🧪 Testing sample permit events data...\n');

  const sampleDataPath = path.join(__dirname, 'sample-data', 'permit-events.json');
  
  if (!fs.existsSync(sampleDataPath)) {
    console.error('❌ Sample data file not found:', sampleDataPath);
    return false;
  }

  let sampleEvents;
  try {
    const content = fs.readFileSync(sampleDataPath, 'utf8');
    sampleEvents = JSON.parse(content);
  } catch (error) {
    console.error('❌ Error parsing sample data:', error.message);
    return false;
  }

  if (!Array.isArray(sampleEvents)) {
    console.error('❌ Sample data must be an array of events');
    return false;
  }

  console.log(`📊 Testing ${sampleEvents.length} sample events:`);
  
  let validEvents = 0;
  const eventTypes = new Set();
  
  for (const [index, event] of sampleEvents.entries()) {
    const errors = validatePermitEvent(event);
    
    if (errors.length === 0) {
      validEvents++;
      eventTypes.add(event.eventType);
      console.log(`✅ Event ${index + 1} (${event.eventType}): valid`);
    } else {
      console.log(`❌ Event ${index + 1}: ${errors.join(', ')}`);
    }
  }

  console.log(`\n📈 Summary:`);
  console.log(`   - Valid events: ${validEvents}/${sampleEvents.length}`);
  console.log(`   - Event types covered: ${Array.from(eventTypes).join(', ')}`);
  
  return validEvents === sampleEvents.length;
}

/**
 * Checks documentation files
 */
function checkDocumentation() {
  console.log('\n📚 Checking documentation...\n');

  const docs = [
    { file: 'docs/permit-events-schema.md', description: 'Event schema documentation' },
    { file: 'docs/integration-endpoints.md', description: 'Integration endpoint documentation' }
  ];

  let allPresent = true;

  for (const doc of docs) {
    const docPath = path.join(__dirname, doc.file);
    if (fs.existsSync(docPath)) {
      const stats = fs.statSync(docPath);
      console.log(`✅ ${doc.description} (${stats.size} bytes)`);
    } else {
      console.log(`❌ ${doc.description} - file not found`);
      allPresent = false;
    }
  }

  return allPresent;
}

/**
 * Main test runner
 */
function main() {
  console.log('🚀 SF Permit Events Pipeline Validation\n');
  console.log('='.repeat(50));

  const results = {
    config: validatePipelineConfig(),
    samples: testSampleData(), 
    docs: checkDocumentation()
  };

  console.log('\n' + '='.repeat(50));
  console.log('📋 Final Results:');
  console.log(`   Pipeline Configuration: ${results.config ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Sample Data Validation: ${results.samples ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Documentation: ${results.docs ? '✅ PASS' : '❌ FAIL'}`);

  const allPassed = Object.values(results).every(result => result);
  
  if (allPassed) {
    console.log('\n🎉 All tests passed! The sf-permit-events pipeline is ready for use.');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Please review the issues above.');
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  main();
}

module.exports = {
  validatePermitEvent,
  validatePipelineConfig,
  testSampleData,
  checkDocumentation
};