import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Anthropic
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || ''
});

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', /https:\/\/.*\.vercel\.app$/],
  credentials: true
}));

app.use(express.json());

// Simple auth middleware
const simpleAuth = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token || (!token.startsWith('mypa_') && token !== 'dev-token')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  req.user = { id: 'user-123' };
  next();
};

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// AI endpoints
app.post('/api/v1/ai/generate', simpleAuth, async (req, res) => {
  try {
    const { messages, options = {} } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array required' });
    }

    // Handle system messages for Anthropic
    const systemMessages = messages.filter((msg: any) => msg.role === 'system');
    const otherMessages = messages.filter((msg: any) => msg.role !== 'system');
    
    let processedMessages = otherMessages;
    if (systemMessages.length > 0) {
      const systemContent = systemMessages.map((msg: any) => msg.content).join('\n\n');
      const firstUserMessage = otherMessages.find((msg: any) => msg.role === 'user');
      
      if (firstUserMessage) {
        processedMessages = otherMessages.map((msg: any) => 
          msg === firstUserMessage 
            ? { ...msg, content: `${systemContent}\n\n${msg.content}` }
            : msg
        );
      }
    }

    const response = await anthropic.messages.create({
      model: options.model || 'claude-3-5-haiku-20241022',
      max_tokens: options.maxTokens || 1000,
      temperature: options.temperature || 0.7,
      messages: processedMessages.map((msg: any) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }))
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    res.json({
      success: true,
      data: {
        content: content.text,
        usage: {
          promptTokens: response.usage.input_tokens,
          completionTokens: response.usage.output_tokens,
          totalTokens: response.usage.input_tokens + response.usage.output_tokens
        },
        model: response.model
      }
    });
  } catch (error: any) {
    console.error('AI generate error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'AI generation failed',
      message: error.message 
    });
  }
});

app.post('/api/v1/ai/parse', simpleAuth, async (req, res) => {
  try {
    const { input } = req.body;
    
    if (!input) {
      return res.status(400).json({ error: 'Input required' });
    }

    const messages = [
      {
        role: 'user',
        content: `Parse this input into tasks and respond with a JSON array of task objects. Each task should have:
- content: string (the task description)
- project: string (if mentioned, use existing project tags)
- assignee: string (if mentioned, person involved)
- priority: 'P1' | 'P2' | 'P3' (if mentioned or inferred)
- dueDate: string (YYYY-MM-DD format if mentioned)
- sectionType: 'priorities' | 'schedule' | 'followUps' (infer from task type)

USER INPUT: "${input}"

Respond only with valid JSON array, no other text:`
      }
    ];

    const response = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 1000,
      messages: messages.map((msg: any) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }))
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    try {
      const parsed = JSON.parse(content.text);
      const tasks = Array.isArray(parsed) ? parsed : [parsed];
      
      res.json({
        success: true,
        data: tasks
      });
    } catch (parseError) {
      // Fallback parsing
      res.json({
        success: true,
        data: [{
          content: input.trim(),
          sectionType: 'schedule'
        }]
      });
    }
  } catch (error: any) {
    console.error('AI parse error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'AI parsing failed',
      message: error.message 
    });
  }
});

app.get('/api/v1/ai/providers', simpleAuth, (req, res) => {
  res.json({
    success: true,
    data: [
      {
        type: 'anthropic',
        name: 'Anthropic Claude',
        description: 'Claude AI models by Anthropic',
        models: ['claude-3-5-haiku-20241022', 'claude-3-5-sonnet-20241022'],
        healthy: !!process.env.ANTHROPIC_API_KEY
      }
    ]
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 MyPA API server running on port ${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  console.log(`🤖 Anthropic configured: ${!!process.env.ANTHROPIC_API_KEY}`);
});

export default app;
