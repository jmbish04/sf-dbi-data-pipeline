# SF DBI Data Pipeline Schema Documentation

This document provides comprehensive documentation for all standardized data schemas used in the San Francisco Department of Building Inspection (SF DBI) data pipeline.

## Overview

The SF DBI data pipeline processes three main types of records:
- **Permit Records**: Core permit data from the DBI permit system
- **Event Records**: Lifecycle events for permits and inspections
- **Inspector Analytics**: Performance metrics and workload analysis

All schemas include standardized fields for data lineage, quality tracking, and pipeline metadata.

## Common Schema Elements

All schemas include these standardized pipeline fields:

### Required Pipeline Fields
- `ingestion_timestamp` (string): ISO 8601 timestamp when data was ingested
- `source_system` (string): Identifier for the source system (e.g., "DBI_PERMITS_API")
- `raw_data` (object): Preserved original data structure
- `schema_version` (string): Schema version in semantic versioning format (x.y.z)

### Optional Pipeline Fields
- `source_file` (string): Original file name if applicable
- `source_record_id` (string): Original record identifier from source system
- `data_quality_score` (number): Quality score from 0-100
- `validation_errors` (string[]): Array of validation error messages
- `pipeline_run_id` (string): Unique identifier for pipeline execution
- `processing_timestamp` (string): ISO 8601 timestamp when record was processed

## Permit Record Schema

The PermitRecord interface represents individual building permits issued by SF DBI.

### Required Fields
- `permit_number` (string): Unique permit identifier
- `permit_type` (string): Type of permit (BUILDING, ELECTRICAL, PLUMBING, etc.)
- `property_address` (string): Address where work is being performed
- `status` (string): Current permit status
- Standard pipeline fields: `ingestion_timestamp`, `source_system`, `raw_data`, `schema_version`

### Key Optional Fields
- `application_number` (string): Related application number
- `applicant_name` (string): Name of permit applicant
- `description` (string): Description of work to be performed
- `estimated_cost` (number): Estimated cost of work
- `application_date`, `issued_date`, `completed_date`, `expiration_date` (string): Key dates in ISO 8601 format
- `latitude`, `longitude` (number): Geographic coordinates
- `block`, `lot`, `assessor_parcel_number` (string): Property identifiers

### Enumerations
- `PermitStatus`: FILED, ISSUED, APPROVED, COMPLETE, CANCELLED, EXPIRED, SUSPENDED, WITHDRAWN
- `PermitType`: BUILDING, ELECTRICAL, PLUMBING, MECHANICAL, DEMOLITION, ALTERATION, ADDITION, NEW_CONSTRUCTION, SIGN, TEMPORARY

### Example
```json
{
  "permit_number": "2024-001234",
  "permit_type": "BUILDING",
  "property_address": "456 Mission St, San Francisco, CA 94105",
  "status": "ISSUED",
  "applicant_name": "John Smith Construction",
  "description": "Kitchen remodel including electrical and plumbing updates",
  "estimated_cost": 75000,
  "application_date": "2024-01-15",
  "issued_date": "2024-02-01",
  "ingestion_timestamp": "2024-01-20T10:30:00Z",
  "source_system": "DBI_PERMITS_API",
  "raw_data": { "original_permit_num": "2024-001234" },
  "schema_version": "1.0.0"
}
```

## Event Record Schema

The EventRecord interface captures lifecycle events for permits and inspections.

### Required Fields
- `event_id` (string): Unique event identifier
- `event_type` (string): Type of event (see EventType enum)
- `event_status` (string): Current status of the event
- `event_date` (string): Date when event occurred (ISO 8601)
- Standard pipeline fields: `ingestion_timestamp`, `source_system`, `raw_data`, `schema_version`

### Key Optional Fields
- `permit_number`, `inspection_id`, `application_number` (string): Related entity identifiers
- `inspector_id`, `inspector_name` (string): Inspector information
- `inspection_type`, `inspection_result` (string): Inspection details
- `deficiencies`, `corrections_required` (string[]): Arrays of issues and required fixes
- `fee_amount` (number): Associated fees
- `document_ids`, `photo_ids` (string[]): Related document references

