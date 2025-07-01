# SF DBI Data Pipeline

This repository contains standardized data schemas and helper scripts for the San Francisco Department of Building Inspection (SF DBI) data pipeline workflow.

## Features

- **Standardized Data Schemas**: TypeScript interfaces for permit records, events, and inspector analytics
- **Data Validation**: Comprehensive validation functions with quality scoring
- **Schema Versioning**: Semantic versioning strategy for schema evolution
- **Sample Data**: Representative test data for all schema types
- **Pipeline Setup**: Helper scripts for setting up R2 buckets and Cloudflare Pipelines

## Requirements
- [Node.js](https://nodejs.org) 18+
- [`wrangler`](https://developers.cloudflare.com/workers/wrangler/) configured with your Cloudflare account credentials (for pipeline setup)

## Installation

```bash
npm install
```

## Build

Compile TypeScript schemas and validation functions:

```bash
npm run build
```

## Schemas

The library provides three main schema types:

### Permit Records (`PermitRecord`)
Standardized structure for SF DBI building permits including:
- Core permit information (number, type, status)
- Applicant and property details
- Dates and geographical coordinates
- Cost estimates and descriptions

### Event Records (`EventRecord`)
Lifecycle events for permits and inspections including:
- Event identification and classification
- Inspector and inspection details
- Violations and corrections
- Document and photo references

### Inspector Analytics (`InspectorAnalyticsRecord`)
Performance metrics and workload analysis including:
- Inspection counts and success rates
- Time allocation and efficiency metrics
- Geographic coverage and specialization
- Training and development tracking

All schemas include standardized fields for:
- Data lineage (`ingestion_timestamp`, `source_system`)
- Quality tracking (`data_quality_score`, `validation_errors`)
- Raw data preservation (`raw_data`)
- Schema versioning (`schema_version`)

## Usage

```typescript
import { 
  PermitRecord, 
  EventRecord, 
  InspectorAnalyticsRecord,
  validatePermitRecord,
  validateEventRecord,
  validateInspectorAnalyticsRecord
} from 'sf-dbi-data-pipeline';

// Validate a permit record
const permitResult = validatePermitRecord(permitData);
if (permitResult.isValid) {
  console.log('Valid permit record');
} else {
  console.log('Validation errors:', permitResult.errors);
}
```

## Sample Data

Sample data files are provided in the `sample-data/` directory:
- `permit-records.json` - Example permit records
- `event-records.json` - Example event records  
- `inspector-analytics.json` - Example analytics records

## Documentation

Comprehensive documentation is available in the `docs/` directory:
- `docs/schemas/README.md` - Detailed schema documentation
- `docs/SCHEMA_VERSIONING.md` - Schema versioning strategy

## Pipeline Setup

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

Both scripts simply wrap `wrangler` commands and will log errors if creation fails.

## Schema Versioning

The schemas follow semantic versioning (major.minor.patch):
- **Major**: Breaking changes requiring data migration
- **Minor**: New optional fields or enhancements
- **Patch**: Bug fixes or documentation updates

Current schema versions:
- Permit Record: 1.0.0
- Event Record: 1.0.0
- Inspector Analytics: 1.0.0

See `docs/SCHEMA_VERSIONING.md` for the complete versioning strategy.

## Testing

Run the schema validation test:

```bash
node test-schemas.js
```

This validates all sample data against the schemas and reports any issues.

## License

ISC

