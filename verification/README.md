# SF DBI Data Pipeline - Phase 1 Task 7 Verification

This directory contains comprehensive verification scripts for validating the end-to-end data flow from DataSF APIs through Cloudflare Pipelines to R2 storage.

## Overview

The verification suite addresses all acceptance criteria for Phase 1 Task 7:

- ✅ Test data successfully flows from sync worker to pipelines
- ✅ Data correctly stored in R2 with proper partitioning
- ✅ File naming convention follows expected pattern
- ✅ Data integrity verified (no corruption or loss)
- ✅ Compression working correctly
- ✅ Batch timing verified (files created at expected intervals)
- ✅ Error scenarios tested and logged
- ✅ Performance metrics documented

## Quick Start

### Run All Verifications
```bash
# Production environment
node verification/run-all-tests.js --verbose

# Staging environment
node verification/run-all-tests.js --staging --verbose

# Skip error scenario testing (faster execution)
node verification/run-all-tests.js --skip-errors
```

### Run Individual Tests
```bash
# Data flow verification
node verification/verify-data-flow.js --verbose

# Data integrity verification
node verification/utils/data-integrity.js --verbose

# Batch timing verification
node verification/utils/batch-timing.js --verbose

# Error scenario testing
node verification/utils/error-scenarios.js --verbose
```

## Verification Scripts

### 1. `verify-data-flow.js`
Main verification script that checks:
- Pipeline existence and configuration
- R2 bucket accessibility
- Data partitioning (year/month/day structure)
- File naming conventions
- Compression verification

### 2. `utils/data-integrity.js`
Verifies data integrity by:
- Downloading sample files from R2 buckets
- Calculating checksums
- Validating compression (gzip)
- Verifying JSON format validity
- Detecting corruption or data loss

### 3. `utils/batch-timing.js`
Validates batch timing by:
- Analyzing file creation timestamps
- Calculating intervals between batches
- Comparing against expected timing configuration
- Identifying timing anomalies

### 4. `utils/error-scenarios.js`
Tests error handling for:
- Invalid bucket access
- Network timeouts
- Invalid credentials
- Non-existent pipelines
- Rate limiting
- Large file handling

### 5. `run-all-tests.js`
Comprehensive test runner that:
- Executes all verification scripts
- Generates unified reports
- Provides acceptance criteria checklist
- Saves detailed results to JSON files

## Configuration

The verification scripts use the following pipeline configuration:

```javascript
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
```

## File Naming Convention

Expected file naming pattern:
```
YYYY/MM/DD/sf-{pipeline-type}_{YYYYMMDD}_{HHMMSS}_{shard}.json.gz
```

Examples:
- `2024/01/15/sf-permits-ingestion_20240115_143022_001.json.gz`
- `2024/01/15/sf-permit-events_20240115_143052_001.json.gz`
- `2024/01/15/sf-inspector-analytics_20240115_143322_001.json.gz`

## Data Partitioning

Data is partitioned by:
- **Year**: YYYY (e.g., 2024)
- **Month**: MM (e.g., 01 for January)
- **Day**: DD (e.g., 15)

This structure enables efficient querying and data organization in R2 storage.

## Performance Metrics

The verification suite tracks:
- **Execution Time**: Total time for all verifications
- **Data Integrity Ratio**: Percentage of files passing integrity checks
- **Compression Ratio**: Percentage of files properly compressed
- **Timing Accuracy**: Percentage of batches created within expected intervals
- **Error Handling Coverage**: Number of error scenarios tested

## Reports and Logs

### Console Output
Real-time verification progress with color-coded status indicators:
- ✅ **Green checkmarks**: Successful verifications
- ❌ **Red X marks**: Failed verifications
- ⚠️ **Yellow warnings**: Issues that don't cause failure

### JSON Reports
Detailed reports saved to `/tmp/pipeline-verification-reports/`:
```json
{
  "summary": {
    "overallStatus": "PASS",
    "executionTime": 45230,
    "totalTests": 4,
    "passedTests": 4,
    "failedTests": 0,
    "timestamp": "2024-01-15T14:30:22.123Z"
  },
  "dataFlow": { "status": "PASS" },
  "dataIntegrity": { "status": "PASS" },
  "batchTiming": { "status": "PASS" },
  "errorScenarios": { "status": "PASS" }
}
```

## Prerequisites

1. **Node.js 18+** installed
2. **Wrangler CLI** configured with Cloudflare credentials
3. **Proper permissions** for R2 bucket access
4. **Active pipelines** (created via `scripts/create_pipelines.js`)

## Environment Variables

Required for full functionality:
```bash
export CLOUDFLARE_API_TOKEN="your_token"
export CLOUDFLARE_ACCOUNT_ID="your_account_id"
```

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Verify Cloudflare API token and account ID
   - Check token permissions for R2 and Workers

2. **Pipeline Not Found**
   - Run `scripts/create_pipelines.js` to create pipelines
   - Verify pipeline names match configuration

3. **Empty Buckets**
   - Ensure data ingestion is active
   - Check sync worker status
   - Verify API connectivity

4. **Permission Denied**
   - Verify R2 bucket permissions
   - Check account-level access controls

### Debug Mode

Enable verbose logging for detailed information:
```bash
node verification/run-all-tests.js --verbose
```

## Integration with CI/CD

For automated testing in CI/CD pipelines:

```bash
#!/bin/bash
# Run verification and capture exit code
node verification/run-all-tests.js --staging
exit_code=$?

if [ $exit_code -eq 0 ]; then
    echo "✅ All verifications passed"
else
    echo "❌ Verification failed with code $exit_code"
    exit $exit_code
fi
```

## Acceptance Criteria Mapping

| Acceptance Criteria | Verification Script | Status Check |
|-------------------|-------------------|-------------|
| Data flows from sync worker to pipelines | `verify-data-flow.js` | Pipeline status |
| Data correctly stored in R2 with partitioning | `verify-data-flow.js` | Partition validation |
| File naming convention follows pattern | `verify-data-flow.js` | Naming pattern check |
| Data integrity verified | `data-integrity.js` | Checksum validation |
| Compression working correctly | `verify-data-flow.js` | Gzip validation |
| Batch timing verified | `batch-timing.js` | Interval analysis |
| Error scenarios tested and logged | `error-scenarios.js` | Error simulation |
| Performance metrics documented | `run-all-tests.js` | Metrics collection |

## Next Steps

After running verifications:

1. **Review Reports**: Check JSON reports for detailed analysis
2. **Address Failures**: Fix any identified issues
3. **Monitor Continuously**: Set up regular verification runs
4. **Update Documentation**: Keep verification criteria current
5. **Expand Testing**: Add new scenarios as system evolves