### Event Types
- Permit events: PERMIT_APPLICATION, PERMIT_ISSUANCE, PERMIT_APPROVAL, PERMIT_RENEWAL
- Inspection events: INSPECTION_SCHEDULED, INSPECTION_CONDUCTED, INSPECTION_COMPLETED
- Violation events: VIOLATION_ISSUED, VIOLATION_RESOLVED
- Administrative: FEE_PAYMENT, DOCUMENT_SUBMISSION, STATUS_CHANGE

### Example
```json
{
  "event_id": "evt_2024_001",
  "event_type": "INSPECTION_CONDUCTED",
  "event_status": "COMPLETED",
  "event_date": "2024-01-30",
  "permit_number": "2024-001234",
  "inspector_id": "INS_002",
  "inspector_name": "Sarah Chen",
  "inspection_type": "FINAL",
  "inspection_result": "PASS",
  "ingestion_timestamp": "2024-01-20T10:30:00Z",
  "source_system": "DBI_EVENTS_API",
  "raw_data": { "inspection_duration": 45 },
  "schema_version": "1.0.0"
}
```

## Inspector Analytics Schema

The InspectorAnalyticsRecord interface provides performance metrics and workload analysis.

### Required Fields
- `analytics_id` (string): Unique analytics record identifier
- `reporting_period` (string): Period covered (YYYY-MM or YYYY-MM-DD)
- `inspector_id` (string): Inspector identifier
- `total_inspections` (number): Total inspections in period
- `completed_inspections` (number): Successfully completed inspections
- `pass_rate`, `fail_rate` (number): Success/failure percentages (0-100)
- `aggregation_level` (string): Time period aggregation (daily, weekly, monthly, etc.)
- Standard pipeline fields: `ingestion_timestamp`, `source_system`, `raw_data`, `schema_version`

### Key Metrics Categories

#### Workload Metrics
- `scheduled_inspections`, `cancelled_inspections`, `no_access_inspections` (number)
- `avg_inspection_duration`, `total_inspection_time` (number): Time in minutes

#### Performance Metrics
- `reinspection_rate` (number): Percentage requiring re-inspection
- `violations_issued`, `violations_resolved` (number): Enforcement actions
- `performance_score` (number): Overall performance score (0-100)

#### Inspection Type Breakdown
- `building_inspections`, `electrical_inspections`, `plumbing_inspections` (number)
- `mechanical_inspections`, `fire_safety_inspections`, `other_inspections` (number)

#### Geographic and Efficiency
- `districts_covered`, `neighborhoods_covered` (string[]): Areas served
- `inspections_per_day` (number): Daily productivity
- `travel_time_percentage`, `administrative_time_percentage` (number): Time allocation

### Example
```json
{
  "analytics_id": "analytics_2024_01_001",
  "reporting_period": "2024-01",
  "inspector_id": "INS_001",
  "inspector_name": "Bob Wilson",
  "total_inspections": 85,
  "completed_inspections": 85,
  "pass_rate": 78.8,
  "fail_rate": 21.2,
  "aggregation_level": "monthly",
  "electrical_inspections": 65,
  "building_inspections": 10,
  "inspections_per_day": 4.25,
  "ingestion_timestamp": "2024-02-01T08:00:00Z",
  "source_system": "DBI_ANALYTICS_API",
  "raw_data": { "performance_rating": "GOOD" },
  "schema_version": "1.0.0"
}
```

## Data Quality and Validation

All schemas support data quality tracking through:
- `data_quality_score`: Automated quality assessment (0-100)
- `validation_errors`: Array of validation issues
- `data_completeness`: Percentage of fields populated (for analytics)

Validation functions are provided for each schema type to ensure data integrity.

## Schema Versioning

All schemas use semantic versioning (major.minor.patch):
- Major: Breaking changes to required fields or data types
- Minor: New optional fields or enhancements
- Patch: Bug fixes or documentation updates

Current versions:
- Permit Record: 1.0.0
- Event Record: 1.0.0
- Inspector Analytics: 1.0.0