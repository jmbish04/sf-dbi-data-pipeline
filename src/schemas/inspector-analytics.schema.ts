/**
 * SF DBI Inspector Analytics Schema
 * 
 * This schema defines the standardized structure for inspector analytics
 * used to track performance metrics and workload analysis.
 */

/**
 * Inspector analytics record interface
 */
export interface InspectorAnalyticsRecord {
  // Analytics identifiers
  analytics_id: string;
  reporting_period: string; // YYYY-MM or YYYY-MM-DD
  
  // Inspector information
  inspector_id: string;
  inspector_name?: string;
  inspector_badge?: string;
  department?: string;
  team?: string;
  
  // Workload metrics
  total_inspections: number;
  scheduled_inspections: number;
  completed_inspections: number;
  cancelled_inspections: number;
  no_access_inspections: number;
  
  // Performance metrics
  pass_rate: number; // Percentage (0-100)
  fail_rate: number; // Percentage (0-100)
  avg_inspection_duration?: number; // Minutes
  total_inspection_time?: number; // Minutes
  
  // Inspection type breakdown
  building_inspections: number;
  electrical_inspections: number;
  plumbing_inspections: number;
  mechanical_inspections: number;
  fire_safety_inspections: number;
  other_inspections: number;
  
  // Quality metrics
  reinspection_rate: number; // Percentage (0-100)
  complaint_inspections: number;
  emergency_inspections: number;
  follow_up_inspections: number;
  
  // Geographical coverage
  districts_covered?: string[];
  neighborhoods_covered?: string[];
  total_locations_visited: number;
  
  // Efficiency metrics
  inspections_per_day?: number;
  travel_time_percentage?: number; // Percentage of day spent traveling
  administrative_time_percentage?: number; // Percentage of day on admin tasks
  
  // Violation and enforcement
  violations_issued: number;
  violations_resolved: number;
  stop_work_orders: number;
  citations_issued: number;
  
  // Permit related
  permit_reviews: number;
  plan_reviews: number;
  final_approvals: number;
  
  // Training and development
  training_hours?: number;
  certifications_earned?: string[];
  continuing_education_credits?: number;
  
  // Workload distribution
  overtime_hours?: number;
  weekend_inspections?: number;
  after_hours_inspections?: number;
  
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
  data_completeness?: number; // Percentage of fields populated
  
  // Pipeline metadata
  pipeline_run_id?: string; // Unique pipeline execution ID
  processing_timestamp?: string; // When record was processed
  
  // Aggregation metadata
  aggregation_level: string; // daily, weekly, monthly, quarterly, yearly
  calculation_method?: string; // How metrics were calculated
  baseline_period?: string; // Comparison period for metrics
  
  // Performance indicators
  performance_score?: number; // Overall performance score (0-100)
  efficiency_rating?: string; // HIGH, MEDIUM, LOW
  workload_status?: string; // OVERLOADED, NORMAL, UNDERUTILIZED
}

/**
 * Reporting period enumeration
 */
export enum ReportingPeriod {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY'
}

/**
 * Inspector department enumeration
 */
export enum InspectorDepartment {
  BUILDING_INSPECTION = 'BUILDING_INSPECTION',
  ELECTRICAL = 'ELECTRICAL',
  PLUMBING = 'PLUMBING',
  MECHANICAL = 'MECHANICAL',
  FIRE_SAFETY = 'FIRE_SAFETY',
  CODE_ENFORCEMENT = 'CODE_ENFORCEMENT',
  PLAN_REVIEW = 'PLAN_REVIEW'
}

/**
 * Performance rating enumeration
 */
export enum PerformanceRating {
  EXCELLENT = 'EXCELLENT',
  GOOD = 'GOOD',
  SATISFACTORY = 'SATISFACTORY',
  NEEDS_IMPROVEMENT = 'NEEDS_IMPROVEMENT',
  UNSATISFACTORY = 'UNSATISFACTORY'
}

/**
 * Workload status enumeration
 */
export enum WorkloadStatus {
  OVERLOADED = 'OVERLOADED',
  HIGH = 'HIGH',
  NORMAL = 'NORMAL',
  LOW = 'LOW',
  UNDERUTILIZED = 'UNDERUTILIZED'
}

/**
 * Required fields for inspector analytics validation
 */
export const INSPECTOR_ANALYTICS_REQUIRED_FIELDS = [
  'analytics_id',
  'reporting_period',
  'inspector_id',
  'total_inspections',
  'completed_inspections',
  'pass_rate',
  'fail_rate',
  'aggregation_level',
  'ingestion_timestamp',
  'source_system',
  'raw_data',
  'schema_version'
] as const;

/**
 * Current schema version
 */
export const INSPECTOR_ANALYTICS_SCHEMA_VERSION = '1.0.0';