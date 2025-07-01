# Schema Versioning Strategy

This document outlines the versioning strategy for SF DBI data pipeline schemas to ensure backward compatibility, smooth upgrades, and proper data lineage tracking.

## Versioning Approach

### Semantic Versioning
All schemas follow semantic versioning (SemVer) with the format `MAJOR.MINOR.PATCH`:

- **MAJOR**: Breaking changes that require data migration or pipeline updates
- **MINOR**: New optional fields, enhancements, or non-breaking additions
- **PATCH**: Bug fixes, documentation updates, or clarifications

### Version Tracking
Every record includes a `schema_version` field that identifies the exact schema version used when the record was processed.

## Version Change Guidelines

### MAJOR Version Changes (X.0.0)
Trigger a major version change when:
- Removing required fields
- Changing data types of existing fields
- Renaming fields
- Changing field semantics or meaning
- Restructuring nested objects

**Impact**: Requires pipeline updates and potential data migration.

**Example**: Changing `permit_number` from string to object with sub-fields.

### MINOR Version Changes (X.Y.0)
Trigger a minor version change when:
- Adding new optional fields
- Adding new enum values
- Enhancing validation rules (making them more permissive)
- Adding new nested objects or arrays
- Expanding field documentation

**Impact**: Backward compatible, older pipeline versions can continue processing.

**Example**: Adding `environmental_impact_assessment` optional field to PermitRecord.

### PATCH Version Changes (X.Y.Z)
Trigger a patch version change when:
- Fixing documentation errors
- Correcting field descriptions
- Updating examples
- Fixing validation logic bugs
- Clarifying field usage

**Impact**: No data structure changes, purely informational.

**Example**: Correcting description of `pass_rate` field from "ratio" to "percentage".

## Schema Evolution Process

### 1. Proposal Phase
- Document proposed changes with rationale
- Assess impact on existing pipelines and data
- Determine appropriate version increment
- Create migration plan if needed

### 2. Development Phase
- Update TypeScript interfaces
- Update validation functions
- Create new sample data
- Update documentation
- Add migration scripts if needed

### 3. Testing Phase
- Validate against existing sample data
- Test with real pipeline data
- Verify backward compatibility
- Test migration procedures

### 4. Deployment Phase
- Update schema version constants
- Deploy new schema definitions
- Update pipeline configurations
- Execute data migration if needed
- Monitor for issues

## Backward Compatibility Strategy

### Reading Old Versions
Pipelines should be able to process records with older schema versions by:
- Providing default values for missing fields
- Handling deprecated fields gracefully
- Maintaining field mappings for renamed fields

### Writing New Versions
When creating new records:
- Always use the latest schema version
- Populate all required fields according to current schema
- Include migration metadata if record was upgraded

## Data Migration Approach

### Automatic Migration
For minor and patch versions:
- Records can be processed without migration
- Missing optional fields get default values
- Validation adapts to schema version

### Manual Migration
For major versions:
- Create migration scripts for each breaking change
- Batch process existing data
- Maintain audit trail of migrations
- Validate migrated data integrity

### Migration Metadata
Track migration history in records:
```json
{
  "schema_version": "2.0.0",
  "migration_history": [
    {
      "from_version": "1.2.0",
      "to_version": "2.0.0",
      "migration_date": "2024-06-15T10:00:00Z",
      "migration_script": "migrate_v1_to_v2.js"
    }
  ]
}
```

## Version Compatibility Matrix

### Current Support Policy
- **Active Support**: Current major version (all minor/patch versions)
- **Maintenance Support**: Previous major version (latest minor/patch only)
- **Deprecated**: Major versions older than previous (read-only, no updates)

### Pipeline Compatibility
| Pipeline Version | Schema v1.x | Schema v2.x | Schema v3.x |
|------------------|-------------|-------------|-------------|
| Pipeline v1.x    | ✅ Full     | ⚠️ Read-only | ❌ No       |
| Pipeline v2.x    | ✅ Full     | ✅ Full      | ⚠️ Read-only |
| Pipeline v3.x    | ⚠️ Read-only | ✅ Full      | ✅ Full      |

## Implementation Guidelines

### Schema Version Constants
```typescript
// Always update when schema changes
export const PERMIT_SCHEMA_VERSION = '1.0.0';
export const EVENT_SCHEMA_VERSION = '1.0.0';
export const INSPECTOR_ANALYTICS_SCHEMA_VERSION = '1.0.0';
```

### Version Validation
```typescript
function validateSchemaVersion(record: any, currentVersion: string): boolean {
  const recordVersion = record.schema_version;
  const [major, minor] = recordVersion.split('.').map(Number);
  const [currentMajor, currentMinor] = currentVersion.split('.').map(Number);
  
  // Same major version or previous major version
  return major === currentMajor || major === currentMajor - 1;
}
```

### Default Value Handling
```typescript
function applySchemaDefaults(record: any, schemaVersion: string): any {
  const version = parseVersion(schemaVersion);
  
  // Apply defaults based on version
  if (version.major === 1 && version.minor < 1) {
    record.data_quality_score = record.data_quality_score || 0;
  }
  
  return record;
}
```

## Change Documentation

### Change Log Format
Each schema version change should document:
- Version number and date
- Type of change (MAJOR/MINOR/PATCH)
- Description of changes
- Migration requirements
- Backward compatibility notes

### Example Change Log Entry
```
## Version 1.1.0 (2024-02-15)
**Type**: MINOR

**Changes**:
- Added optional `environmental_impact` field to PermitRecord
- Added `ENVIRONMENTAL` to PermitType enum
- Enhanced validation for geo-coordinates

**Migration**: None required (backward compatible)
**Compatibility**: Fully compatible with v1.0.x pipelines
```

## Testing Strategy

### Version Compatibility Tests
- Test processing of records with different schema versions
- Validate migration scripts with sample data
- Verify backward compatibility with existing pipelines

### Regression Testing
- Ensure new versions don't break existing functionality
- Test edge cases with mixed version datasets
- Validate data integrity across version boundaries

## Monitoring and Alerts

### Version Distribution Monitoring
Track distribution of schema versions in production:
- Percentage of records by schema version
- Alert on unexpected version patterns
- Monitor migration progress

### Compatibility Alerts
- Alert when deprecated versions exceed threshold
- Notify on schema validation failures
- Track migration success rates

## Future Considerations

### Schema Registry
Consider implementing a centralized schema registry for:
- Version management
- Compatibility checking
- Migration automation
- Documentation generation

### Automated Migration
Develop tools for:
- Automatic schema evolution detection
- Migration script generation
- Batch data processing
- Validation and rollback

This versioning strategy ensures the SF DBI data pipeline can evolve while maintaining data integrity and system reliability.