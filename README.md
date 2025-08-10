# SF DBI Data Pipeline

This repository contains helper scripts for setting up R2 buckets and Cloudflare Pipelines used by the San Francisco Department of Building Inspection data workflow.

## Requirements
- [Node.js](https://nodejs.org) 18+
- [`wrangler`](https://developers.cloudflare.com/workers/wrangler/) configured with your Cloudflare account credentials. The scripts will automatically install `wrangler` via `npx` if it is not already available.

## Setup
Install dependencies (none currently) and run the scripts using Node.js.

```
npm install
```

### Tests
This project has no automated tests yet. Running `npm test` will simply print a
message.

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

Both scripts wrap `wrangler` commands and will log errors if creation fails. They use `npx -y` to download `wrangler` automatically when it is not installed.

