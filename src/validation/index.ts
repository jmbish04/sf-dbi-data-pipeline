/**
 * SF DBI Data Pipeline Validation Functions
 * 
 * This module provides validation functions for all schema types
 * to ensure data quality and consistency.
 */

import {
  PermitRecord,
  EventRecord,
  InspectorAnalyticsRecord,
  PERMIT_REQUIRED_FIELDS,
  EVENT_REQUIRED_FIELDS,
  INSPECTOR_ANALYTICS_REQUIRED_FIELDS
} from '../schemas';

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  score: number; // 0-100 quality score
}

/**
 * Base validation for common fields across all schemas
 */
function validateCommonFields(record: any, requiredFields: readonly string[]): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check required fields
  for (const field of requiredFields) {
    if (record[field] === undefined || record[field] === null || record[field] === '') {
      errors.push(`Required field '${field}' is missing or empty`);
    }
  }
  
  // Validate ingestion_timestamp format
  if (record.ingestion_timestamp) {
    const timestamp = new Date(record.ingestion_timestamp);
    if (isNaN(timestamp.getTime())) {
      errors.push('ingestion_timestamp must be a valid ISO 8601 timestamp');
    }
  }
  
  // Validate source_system
  if (record.source_system && typeof record.source_system !== 'string') {
    errors.push('source_system must be a string');
  }
  
  // Validate raw_data exists
  if (record.raw_data && typeof record.raw_data !== 'object') {
    errors.push('raw_data must be an object');
  }
  
  // Validate schema_version format
  if (record.schema_version && !/^\d+\.\d+\.\d+$/.test(record.schema_version)) {
    warnings.push('schema_version should follow semantic versioning (x.y.z)');
  }
  
  // Calculate quality score
  const totalFields = requiredFields.length;
  const validFields = requiredFields.filter(field => 
    record[field] !== undefined && record[field] !== null && record[field] !== ''
  ).length;
  
  const score = Math.round((validFields / totalFields) * 100);
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    score
  };
}

/**
 * Validate permit record
 */
export function validatePermitRecord(record: Partial<PermitRecord>): ValidationResult {
  const baseResult = validateCommonFields(record, PERMIT_REQUIRED_FIELDS);
  
  // Additional permit-specific validations
  if (record.permit_number && typeof record.permit_number !== 'string') {
    baseResult.errors.push('permit_number must be a string');
  }
  
  if (record.permit_type && typeof record.permit_type !== 'string') {
    baseResult.errors.push('permit_type must be a string');
  }
  
  if (record.property_address && typeof record.property_address !== 'string') {
    baseResult.errors.push('property_address must be a string');
  }
  
  if (record.status && typeof record.status !== 'string') {
    baseResult.errors.push('status must be a string');
  }
  
  // Validate numeric fields
  if (record.estimated_cost !== undefined && (typeof record.estimated_cost !== 'number' || record.estimated_cost < 0)) {
    baseResult.errors.push('estimated_cost must be a non-negative number');
  }
  
  if (record.revised_cost !== undefined && (typeof record.revised_cost !== 'number' || record.revised_cost < 0)) {
    baseResult.errors.push('revised_cost must be a non-negative number');
  }
  
  // Validate coordinates
  if (record.latitude !== undefined && (typeof record.latitude !== 'number' || record.latitude < -90 || record.latitude > 90)) {
    baseResult.errors.push('latitude must be a number between -90 and 90');
  }
  
  if (record.longitude !== undefined && (typeof record.longitude !== 'number' || record.longitude < -180 || record.longitude > 180)) {
    baseResult.errors.push('longitude must be a number between -180 and 180');
  }
  
  // Validate date fields
  const dateFields = ['application_date', 'issued_date', 'completed_date', 'expiration_date'];
  for (const dateField of dateFields) {
    if (record[dateField as keyof PermitRecord] && !isValidDateString(record[dateField as keyof PermitRecord] as string)) {
      baseResult.warnings.push(`${dateField} should be a valid ISO 8601 date string`);
    }
  }
  
  return baseResult;
}

/**
 * Validate event record
 */
