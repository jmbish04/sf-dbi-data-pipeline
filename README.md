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

## Inspector Analytics Pipeline

The `sf-inspector-analytics` pipeline is configured for tracking inspector performance metrics, workload distribution, and processing patterns with the following specifications:

- **Batch interval**: 5 minutes (300 seconds) for analytics aggregation
- **Batch size**: 100 MB maximum
- **Shards**: Single shard for inspector metrics volume
- **Compression**: gzip compression enabled
- **Storage**: `sf-inspector-data` R2 bucket

### Analytics Schema

The inspector analytics data follows a defined schema located in `schemas/inspector-analytics-schema.json`. The schema includes:

- **Performance metrics**: Inspections completed, average time, on-time rates
- **Workload distribution**: Inspection types, geographic zones, peak hours
- **Processing patterns**: Approval rates, violation types, follow-up requirements
- **Privacy metadata**: Anonymization flags, retention periods, geographic precision

### Privacy Considerations

Comprehensive privacy measures are documented in `docs/privacy-considerations.md`, including:

- Data minimization and anonymization practices
- Retention policies and automatic purging
- Access controls and audit logging
- Compliance with CCPA and local regulations

### Sample Data Verification

To verify the pipeline setup and data format:

```
npm run verify-sample-data
```

This command validates sample inspector analytics data against the defined schema and provides a summary of analytics metrics.

