# SF DBI Data Pipeline

This repository contains helper scripts for setting up R2 buckets and Cloudflare Pipelines used by the San Francisco Department of Building Inspection data workflow.

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

## Pipeline Endpoints

After successful creation, the pipelines will be available at the following endpoints:

### sf-permits-ingestion Pipeline
- **Endpoint URL**: `https://api.cloudflare.com/client/v4/pipelines/sf-permits-ingestion`
- **Configuration**: 
  - Batch interval: 60 seconds
  - Batch size: 50 MB max
  - Compression: gzip
  - Shards: 3
  - R2 bucket: sf-permits-data

### Health Check
Run the health check script to verify pipeline status:
```
node scripts/health_check.js
```

## Testing

Run the test suite to verify pipeline configuration:
```
npm test
```

This will validate that all pipeline configurations meet the requirements including:
- Correct pipeline names and settings
- Proper batch intervals and compression
- Shard configuration
- Documentation completeness

