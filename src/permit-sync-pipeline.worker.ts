/**
 * Permit Sync Pipeline Worker
 * 
 * This worker processes permit data and publishes it to appropriate pipelines,
 * with fallback to D1 database if pipelines are unavailable.
 */

// Pipeline interface for Cloudflare Pipelines
export interface Pipeline {
  send(data: any): Promise<void>;
}

export interface Env {
  // Pipeline bindings
  SF_PERMITS_INGESTION: Pipeline;
  SF_PERMIT_EVENTS: Pipeline;
  SF_INSPECTOR_ANALYTICS: Pipeline;
  
  // D1 database fallback
  DB: D1Database;
  
  // Environment variables
  ENVIRONMENT: string;
  LOG_LEVEL: string;
}

// Data interfaces
export interface PermitData {
  id: string;
  application_number: string;
  permit_type: string;
  status: string;
  filed_date: string;
  issued_date?: string;
  completed_date?: string;
  description: string;
  estimated_cost?: number;
  revised_cost?: number;
  existing_use?: string;
  proposed_use?: string;
  plansets?: number;
  location: {
    address: string;
    block: string;
    lot: string;
    zipcode: string;
  };
  contact_info?: {
    applicant_name: string;
    applicant_address?: string;
  };
  inspector_info?: {
    inspector_name?: string;
    inspection_date?: string;
    inspection_status?: string;
  };
}

export interface PipelinePayload {
  data: any;
  metadata: {
    timestamp: string;
    source: string;
    version: string;
    pipeline_target: string;
  };
}

// Logging utility
class Logger {
  private logLevel: string;
  
  constructor(logLevel: string = 'info') {
    this.logLevel = logLevel.toLowerCase();
  }
  
  private shouldLog(level: string): boolean {
    const levels = ['error', 'warn', 'info', 'debug'];
    return levels.indexOf(level) <= levels.indexOf(this.logLevel);
  }
  
  error(message: string, data?: any) {
    if (this.shouldLog('error')) {
      console.error(`[ERROR] ${message}`, data || '');
    }
  }
  
  warn(message: string, data?: any) {
    if (this.shouldLog('warn')) {
      console.warn(`[WARN] ${message}`, data || '');
    }
  }
  
  info(message: string, data?: any) {
    if (this.shouldLog('info')) {
      console.info(`[INFO] ${message}`, data || '');
    }
  }
  
  debug(message: string, data?: any) {
    if (this.shouldLog('debug')) {
      console.debug(`[DEBUG] ${message}`, data || '');
    }
  }
}

// Data transformation functions
export class PermitDataTransformer {
  
  /**
   * Transform permit data for the permits ingestion pipeline
   */
  static transformForIngestion(permit: PermitData): any {
    return {
      permit_id: permit.id,
      application_number: permit.application_number,
      permit_type: permit.permit_type,
      status: permit.status,
      dates: {
        filed: permit.filed_date,
        issued: permit.issued_date,
        completed: permit.completed_date
      },
      description: permit.description,
      costs: {
        estimated: permit.estimated_cost,
        revised: permit.revised_cost
      },
      usage: {
        existing: permit.existing_use,
        proposed: permit.proposed_use
      },
      plansets: permit.plansets,
      location: permit.location,
      contact: permit.contact_info
    };
  }
  
  /**
   * Transform permit data for permit events pipeline
   */
  static transformForEvents(permit: PermitData): any {
    const events = [];
    
    // Filed event
    if (permit.filed_date) {
      events.push({
        permit_id: permit.id,
        event_type: 'filed',
        event_date: permit.filed_date,
        status: permit.status,
        details: {
          application_number: permit.application_number,
          permit_type: permit.permit_type
        }
      });
    }
    
    // Issued event
    if (permit.issued_date) {
      events.push({
        permit_id: permit.id,
        event_type: 'issued',
        event_date: permit.issued_date,
        status: permit.status,
        details: {
          costs: {
            estimated: permit.estimated_cost,
            revised: permit.revised_cost
          }
        }
      });
    }
    
    // Completed event
    if (permit.completed_date) {
      events.push({
        permit_id: permit.id,
        event_type: 'completed',
        event_date: permit.completed_date,
        status: permit.status,
        details: {}
      });
    }
    
    return { events };
  }
  
