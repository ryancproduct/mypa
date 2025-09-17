import type { 
  AIProvider, 
  AIProviderConfig, 
  AIMessage, 
  AIResponse, 
  AIGenerationOptions, 
  AICapabilities,
  AIProviderMetadata 
} from './types';

/**
 * Abstract base class for AI providers
 * Provides common functionality and enforces interface compliance
 */
export abstract class BaseAIProvider implements AIProvider {
  protected config: AIProviderConfig | null = null;
  protected initialized = false;

  abstract readonly name: string;
  abstract readonly models: string[];

  protected metadata: AIProviderMetadata;
  
  constructor(metadata: AIProviderMetadata) {
    this.metadata = metadata;
  }

  async initialize(config: AIProviderConfig): Promise<void> {
    this.validateConfig(config);
    this.config = config;
    await this.initializeProvider(config);
    this.initialized = true;
  }

  abstract generateResponse(messages: AIMessage[], options?: AIGenerationOptions): Promise<AIResponse>;
  abstract getCapabilities(): AICapabilities;
  abstract isHealthy(): Promise<boolean>;

  /**
   * Provider-specific initialization logic
   */
  protected abstract initializeProvider(config: AIProviderConfig): Promise<void>;

  /**
   * Validate configuration for this provider
   */
  protected validateConfig(config: AIProviderConfig): void {
    if (this.metadata.requiresApiKey && !config.apiKey) {
      throw new Error(`API key is required for ${this.name} provider`);
    }
  }

  /**
   * Ensure provider is initialized before use
   */
  protected ensureInitialized(): void {
    if (!this.initialized || !this.config) {
      throw new Error(`${this.name} provider not initialized. Call initialize() first.`);
    }
  }

  /**
   * Get provider metadata
   */
  getMetadata(): AIProviderMetadata {
    return { ...this.metadata };
  }

  /**
   * Format messages for provider-specific API
   */
  protected abstract formatMessages(messages: AIMessage[]): any;

  /**
   * Parse provider-specific response to standard format
   */
  protected abstract parseResponse(response: any): AIResponse;

  /**
   * Handle provider-specific errors
   */
  protected handleError(error: any): never {
    console.error(`${this.name} provider error:`, error);
    
    // Standardize common error types
    if (error.status === 401 || error.message?.includes('unauthorized')) {
      throw new Error(`Authentication failed for ${this.name}. Check your API key.`);
    }
    
    if (error.status === 429 || error.message?.includes('rate limit')) {
      throw new Error(`Rate limit exceeded for ${this.name}. Please try again later.`);
    }
    
    if (error.status === 400 || error.message?.includes('invalid')) {
      throw new Error(`Invalid request to ${this.name}: ${error.message}`);
    }
    
    // Generic error
    throw new Error(`${this.name} provider error: ${error.message || 'Unknown error'}`);
  }

  /**
   * Get default generation options for this provider
   */
  protected getDefaultOptions(): AIGenerationOptions {
    return {
      model: this.metadata.defaultModel,
      maxTokens: 1000,
      temperature: 0.7
    };
  }

  /**
   * Merge user options with defaults
   */
  protected mergeOptions(options?: AIGenerationOptions): AIGenerationOptions {
    return {
      ...this.getDefaultOptions(),
      ...options
    };
  }
}
