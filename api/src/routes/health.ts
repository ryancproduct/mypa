import express from 'express';
import { createLogger } from '../utils/logger.js';

const router = express.Router();
const logger = createLogger();

// GET /health
router.get('/', (req, res) => {
  const healthCheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0'
  };

  try {
    res.status(200).json(healthCheck);
  } catch (error) {
    healthCheck.message = 'ERROR';
    logger.error('Health check failed', { error: error.message });
    res.status(503).json(healthCheck);
  }
});

// GET /health/ready
router.get('/ready', async (req, res) => {
  const checks = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    checks: {
      environment: process.env.NODE_ENV ? 'pass' : 'fail',
      anthropic_key: process.env.ANTHROPIC_API_KEY ? 'configured' : 'missing',
      openai_key: process.env.OPENAI_API_KEY ? 'configured' : 'missing',
      jwt_secret: process.env.JWT_SECRET ? 'configured' : 'missing'
    }
  };

  const hasRequiredConfig = checks.checks.jwt_secret === 'configured' && 
    (checks.checks.anthropic_key === 'configured' || checks.checks.openai_key === 'configured');

  if (!hasRequiredConfig) {
    checks.status = 'unhealthy';
    return res.status(503).json(checks);
  }

  res.status(200).json(checks);
});

export default router;
