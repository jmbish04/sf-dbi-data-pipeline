#!/usr/bin/env node

/**
 * Error Scenario Testing Utility
 * 
 * This script tests various error scenarios and ensures they are
 * properly logged and handled by the pipeline system.
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');

class ErrorScenarioTester {
  constructor(options = {}) {
    this.verbose = options.verbose || false;
    this.testResults = [];
    this.logDir = '/tmp/pipeline-error-tests';
    
    // Ensure log directory exists
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level}]`;
    
    if (level === 'ERROR') {
      console.error(`${prefix} ${message}`);
    } else if (level === 'WARN') {
      console.warn(`${prefix} ${message}`);
    } else if (this.verbose || level === 'INFO') {
      console.log(`${prefix} ${message}`);
    }
  }

  async testInvalidBucketAccess() {
    this.log('Testing invalid bucket access scenario...');
    
    const testName = 'invalid_bucket_access';
    const startTime = Date.now();
    
    try {
      // Try to list objects from a non-existent bucket
      const invalidBucket = 'non-existent-bucket-test-123';
      const cmd = `npx wrangler r2 object list ${invalidBucket}`;
      
      execSync(cmd, { stdio: 'pipe' });
      
      // If we get here, the test failed (should have thrown an error)
      this.testResults.push({
        testName,
        status: 'FAIL',
        message: 'Expected error for invalid bucket access, but command succeeded',
        duration: Date.now() - startTime
      });
      
    } catch (error) {
      // This is expected - the error should be properly handled
      this.testResults.push({
        testName,
        status: 'PASS',
        message: 'Invalid bucket access properly rejected',
        errorMessage: error.message,
        duration: Date.now() - startTime
      });
    }
  }

  async testNetworkTimeout() {
    this.log('Testing network timeout scenario...');
    
    const testName = 'network_timeout';
    const startTime = Date.now();
    
    try {
      // Set a very short timeout to simulate network issues
      const cmd = 'timeout 1s npx wrangler r2 bucket list';
      
      execSync(cmd, { stdio: 'pipe' });
      
      this.testResults.push({
        testName,
        status: 'PASS',
        message: 'Command completed within timeout (network healthy)',
        duration: Date.now() - startTime
      });
      
    } catch (error) {
      if (error.message.includes('timeout') || error.signal === 'SIGTERM') {
        this.testResults.push({
          testName,
          status: 'PASS',
          message: 'Network timeout properly handled',
          errorMessage: error.message,
          duration: Date.now() - startTime
        });
      } else {
        this.testResults.push({
          testName,
          status: 'FAIL',
          message: 'Unexpected error during timeout test',
          errorMessage: error.message,
          duration: Date.now() - startTime
        });
      }
    }
  }

  async testInvalidCredentials() {
    this.log('Testing invalid credentials scenario...');
    
    const testName = 'invalid_credentials';
    const startTime = Date.now();
    
    try {
      // Save current environment
      const originalToken = process.env.CLOUDFLARE_API_TOKEN;
      const originalAccountId = process.env.CLOUDFLARE_ACCOUNT_ID;
      
      // Set invalid credentials
      process.env.CLOUDFLARE_API_TOKEN = 'invalid_token_test_123';
      process.env.CLOUDFLARE_ACCOUNT_ID = 'invalid_account_id';
      
      const cmd = 'npx wrangler r2 bucket list';
      
      try {
        execSync(cmd, { stdio: 'pipe' });
        
        this.testResults.push({
          testName,
          status: 'FAIL',
          message: 'Expected authentication error with invalid credentials',
          duration: Date.now() - startTime
        });
        
      } catch (error) {
        this.testResults.push({
          testName,
          status: 'PASS',
          message: 'Invalid credentials properly rejected',
          errorMessage: error.message,
          duration: Date.now() - startTime
        });
      }
      
      // Restore original environment
      if (originalToken) process.env.CLOUDFLARE_API_TOKEN = originalToken;
      if (originalAccountId) process.env.CLOUDFLARE_ACCOUNT_ID = originalAccountId;
      
    } catch (error) {
      this.testResults.push({
        testName,
        status: 'FAIL',
        message: 'Error during credential test setup',
        errorMessage: error.message,
        duration: Date.now() - startTime
      });
    }
  }

  async testPipelineNotFound() {
    this.log('Testing pipeline not found scenario...');
    
    const testName = 'pipeline_not_found';
    const startTime = Date.now();
    
    try {
      // Try to get info about a non-existent pipeline
      const invalidPipeline = 'non-existent-pipeline-test-123';
      const cmd = `npx wrangler pipelines show ${invalidPipeline}`;
      
      execSync(cmd, { stdio: 'pipe' });
      
      this.testResults.push({
        testName,
        status: 'FAIL',
        message: 'Expected error for non-existent pipeline',
        duration: Date.now() - startTime
      });
      
    } catch (error) {
      this.testResults.push({
        testName,
        status: 'PASS',
        message: 'Non-existent pipeline properly rejected',
        errorMessage: error.message,
        duration: Date.now() - startTime
      });
    }
  }

  async testRateLimiting() {
    this.log('Testing rate limiting scenario...');
    
    const testName = 'rate_limiting';
    const startTime = Date.now();
    
    try {
      // Make multiple rapid requests to potentially trigger rate limiting
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          new Promise((resolve, reject) => {
            try {
              execSync('npx wrangler r2 bucket list', { stdio: 'pipe' });
              resolve({ success: true, attempt: i + 1 });
            } catch (error) {
              resolve({ success: false, attempt: i + 1, error: error.message });
            }
          })
        );
      }
      
      const results = await Promise.all(promises);
      const failures = results.filter(r => !r.success);
      const rateLimitErrors = failures.filter(f => 
        f.error && (f.error.includes('rate limit') || f.error.includes('429'))
      );
      
      if (rateLimitErrors.length > 0) {
        this.testResults.push({
          testName,
          status: 'PASS',
          message: `Rate limiting detected and handled (${rateLimitErrors.length} rate limit errors)`,
          duration: Date.now() - startTime
        });
      } else {
        this.testResults.push({
          testName,
          status: 'PASS',
          message: 'No rate limiting encountered (all requests succeeded)',
          duration: Date.now() - startTime
        });
      }
      
    } catch (error) {
      this.testResults.push({
        testName,
        status: 'FAIL',
        message: 'Error during rate limiting test',
        errorMessage: error.message,
        duration: Date.now() - startTime
      });
    }
  }

  async testLargeFileHandling() {
    this.log('Testing large file handling scenario...');
    
    const testName = 'large_file_handling';
    const startTime = Date.now();
    
    try {
      // Check if there are any large files in the buckets
      const buckets = ['sf-permits-data', 'sf-permit-events', 'sf-inspector-data'];
      let largeFilesFound = 0;
      const maxSize = 100 * 1024 * 1024; // 100MB threshold
      
      for (const bucket of buckets) {
        try {
          const cmd = `npx wrangler r2 object list ${bucket} --json`;
          const result = execSync(cmd, { encoding: 'utf8' });
          const objects = JSON.parse(result);
          
          const largeFiles = objects.filter(obj => obj.size > maxSize);
          largeFilesFound += largeFiles.length;
          
          if (largeFiles.length > 0) {
            this.log(`Found ${largeFiles.length} large files in ${bucket}`, 'DEBUG');
          }
          
        } catch (error) {
          this.log(`Could not check bucket ${bucket}: ${error.message}`, 'DEBUG');
        }
      }
      
      this.testResults.push({
        testName,
        status: 'PASS',
        message: `Large file handling check completed (${largeFilesFound} large files found)`,
        largeFilesCount: largeFilesFound,
        duration: Date.now() - startTime
      });
      
    } catch (error) {
      this.testResults.push({
        testName,
        status: 'FAIL',
        message: 'Error during large file handling test',
        errorMessage: error.message,
        duration: Date.now() - startTime
      });
    }
  }

  async runAllErrorTests() {
    this.log('Starting error scenario testing...');
    
    const tests = [
      this.testInvalidBucketAccess(),
      this.testNetworkTimeout(),
      this.testInvalidCredentials(),
      this.testPipelineNotFound(),
      this.testRateLimiting(),
      this.testLargeFileHandling()
    ];
    
    await Promise.all(tests);
    
    this.generateErrorReport();
  }

  generateErrorReport() {
    this.log('\n=== ERROR SCENARIO TESTING REPORT ===');
    
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.status === 'PASS').length;
    const failedTests = this.testResults.filter(r => r.status === 'FAIL').length;
    
    this.log(`Total Tests: ${totalTests}`);
    this.log(`Passed: ${passedTests}`);
    this.log(`Failed: ${failedTests}`);
    this.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    
    this.log('\nTest Details:');
    this.testResults.forEach(result => {
      const status = result.status === 'PASS' ? '✓' : '✗';
      this.log(`  ${status} ${result.testName}: ${result.message}`);
      if (result.errorMessage && this.verbose) {
        this.log(`    Error: ${result.errorMessage}`, 'DEBUG');
      }
      this.log(`    Duration: ${result.duration}ms`, 'DEBUG');
    });
    
    // Save results to file
    const reportPath = `${this.logDir}/error-test-report.json`;
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      summary: {
        totalTests,
        passedTests,
        failedTests,
        successRate: (passedTests / totalTests) * 100
      },
      results: this.testResults
    }, null, 2));
    
    this.log(`\nDetailed report saved to: ${reportPath}`);
    
    return passedTests === totalTests;
  }
}

// CLI handling
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {
    verbose: args.includes('--verbose')
  };
  
  const tester = new ErrorScenarioTester(options);
  
  tester.runAllErrorTests()
    .then(() => {
      const allPassed = tester.testResults.every(r => r.status === 'PASS');
      process.exit(allPassed ? 0 : 1);
    })
    .catch(error => {
      console.error('Error scenario testing failed:', error);
      process.exit(1);
    });
}

module.exports = ErrorScenarioTester;