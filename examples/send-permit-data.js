/**
 * Example usage of the Permit Sync Pipeline Worker
 * 
 * This example demonstrates how to send permit data to the worker endpoint.
 */

const samplePermitData = {
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

async function sendPermitToWorker(permitData, workerUrl) {
  try {
    const response = await fetch(workerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(permitData)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Permit processed successfully:', result);
    } else {
      console.error('❌ Failed to process permit:', result);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Error sending permit to worker:', error);
    throw error;
  }
}

// Example usage
async function main() {
  // Replace with your actual worker URL
  const workerUrl = 'https://your-worker-name.your-subdomain.workers.dev';
  
  console.log('🚀 Sending permit data to worker...');
  
  try {
    await sendPermitToWorker(samplePermitData, workerUrl);
  } catch (error) {
    console.error('Failed to send permit data:', error);
  }
}

// Uncomment to run the example
// main();

module.exports = {
  samplePermitData,
  sendPermitToWorker
};