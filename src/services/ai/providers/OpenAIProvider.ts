import { BaseAIProvider } from '../BaseAIProvider';
import type { 
  AIProviderConfig, 
  AIMessage, 
  AIResponse, 
  AIGenerationOptions, 
  AICapabilities 
} from '../types';

// OpenAI API types (simplified - in real implementation you'd use the official SDK)
interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model: string;
}

export class OpenAIProvider extends BaseAIProvider {
  readonly name = 'OpenAI GPT';
  readonly models = [
    'gpt-4o',
    'gpt-4o-mini',
    'gpt-4-turbo',
    'gpt-4',
    'gpt-3.5-turbo'
  ];

  private apiKey: string | null = null;
  private baseUrl: string = 'https://api.openai.com/v1';

  constructor() {
    super({
      type: 'openai',
      name: 'OpenAI GPT',
      description: 'GPT models by OpenAI - versatile and widely supported',
      defaultModel: 'gpt-4o-mini',
      requiresApiKey: true,
      supportedFeatures: ['text-generation', 'function-calling', 'reasoning', 'coding']
    });
  }

  protected async initializeProvider(config: AIProviderConfig): Promise<void> {
    this.apiKey = config.apiKey;
    if (config.baseUrl) {
      this.baseUrl = config.baseUrl;
    }
  }

  async generateResponse(messages: AIMessage[], options?: AIGenerationOptions): Promise<AIResponse> {
    this.ensureInitialized();
    
    try {
      const mergedOptions = this.mergeOptions(options);
      const formattedMessages = this.formatMessages(messages);
      
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: mergedOptions.model,
          messages: formattedMessages,
          max_tokens: mergedOptions.maxTokens,
          temperature: mergedOptions.temperature,
          stop: mergedOptions.stopSequences
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data: OpenAIResponse = await response.json();
      return this.parseResponse(data);
    } catch (error) {
      this.handleError(error);
    }
  }

  protected formatMessages(messages: AIMessage[]): OpenAIMessage[] {
    return messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
  }

  protected parseResponse(response: OpenAIResponse): AIResponse {
    const choice = response.choices[0];
    
    if (!choice || !choice.message) {
      throw new Error('Invalid response from OpenAI');
    }

    return {
      content: choice.message.content,
      usage: {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens
      },
      model: response.model,
      finishReason: choice.finish_reason === 'stop' ? 'stop' :
                   choice.finish_reason === 'length' ? 'length' :
                   choice.finish_reason === 'content_filter' ? 'content_filter' :
                   'stop'
    };
  }

  async isHealthy(): Promise<boolean> {
    if (!this.initialized || !this.apiKey) {
      return false;
    }

    try {
      // Simple health check with minimal token usage
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'Hi' }],
          max_tokens: 5
        })
      });

      return response.ok;
    } catch (error) {
      console.warn('OpenAI health check failed:', error);
      return false;
    }
  }

  getCapabilities(): AICapabilities {
    return {
      supportsStreaming: true,
      supportsSystemMessages: true,
      supportsFunctionCalling: true,
      maxContextLength: 128000, // GPT-4 context window
      supportedModalities: ['text']
    };
  }

  protected getDefaultOptions(): AIGenerationOptions {
    return {
      model: 'gpt-4o-mini',
      maxTokens: 1000,
      temperature: 0.7
    };
  }
}
