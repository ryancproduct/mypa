import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { createLogger } from '../utils/logger.js';

interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface AIResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model?: string;
  finishReason?: 'stop' | 'length' | 'content_filter';
}

interface AIGenerationOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  stopSequences?: string[];
}

interface TaskSuggestion {
  content: string;
  project?: string;
  assignee?: string;
  priority?: 'P1' | 'P2' | 'P3';
  dueDate?: string;
  sectionType: 'priorities' | 'schedule' | 'followUps';
}

interface AICommandResult {
  type: 'create_tasks' | 'query' | 'update' | 'unknown';
  tasks?: TaskSuggestion[];
  response?: string;
  query?: any;
}

export class AIProxyService {
  private anthropic: Anthropic | null = null;
  private openai: OpenAI | null = null;
  private logger = createLogger();

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders() {
    // Initialize Anthropic
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
      });
      this.logger.info('Anthropic provider initialized');
    } else {
      this.logger.warn('Anthropic API key not found');
    }

    // Initialize OpenAI
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
      this.logger.info('OpenAI provider initialized');
    } else {
      this.logger.warn('OpenAI API key not found');
    }
  }

  async generateResponse(
    messages: AIMessage[], 
    provider: 'anthropic' | 'openai' = 'anthropic',
    options?: AIGenerationOptions
  ): Promise<AIResponse> {
    switch (provider) {
      case 'anthropic':
        return this.generateAnthropicResponse(messages, options);
      case 'openai':
        return this.generateOpenAIResponse(messages, options);
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  private async generateAnthropicResponse(
    messages: AIMessage[], 
    options?: AIGenerationOptions
  ): Promise<AIResponse> {
    if (!this.anthropic) {
      throw new Error('Anthropic provider not initialized');
    }

    try {
      // Handle system messages for Anthropic
      const systemMessages = messages.filter(msg => msg.role === 'system');
      const otherMessages = messages.filter(msg => msg.role !== 'system');
      
      let processedMessages = otherMessages;
      if (systemMessages.length > 0) {
        const systemContent = systemMessages.map(msg => msg.content).join('\n\n');
        const firstUserMessage = otherMessages.find(msg => msg.role === 'user');
        
        if (firstUserMessage) {
          processedMessages = otherMessages.map(msg => 
            msg === firstUserMessage 
              ? { ...msg, content: `${systemContent}\n\n${msg.content}` }
              : msg
          );
        }
      }

      const response = await this.anthropic.messages.create({
        model: options?.model || 'claude-3-5-haiku-20241022',
        max_tokens: options?.maxTokens || 1000,
        temperature: options?.temperature || 0.7,
        messages: processedMessages.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        }))
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Anthropic');
      }

      return {
        content: content.text,
        usage: response.usage ? {
          promptTokens: response.usage.input_tokens,
          completionTokens: response.usage.output_tokens,
          totalTokens: response.usage.input_tokens + response.usage.output_tokens
        } : undefined,
        model: response.model,
        finishReason: response.stop_reason === 'end_turn' ? 'stop' : 
                     response.stop_reason === 'max_tokens' ? 'length' : 'stop'
      };
    } catch (error) {
      this.logger.error('Anthropic API error', { error: error.message });
      throw new Error(`Anthropic API error: ${error.message}`);
    }
  }

  private async generateOpenAIResponse(
    messages: AIMessage[], 
    options?: AIGenerationOptions
  ): Promise<AIResponse> {
    if (!this.openai) {
      throw new Error('OpenAI provider not initialized');
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: options?.model || 'gpt-4o-mini',
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        max_tokens: options?.maxTokens || 1000,
        temperature: options?.temperature || 0.7,
        stop: options?.stopSequences
      });

      const choice = response.choices[0];
      if (!choice || !choice.message) {
        throw new Error('Invalid response from OpenAI');
      }

      return {
        content: choice.message.content || '',
        usage: response.usage ? {
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens
        } : undefined,
        model: response.model,
        finishReason: choice.finish_reason === 'stop' ? 'stop' :
                     choice.finish_reason === 'length' ? 'length' :
                     choice.finish_reason === 'content_filter' ? 'content_filter' : 'stop'
      };
    } catch (error) {
      this.logger.error('OpenAI API error', { error: error.message });
      throw new Error(`OpenAI API error: ${error.message}`);
    }
  }

  async parseNaturalLanguage(
    input: string, 
    provider: 'anthropic' | 'openai' = 'anthropic'
  ): Promise<TaskSuggestion[]> {
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: 'You are MyPA, a personal productivity assistant. Parse natural language input into structured tasks.'
      },
      {
        role: 'user',
        content: `Parse this input into tasks and respond with a JSON array of task objects. Each task should have:
- content: string (the task description)
- project: string (if mentioned, use existing project tags like #DataTables)
- assignee: string (if mentioned, person involved)
- priority: 'P1' | 'P2' | 'P3' (if mentioned or inferred)
- dueDate: string (YYYY-MM-DD format if mentioned)
- sectionType: 'priorities' | 'schedule' | 'followUps' (infer from task type)

Examples:
- "Add meeting with Sarah about DataTables tomorrow at 2pm" → schedule item
- "Follow up with Jim on IKEA project" → followUps item  
- "High priority presentation prep" → priorities item

USER INPUT: "${input}"

Respond only with valid JSON array, no other text:`
      }
    ];

    try {
      const response = await this.generateResponse(messages, provider, { maxTokens: 1000 });
      const parsed = JSON.parse(response.content);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch (error) {
      this.logger.error('Failed to parse natural language', { input, error: error.message });
      // Fallback parsing
      return this.fallbackTaskParsing(input);
    }
  }

  async processNaturalLanguageCommand(
    input: string, 
    provider: 'anthropic' | 'openai' = 'anthropic'
  ): Promise<AICommandResult> {
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: 'You are MyPA, a personal productivity assistant helping Ryan manage his daily tasks.'
      },
      {
        role: 'user',
        content: `Analyze this input and determine what the user wants to do. Respond with JSON in this format:

{
  "type": "create_tasks" | "query" | "update" | "unknown",
  "response": "Brief response to user",
  "tasks": [...] // if creating tasks
  "query": {...} // if querying existing data
}

COMMAND TYPES:
- create_tasks: User wants to add new tasks ("Add meeting", "I need to...")
- query: User wants to see existing data ("Show overdue tasks", "What's on my calendar")
- update: User wants to modify existing tasks ("Mark done", "Reschedule")
- unknown: Unclear intent

USER INPUT: "${input}"

Respond only with valid JSON:`
      }
    ];

    try {
      const response = await this.generateResponse(messages, provider, { maxTokens: 1500 });
      return JSON.parse(response.content);
    } catch (error) {
      this.logger.error('Failed to process command', { input, error: error.message });
      return {
        type: 'unknown',
        response: 'I had trouble understanding that. Could you rephrase?'
      };
    }
  }

  async generateDailyInsights(provider: 'anthropic' | 'openai' = 'anthropic'): Promise<string> {
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: 'You are MyPA, Ryan\'s personal productivity assistant. Provide brief, actionable daily insights.'
      },
      {
        role: 'user',
        content: `Provide a concise daily insight focusing on:
1. Priority items that need attention
2. Any overdue tasks
3. Potential scheduling conflicts
4. One actionable suggestion for the day

Keep it brief, friendly, and actionable. Start with "Good ${this.getTimeOfDay()}! Here's your daily overview:"`
      }
    ];

    try {
      const response = await this.generateResponse(messages, provider, { maxTokens: 800 });
      return response.content;
    } catch (error) {
      this.logger.error('Failed to generate insights', { error: error.message });
      return 'Have a productive day! I\'m here to help manage your tasks.';
    }
  }

  async getAvailableProviders() {
    const providers = [];
    
    if (this.anthropic) {
      providers.push({
        type: 'anthropic',
        name: 'Anthropic Claude',
        description: 'Claude AI models by Anthropic - excellent for reasoning and analysis',
        models: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-haiku-20240307'],
        healthy: await this.checkProviderHealth('anthropic')
      });
    }
    
    if (this.openai) {
      providers.push({
        type: 'openai',
        name: 'OpenAI GPT',
        description: 'GPT models by OpenAI - versatile and widely supported',
        models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
        healthy: await this.checkProviderHealth('openai')
      });
    }
    
    return providers;
  }

  async checkProviderHealth(provider: 'anthropic' | 'openai'): Promise<boolean> {
    try {
      const testMessages: AIMessage[] = [
        { role: 'user', content: 'Hi' }
      ];
      
      await this.generateResponse(testMessages, provider, { maxTokens: 5 });
      return true;
    } catch (error) {
      this.logger.warn(`Provider ${provider} health check failed`, { error: error.message });
      return false;
    }
  }

  private fallbackTaskParsing(input: string): TaskSuggestion[] {
    const hasHighPriority = /urgent|asap|high priority|important/i.test(input);
    const hasMeeting = /meeting|call|discuss/i.test(input);
    const hasFollowUp = /follow up|check|remind/i.test(input);
    
    let sectionType: 'priorities' | 'schedule' | 'followUps' = 'schedule';
    if (hasHighPriority) sectionType = 'priorities';
    else if (hasFollowUp) sectionType = 'followUps';
    else if (hasMeeting) sectionType = 'schedule';

    return [{
      content: input.trim(),
      sectionType,
      priority: hasHighPriority ? 'P1' : undefined
    }];
  }

  private getTimeOfDay(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  }
}