export function validateEventRecord(record: Partial<EventRecord>): ValidationResult {
  const baseResult = validateCommonFields(record, EVENT_REQUIRED_FIELDS);
  
  // Additional event-specific validations
  if (record.event_id && typeof record.event_id !== 'string') {
    baseResult.errors.push('event_id must be a string');
  }
  
  if (record.event_type && typeof record.event_type !== 'string') {
    baseResult.errors.push('event_type must be a string');
  }
  
  if (record.event_status && typeof record.event_status !== 'string') {
    baseResult.errors.push('event_status must be a string');
  }
  
  if (record.event_date && !isValidDateString(record.event_date)) {
    baseResult.errors.push('event_date must be a valid ISO 8601 date string');
  }
  
  // Validate numeric fields
  if (record.fee_amount !== undefined && (typeof record.fee_amount !== 'number' || record.fee_amount < 0)) {
    baseResult.errors.push('fee_amount must be a non-negative number');
  }
  
  // Validate arrays
  if (record.deficiencies && !Array.isArray(record.deficiencies)) {
    baseResult.errors.push('deficiencies must be an array');
  }
  
  if (record.corrections_required && !Array.isArray(record.corrections_required)) {
    baseResult.errors.push('corrections_required must be an array');
  }
  
  if (record.document_ids && !Array.isArray(record.document_ids)) {
    baseResult.errors.push('document_ids must be an array');
  }
  
  // Validate timestamp fields
  const timestampFields = ['event_timestamp', 'processing_timestamp'];
  for (const timestampField of timestampFields) {
    if (record[timestampField as keyof EventRecord] && !isValidTimestamp(record[timestampField as keyof EventRecord] as string)) {
      baseResult.warnings.push(`${timestampField} should be a valid ISO 8601 timestamp`);
    }
  }
  
  return baseResult;
}

/**
 * Validate inspector analytics record
 */
export function validateInspectorAnalyticsRecord(record: Partial<InspectorAnalyticsRecord>): ValidationResult {
  const baseResult = validateCommonFields(record, INSPECTOR_ANALYTICS_REQUIRED_FIELDS);
  
  // Additional analytics-specific validations
  if (record.analytics_id && typeof record.analytics_id !== 'string') {
    baseResult.errors.push('analytics_id must be a string');
  }
  
  if (record.inspector_id && typeof record.inspector_id !== 'string') {
    baseResult.errors.push('inspector_id must be a string');
  }
  
  if (record.reporting_period && typeof record.reporting_period !== 'string') {
    baseResult.errors.push('reporting_period must be a string');
  }
  
  if (record.aggregation_level && typeof record.aggregation_level !== 'string') {
    baseResult.errors.push('aggregation_level must be a string');
  }
  
  // Validate numeric fields
  const numericFields = [
    'total_inspections', 'completed_inspections', 'pass_rate', 'fail_rate',
    'building_inspections', 'electrical_inspections', 'plumbing_inspections',
    'mechanical_inspections', 'fire_safety_inspections', 'other_inspections'
  ];
  
  for (const field of numericFields) {
    const value = record[field as keyof InspectorAnalyticsRecord];
    if (value !== undefined && (typeof value !== 'number' || value < 0)) {
      baseResult.errors.push(`${field} must be a non-negative number`);
    }
  }
  
  // Validate percentage fields
  const percentageFields = ['pass_rate', 'fail_rate', 'reinspection_rate'];
  for (const field of percentageFields) {
    const value = record[field as keyof InspectorAnalyticsRecord];
    if (value !== undefined && (typeof value !== 'number' || value < 0 || value > 100)) {
      baseResult.errors.push(`${field} must be a number between 0 and 100`);
    }
  }
  
  // Validate arrays
  if (record.districts_covered && !Array.isArray(record.districts_covered)) {
    baseResult.errors.push('districts_covered must be an array');
  }
  
  if (record.neighborhoods_covered && !Array.isArray(record.neighborhoods_covered)) {
    baseResult.errors.push('neighborhoods_covered must be an array');
  }
  
  return baseResult;
}

/**
 * Helper function to validate date strings
 */
function isValidDateString(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && dateString.includes('-');
}

/**
 * Helper function to validate timestamp strings
 */
function isValidTimestamp(timestamp: string): boolean {
  const date = new Date(timestamp);
  return !isNaN(date.getTime()) && (timestamp.includes('T') || timestamp.includes(' '));
}

/**
 * Batch validation for multiple records
 */
export function validateRecords<T>(
  records: T[],
  validator: (record: T) => ValidationResult
): { results: ValidationResult[]; summary: { valid: number; invalid: number; avgScore: number } } {
  const results = records.map(validator);
  
  const valid = results.filter(r => r.isValid).length;
  const invalid = results.length - valid;
  const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
  
  return {
    results,
    summary: {
      valid,
      invalid,
      avgScore: Math.round(avgScore)
    }
  };
}