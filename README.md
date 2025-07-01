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
Run `scripts/create_r2_buckets.js` to create the required R2 buckets with proper naming convention, lifecycle policies, and permissions configuration.

```bash
# Production mode (requires CLOUDFLARE_API_TOKEN)
node scripts/create_r2_buckets.js

# Dry-run mode (for testing and configuration preview)
DRY_RUN=true node scripts/create_r2_buckets.js
```

#### Buckets Created
- **sf-permits-data**: Primary permit data storage (365-day retention)
- **sf-permit-events**: Event tracking and audit logs (180-day retention)  
- **sf-inspector-data**: Inspector analytics and reporting (730-day retention)
- **sf-processed-files**: Pipeline processing metadata (90-day retention)

#### Configuration
Bucket configurations are defined in `scripts/r2-bucket-config.json`:
- Lifecycle policies with multi-tier storage (hot/warm/cold)
- Required API permissions for pipeline access  
- Naming convention: `sf-{data-type}-{environment}`

### Create Pipelines
Run `scripts/create_pipelines.js` to create the Cloudflare Pipelines.

```
node scripts/create_pipelines.js
```

Both scripts simply wrap `wrangler` commands and will log errors if creation fails.

## Environment Variables
- `CLOUDFLARE_API_TOKEN`: Required for production bucket/pipeline creation
- `DRY_RUN`: Set to 'true' for testing mode without actual resource creation

