/**
 * SF DBI Event Record Schema
 * 
 * This schema defines the standardized structure for event records
 * that track lifecycle events for permits and inspections.
 */

/**
 * Event record interface for tracking permit and inspection events
 */
export interface EventRecord {
  // Event identifiers
  event_id: string;
  event_type: string;
  event_subtype?: string;
  
  // Related entity information
  permit_number?: string;
  inspection_id?: string;
  application_number?: string;
  
  // Event details
  event_description?: string;
  event_status: string;
  event_outcome?: string;
  
  // Timing information
  event_date: string; // ISO 8601 date
  event_timestamp?: string; // ISO 8601 timestamp with time
  scheduled_date?: string;
  completed_date?: string;
  
  // Personnel information
  inspector_id?: string;
  inspector_name?: string;
  staff_member?: string;
  
  // Location information
  property_address?: string;
  inspection_location?: string;
  
  // Event-specific data
  inspection_type?: string;
  inspection_result?: string;
  deficiencies?: string[];
  corrections_required?: string[];
  notes?: string;
  
  // Fees and costs
  fee_amount?: number;
  payment_status?: string;
  payment_date?: string;
  
  // Document references
  document_ids?: string[];
  photo_ids?: string[];
  
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
  
  // Relationships
  parent_event_id?: string; // For related/follow-up events
  related_event_ids?: string[]; // Other related events
}

/**
 * Event type enumeration
 */
export enum EventType {
  PERMIT_APPLICATION = 'PERMIT_APPLICATION',
  PERMIT_ISSUANCE = 'PERMIT_ISSUANCE',
  PERMIT_APPROVAL = 'PERMIT_APPROVAL',
  PERMIT_RENEWAL = 'PERMIT_RENEWAL',
  PERMIT_CANCELLATION = 'PERMIT_CANCELLATION',
  PERMIT_EXPIRATION = 'PERMIT_EXPIRATION',
  INSPECTION_SCHEDULED = 'INSPECTION_SCHEDULED',
  INSPECTION_CONDUCTED = 'INSPECTION_CONDUCTED',
  INSPECTION_COMPLETED = 'INSPECTION_COMPLETED',
  INSPECTION_FAILED = 'INSPECTION_FAILED',
  INSPECTION_PASSED = 'INSPECTION_PASSED',
  REINSPECTION_REQUIRED = 'REINSPECTION_REQUIRED',
  VIOLATION_ISSUED = 'VIOLATION_ISSUED',
  VIOLATION_RESOLVED = 'VIOLATION_RESOLVED',
  FEE_PAYMENT = 'FEE_PAYMENT',
  DOCUMENT_SUBMISSION = 'DOCUMENT_SUBMISSION',
  STATUS_CHANGE = 'STATUS_CHANGE',
  CORRECTION_REQUEST = 'CORRECTION_REQUEST',
  FINAL_APPROVAL = 'FINAL_APPROVAL'
}

/**
 * Event status enumeration
 */
export enum EventStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED',
  PENDING = 'PENDING',
  OVERDUE = 'OVERDUE'
}

/**
 * Inspection result enumeration
 */
export enum InspectionResult {
  PASS = 'PASS',
  FAIL = 'FAIL',
  PARTIAL = 'PARTIAL',
  NO_ACCESS = 'NO_ACCESS',
  CANCELLED = 'CANCELLED',
  PENDING = 'PENDING'
}

/**
 * Required fields for event record validation
 */
export const EVENT_REQUIRED_FIELDS = [
  'event_id',
  'event_type',
  'event_status',
  'event_date',
  'ingestion_timestamp',
  'source_system',
  'raw_data',
  'schema_version'
] as const;

/**
 * Current schema version
 */
export const EVENT_SCHEMA_VERSION = '1.0.0';