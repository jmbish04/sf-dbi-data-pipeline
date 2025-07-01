# Permit Events Schema

This document defines the schema for permit events processed by the sf-permit-events pipeline.

## Event Schema

All permit events must include the following required fields:

```json
{
  "eventId": "string",
  "permitId": "string", 
  "eventType": "string",
  "timestamp": "string (ISO 8601)",
  "eventData": "object"
}
```

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `eventId` | string | Unique identifier for the event |
| `permitId` | string | SF DBI permit number |
| `eventType` | string | Type of permit event (see Event Types) |
| `timestamp` | string | ISO 8601 timestamp when event occurred |
| `eventData` | object | Event-specific data payload |

### Event Types

The following event types are supported:

- `status_change` - Permit status has changed
- `inspector_assigned` - Inspector assigned to permit
- `inspector_unassigned` - Inspector removed from permit
- `inspection_scheduled` - Inspection scheduled
- `inspection_completed` - Inspection completed
- `inspection_cancelled` - Inspection cancelled
- `payment_received` - Payment processed
- `document_uploaded` - Document added to permit
- `comment_added` - Comment added to permit

### Event Data Examples

#### Status Change Event
```json
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
```

#### Inspector Assignment Event
```json
{
  "eventId": "evt_12346",
  "permitId": "PRM2024-001234", 
  "eventType": "inspector_assigned",
  "timestamp": "2024-01-15T11:15:00Z",
  "eventData": {
    "inspectorId": "INS001",
    "inspectorName": "John Smith",
    "assignedBy": "supervisor_jones",
    "specialization": "structural"
  }
}
```

#### Inspection Scheduled Event
```json
{
  "eventId": "evt_12347",
  "permitId": "PRM2024-001234",
  "eventType": "inspection_scheduled", 
  "timestamp": "2024-01-15T14:20:00Z",
  "eventData": {
    "inspectionId": "INS2024-005678",
    "inspectionType": "rough_framing",
    "scheduledDate": "2024-01-22T09:00:00Z",
    "inspectorId": "INS001",
    "location": "123 Main St, San Francisco, CA"
  }
}
```

## Validation Rules

- All timestamps must be in ISO 8601 format
- `permitId` must match SF DBI permit number format (PRM followed by year and number)
- `eventId` must be unique across all events
- `eventType` must be one of the supported types listed above
- `eventData` content varies by event type but must be a valid JSON object