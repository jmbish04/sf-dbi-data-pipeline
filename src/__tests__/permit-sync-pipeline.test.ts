import { PermitDataTransformer, DataValidator, PermitData } from '../permit-sync-pipeline.worker';

describe('PermitDataTransformer', () => {
  const samplePermitData: PermitData = {
    id: 'PERM-123456',
    application_number: 'APP-2023-001',
    permit_type: 'Building',
    status: 'Issued',
    filed_date: '2023-01-15T00:00:00Z',
    issued_date: '2023-02-01T00:00:00Z',
    completed_date: '2023-03-15T00:00:00Z',
    description: 'Residential renovation project',
    estimated_cost: 50000,
    revised_cost: 55000,
    existing_use: 'Single Family Dwelling',
    proposed_use: 'Single Family Dwelling with Addition',
    plansets: 3,
    location: {
      address: '123 Main St, San Francisco, CA',
      block: '1234',
      lot: '056',
      zipcode: '94102'
    },
    contact_info: {
      applicant_name: 'John Doe',
      applicant_address: '123 Main St, San Francisco, CA 94102'
    },
    inspector_info: {
      inspector_name: 'Jane Smith',
      inspection_date: '2023-02-15T00:00:00Z',
      inspection_status: 'Approved'
    }
  };

  describe('transformForIngestion', () => {
    it('should transform permit data for ingestion pipeline correctly', () => {
      const result = PermitDataTransformer.transformForIngestion(samplePermitData);
      
      expect(result).toEqual({
        permit_id: 'PERM-123456',
        application_number: 'APP-2023-001',
        permit_type: 'Building',
        status: 'Issued',
        dates: {
          filed: '2023-01-15T00:00:00Z',
          issued: '2023-02-01T00:00:00Z',
          completed: '2023-03-15T00:00:00Z'
        },
        description: 'Residential renovation project',
        costs: {
          estimated: 50000,
          revised: 55000
        },
        usage: {
          existing: 'Single Family Dwelling',
          proposed: 'Single Family Dwelling with Addition'
        },
        plansets: 3,
        location: {
          address: '123 Main St, San Francisco, CA',
          block: '1234',
          lot: '056',
          zipcode: '94102'
        },
        contact: {
          applicant_name: 'John Doe',
          applicant_address: '123 Main St, San Francisco, CA 94102'
        }
      });
    });

    it('should handle missing optional fields', () => {
      const minimalData: PermitData = {
        id: 'PERM-123456',
        application_number: 'APP-2023-001',
        permit_type: 'Building',
        status: 'Filed',
        filed_date: '2023-01-15T00:00:00Z',
        description: 'Basic permit',
        location: {
          address: '123 Main St',
          block: '1234',
          lot: '056',
          zipcode: '94102'
        }
      };

      const result = PermitDataTransformer.transformForIngestion(minimalData);
      
      expect(result.permit_id).toBe('PERM-123456');
      expect(result.dates.issued).toBeUndefined();
      expect(result.costs.estimated).toBeUndefined();
      expect(result.contact).toBeUndefined();
    });
  });

  describe('transformForEvents', () => {
    it('should create events for all available dates', () => {
      const result = PermitDataTransformer.transformForEvents(samplePermitData);
      
      expect(result.events).toHaveLength(3);
      
      // Filed event
      expect(result.events[0]).toEqual({
        permit_id: 'PERM-123456',
        event_type: 'filed',
        event_date: '2023-01-15T00:00:00Z',
        status: 'Issued',
        details: {
          application_number: 'APP-2023-001',
          permit_type: 'Building'
        }
      });
      
      // Issued event
      expect(result.events[1]).toEqual({
        permit_id: 'PERM-123456',
        event_type: 'issued',
        event_date: '2023-02-01T00:00:00Z',
        status: 'Issued',
        details: {
          costs: {
            estimated: 50000,
            revised: 55000
          }
        }
      });
      
      // Completed event
      expect(result.events[2]).toEqual({
        permit_id: 'PERM-123456',
        event_type: 'completed',
        event_date: '2023-03-15T00:00:00Z',
        status: 'Issued',
        details: {}
      });
    });

    it('should only create events for available dates', () => {
      const partialData: PermitData = {
        ...samplePermitData,
        issued_date: undefined,
        completed_date: undefined
      };

      const result = PermitDataTransformer.transformForEvents(partialData);
      
      expect(result.events).toHaveLength(1);
      expect(result.events[0].event_type).toBe('filed');
    });
  });

  describe('transformForAnalytics', () => {
    it('should transform permit data for analytics pipeline correctly', () => {
      const result = PermitDataTransformer.transformForAnalytics(samplePermitData);
      
      expect(result).toEqual({
        permit_id: 'PERM-123456',
        permit_type: 'Building',
        location_data: {
          block: '1234',
          lot: '056',
          zipcode: '94102'
        },
        timeline_data: {
          filed_date: '2023-01-15T00:00:00Z',
          issued_date: '2023-02-01T00:00:00Z',
          completed_date: '2023-03-15T00:00:00Z',
          processing_days: 17 // Days between filed and issued
        },
        cost_data: {
          estimated: 50000,
          revised: 55000,
          cost_variance: 5000
        },
        inspection_data: {
          inspector_name: 'Jane Smith',
          inspection_date: '2023-02-15T00:00:00Z',
          inspection_status: 'Approved'
        }
      });
    });

    it('should handle missing cost and timeline data', () => {
      const dataWithoutCosts: PermitData = {
        ...samplePermitData,
        estimated_cost: undefined,
        revised_cost: undefined,
        issued_date: undefined,
        inspector_info: undefined
      };

      const result = PermitDataTransformer.transformForAnalytics(dataWithoutCosts);
      
      expect(result.timeline_data.processing_days).toBeNull();
      expect(result.cost_data.cost_variance).toBeNull();
      expect(result.inspection_data).toBeNull();
    });

    it('should calculate processing days correctly', () => {
      const testData: PermitData = {
        ...samplePermitData,
        filed_date: '2023-01-01T00:00:00Z',
        issued_date: '2023-01-31T00:00:00Z'
      };

      const result = PermitDataTransformer.transformForAnalytics(testData);
      
      expect(result.timeline_data.processing_days).toBe(30);
    });
  });
});

