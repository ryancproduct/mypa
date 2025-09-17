# Wave 0 Backend Alignment Report - MyPA Notes PWA

**Date:** September 17, 2025
**Project:** MyPA Notes PWA Backend Architecture
**Phase:** Wave 0 - Alignment & Readiness

## Executive Summary

This report provides architectural decisions and recommendations for the MyPA Notes PWA backend infrastructure based on analysis of current implementation and requirements outlined in PWA_BUILD_PLAN.md.

**Critical Findings:**
- Current implementation has browser-exposed Anthropic API keys (HIGH SECURITY RISK)
- No dedicated backend infrastructure exists (mypa-api directory is empty)
- Client-side encryption exists but inadequate for production security
- Need for unified data service and AI gateway architecture

**Key Decisions:**
1. **Backend Technology:** Supabase + FastAPI Gateway (Recommended)
2. **Hosting:** Railway.app for API gateway, Supabase for data services
3. **Security Priority:** Immediate elimination of browser-exposed secrets

---

## 1. Technology Selection Analysis

### 1.1 Supabase vs Firebase Evaluation

**RECOMMENDATION: Supabase**

| Criteria | Supabase | Firebase | Decision Rationale |
|----------|----------|----------|-------------------|
| **PostgreSQL vs NoSQL** | ✅ PostgreSQL | ❌ Firestore | Strong ACID compliance, complex task relationships |
| **Real-time Sync** | ✅ Built-in realtime | ✅ Built-in realtime | Equivalent capability |
| **Row Level Security** | ✅ Native RLS | ❌ Complex rules | Essential for multi-user security |
| **SQL Queries** | ✅ Direct SQL | ❌ Limited queries | Complex task filtering/search needs |
| **Open Source** | ✅ Self-hostable | ❌ Vendor lock-in | Future flexibility, compliance options |
| **Cost Structure** | ✅ Predictable | ⚠️ Usage-based | Better for scaling predictability |
| **TypeScript SDK** | ✅ Excellent | ✅ Good | Equivalent quality |
| **Migration Path** | ✅ Standard SQL | ❌ Custom tooling | Easier data portability |

**Technical Justification:**
- MyPA's task management requires complex relational queries (projects, due dates, priorities, assignments)
- PostgreSQL's JSONB support provides NoSQL flexibility when needed while maintaining ACID compliance
- Supabase RLS provides granular security without complex client-side logic
- Built-in auth integration simplifies user management

### 1.2 Backend Gateway Technology Stack

**RECOMMENDATION: FastAPI + Python**

**Primary Choice: FastAPI**
- **Pros:** High performance, automatic OpenAPI docs, excellent typing, async support
- **Cons:** Python ecosystem (vs Node.js alignment with frontend)
- **Use Case:** AI orchestration, data validation, complex business logic

**Alternative: Express.js + Node.js**
- **Pros:** JavaScript consistency, npm ecosystem, team familiarity
- **Cons:** Less robust typing, performance limitations for AI workloads
- **Use Case:** If team JavaScript expertise is critical

**Decision: FastAPI** - Better suited for AI/ML workloads and has superior performance characteristics for the planned AI orchestration features.

---

## 2. Backend Gateway Architecture

### 2.1 High-Level Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│                 │    │                  │    │                 │
│   PWA Client    │    │  FastAPI Gateway │    │    Supabase     │
│                 │    │                  │    │                 │
│ - React Frontend│◄──►│ - Auth Middleware│◄──►│ - PostgreSQL    │
│ - Task UI       │    │ - AI Orchestration│    │ - Auth/RLS      │
│ - Offline Cache │    │ - Rate Limiting  │    │ - Real-time     │
│ - PWA Features  │    │ - Request Proxy  │    │ - Storage       │
│                 │    │ - Response Cache │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │                  │
                       │ AI Providers     │
                       │                  │
                       │ - Anthropic/Claude│
                       │ - OpenAI (fallback)│
                       │ - Future providers│
                       │                  │
                       └──────────────────┘
