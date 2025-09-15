# MyPA REST API Design - Phase 3

## Overview
The MyPA REST API provides complete programmatic access to the personal assistant functionality, enabling third-party integrations, mobile apps, and automation workflows.

## API Architecture

### Base URL
- **Development**: `http://localhost:3001/api/v1`
- **Production**: `https://api.mypa.app/v1`

### Authentication
- **API Keys**: Bearer token authentication
- **JWT Tokens**: For user sessions
- **Webhook Signatures**: HMAC-SHA256 for webhook verification

## Core API Endpoints

### Authentication & Users
```http
POST   /auth/login           # User login
POST   /auth/logout          # User logout  
POST   /auth/refresh         # Refresh JWT token
GET    /auth/me              # Get current user info
POST   /users                # Create user account
GET    /users/{id}           # Get user details
PUT    /users/{id}           # Update user profile
DELETE /users/{id}           # Delete user account
```

### Tasks
```http
GET    /tasks                # List all tasks with filters
POST   /tasks                # Create new task
GET    /tasks/{id}           # Get specific task
PUT    /tasks/{id}           # Update task
DELETE /tasks/{id}           # Delete task
POST   /tasks/{id}/complete  # Mark task complete
POST   /tasks/{id}/reopen    # Reopen completed task
POST   /tasks/bulk           # Bulk operations on tasks
GET    /tasks/search         # Advanced task search
POST   /tasks/import         # Import tasks from markdown
GET    /tasks/export         # Export tasks to various formats
```

### Daily Sections
```http
GET    /daily                # List daily sections
POST   /daily                # Create daily section
GET    /daily/{date}         # Get specific daily section
PUT    /daily/{date}         # Update daily section
DELETE /daily/{date}         # Delete daily section
POST   /daily/{date}/rollover # Trigger rollover for date
GET    /daily/{date}/insights # Get AI insights for the day
```

### Projects
```http
GET    /projects             # List all projects
POST   /projects             # Create new project
GET    /projects/{id}        # Get specific project
PUT    /projects/{id}        # Update project
DELETE /projects/{id}        # Delete project
GET    /projects/{id}/tasks  # Get all tasks for project
GET    /projects/{id}/stats  # Get project statistics
```

### AI Assistant
```http
POST   /ai/chat              # Chat with Claude assistant
POST   /ai/parse-task        # Parse natural language to task
POST   /ai/suggestions       # Get AI suggestions
POST   /ai/insights          # Get daily/weekly insights
POST   /ai/priority-analysis # Get priority recommendations
POST   /ai/rollover-analysis # Get smart rollover insights
```

### Analytics & Insights
```http
GET    /analytics/overview   # Overall productivity metrics
GET    /analytics/tasks      # Task completion analytics
GET    /analytics/projects   # Project progress analytics
GET    /analytics/time       # Time tracking analytics
GET    /analytics/trends     # Productivity trends
```

### Webhooks
```http
GET    /webhooks             # List user webhooks
POST   /webhooks             # Create webhook
GET    /webhooks/{id}        # Get webhook details
PUT    /webhooks/{id}        # Update webhook
DELETE /webhooks/{id}        # Delete webhook
POST   /webhooks/{id}/test   # Test webhook delivery
GET    /webhooks/{id}/logs   # Get webhook delivery logs
```

### Integrations
```http
GET    /integrations         # List available integrations
POST   /integrations/zapier  # Zapier integration endpoint
POST   /integrations/ifttt   # IFTTT integration endpoint
POST   /integrations/slack   # Slack integration
POST   /integrations/calendar # Calendar integration
GET    /integrations/status  # Integration status
```

## Request/Response Format

### Standard Response Format
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "meta": {
    "timestamp": "2025-08-22T10:30:00Z",
    "version": "1.0.0",
    "request_id": "req_123456789"
  }
}
```

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid task data provided",
    "details": {
      "field": "dueDate",
      "issue": "Date must be in YYYY-MM-DD format"
    }
  },
  "meta": {
    "timestamp": "2025-08-22T10:30:00Z",
    "version": "1.0.0",
    "request_id": "req_123456789"
  }
}
```

## Data Models