describe('DataValidator', () => {
  const validPermitData: PermitData = {
    id: 'PERM-123456',
    application_number: 'APP-2023-001',
    permit_type: 'Building',
    status: 'Filed',
    filed_date: '2023-01-15T00:00:00Z',
    description: 'Test permit',
    location: {
      address: '123 Main St',
      block: '1234',
      lot: '056',
      zipcode: '94102'
    }
  };

  it('should validate correct permit data', () => {
    const result = DataValidator.validatePermitData(validPermitData);
    
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject null or undefined data', () => {
    const result1 = DataValidator.validatePermitData(null);
    const result2 = DataValidator.validatePermitData(undefined);
    
    expect(result1.valid).toBe(false);
    expect(result1.errors).toContain('Permit data is required');
    
    expect(result2.valid).toBe(false);
    expect(result2.errors).toContain('Permit data is required');
  });

  it('should require essential fields', () => {
    const incompleteData = {
      id: 'PERM-123456'
      // Missing other required fields
    };

    const result = DataValidator.validatePermitData(incompleteData);
    
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Application number is required');
    expect(result.errors).toContain('Permit type is required');
    expect(result.errors).toContain('Status is required');
    expect(result.errors).toContain('Filed date is required');
    expect(result.errors).toContain('Description is required');
    expect(result.errors).toContain('Location is required');
  });

  it('should validate location fields', () => {
    const dataWithIncompleteLocation = {
      ...validPermitData,
      location: {
        address: '123 Main St'
        // Missing block, lot, zipcode
      }
    };

    const result = DataValidator.validatePermitData(dataWithIncompleteLocation);
    
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Location block is required');
    expect(result.errors).toContain('Location lot is required');
    expect(result.errors).toContain('Location zipcode is required');
  });

  it('should validate date formats', () => {
    const dataWithInvalidDates = {
      ...validPermitData,
      filed_date: 'invalid-date',
      issued_date: 'also-invalid',
      completed_date: 'not-a-date'
    };

    const result = DataValidator.validatePermitData(dataWithInvalidDates);
    
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('filed_date must be a valid date');
    expect(result.errors).toContain('issued_date must be a valid date');
    expect(result.errors).toContain('completed_date must be a valid date');
  });

  it('should validate cost fields', () => {
    const dataWithInvalidCosts = {
      ...validPermitData,
      estimated_cost: -100,
      revised_cost: 'not-a-number'
    };

    const result = DataValidator.validatePermitData(dataWithInvalidCosts);
    
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Estimated cost must be a positive number');
    expect(result.errors).toContain('Revised cost must be a positive number');
  });

  it('should accept valid optional fields', () => {
    const dataWithOptionalFields = {
      ...validPermitData,
      estimated_cost: 50000,
      revised_cost: 55000,
      issued_date: '2023-02-01T00:00:00Z',
      contact_info: {
        applicant_name: 'John Doe'
      }
    };

    const result = DataValidator.validatePermitData(dataWithOptionalFields);
    
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});