/**
 * SF DBI Data Pipeline Schema Index
 * 
 * This module exports all standardized data schemas for the
 * San Francisco Department of Building Inspection data pipeline.
 */

// Permit Record Schema
export {
  PermitRecord,
  PermitStatus,
  PermitType,
  PERMIT_REQUIRED_FIELDS,
  PERMIT_SCHEMA_VERSION
} from './permit-record.schema';

// Event Record Schema
export {
  EventRecord,
  EventType,
  EventStatus,
  InspectionResult,
  EVENT_REQUIRED_FIELDS,
  EVENT_SCHEMA_VERSION
} from './event-record.schema';

// Inspector Analytics Schema
export {
  InspectorAnalyticsRecord,
  ReportingPeriod,
  InspectorDepartment,
  PerformanceRating,
  WorkloadStatus,
  INSPECTOR_ANALYTICS_REQUIRED_FIELDS,
  INSPECTOR_ANALYTICS_SCHEMA_VERSION
} from './inspector-analytics.schema';

// Import schema versions for the registry
import { PERMIT_SCHEMA_VERSION } from './permit-record.schema';
import { EVENT_SCHEMA_VERSION } from './event-record.schema';
import { INSPECTOR_ANALYTICS_SCHEMA_VERSION } from './inspector-analytics.schema';
import { PERMIT_REQUIRED_FIELDS } from './permit-record.schema';
import { EVENT_REQUIRED_FIELDS } from './event-record.schema';
import { INSPECTOR_ANALYTICS_REQUIRED_FIELDS } from './inspector-analytics.schema';

// Import types for the union type
import type { PermitRecord } from './permit-record.schema';
import type { EventRecord } from './event-record.schema';
import type { InspectorAnalyticsRecord } from './inspector-analytics.schema';

/**
 * All schema versions for version management
 */
export const SCHEMA_VERSIONS = {
  PERMIT_RECORD: PERMIT_SCHEMA_VERSION,
  EVENT_RECORD: EVENT_SCHEMA_VERSION,
  INSPECTOR_ANALYTICS: INSPECTOR_ANALYTICS_SCHEMA_VERSION
} as const;

/**
 * Schema types union for type safety
 */
export type SchemaRecord = PermitRecord | EventRecord | InspectorAnalyticsRecord;

/**
 * Schema metadata for pipeline configuration
 */
export interface SchemaMetadata {
  name: string;
  version: string;
  description: string;
  requiredFields: readonly string[];
  lastUpdated: string;
}

/**
 * Schema registry with metadata
 */
export const SCHEMA_REGISTRY: Record<string, SchemaMetadata> = {
  PERMIT_RECORD: {
    name: 'PermitRecord',
    version: PERMIT_SCHEMA_VERSION,
    description: 'Standardized schema for SF DBI permit records',
    requiredFields: PERMIT_REQUIRED_FIELDS,
    lastUpdated: '2024-01-01'
  },
  EVENT_RECORD: {
    name: 'EventRecord', 
    version: EVENT_SCHEMA_VERSION,
    description: 'Standardized schema for permit and inspection events',
    requiredFields: EVENT_REQUIRED_FIELDS,
    lastUpdated: '2024-01-01'
  },
  INSPECTOR_ANALYTICS: {
    name: 'InspectorAnalyticsRecord',
    version: INSPECTOR_ANALYTICS_SCHEMA_VERSION,
    description: 'Standardized schema for inspector performance analytics',
    requiredFields: INSPECTOR_ANALYTICS_REQUIRED_FIELDS,
    lastUpdated: '2024-01-01'
  }
} as const;