  /**
   * Transform permit data for inspector analytics pipeline
   */
  static transformForAnalytics(permit: PermitData): any {
    return {
      permit_id: permit.id,
      permit_type: permit.permit_type,
      location_data: {
        block: permit.location.block,
        lot: permit.location.lot,
        zipcode: permit.location.zipcode
      },
      timeline_data: {
        filed_date: permit.filed_date,
        issued_date: permit.issued_date,
        completed_date: permit.completed_date,
        processing_days: permit.issued_date && permit.filed_date ? 
          Math.ceil((new Date(permit.issued_date).getTime() - new Date(permit.filed_date).getTime()) / (1000 * 60 * 60 * 24)) : null
      },
      cost_data: {
        estimated: permit.estimated_cost,
        revised: permit.revised_cost,
        cost_variance: permit.revised_cost && permit.estimated_cost ?
          permit.revised_cost - permit.estimated_cost : null
      },
      inspection_data: permit.inspector_info || null
    };
  }
}

// Data validation
export class DataValidator {
  
  static validatePermitData(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!data) {
      errors.push('Permit data is required');
      return { valid: false, errors };
    }
    
    // Required fields
    if (!data.id) errors.push('Permit ID is required');
    if (!data.application_number) errors.push('Application number is required');
    if (!data.permit_type) errors.push('Permit type is required');
    if (!data.status) errors.push('Status is required');
    if (!data.filed_date) errors.push('Filed date is required');
    if (!data.description) errors.push('Description is required');
    
    // Location validation
    if (!data.location) {
      errors.push('Location is required');
    } else {
      if (!data.location.address) errors.push('Location address is required');
      if (!data.location.block) errors.push('Location block is required');
      if (!data.location.lot) errors.push('Location lot is required');
      if (!data.location.zipcode) errors.push('Location zipcode is required');
    }
    
    // Date format validation
    const dateFields = ['filed_date', 'issued_date', 'completed_date'];
    dateFields.forEach(field => {
      if (data[field] && isNaN(Date.parse(data[field]))) {
        errors.push(`${field} must be a valid date`);
      }
    });
    
    // Cost validation
    if (data.estimated_cost !== undefined && (typeof data.estimated_cost !== 'number' || data.estimated_cost < 0)) {
      errors.push('Estimated cost must be a positive number');
    }
    
    if (data.revised_cost !== undefined && (typeof data.revised_cost !== 'number' || data.revised_cost < 0)) {
      errors.push('Revised cost must be a positive number');
    }
    
    return { valid: errors.length === 0, errors };
  }
}

// Main permit sync service
export class PermitSyncService {
  private env: Env;
  private logger: Logger;
  
  constructor(env: Env) {
    this.env = env;
    this.logger = new Logger(env.LOG_LEVEL);
  }
  
  /**
   * Process permit data and send to appropriate pipelines
   */
  async processPermitData(permitData: PermitData): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    // Validate data
    const validation = DataValidator.validatePermitData(permitData);
    if (!validation.valid) {
      this.logger.error('Data validation failed', validation.errors);
      return { success: false, errors: validation.errors };
    }
    
    this.logger.info(`Processing permit data for ID: ${permitData.id}`);
    
    // Transform and send to each pipeline
    const pipelineResults = await Promise.allSettled([
      this.sendToIngestionPipeline(permitData),
      this.sendToEventsPipeline(permitData),
      this.sendToAnalyticsPipeline(permitData)
    ]);
    
    // Check results and handle failures
    let allSuccessful = true;
    pipelineResults.forEach((result, index) => {
      const pipelineNames = ['ingestion', 'events', 'analytics'];
      if (result.status === 'rejected') {
        allSuccessful = false;
        const error = `Failed to send to ${pipelineNames[index]} pipeline: ${result.reason}`;
        errors.push(error);
        this.logger.error(error);
      }
    });
    
