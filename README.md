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

## Permit Events Pipeline

The `sf-permit-events` pipeline is configured for real-time processing of permit status changes, inspector assignments, and permit lifecycle events.

### Configuration
- **Batch interval**: 30 seconds (near real-time processing)
- **Batch size**: 25 MB maximum
- **Shards**: 2 (for event volume handling)
- **Compression**: gzip
- **R2 bucket**: sf-permit-events

### Documentation
- [Event Schema](./docs/permit-events-schema.md) - Required fields and event types
- [Integration Endpoints](./docs/integration-endpoints.md) - API endpoints and usage examples

### Testing
Run the validation test to ensure proper configuration:

```
node test-permit-events.js
```

### Sample Data
Sample permit events are provided in `sample-data/permit-events.json` for testing and integration development.

