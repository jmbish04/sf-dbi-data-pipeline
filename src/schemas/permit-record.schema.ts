/**
 * SF DBI Permit Record Schema
 * 
 * This schema defines the standardized structure for permit records
 * processed through the SF DBI data pipeline.
 */

/**
 * Permit record interface with all required and optional fields
 */
export interface PermitRecord {
  // Core permit identifiers
  permit_number: string;
  application_number?: string;
  
  // Permit classification
  permit_type: string;
  permit_subtype?: string;
  work_type?: string;
  
  // Applicant information
  applicant_name?: string;
  applicant_address?: string;
  applicant_phone?: string;
  applicant_email?: string;
  
  // Property information
  property_address: string;
  block?: string;
  lot?: string;
  assessor_parcel_number?: string;
  
  // Permit details
  description?: string;
  estimated_cost?: number;
  revised_cost?: number;
  existing_use?: string;
  proposed_use?: string;
  
  // Status and dates
  status: string;
  application_date?: string;
  issued_date?: string;
  completed_date?: string;
  expiration_date?: string;
  
  // Location coordinates
  latitude?: number;
  longitude?: number;
  
  // Standardized pipeline fields
  ingestion_timestamp: string; // ISO 8601 timestamp
  source_system: string; // Source system identifier
  source_file?: string; // Original file name
  source_record_id?: string; // Original record identifier
  raw_data: Record<string, any>; // Preserved original data
  schema_version: string; // Schema version for compatibility
  
  // Data quality indicators
  data_quality_score?: number; // 0-100 quality score
  validation_errors?: string[]; // Any validation issues
  
  // Pipeline metadata
  pipeline_run_id?: string; // Unique pipeline execution ID
  processing_timestamp?: string; // When record was processed
}

/**
 * Permit status enumeration
 */
export enum PermitStatus {
  FILED = 'FILED',
  ISSUED = 'ISSUED',
  APPROVED = 'APPROVED',
  COMPLETE = 'COMPLETE',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
  SUSPENDED = 'SUSPENDED',
  WITHDRAWN = 'WITHDRAWN'
}

/**
 * Permit type enumeration
 */
export enum PermitType {
  BUILDING = 'BUILDING',
  ELECTRICAL = 'ELECTRICAL',
  PLUMBING = 'PLUMBING',
  MECHANICAL = 'MECHANICAL',
  DEMOLITION = 'DEMOLITION',
  ALTERATION = 'ALTERATION',
  ADDITION = 'ADDITION',
  NEW_CONSTRUCTION = 'NEW_CONSTRUCTION',
  SIGN = 'SIGN',
  TEMPORARY = 'TEMPORARY'
}

/**
 * Required fields for permit record validation
 */
export const PERMIT_REQUIRED_FIELDS = [
  'permit_number',
  'permit_type',
  'property_address',
  'status',
  'ingestion_timestamp',
  'source_system',
  'raw_data',
  'schema_version'
] as const;

/**
 * Current schema version
 */
export const PERMIT_SCHEMA_VERSION = '1.0.0';