```

### 2.2 API Gateway Responsibilities

**Authentication & Authorization**
- JWT token validation
- User session management
- Rate limiting per user/IP
- Request sanitization

**AI Provider Orchestration**
- Multi-provider routing (Claude primary, OpenAI fallback)
- Request/response transformation
- Provider-specific rate limiting
- Cost tracking and budget controls
- Response caching with invalidation

**Data Service Integration**
- Supabase connection pooling
- Transaction management
- Data validation and sanitization
- Real-time subscription management

**Observability**
- Request/response logging
- Performance metrics
- Error tracking and alerting
- AI usage analytics

### 2.3 Deployment Architecture

**Recommended Hosting: Railway.app**

**Rationale:**
- **vs Fly.io:** Better PostgreSQL integration, simpler deployments
- **vs AWS Lambda:** Better for stateful connections, WebSocket support
- **vs Vercel:** Full backend control, no cold start issues

**Infrastructure Layout:**
```
┌─────────────────────────────────────────────────────────────────┐
│                         Railway.app                             │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Production    │  │     Staging     │  │   Development   │ │
│  │                 │  │                 │  │                 │ │
│  │ FastAPI Gateway │  │ FastAPI Gateway │  │ FastAPI Gateway │ │
│  │ - Auto-scaling  │  │ - Feature branch│  │ - Local testing │ │
│  │ - Health checks │  │ - Testing env   │  │ - Debug mode    │ │
│  │ - Monitoring    │  │                 │  │                 │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Supabase                                │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Production    │  │     Staging     │  │   Development   │ │
│  │                 │  │                 │  │                 │ │
│  │ - PostgreSQL    │  │ - PostgreSQL    │  │ - PostgreSQL    │ │
│  │ - Auth          │  │ - Auth          │  │ - Auth          │ │
│  │ - Storage       │  │ - Storage       │  │ - Storage       │ │
│  │ - Edge Functions│  │ - Edge Functions│  │ - Edge Functions│ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Security Audit & Recommendations

### 3.1 Current Security Posture Assessment

**CRITICAL VULNERABILITIES IDENTIFIED:**

**🚨 HIGH SEVERITY**
1. **Browser-exposed Anthropic API keys** (`dangerouslyAllowBrowser: true`)
   - **Risk:** API key theft, usage abuse, quota exhaustion
   - **Impact:** High - Direct financial and security risk
   - **Remediation:** Immediate backend proxy implementation

2. **Client-side secret storage limitations**
   - **Risk:** Device-based encryption is insufficient for sensitive data
   - **Impact:** Medium - Local device compromise exposes data
   - **Remediation:** Server-side secret management

**⚠️ MEDIUM SEVERITY**
3. **Missing Content Security Policy (CSP)**
   - **Risk:** XSS attacks, injection vulnerabilities
   - **Current:** Basic headers in vercel.json, no CSP
   - **Remediation:** Comprehensive CSP implementation

4. **No rate limiting**
   - **Risk:** API abuse, DoS attacks, cost runaway
   - **Impact:** Medium - Service availability and cost control
   - **Remediation:** Gateway-level rate limiting

5. **Missing integrity checks**
   - **Risk:** Supply chain attacks, CDN compromise
   - **Current:** No Subresource Integrity (SRI) hashes
   - **Remediation:** SRI implementation for external resources

### 3.2 Enhanced Security Architecture

**Immediate Actions (Week 0-1):**

1. **Eliminate Browser-Exposed Secrets**
   ```typescript
   // REMOVE: dangerouslyAllowBrowser: true
   // IMPLEMENT: Backend proxy for all AI API calls
   ```

2. **Implement Comprehensive CSP**
   ```http
   Content-Security-Policy:
     default-src 'self';
     script-src 'self' 'unsafe-inline' https://www.googletagmanager.com;
     style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
     font-src 'self' https://fonts.gstatic.com;
     img-src 'self' data: https:;
     connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.mypa.railway.app;
     worker-src 'self';
     manifest-src 'self';
   ```

3. **Add Subresource Integrity (SRI)**
   ```html
   <!-- External resources with integrity hashes -->
   <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap"
         integrity="sha384-..." crossorigin="anonymous">
   ```

**Phase 1 Security Hardening:**

4. **Rate Limiting Strategy**
   ```python
   # Per-user limits
   - AI requests: 100/hour per user
   - Data sync: 1000/hour per user
   - Auth attempts: 10/hour per IP

   # Global limits
   - AI provider fallback triggers
   - Cost-based throttling
   ```

