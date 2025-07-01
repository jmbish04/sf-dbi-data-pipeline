#!/usr/bin/env node

/**
 * Batch Timing Verification Utility
 * 
 * This script verifies that files are created at expected intervals
 * based on pipeline batch timing configuration.
 */

const { execSync } = require('child_process');

class BatchTimingVerifier {
  constructor(options = {}) {
    this.verbose = options.verbose || false;
    this.pipelines = [
      {
        name: 'sf-permits-ingestion',
        r2Bucket: 'sf-permits-data',
        batchSeconds: 60,
        expectedIntervalMin: 50,   // Allow 10 second variance
        expectedIntervalMax: 70
      },
      {
        name: 'sf-permit-events',
        r2Bucket: 'sf-permit-events',
        batchSeconds: 30,
        expectedIntervalMin: 25,
        expectedIntervalMax: 35
      },
      {
        name: 'sf-inspector-analytics',
        r2Bucket: 'sf-inspector-data',
        batchSeconds: 300,
        expectedIntervalMin: 280,
        expectedIntervalMax: 320
      }
    ];
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

  parseFileTimestamp(filename) {
    // Extract timestamp from filename pattern: sf-*_YYYYMMDD_HHMMSS_*.json.gz
    const timestampMatch = filename.match(/_(\d{8})_(\d{6})_/);
    if (!timestampMatch) {
      return null;
    }
    
    const dateStr = timestampMatch[1]; // YYYYMMDD
    const timeStr = timestampMatch[2]; // HHMMSS
    
    const year = parseInt(dateStr.substring(0, 4));
    const month = parseInt(dateStr.substring(4, 6)) - 1; // JS months are 0-based
    const day = parseInt(dateStr.substring(6, 8));
    const hour = parseInt(timeStr.substring(0, 2));
    const minute = parseInt(timeStr.substring(2, 4));
    const second = parseInt(timeStr.substring(4, 6));
    
    return new Date(year, month, day, hour, minute, second);
  }

  async verifyBatchTiming(pipeline) {
    this.log(`Verifying batch timing for ${pipeline.name}...`);
    
    try {
      // Get list of objects with modification times
      const listCmd = `npx wrangler r2 object list ${pipeline.r2Bucket} --json`;
      const result = execSync(listCmd, { encoding: 'utf8' });
      const objects = JSON.parse(result);
      
      if (objects.length < 2) {
        this.log(`⚠ Not enough files (${objects.length}) to verify timing for ${pipeline.name}`, 'WARN');
        return {
          pipeline: pipeline.name,
          filesAnalyzed: objects.length,
          timingValid: false,
          intervals: [],
          avgInterval: 0,
          message: 'Insufficient files for timing analysis'
        };
      }
      
      // Sort objects by modification time
      const sortedObjects = objects.sort((a, b) => new Date(a.uploaded) - new Date(b.uploaded));
      
      // Calculate intervals between consecutive files
      const intervals = [];
      for (let i = 1; i < sortedObjects.length; i++) {
        const prevTime = new Date(sortedObjects[i - 1].uploaded);
        const currentTime = new Date(sortedObjects[i].uploaded);
        const interval = (currentTime - prevTime) / 1000; // Convert to seconds
        intervals.push(interval);
      }
      
      // Calculate average interval
      const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
      
      // Check if intervals are within expected range
      const validIntervals = intervals.filter(interval => 
        interval >= pipeline.expectedIntervalMin && interval <= pipeline.expectedIntervalMax
      );
      
      const timingValidRatio = validIntervals.length / intervals.length;
      const timingValid = timingValidRatio >= 0.8; // 80% of intervals should be valid
      
      this.log(`Average interval: ${avgInterval.toFixed(1)}s (expected: ${pipeline.batchSeconds}s)`);
      this.log(`Valid intervals: ${validIntervals.length}/${intervals.length} (${(timingValidRatio * 100).toFixed(1)}%)`);
      
      return {
        pipeline: pipeline.name,
        filesAnalyzed: objects.length,
        intervalsAnalyzed: intervals.length,
        avgInterval: avgInterval,
        expectedInterval: pipeline.batchSeconds,
        validIntervals: validIntervals.length,
        totalIntervals: intervals.length,
        timingValidRatio: timingValidRatio,
        timingValid: timingValid,
        intervals: intervals
      };
      
    } catch (error) {
      this.log(`✗ Failed to verify timing for ${pipeline.name}: ${error.message}`, 'ERROR');
      return {
        pipeline: pipeline.name,
        timingValid: false,
        error: error.message
      };
    }
  }

  async verifyAllPipelineTiming() {
    this.log('Starting batch timing verification...');
    
    const results = [];
    let overallValid = true;
    
    for (const pipeline of this.pipelines) {
      const result = await this.verifyBatchTiming(pipeline);
      results.push(result);
      
      if (!result.timingValid) {
        overallValid = false;
      }
    }
    
    // Generate timing report
    this.log('\n=== BATCH TIMING VERIFICATION REPORT ===');
    
    for (const result of results) {
      this.log(`\n${result.pipeline}:`);
      
      if (result.error) {
        this.log(`  Status: ✗ ERROR - ${result.error}`, 'ERROR');
        continue;
      }
      
      if (result.message) {
        this.log(`  Status: ⚠ ${result.message}`, 'WARN');
        continue;
      }
      
      this.log(`  Files Analyzed: ${result.filesAnalyzed}`);
      this.log(`  Intervals Analyzed: ${result.intervalsAnalyzed}`);
      this.log(`  Average Interval: ${result.avgInterval.toFixed(1)}s`);
      this.log(`  Expected Interval: ${result.expectedInterval}s`);
      this.log(`  Valid Intervals: ${result.validIntervals}/${result.totalIntervals} (${(result.timingValidRatio * 100).toFixed(1)}%)`);
      this.log(`  Status: ${result.timingValid ? '✓ PASS' : '✗ FAIL'}`);
      
      if (result.intervals && this.verbose) {
        this.log('  Individual Intervals (seconds):');
        result.intervals.forEach((interval, index) => {
          const status = interval >= result.expectedInterval * 0.8 && interval <= result.expectedInterval * 1.2 ? '✓' : '✗';
          this.log(`    ${index + 1}: ${interval.toFixed(1)}s ${status}`);
        });
      }
    }
    
    this.log(`\nOverall Timing Verification: ${overallValid ? '✓ PASS' : '✗ FAIL'}`);
    
    return {
      overallValid,
      results
    };
  }
}

// CLI handling
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {
    verbose: args.includes('--verbose')
  };
  
  const verifier = new BatchTimingVerifier(options);
  
  verifier.verifyAllPipelineTiming()
    .then(({ overallValid }) => {
      process.exit(overallValid ? 0 : 1);
    })
    .catch(error => {
      console.error('Batch timing verification failed:', error);
      process.exit(1);
    });
}

module.exports = BatchTimingVerifier;