### Task Model
```typescript
interface Task {
  id: string;
  content: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority?: 'P1' | 'P2' | 'P3';
  project?: string;
  assignee?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  notes?: string[];
  tags?: string[];
  metadata?: Record<string, any>;
}
```

### Daily Section Model
```typescript
interface DailySection {
  id: string;
  date: string;
  priorities: Task[];
  schedule: Task[];
  followUps: Task[];
  notes: Note[];
  completed: Task[];
  blockers: Task[];
  insights?: string;
  createdAt: string;
  updatedAt: string;
}
```

### Project Model
```typescript
interface Project {
  id: string;
  name: string;
  tag: string;
  description?: string;
  color?: string;
  status: 'active' | 'completed' | 'archived';
  startDate?: string;
  endDate?: string;
  progress?: number;
  taskCount?: number;
  completedTasks?: number;
  createdAt: string;
  updatedAt: string;
}
```

## Authentication & Security

### API Key Authentication
```http
Authorization: Bearer mypa_sk_1234567890abcdef
```

### JWT Token Authentication
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Rate Limiting
- **Free Tier**: 1000 requests/hour
- **Pro Tier**: 10,000 requests/hour  
- **Enterprise**: Unlimited

### Security Headers
- CORS configuration
- Content Security Policy
- Rate limiting per API key
- Request validation and sanitization
- Webhook signature verification

## Webhook Events

### Event Types
```typescript
type WebhookEvent = 
  | 'task.created'
  | 'task.updated' 
  | 'task.completed'
  | 'task.deleted'
  | 'daily.created'
  | 'daily.updated'
  | 'project.created'
  | 'project.updated'
  | 'ai.insight_generated'
  | 'user.logged_in';
```

### Webhook Payload
```json
{
  "event": "task.completed",
  "timestamp": "2025-08-22T10:30:00Z",
  "user_id": "user_123",
  "data": {
    "task": {
      "id": "task_456",
      "content": "Complete API documentation",
      "status": "completed",
      "completedAt": "2025-08-22T10:30:00Z"
    }
  },
  "webhook_id": "wh_789"
}
```

## SDK Design

### JavaScript/TypeScript SDK
```typescript
import { MyPAClient } from '@mypa/sdk';

const client = new MyPAClient({
  apiKey: 'mypa_sk_...',
  baseURL: 'https://api.mypa.app/v1'
});

// Create a task
const task = await client.tasks.create({
  content: 'Review API documentation',
  priority: 'P1',
  project: '#API',
  dueDate: '2025-08-23'
});

// Get AI insights
const insights = await client.ai.insights({
  date: '2025-08-22',
  includeRecommendations: true
});

// Set up webhook
const webhook = await client.webhooks.create({
  url: 'https://myapp.com/webhooks/mypa',
  events: ['task.completed', 'daily.created']
});
```

## Integration Examples

### Zapier Integration
- Trigger: "New task created"
- Action: "Create calendar event"
- Filter: "Only P1 priority tasks"

### IFTTT Integration  
- Trigger: "Task completed"
- Action: "Post to Slack channel"
- Condition: "If project is #LoneWorker"

### Slack Bot Integration
```
/mypa add task "Review quarterly reports" P1 #DataTables
/mypa show today
/mypa complete task-123
```

## Error Codes

### Standard HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `429` - Rate Limit Exceeded
- `500` - Internal Server Error

### Custom Error Codes
- `TASK_NOT_FOUND`
- `INVALID_DATE_FORMAT`
- `PROJECT_LIMIT_EXCEEDED`
- `AI_SERVICE_UNAVAILABLE`
- `WEBHOOK_DELIVERY_FAILED`

## API Versioning
- Version in URL: `/api/v1/`
- Backward compatibility for 12 months
- Deprecation notices 6 months in advance
- Migration guides for breaking changes

## Performance & Caching
- Response caching with ETags
- Rate limiting with Redis
- Database query optimization
- CDN for static responses
- Pagination for large datasets

## Documentation
- OpenAPI 3.0 specification
- Interactive API explorer
- Code examples in multiple languages
- Webhook testing tools
- SDK documentation

This comprehensive API design provides the foundation for a robust developer platform that enables third-party integrations while maintaining security and performance.