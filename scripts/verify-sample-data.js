const fs = require('fs');
const path = require('path');

/**
 * Simple JSON schema validator for inspector analytics data
 */
class SchemaValidator {
  constructor(schema) {
    this.schema = schema;
  }

  validate(data) {
    const errors = [];
    
    // Validate required fields
    if (this.schema.required) {
      for (const field of this.schema.required) {
        if (!(field in data)) {
          errors.push(`Missing required field: ${field}`);
        }
      }
    }

    // Validate properties
    if (this.schema.properties) {
      for (const [key, value] of Object.entries(data)) {
        if (this.schema.properties[key]) {
          const fieldErrors = this.validateField(key, value, this.schema.properties[key]);
          errors.push(...fieldErrors);
        }
      }
    }

    return errors;
  }

  validateField(fieldName, value, fieldSchema) {
    const errors = [];
    
    // Type validation
    if (fieldSchema.type) {
      const expectedType = fieldSchema.type;
      let actualType = Array.isArray(value) ? 'array' : typeof value;
      
      // Special handling for integer type in JavaScript
      if (expectedType === 'integer') {
        if (typeof value === 'number' && Number.isInteger(value)) {
          actualType = 'integer';
        }
      }
      
      if (actualType !== expectedType) {
        errors.push(`Field '${fieldName}' should be ${expectedType}, got ${actualType}`);
        return errors; // Skip further validation if type is wrong
      }
    }

    // Pattern validation for strings
    if (fieldSchema.pattern && typeof value === 'string') {
      const regex = new RegExp(fieldSchema.pattern);
      if (!regex.test(value)) {
        errors.push(`Field '${fieldName}' does not match pattern: ${fieldSchema.pattern}`);
      }
    }

    // Range validation for numbers
    if (typeof value === 'number') {
      if (fieldSchema.minimum !== undefined && value < fieldSchema.minimum) {
        errors.push(`Field '${fieldName}' is below minimum: ${fieldSchema.minimum}`);
      }
      if (fieldSchema.maximum !== undefined && value > fieldSchema.maximum) {
        errors.push(`Field '${fieldName}' is above maximum: ${fieldSchema.maximum}`);
      }
    }

    // Object validation
    if (fieldSchema.type === 'object' && fieldSchema.properties) {
      const subValidator = new SchemaValidator(fieldSchema);
      const subErrors = subValidator.validate(value);
      errors.push(...subErrors.map(err => `${fieldName}.${err}`));
    }

    return errors;
  }
}

function validateSampleData() {
  try {
    // Load schema
    const schemaPath = path.join(__dirname, '../schemas/inspector-analytics-schema.json');
    const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
    
    // Load sample data
    const sampleDataPath = path.join(__dirname, '../sample-data/inspector-analytics-sample.json');
    const sampleData = JSON.parse(fs.readFileSync(sampleDataPath, 'utf8'));
    
    console.log('🔍 Validating Inspector Analytics Sample Data');
    console.log('=' .repeat(50));
    
    const validator = new SchemaValidator(schema);
    let totalErrors = 0;
    
    // Validate each record
    sampleData.forEach((record, index) => {
      console.log(`\n📋 Validating record ${index + 1} (Inspector: ${record.inspector_id})`);
      
      const errors = validator.validate(record);
      
      if (errors.length === 0) {
        console.log('✅ Record is valid');
      } else {
        console.log(`❌ Found ${errors.length} validation errors:`);
        errors.forEach(error => console.log(`   - ${error}`));
        totalErrors += errors.length;
      }
    });
    
    console.log('\n' + '=' .repeat(50));
    console.log(`📊 Validation Summary:`);
    console.log(`   Records processed: ${sampleData.length}`);
    console.log(`   Total errors: ${totalErrors}`);
    
    if (totalErrors === 0) {
      console.log('🎉 All sample data is valid!');
      
      // Display sample analytics
      console.log('\n📈 Sample Analytics Summary:');
      const totalInspections = sampleData.reduce((sum, record) => 
        sum + record.performance_metrics.inspections_completed, 0);
      const avgTime = sampleData.reduce((sum, record) => 
        sum + record.performance_metrics.avg_inspection_time_minutes, 0) / sampleData.length;
      const avgOnTimeRate = sampleData.reduce((sum, record) => 
        sum + record.performance_metrics.on_time_rate, 0) / sampleData.length;
      
      console.log(`   Total inspections: ${totalInspections}`);
      console.log(`   Average inspection time: ${avgTime.toFixed(1)} minutes`);
      console.log(`   Average on-time rate: ${(avgOnTimeRate * 100).toFixed(1)}%`);
      
      return true;
    } else {
      console.log('❌ Validation failed');
      return false;
    }
    
  } catch (error) {
    console.error('Error during validation:', error.message);
    return false;
  }
}

// Run validation if this script is executed directly
if (require.main === module) {
  const success = validateSampleData();
  process.exit(success ? 0 : 1);
}

module.exports = { validateSampleData, SchemaValidator };