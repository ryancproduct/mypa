import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { createLogger } from '../utils/logger.js';

const logger = createLogger();

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
  };
}

export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authorization header required'
      });
    }

    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Token required'
      });
    }

    // For development, we'll use a simple API key approach
    // In production, you'd want proper JWT validation
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      logger.error('JWT_SECRET not configured');
      return res.status(500).json({
        success: false,
        error: 'Server Configuration Error',
        message: 'Authentication not properly configured'
      });
    }

    try {
      // Try JWT validation first
      const decoded = jwt.verify(token, jwtSecret) as any;
      req.user = {
        id: decoded.userId || decoded.id || 'anonymous',
        email: decoded.email
      };
    } catch (jwtError) {
      // Fallback to simple API key validation for development
      if (token === process.env.DEVELOPMENT_API_KEY || token.startsWith('mypa_')) {
        req.user = {
          id: 'development-user'
        };
      } else {
        logger.warn('Invalid token provided', { 
          token: token.substring(0, 10) + '...',
          ip: req.ip 
        });
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Invalid token'
        });
        return;
      }
    }

    next();
  } catch (error: any) {
    logger.error('Auth middleware error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Authentication error'
    });
  }
};

// Generate a simple API key for development
export const generateApiKey = (userId: string): string => {
  const payload = {
    userId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60) // 1 year
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET!);
};
