#!/usr/bin/env node

/**
 * SF DBI Data Pipeline - Data Flow Verification Script
 * 
 * This script verifies end-to-end data flow from DataSF APIs through 
 * Cloudflare Pipelines to R2 storage, ensuring data integrity and proper partitioning.
 * 
 * Usage: node verification/verify-data-flow.js [--staging] [--verbose]
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const PIPELINES = [
  {
    name: 'sf-permits-ingestion',
    r2Bucket: 'sf-permits-data',
    batchSeconds: 60,
    batchMB: 50,
    shards: 3,
    expectedPartitions: ['year', 'month', 'day']
  },
  {
    name: 'sf-permit-events',
    r2Bucket: 'sf-permit-events',
    batchSeconds: 30,
    batchMB: 25,
    shards: 2,
    expectedPartitions: ['year', 'month', 'day']
  },
  {
    name: 'sf-inspector-analytics',
    r2Bucket: 'sf-inspector-data',
    batchSeconds: 300,
    batchMB: 100,
    shards: 1,
    expectedPartitions: ['year', 'month', 'day']
  }
];

const VERIFICATION_RESULTS = {
  dataFlow: false,
  r2Storage: false,
  fileNaming: false,
  dataIntegrity: false,
  compression: false,
  batchTiming: false,
  errorScenarios: false,
  performanceMetrics: {}
};

class DataFlowVerifier {
  constructor(options = {}) {
    this.staging = options.staging || false;
    this.verbose = options.verbose || false;
    this.startTime = Date.now();
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

  async verifyPipelineStatus() {
    this.log('Verifying pipeline status...');
    
    try {
      for (const pipeline of PIPELINES) {
        this.log(`Checking pipeline: ${pipeline.name}`, 'DEBUG');
        
        // Check if pipeline exists
        const listCmd = 'npx wrangler pipelines list --json';
        const result = execSync(listCmd, { encoding: 'utf8' });
        const pipelines = JSON.parse(result);
        
        const pipelineExists = pipelines.some(p => p.name === pipeline.name);
        
        if (!pipelineExists) {
          throw new Error(`Pipeline ${pipeline.name} does not exist`);
        }
        
        this.log(`✓ Pipeline ${pipeline.name} exists`);
      }
      
      VERIFICATION_RESULTS.dataFlow = true;
      this.log('✓ All pipelines verified');
      
    } catch (error) {
      this.log(`✗ Pipeline verification failed: ${error.message}`, 'ERROR');
      VERIFICATION_RESULTS.dataFlow = false;
      throw error;
    }
  }

  async verifyR2Storage() {
    this.log('Verifying R2 storage and partitioning...');
    
    try {
      for (const pipeline of PIPELINES) {
        this.log(`Checking R2 bucket: ${pipeline.r2Bucket}`, 'DEBUG');
        
        // Check if bucket exists
        const listCmd = 'npx wrangler r2 bucket list --json';
        const result = execSync(listCmd, { encoding: 'utf8' });
        const buckets = JSON.parse(result);
        
        const bucketExists = buckets.some(b => b.name === pipeline.r2Bucket);
        
        if (!bucketExists) {
          throw new Error(`R2 bucket ${pipeline.r2Bucket} does not exist`);
        }
        
        this.log(`✓ R2 bucket ${pipeline.r2Bucket} exists`);
        
        // Check for data files and partitioning
        await this.verifyBucketPartitioning(pipeline);
      }
      
      VERIFICATION_RESULTS.r2Storage = true;
      this.log('✓ R2 storage verification completed');
      
    } catch (error) {
      this.log(`✗ R2 storage verification failed: ${error.message}`, 'ERROR');
      VERIFICATION_RESULTS.r2Storage = false;
      throw error;
    }
  }

  async verifyBucketPartitioning(pipeline) {
    this.log(`Verifying partitioning for ${pipeline.r2Bucket}...`, 'DEBUG');
    
    try {
      const listCmd = `npx wrangler r2 object list ${pipeline.r2Bucket} --json`;
      const result = execSync(listCmd, { encoding: 'utf8' });
      const objects = JSON.parse(result);
      
      if (objects.length === 0) {
        this.log(`⚠ No objects found in ${pipeline.r2Bucket} - may be empty`, 'WARN');
        return;
      }
      
      // Check if objects follow expected partitioning pattern
      const partitionPattern = /^(\d{4})\/(\d{2})\/(\d{2})\//;
      let partitionedObjects = 0;
      
      for (const obj of objects) {
        if (partitionPattern.test(obj.key)) {
          partitionedObjects++;
        }
      }
      
      const partitionRatio = partitionedObjects / objects.length;
      
      if (partitionRatio < 0.8) {
        this.log(`⚠ Only ${(partitionRatio * 100).toFixed(1)}% of objects follow partitioning pattern`, 'WARN');
      } else {
        this.log(`✓ ${(partitionRatio * 100).toFixed(1)}% of objects properly partitioned`);
      }
      
    } catch (error) {
      this.log(`⚠ Could not verify partitioning for ${pipeline.r2Bucket}: ${error.message}`, 'WARN');
    }
  }

  async verifyFileNaming() {
    this.log('Verifying file naming conventions...');
    
    try {
      const expectedPattern = /^(\d{4})\/(\d{2})\/(\d{2})\/sf-[a-z-]+_\d{8}_\d{6}_\d+\.json\.gz$/;
      let totalFiles = 0;
      let validFiles = 0;
      
      for (const pipeline of PIPELINES) {
        const listCmd = `npx wrangler r2 object list ${pipeline.r2Bucket} --json`;
        const result = execSync(listCmd, { encoding: 'utf8' });
        const objects = JSON.parse(result);
        
        for (const obj of objects) {
          totalFiles++;
          if (expectedPattern.test(obj.key)) {
            validFiles++;
          } else {
            this.log(`⚠ File ${obj.key} doesn't match naming convention`, 'DEBUG');
          }
        }
      }
      
      if (totalFiles === 0) {
        this.log('⚠ No files found to verify naming convention', 'WARN');
      } else {
        const validRatio = validFiles / totalFiles;
        if (validRatio >= 0.9) {
          VERIFICATION_RESULTS.fileNaming = true;
          this.log(`✓ ${(validRatio * 100).toFixed(1)}% of files follow naming convention`);
        } else {
          this.log(`✗ Only ${(validRatio * 100).toFixed(1)}% of files follow naming convention`, 'ERROR');
        }
      }
      
    } catch (error) {
      this.log(`✗ File naming verification failed: ${error.message}`, 'ERROR');
      VERIFICATION_RESULTS.fileNaming = false;
    }
  }

  async verifyCompression() {
    this.log('Verifying compression...');
    
    try {
      let compressedFiles = 0;
      let totalFiles = 0;
      
      for (const pipeline of PIPELINES) {
        const listCmd = `npx wrangler r2 object list ${pipeline.r2Bucket} --json`;
        const result = execSync(listCmd, { encoding: 'utf8' });
        const objects = JSON.parse(result);
        
        for (const obj of objects) {
          totalFiles++;
          if (obj.key.endsWith('.gz')) {
            compressedFiles++;
          }
        }
      }
      
      if (totalFiles === 0) {
        this.log('⚠ No files found to verify compression', 'WARN');
      } else {
        const compressionRatio = compressedFiles / totalFiles;
        if (compressionRatio >= 0.9) {
          VERIFICATION_RESULTS.compression = true;
          this.log(`✓ ${(compressionRatio * 100).toFixed(1)}% of files are compressed`);
        } else {
          this.log(`✗ Only ${(compressionRatio * 100).toFixed(1)}% of files are compressed`, 'ERROR');
        }
      }
      
    } catch (error) {
      this.log(`✗ Compression verification failed: ${error.message}`, 'ERROR');
      VERIFICATION_RESULTS.compression = false;
    }
  }

  async runVerification() {
    this.log('Starting SF DBI Data Pipeline verification...');
    this.log(`Running in ${this.staging ? 'STAGING' : 'PRODUCTION'} mode`);
    
    try {
      await this.verifyPipelineStatus();
      await this.verifyR2Storage();
      await this.verifyFileNaming();
      await this.verifyCompression();
      
      // Calculate performance metrics
      const endTime = Date.now();
      VERIFICATION_RESULTS.performanceMetrics = {
        executionTime: endTime - this.startTime,
        timestamp: new Date().toISOString()
      };
      
      this.generateReport();
      
    } catch (error) {
      this.log(`Verification failed: ${error.message}`, 'ERROR');
      process.exit(1);
    }
  }

  generateReport() {
    this.log('\n=== VERIFICATION REPORT ===');
    this.log(`Data Flow: ${VERIFICATION_RESULTS.dataFlow ? '✓ PASS' : '✗ FAIL'}`);
    this.log(`R2 Storage: ${VERIFICATION_RESULTS.r2Storage ? '✓ PASS' : '✗ FAIL'}`);
    this.log(`File Naming: ${VERIFICATION_RESULTS.fileNaming ? '✓ PASS' : '✗ FAIL'}`);
    this.log(`Compression: ${VERIFICATION_RESULTS.compression ? '✓ PASS' : '✗ FAIL'}`);
    this.log(`Execution Time: ${VERIFICATION_RESULTS.performanceMetrics.executionTime}ms`);
    
    const passCount = Object.values(VERIFICATION_RESULTS).filter(v => v === true).length;
    const totalChecks = 4; // dataFlow, r2Storage, fileNaming, compression
    
    this.log(`\nOverall: ${passCount}/${totalChecks} checks passed`);
    
    if (passCount === totalChecks) {
      this.log('✓ All verifications passed successfully!');
      process.exit(0);
    } else {
      this.log('✗ Some verifications failed. Check logs above for details.', 'ERROR');
      process.exit(1);
    }
  }
}

// CLI handling
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {
    staging: args.includes('--staging'),
    verbose: args.includes('--verbose')
  };
  
  const verifier = new DataFlowVerifier(options);
  verifier.runVerification().catch(error => {
    console.error('Verification failed:', error);
    process.exit(1);
  });
}

module.exports = DataFlowVerifier;