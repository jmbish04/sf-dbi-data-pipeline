/**
 * SF DBI Data Pipeline - Main Export
 * 
 * This is the main entry point for the SF DBI data pipeline schema library.
 * It exports all schemas, validation functions, and utilities.
 */

// Export all schemas
export * from './schemas';

// Export validation functions  
export * from './validation';

// Re-export key types for convenience
export type {
  PermitRecord,
  EventRecord,
  InspectorAnalyticsRecord
} from './schemas';

export type { ValidationResult } from './validation';