# SF DBI Data Pipeline

This repository contains helper scripts for setting up R2 buckets and Cloudflare Pipelines used by the San Francisco Department of Building Inspection data workflow, along with a permit sync pipeline worker.

## Components

### Infrastructure Scripts
- R2 bucket creation for data storage
- Cloudflare Pipeline creation for data processing

### Permit Sync Pipeline Worker
A Cloudflare Worker that processes permit data and publishes it to appropriate pipelines with fallback to D1 database.

## Requirements
- [Node.js](https://nodejs.org) 18+
- [`wrangler`](https://developers.cloudflare.com/workers/wrangler/) configured with your Cloudflare account credentials

## Setup

### Install Dependencies
```bash
npm install
```

### Create R2 Buckets
Run `scripts/create_r2_buckets.js` to create the required R2 buckets.

```bash
node scripts/create_r2_buckets.js
```

### Create Pipelines
Run `scripts/create_pipelines.js` to create the Cloudflare Pipelines.

```bash
node scripts/create_pipelines.js
```

### Set up D1 Database
Create a D1 database for fallback storage:

```bash
npx wrangler d1 create sf-permits-db
```

Update the `database_id` in `wrangler.toml` with the ID from the command output, then run migrations:

```bash
npx wrangler d1 migrations apply sf-permits-db --local
```

## Development

### Build the Worker
```bash
npm run build
```

### Run Tests
```bash
npm test
```

### Deploy the Worker
```bash
npm run deploy
```

### Local Development
```bash
npm run dev
```

## Permit Sync Pipeline Worker

The worker processes permit data through three main pipelines:

1. **sf-permits-ingestion**: Raw permit data ingestion
2. **sf-permit-events**: Permit lifecycle events
3. **sf-inspector-analytics**: Analytics data for inspectors

### Features

- **Data Validation**: Validates permit data before processing
- **Multiple Pipeline Support**: Sends data to appropriate pipelines based on content
- **Fallback Mechanism**: Falls back to D1 database if pipelines are unavailable
- **Error Handling**: Comprehensive error handling with detailed logging
- **Monitoring**: Built-in logging and monitoring capabilities

### API Endpoint

**POST** `/`
- Content-Type: `application/json`
- Body: Permit data object (see example below)

### Example Usage

```javascript
const permitData = {
  id: 'PERM-123456',
  application_number: 'APP-2023-001',
  permit_type: 'Building',
  status: 'Issued',
  filed_date: '2023-01-15T00:00:00Z',
  description: 'Residential renovation project',
  location: {
    address: '123 Main St, San Francisco, CA',
    block: '1234',
    lot: '056',
    zipcode: '94102'
  }
  // ... additional fields
};

const response = await fetch('https://your-worker.workers.dev', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(permitData)
});
```

### Configuration

Update `wrangler.toml` with your specific:
- Pipeline names and bindings
- D1 database ID
- Environment variables

Both scripts simply wrap `wrangler` commands and will log errors if creation fails.