    // If any pipeline failed, try fallback to D1
    if (!allSuccessful) {
      this.logger.warn('Some pipelines failed, attempting D1 fallback');
      try {
        await this.saveToD1Fallback(permitData);
        this.logger.info('Successfully saved to D1 fallback');
      } catch (fallbackError) {
        const error = `D1 fallback also failed: ${fallbackError}`;
        errors.push(error);
        this.logger.error(error);
      }
    }
    
    return { success: allSuccessful || errors.length === 0, errors };
  }
  
  private async sendToIngestionPipeline(permitData: PermitData): Promise<void> {
    const payload: PipelinePayload = {
      data: PermitDataTransformer.transformForIngestion(permitData),
      metadata: {
        timestamp: new Date().toISOString(),
        source: 'permit-sync-worker',
        version: '1.0.0',
        pipeline_target: 'ingestion'
      }
    };
    
    await this.env.SF_PERMITS_INGESTION.send(payload);
    this.logger.debug('Sent to ingestion pipeline', { permit_id: permitData.id });
  }
  
  private async sendToEventsPipeline(permitData: PermitData): Promise<void> {
    const payload: PipelinePayload = {
      data: PermitDataTransformer.transformForEvents(permitData),
      metadata: {
        timestamp: new Date().toISOString(),
        source: 'permit-sync-worker',
        version: '1.0.0',
        pipeline_target: 'events'
      }
    };
    
    await this.env.SF_PERMIT_EVENTS.send(payload);
    this.logger.debug('Sent to events pipeline', { permit_id: permitData.id });
  }
  
  private async sendToAnalyticsPipeline(permitData: PermitData): Promise<void> {
    const payload: PipelinePayload = {
      data: PermitDataTransformer.transformForAnalytics(permitData),
      metadata: {
        timestamp: new Date().toISOString(),
        source: 'permit-sync-worker',
        version: '1.0.0',
        pipeline_target: 'analytics'
      }
    };
    
    await this.env.SF_INSPECTOR_ANALYTICS.send(payload);
    this.logger.debug('Sent to analytics pipeline', { permit_id: permitData.id });
  }
  
  private async saveToD1Fallback(permitData: PermitData): Promise<void> {
    const insertQuery = `
      INSERT OR REPLACE INTO permit_fallback (
        id, application_number, permit_type, status, filed_date, 
        issued_date, completed_date, description, estimated_cost, 
        revised_cost, existing_use, proposed_use, plansets,
        address, block, lot, zipcode, applicant_name, applicant_address,
        inspector_name, inspection_date, inspection_status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    await this.env.DB.prepare(insertQuery)
      .bind(
        permitData.id,
        permitData.application_number,
        permitData.permit_type,
        permitData.status,
        permitData.filed_date,
        permitData.issued_date,
        permitData.completed_date,
        permitData.description,
        permitData.estimated_cost,
        permitData.revised_cost,
        permitData.existing_use,
        permitData.proposed_use,
        permitData.plansets,
        permitData.location.address,
        permitData.location.block,
        permitData.location.lot,
        permitData.location.zipcode,
        permitData.contact_info?.applicant_name,
        permitData.contact_info?.applicant_address,
        permitData.inspector_info?.inspector_name,
        permitData.inspector_info?.inspection_date,
        permitData.inspector_info?.inspection_status,
        new Date().toISOString()
      )
      .run();
  }
}

// Worker fetch handler
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const logger = new Logger(env.LOG_LEVEL);
    
    try {
      // Only accept POST requests
      if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
      }
      
      // Parse request body
      const permitData: PermitData = await request.json();
      
      // Process the permit data
      const syncService = new PermitSyncService(env);
      const result = await syncService.processPermitData(permitData);
      
      if (result.success) {
        logger.info('Permit data processed successfully', { permit_id: permitData.id });
        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Permit data processed successfully',
          permit_id: permitData.id
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } else {
        logger.error('Permit data processing failed', result.errors);
        return new Response(JSON.stringify({ 
          success: false, 
          errors: result.errors 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
    } catch (error) {
      logger.error('Unexpected error in worker', error);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Internal server error' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};