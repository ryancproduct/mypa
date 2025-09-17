import { BaseAIProvider } from '../BaseAIProvider';
import type { 
  AIProviderConfig, 
  AIMessage, 
  AIResponse, 
  AIGenerationOptions, 
  AICapabilities 
} from '../types';

/**
 * Secure proxy provider that routes AI requests through backend API
 * This eliminates the need to expose API keys in the browser
 */
export class ProxyProvider extends BaseAIProvider {
  readonly name = 'Secure Proxy';
  readonly models = ['anthropic', 'openai']; // Available backend providers

  private apiBaseUrl: string = '';
  private apiKey: string = '';

  constructor() {
    super({
      type: 'custom',
      name: 'Secure Proxy',
      description: 'Secure backend proxy for AI providers - no API keys exposed',
      defaultModel: 'openai',
      requiresApiKey: true,
      supportedFeatures: ['text-generation', 'reasoning', 'analysis', 'secure-proxy']
    });
  }

  protected async initializeProvider(config: AIProviderConfig): Promise<void> {
    this.apiBaseUrl = config.baseUrl || import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
    this.apiKey = config.apiKey; // This is now a JWT token, not an AI provider API key
  }

  async generateResponse(messages: AIMessage[], options?: AIGenerationOptions): Promise<AIResponse> {
    this.ensureInitialized();
    
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/v1/ai/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          messages,
          provider: options?.model || 'openai', // Use OpenAI as default provider
          options: {
            ...options,
            model: undefined // Remove model from options since we use it for provider selection
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Parse natural language input into structured tasks
   */
  async parseNaturalLanguage(input: string, provider: string = 'anthropic'): Promise<any[]> {
    this.ensureInitialized();
    
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/v1/ai/parse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          input,
          provider
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Process natural language commands
   */
  async processNaturalLanguageCommand(input: string, provider: string = 'anthropic'): Promise<any> {
    this.ensureInitialized();
    
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/v1/ai/command`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          input,
          provider
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Generate daily insights
   */
  async generateDailyInsights(provider: string = 'anthropic'): Promise<string> {
    this.ensureInitialized();
    
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/v1/ai/insights`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          provider
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data.insights;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get available providers from backend
   */
  async getAvailableProviders(): Promise<any[]> {
    this.ensureInitialized();
    
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/v1/ai/providers`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.warn('Failed to get available providers:', error);
      return [];
    }
  }

  async isHealthy(): Promise<boolean> {
    if (!this.initialized) {
      return false;
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/health`, {
        method: 'GET'
      });

      return response.ok;
    } catch (error) {
      console.warn('Proxy health check failed:', error);
      return false;
    }
  }

  /**
   * Check specific provider health
   */
  async checkProviderHealth(provider: string): Promise<boolean> {
    this.ensureInitialized();
    
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/v1/ai/health/${provider}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.data.healthy;
    } catch (error) {
      console.warn(`Provider ${provider} health check failed:`, error);
      return false;
    }
  }

  getCapabilities(): AICapabilities {
    return {
      supportsStreaming: false, // Not implemented yet
      supportsSystemMessages: true,
      supportsFunctionCalling: false, // Depends on backend provider
      maxContextLength: 200000, // Depends on backend provider
      supportedModalities: ['text']
    };
  }

  protected formatMessages(messages: AIMessage[]): any {
    // No formatting needed - backend handles this
    return messages;
  }

  protected parseResponse(response: any): AIResponse {
    // No parsing needed - backend returns standardized format
    return response;
  }

  protected getDefaultOptions(): AIGenerationOptions {
    return {
      model: 'anthropic', // Default to Anthropic provider
      maxTokens: 1000,
      temperature: 0.7
    };
  }
}
