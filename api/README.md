# MyPA Backend API

Secure backend proxy service for MyPA Notes PWA that handles AI provider calls server-side, eliminating the need to expose API keys in the browser.

## 🚀 Quick Start

### Development

1. **Install dependencies:**
   ```bash
   cd api
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys and configuration
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

   The API will be available at `http://localhost:3001`

### Production Deployment

#### Vercel (Recommended)

1. **Deploy to Vercel:**
   ```bash
   npm install -g vercel
   vercel --prod
   ```

2. **Set environment variables in Vercel dashboard:**
   - `ANTHROPIC_API_KEY`
   - `OPENAI_API_KEY` 
   - `JWT_SECRET`
   - `ALLOWED_ORIGINS`

## 🔐 Security Features

- **API Key Protection**: AI provider keys never exposed to client
- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: Prevents abuse (100 requests per 15 minutes)
- **CORS Protection**: Configurable allowed origins
- **Request Validation**: Input sanitization and validation
- **Security Headers**: Helmet.js security middleware

## 📡 API Endpoints

### Authentication
All API endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### AI Endpoints

#### Generate AI Response
```http
POST /api/v1/ai/generate
Content-Type: application/json

{
  "messages": [
    {"role": "user", "content": "Hello"}
  ],
  "provider": "anthropic",
  "options": {
    "maxTokens": 1000,
    "temperature": 0.7
  }
}
```

#### Parse Natural Language
```http
POST /api/v1/ai/parse
Content-Type: application/json

{
  "input": "Add meeting with Sarah tomorrow at 2pm",
  "provider": "anthropic"
}
```

#### Process Commands
```http
POST /api/v1/ai/command
Content-Type: application/json

{
  "input": "Show me overdue tasks",
  "provider": "anthropic"
}
```

#### Generate Daily Insights
```http
POST /api/v1/ai/insights
Content-Type: application/json

{
  "provider": "anthropic"
}
```

#### Get Available Providers
```http
GET /api/v1/ai/providers
```

#### Check Provider Health
```http
GET /api/v1/ai/health/anthropic
```

### Health Check Endpoints

#### Basic Health Check
```http
GET /health
```

#### Readiness Check
```http
GET /health/ready
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `PORT` | Server port | No | `3001` |
| `NODE_ENV` | Environment | No | `development` |
| `JWT_SECRET` | JWT signing secret | Yes | - |
| `ANTHROPIC_API_KEY` | Anthropic API key | No* | - |
| `OPENAI_API_KEY` | OpenAI API key | No* | - |
| `ALLOWED_ORIGINS` | CORS allowed origins | No | `http://localhost:5173,http://localhost:5174` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | No | `900000` (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | No | `100` |
| `LOG_LEVEL` | Logging level | No | `info` |

*At least one AI provider API key is required

### CORS Configuration

The `ALLOWED_ORIGINS` environment variable supports:
- Exact matches: `https://mypa.example.com`
- Wildcard patterns: `https://mypa-*.vercel.app`
- Multiple origins: `origin1,origin2,origin3`

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │  AI Providers   │
│   (Browser)     │    │   (Node.js)     │    │  (Anthropic,    │
│                 │    │                 │    │   OpenAI, etc.) │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │                 │
│ │ ProxyProvider│◄┼────┼►│ AIProxyService│◄┼────┼►                │
│ └─────────────┘ │    │ └─────────────┘ │    │                 │
│                 │    │                 │    │                 │
│ JWT Token Only  │    │ API Keys Stored │    │ Direct API Calls│
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔍 Monitoring & Logging

- **Winston Logging**: Structured JSON logs
- **Request Logging**: All API requests logged
- **Error Tracking**: Detailed error logging with context
- **Health Checks**: Built-in health and readiness endpoints

## 🚦 Rate Limiting

Default rate limits:
- **100 requests per 15 minutes** per IP address
- Configurable via environment variables
- Returns `429 Too Many Requests` when exceeded

## 🛡️ Security Best Practices

1. **Never expose AI provider API keys** in frontend code
2. **Use JWT tokens** for authentication
3. **Configure CORS** properly for your domains
4. **Monitor rate limits** and adjust as needed
5. **Keep dependencies updated** for security patches
6. **Use HTTPS** in production
7. **Set strong JWT secrets** (use a password generator)

## 📊 Usage Examples

### Frontend Integration

```typescript
// Configure frontend to use secure proxy
const aiService = new AIService({
  apiKey: 'your-jwt-token', // Not an AI provider key!
  provider: 'custom' // Uses ProxyProvider
});

// All AI calls now go through secure backend
const response = await aiService.parseNaturalLanguage('Add task');
```

### Generate JWT Token

```javascript
const jwt = require('jsonwebtoken');

const token = jwt.sign(
  { userId: 'user123' },
  process.env.JWT_SECRET,
  { expiresIn: '1y' }
);

console.log('JWT Token:', token);
```

## 🐛 Troubleshooting

### Common Issues

1. **"Provider not initialized"**
   - Check that AI provider API keys are set in environment
   - Verify environment variables are loaded correctly

2. **"CORS blocked"**
   - Add your frontend domain to `ALLOWED_ORIGINS`
   - Check that wildcard patterns match correctly

3. **"Rate limit exceeded"**
   - Increase rate limits or implement user-specific limits
   - Check if requests are being made efficiently

4. **"Invalid token"**
   - Verify JWT secret matches between token generation and validation
   - Check token expiration and format

### Debug Mode

Set `LOG_LEVEL=debug` to see detailed request/response logging.

## 📈 Performance Tips

1. **Use connection pooling** for database connections
2. **Implement response caching** for repeated requests
3. **Add request deduplication** for identical concurrent requests
4. **Monitor memory usage** and optimize as needed
5. **Use CDN** for static assets if serving any

## 🔄 Updates & Maintenance

- **Dependencies**: Run `npm audit` regularly
- **Logs**: Monitor error logs for issues
- **Performance**: Track response times and optimize
- **Security**: Keep security headers and middleware updated