5. **JWT Security Implementation**
   ```python
   # JWT Configuration
   - RS256 algorithm (not HS256)
   - Short-lived access tokens (15 min)
   - Refresh token rotation
   - Device fingerprinting
   ```

6. **Secrets Management**
   ```python
   # Environment-based secrets
   - Railway environment variables
   - Encrypted storage for user tokens
   - API key rotation capabilities
   - Audit logging for secret access
   ```

### 3.3 Security Monitoring & Compliance

**Monitoring Implementation:**
- **Sentry:** Error tracking and performance monitoring
- **Custom alerts:** Unusual API usage patterns
- **Audit logging:** All sensitive operations
- **Cost monitoring:** AI usage and billing alerts

**Compliance Considerations:**
- **Data residency:** Supabase regions for GDPR compliance
- **Audit trails:** All task operations logged
- **Data retention:** Configurable deletion policies
- **Export capabilities:** User data portability

---

## 4. Data Contracts & API Specifications

### 4.1 Core Data Models

**User Entity**
```typescript
interface User {
  id: string;                    // UUID
  email: string;                 // Unique
  display_name: string;
  timezone: string;              // IANA timezone
  preferences: UserPreferences;
  created_at: timestamp;
  updated_at: timestamp;
}

interface UserPreferences {
  ai_provider: 'claude' | 'openai';
  auto_rollover: boolean;
  notification_settings: NotificationPrefs;
  theme: 'light' | 'dark' | 'auto';
}
```

**Task Entity**
```typescript
interface Task {
  id: string;                    // UUID
  user_id: string;               // Foreign key
  content: string;
  project_tag?: string;          // #DataTables, #IKEA, etc.
  assignee?: string;             // @person
  priority?: 'P1' | 'P2' | 'P3';
  due_date?: string;             // ISO date
  section_type: 'priorities' | 'schedule' | 'followUps';
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  metadata: TaskMetadata;
  created_at: timestamp;
  updated_at: timestamp;
  completed_at?: timestamp;
}

interface TaskMetadata {
  rollover_count: number;
  original_date: string;         // Original creation date
  ai_generated: boolean;
  context_tags: string[];
}
```

**Daily Section Entity**
```typescript
interface DailySection {
  id: string;                    // UUID
  user_id: string;               // Foreign key
  date: string;                  // YYYY-MM-DD
  priorities: Task[];            // Max 3
  schedule: Task[];
  follow_ups: Task[];
  notes: Note[];
  insights?: string;             // AI-generated insights
  created_at: timestamp;
  updated_at: timestamp;
}

interface Note {
  id: string;
  content: string;
  timestamp: string;             // HH:MM
  type: 'note' | 'idea' | 'win' | 'blocker';
}
```

**Project Entity**
```typescript
interface Project {
  id: string;                    // UUID
  user_id: string;               // Foreign key
  name: string;                  // Display name
  tag: string;                   // #DataTables
  description?: string;
  status: 'active' | 'on_hold' | 'completed' | 'archived';
  color: string;                 // Hex color
  created_at: timestamp;
  updated_at: timestamp;
}
```

### 4.2 API Gateway Endpoints

**Authentication**
```typescript
POST /auth/login
POST /auth/logout
POST /auth/refresh
GET  /auth/user
PUT  /auth/user
```

**Task Management**
```typescript
GET    /api/v1/tasks                 // List tasks with filters
POST   /api/v1/tasks                 // Create task
GET    /api/v1/tasks/{id}            // Get single task
PUT    /api/v1/tasks/{id}            // Update task
DELETE /api/v1/tasks/{id}            // Delete task
POST   /api/v1/tasks/bulk            // Bulk operations
```

**Daily Sections**
```typescript
GET    /api/v1/daily/{date}          // Get daily section
PUT    /api/v1/daily/{date}          // Update daily section
POST   /api/v1/daily/{date}/rollover // Execute rollover
GET    /api/v1/daily/range           // Date range query
```

**AI Services**
```typescript
POST   /api/v1/ai/parse              // Natural language parsing
POST   /api/v1/ai/insights           // Generate insights
POST   /api/v1/ai/suggestions        // Get task suggestions
GET    /api/v1/ai/usage              // Usage statistics
```

