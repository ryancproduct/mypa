import express, { Request } from 'express';
import Joi from 'joi';
import { AIProxyService } from '../services/AIProxyService.js';
import { createLogger } from '../utils/logger.js';
import { validateRequest } from '../middleware/validation.js';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
  };
}

const router = express.Router();
const logger = createLogger();
const aiProxy = new AIProxyService();

// Request schemas
const generateResponseSchema = Joi.object({
  messages: Joi.array().items(
    Joi.object({
      role: Joi.string().valid('user', 'assistant', 'system').required(),
      content: Joi.string().required()
    })
  ).required().min(1),
  provider: Joi.string().valid('anthropic', 'openai').optional(),
  options: Joi.object({
    model: Joi.string().optional(),
    maxTokens: Joi.number().integer().min(1).max(4000).optional(),
    temperature: Joi.number().min(0).max(2).optional(),
    stopSequences: Joi.array().items(Joi.string()).optional()
  }).optional()
});

const parseNaturalLanguageSchema = Joi.object({
  input: Joi.string().required().min(1).max(1000),
  provider: Joi.string().valid('anthropic', 'openai').optional()
});

const processCommandSchema = Joi.object({
  input: Joi.string().required().min(1).max(1000),
  provider: Joi.string().valid('anthropic', 'openai').optional()
});

// POST /api/v1/ai/generate
router.post('/generate', validateRequest(generateResponseSchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { messages, provider = 'anthropic', options } = req.body;
    
    logger.info('AI generate request', {
      provider,
      messageCount: messages.length,
      userId: req.user?.id,
      model: options?.model
    });

    const startTime = Date.now();
    const response = await aiProxy.generateResponse(messages, provider, options);
    const duration = Date.now() - startTime;

    logger.info('AI generate response', {
      provider,
      duration,
      tokensUsed: response.usage?.totalTokens,
      userId: req.user?.id
    });

    res.json({
      success: true,
      data: response,
      metadata: {
        provider,
        duration,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/ai/parse
router.post('/parse', validateRequest(parseNaturalLanguageSchema), async (req, res, next) => {
  try {
    const { input, provider = 'anthropic' } = req.body;
    
    logger.info('AI parse request', {
      provider,
      inputLength: input.length,
      userId: req.user?.id
    });

    const startTime = Date.now();
    const tasks = await aiProxy.parseNaturalLanguage(input, provider);
    const duration = Date.now() - startTime;

    logger.info('AI parse response', {
      provider,
      duration,
      tasksGenerated: tasks.length,
      userId: req.user?.id
    });

    res.json({
      success: true,
      data: tasks,
      metadata: {
        provider,
        duration,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/ai/command
router.post('/command', validateRequest(processCommandSchema), async (req, res, next) => {
  try {
    const { input, provider = 'anthropic' } = req.body;
    
    logger.info('AI command request', {
      provider,
      inputLength: input.length,
      userId: req.user?.id
    });

    const startTime = Date.now();
    const result = await aiProxy.processNaturalLanguageCommand(input, provider);
    const duration = Date.now() - startTime;

    logger.info('AI command response', {
      provider,
      duration,
      commandType: result.type,
      userId: req.user?.id
    });

    res.json({
      success: true,
      data: result,
      metadata: {
        provider,
        duration,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/ai/insights
router.post('/insights', async (req, res, next) => {
  try {
    const { provider = 'anthropic' } = req.body;
    
    logger.info('AI insights request', {
      provider,
      userId: req.user?.id
    });

    const startTime = Date.now();
    const insights = await aiProxy.generateDailyInsights(provider);
    const duration = Date.now() - startTime;

    logger.info('AI insights response', {
      provider,
      duration,
      userId: req.user?.id
    });

    res.json({
      success: true,
      data: { insights },
      metadata: {
        provider,
        duration,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/ai/providers
router.get('/providers', async (req, res, next) => {
  try {
    const providers = await aiProxy.getAvailableProviders();
    
    res.json({
      success: true,
      data: providers,
      metadata: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/ai/health/:provider
router.get('/health/:provider', async (req, res, next) => {
  try {
    const { provider } = req.params;
    
    if (!['anthropic', 'openai'].includes(provider)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid provider',
        message: 'Provider must be one of: anthropic, openai'
      });
    }

    const isHealthy = await aiProxy.checkProviderHealth(provider as 'anthropic' | 'openai');
    
    res.json({
      success: true,
      data: {
        provider,
        healthy: isHealthy,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
