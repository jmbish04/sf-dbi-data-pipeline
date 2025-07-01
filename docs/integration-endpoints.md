# Integration Endpoints

This document describes the integration endpoints for the SF DBI Data Pipeline.

## Permit Events Pipeline Integration

The `sf-permit-events` pipeline is configured to process real-time permit status changes, inspector assignments, and permit lifecycle events.

### Pipeline Configuration

- **Pipeline Name**: `sf-permit-events`
- **R2 Bucket**: `sf-permit-events`
- **Batch Interval**: 30 seconds (near real-time processing)
- **Batch Size**: 25 MB maximum
- **Compression**: gzip
- **Shard Count**: 2 (for event volume handling)

### Data Ingestion

#### HTTP Endpoint
Events can be submitted to the pipeline via HTTP POST requests:

```
POST https://[your-cloudflare-pipeline-endpoint]/sf-permit-events
Content-Type: application/json
```

#### Request Headers
```
Authorization: Bearer [your-api-token]
Content-Type: application/json
Content-Encoding: gzip (optional)
```

#### Request Body
The request body should contain a JSON array of permit events following the [Permit Events Schema](./permit-events-schema.md):

```json
[
  {
    "eventId": "evt_12345",
    "permitId": "PRM2024-001234",
    "eventType": "status_change",
    "timestamp": "2024-01-15T10:30:00Z",
    "eventData": {
      "previousStatus": "under_review",
      "newStatus": "approved",
      "changedBy": "inspector_smith",
      "reason": "All requirements met"
    }
  }
]
```

#### Response Format
```json
{
  "status": "success",
  "message": "Events queued for processing",
  "eventsReceived": 1,
  "timestamp": "2024-01-15T10:30:15Z"
}
```

### Batch Processing

The pipeline processes events in batches based on:
- **Time interval**: Every 30 seconds
- **Size threshold**: When batch reaches 25 MB
- **Compression**: All data is compressed with gzip before storage

### Data Storage

Processed events are stored in the `sf-permit-events` R2 bucket with the following structure:

```
sf-permit-events/
├── year=2024/
│   ├── month=01/
│   │   ├── day=15/
│   │   │   ├── hour=10/
│   │   │   │   ├── batch-1705316400-001.json.gz
│   │   │   │   └── batch-1705316430-002.json.gz
```

### Error Handling

#### Client Errors (4xx)
- `400 Bad Request`: Invalid JSON format or missing required fields
- `401 Unauthorized`: Invalid or missing API token
- `413 Payload Too Large`: Request exceeds size limits

#### Server Errors (5xx)
- `500 Internal Server Error`: Pipeline processing error
- `503 Service Unavailable`: Pipeline temporarily unavailable

### Rate Limits

- **Events per second**: 1000 events/second per shard (2000 total)
- **Request size**: 25 MB maximum per request
- **Batch frequency**: 30-second intervals

### Monitoring and Observability

The pipeline provides metrics on:
- Events processed per batch
- Processing latency
- Error rates
- Storage utilization

Access metrics through the Cloudflare Dashboard under Analytics > Pipelines.

### Integration Examples

#### Node.js
```javascript
const axios = require('axios');

async function sendPermitEvents(events) {
  try {
    const response = await axios.post(
      'https://[your-pipeline-endpoint]/sf-permit-events',
      events,
      {
        headers: {
          'Authorization': 'Bearer ' + process.env.PIPELINE_API_TOKEN,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('Events sent successfully:', response.data);
  } catch (error) {
    console.error('Error sending events:', error.response?.data || error.message);
  }
}
```

#### Python
```python
import requests
import json
import os

def send_permit_events(events):
    url = "https://[your-pipeline-endpoint]/sf-permit-events"
    headers = {
        "Authorization": f"Bearer {os.environ['PIPELINE_API_TOKEN']}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(url, json=events, headers=headers)
        response.raise_for_status()
        print("Events sent successfully:", response.json())
    except requests.exceptions.RequestException as e:
        print(f"Error sending events: {e}")
```

### Security Considerations

- Always use HTTPS for data transmission
- Store API tokens securely (environment variables, key management services)
- Implement proper authentication and authorization
- Monitor for suspicious activity patterns
- Regularly rotate API tokens