**Project Management**
```typescript
GET    /api/v1/projects              // List projects
POST   /api/v1/projects              // Create project
PUT    /api/v1/projects/{id}         // Update project
DELETE /api/v1/projects/{id}         // Delete project
GET    /api/v1/projects/{id}/tasks   // Project tasks
```

### 4.3 Real-time Subscriptions

**WebSocket Events**
```typescript
// Task updates
task:created
task:updated
task:completed
task:deleted

// Daily section updates
daily:updated
daily:rollover_complete

// Project updates
project:created
project:updated

// AI events
ai:processing_start
ai:processing_complete
ai:insights_ready
```

### 4.4 Data Synchronization Strategy

**Conflict Resolution**
```typescript
interface ConflictResolution {
  strategy: 'last_write_wins' | 'user_choice' | 'merge';
  client_version: number;
  server_version: number;
  resolved_data: any;
  timestamp: string;
}
```

**Offline Sync Pattern**
- Client maintains local SQLite cache
- Changes queued during offline periods
- Optimistic updates with rollback capability
- Server-side conflict detection and resolution
- Background sync with progress indicators

---

## 5. Implementation Roadmap

### 5.1 Phase 0: Immediate Security Actions (Week 0)

**Priority 1: Remove Browser-Exposed Secrets**
```bash
# Create backend gateway MVP
- FastAPI project setup on Railway
- Environment variable configuration
- Basic AI proxy endpoint
- Frontend integration (remove dangerouslyAllowBrowser)
```

**Priority 2: Basic Security Headers**
```bash
# Update vercel.json with comprehensive headers
- Content Security Policy
- Additional security headers
- SRI for external resources
```

### 5.2 Phase 1: Backend Foundation (Weeks 1-2)

1. **Supabase Setup**
   - Database schema creation
   - Row Level Security policies
   - Authentication configuration
   - Real-time subscriptions

2. **FastAPI Gateway Development**
   - Authentication middleware
   - AI provider orchestration
   - Rate limiting implementation
   - Basic data endpoints

3. **Frontend Migration**
   - Remove direct Anthropic SDK usage
   - Implement API gateway client
   - Update authentication flow
   - Error handling improvements

### 5.3 Phase 2: Enhanced Features (Weeks 3-4)

1. **AI Orchestration Enhancement**
   - Multi-provider support
   - Response caching
   - Usage analytics
   - Cost optimization

2. **Data Synchronization**
   - Conflict resolution
   - Offline queue processing
   - Real-time updates
   - Background sync

3. **Performance Optimization**
   - API response caching
   - Database query optimization
   - Connection pooling
   - CDN integration

---

## 6. Success Metrics & Monitoring

### 6.1 Security Metrics
- **Zero browser-exposed secrets**
- **100% HTTPS traffic**
- **CSP compliance score > 95%**
- **Zero security vulnerabilities in dependencies**

### 6.2 Performance Metrics
- **API response time p95 < 500ms**
- **Database query time p95 < 100ms**
- **AI response time p95 < 3s**
- **Uptime > 99.9%**

### 6.3 Reliability Metrics
- **Data sync success rate > 99.5%**
- **Conflict resolution rate < 1%**
- **Error rate < 0.1%**
- **Cache hit rate > 70%**

---

## 7. Next Steps & Approvals Required

### 7.1 Immediate Actions Required
1. **Approve Supabase selection** for data services
2. **Approve FastAPI + Railway.app** for backend gateway
3. **Prioritize security vulnerability fixes** (browser-exposed secrets)
4. **Allocate development resources** for backend implementation

### 7.2 Team Assignments
- **Backend Developer:** FastAPI gateway implementation
- **Frontend Developer:** API integration and security updates
- **DevOps:** Railway deployment and monitoring setup
- **Security Review:** CSP and security headers validation

### 7.3 Timeline Approval
- **Week 0:** Security fixes and architecture approval
- **Week 1-2:** Backend foundation and data migration
- **Week 3-4:** Enhanced features and performance optimization

---

**Document Prepared By:** Senior Backend Architecture Engineer
**Review Required By:** Product Team, Security Team, Development Team
**Next Review Date:** September 24, 2025

---

*This document serves as the authoritative guide for Wave 0 backend alignment and should be referenced for all subsequent implementation decisions.*