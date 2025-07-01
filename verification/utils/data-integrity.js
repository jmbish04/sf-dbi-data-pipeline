#!/usr/bin/env node

/**
 * Data Integrity Verification Utility
 * 
 * This script verifies data integrity by checking for corruption, 
 * data loss, and format consistency in R2 stored files.
 */

const { execSync } = require('child_process');
const crypto = require('crypto');
const zlib = require('zlib');

class DataIntegrityVerifier {
  constructor(options = {}) {
    this.verbose = options.verbose || false;
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

  async downloadAndVerifyFile(bucketName, objectKey) {
    try {
      // Download file content
      const downloadCmd = `npx wrangler r2 object get ${bucketName} ${objectKey}`;
      const fileContent = execSync(downloadCmd, { encoding: 'buffer' });
      
      // Calculate checksum
      const hash = crypto.createHash('sha256');
      hash.update(fileContent);
      const checksum = hash.digest('hex');
      
      // Verify compression if file is gzipped
      let decompressedContent = null;
      let compressionValid = true;
      
      if (objectKey.endsWith('.gz')) {
        try {
          decompressedContent = zlib.gunzipSync(fileContent);
        } catch (error) {
          this.log(`✗ Compression error in ${objectKey}: ${error.message}`, 'ERROR');
          compressionValid = false;
        }
      } else {
        decompressedContent = fileContent;
      }
      
      // Verify JSON format if applicable
      let jsonValid = true;
      if (objectKey.includes('.json') && decompressedContent) {
        try {
          const jsonData = JSON.parse(decompressedContent.toString());
          if (!Array.isArray(jsonData) && typeof jsonData !== 'object') {
            jsonValid = false;
          }
        } catch (error) {
          this.log(`✗ JSON format error in ${objectKey}: ${error.message}`, 'ERROR');
          jsonValid = false;
        }
      }
      
      return {
        objectKey,
        size: fileContent.length,
        checksum,
        compressionValid,
        jsonValid,
        decompressedSize: decompressedContent ? decompressedContent.length : 0
      };
      
    } catch (error) {
      this.log(`✗ Failed to verify ${objectKey}: ${error.message}`, 'ERROR');
      return {
        objectKey,
        error: error.message,
        compressionValid: false,
        jsonValid: false
      };
    }
  }

  async verifyBucketIntegrity(bucketName, sampleSize = 10) {
    this.log(`Verifying data integrity for bucket: ${bucketName}`);
    
    try {
      // List objects in bucket
      const listCmd = `npx wrangler r2 object list ${bucketName} --json`;
      const result = execSync(listCmd, { encoding: 'utf8' });
      const objects = JSON.parse(result);
      
      if (objects.length === 0) {
        this.log(`⚠ No objects found in bucket ${bucketName}`, 'WARN');
        return {
          totalFiles: 0,
          validFiles: 0,
          integrityRatio: 0,
          errors: []
        };
      }
      
      // Sample files for verification (or all if less than sampleSize)
      const samplesToVerify = objects.length <= sampleSize ? 
        objects : objects.slice(0, sampleSize);
      
      this.log(`Verifying ${samplesToVerify.length} files from ${objects.length} total`);
      
      const verifications = [];
      const errors = [];
      
      for (let i = 0; i < samplesToVerify.length; i++) {
        const obj = samplesToVerify[i];
        this.log(`Verifying ${i + 1}/${samplesToVerify.length}: ${obj.key}`, 'DEBUG');
        
        const verification = await this.downloadAndVerifyFile(bucketName, obj.key);
        verifications.push(verification);
        
        if (verification.error) {
          errors.push(verification.error);
        }
      }
      
      // Calculate integrity metrics
      const validFiles = verifications.filter(v => 
        !v.error && v.compressionValid && v.jsonValid
      ).length;
      
      const integrityRatio = validFiles / verifications.length;
      
      return {
        bucketName,
        totalFiles: objects.length,
        verifiedFiles: verifications.length,
        validFiles,
        integrityRatio,
        errors,
        verifications
      };
      
    } catch (error) {
      this.log(`✗ Failed to verify bucket ${bucketName}: ${error.message}`, 'ERROR');
      throw error;
    }
  }

  async generateIntegrityReport(buckets) {
    this.log('Generating data integrity report...');
    
    const results = [];
    let totalValid = 0;
    let totalVerified = 0;
    
    for (const bucket of buckets) {
      const result = await this.verifyBucketIntegrity(bucket);
      results.push(result);
      totalValid += result.validFiles;
      totalVerified += result.verifiedFiles;
    }
    
    // Generate summary report
    this.log('\n=== DATA INTEGRITY REPORT ===');
    
    for (const result of results) {
      this.log(`\n${result.bucketName}:`);
      this.log(`  Total Files: ${result.totalFiles}`);
      this.log(`  Verified Files: ${result.verifiedFiles}`);
      this.log(`  Valid Files: ${result.validFiles}`);
      this.log(`  Integrity Ratio: ${(result.integrityRatio * 100).toFixed(1)}%`);
      
      if (result.errors.length > 0) {
        this.log(`  Errors: ${result.errors.length}`, 'WARN');
        result.errors.forEach(error => {
          this.log(`    - ${error}`, 'WARN');
        });
      }
    }
    
    const overallIntegrity = totalVerified > 0 ? totalValid / totalVerified : 0;
    this.log(`\nOverall Integrity: ${(overallIntegrity * 100).toFixed(1)}%`);
    
    if (overallIntegrity >= 0.95) {
      this.log('✓ Data integrity verification passed');
      return true;
    } else {
      this.log('✗ Data integrity verification failed', 'ERROR');
      return false;
    }
  }
}

// CLI handling
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {
    verbose: args.includes('--verbose')
  };
  
  const buckets = [
    'sf-permits-data',
    'sf-permit-events',
    'sf-inspector-data'
  ];
  
  const verifier = new DataIntegrityVerifier(options);
  
  verifier.generateIntegrityReport(buckets)
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Data integrity verification failed:', error);
      process.exit(1);
    });
}

module.exports = DataIntegrityVerifier;