# SF DBI Data Pipeline

This repository contains helper scripts for setting up R2 buckets and Cloudflare Pipelines used by the San Francisco Department of Building Inspection data workflow, along with comprehensive verification tools for validating data flow and integrity.

## Requirements
- [Node.js](https://nodejs.org) 18+
- [`wrangler`](https://developers.cloudflare.com/workers/wrangler/) configured with your Cloudflare account credentials

## Setup
Install dependencies (none currently) and run the scripts using Node.js.

```
npm install
```

### Create R2 Buckets
Run `scripts/create_r2_buckets.js` to create the required R2 buckets.

```
node scripts/create_r2_buckets.js
```

### Create Pipelines
Run `scripts/create_pipelines.js` to create the Cloudflare Pipelines.

```
node scripts/create_pipelines.js
```

Both scripts simply wrap `wrangler` commands and will log errors if creation fails.

## Data Flow Verification (Phase 1 Task 7)

The repository includes a comprehensive verification suite to validate end-to-end data flow from DataSF APIs through pipelines to R2 storage.

### Quick Verification
Run all verification tests:
```
node verification/run-all-tests.js --verbose
```

For staging environment:
```
node verification/run-all-tests.js --staging --verbose
```

### Individual Verifications
- **Data Flow**: `node verification/verify-data-flow.js`
- **Data Integrity**: `node verification/utils/data-integrity.js`
- **Batch Timing**: `node verification/utils/batch-timing.js`
- **Error Scenarios**: `node verification/utils/error-scenarios.js`

### Verification Features
- ✅ Pipeline status and configuration validation
- ✅ R2 storage and partitioning verification
- ✅ File naming convention compliance
- ✅ Data integrity and compression checks
- ✅ Batch timing interval validation
- ✅ Error scenario testing and logging
- ✅ Performance metrics collection

See [verification/README.md](verification/README.md) for detailed documentation.

