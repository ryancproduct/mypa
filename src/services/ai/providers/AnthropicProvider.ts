import Anthropic from '@anthropic-ai/sdk';
import { BaseAIProvider } from '../BaseAIProvider';
import type { 
  AIProviderConfig, 
  AIMessage, 
  AIResponse, 
  AIGenerationOptions, 
  AICapabilities
} from '../types';

export class AnthropicProvider extends BaseAIProvider {
  readonly name = 'Anthropic Claude';
  readonly models = [
    'claude-3-5-sonnet-20241022',
    'claude-3-5-haiku-20241022', 
    'claude-3-haiku-20240307',
    'claude-3-sonnet-20240229',
    'claude-3-opus-20240229'
  ];

  private client: Anthropic | null = null;

  constructor() {
    super({
      type: 'anthropic',
      name: 'Anthropic Claude',
      description: 'Claude AI models by Anthropic - excellent for reasoning and analysis',
      defaultModel: 'claude-3-5-haiku-20241022',
      requiresApiKey: true,
      supportedFeatures: ['text-generation', 'reasoning', 'analysis', 'coding']
    });
  }

  protected async initializeProvider(config: AIProviderConfig): Promise<void> {
    this.client = new Anthropic({
      apiKey: config.apiKey,
      // TODO: Remove dangerouslyAllowBrowser in production - use backend proxy
      dangerouslyAllowBrowser: true
    });
  }

  async generateResponse(messages: AIMessage[], options?: AIGenerationOptions): Promise<AIResponse> {
    this.ensureInitialized();
    
    try {
      const mergedOptions = this.mergeOptions(options);
      const formattedMessages = this.formatMessages(messages);
      
      const response = await this.client!.messages.create({
        model: mergedOptions.model!,
        max_tokens: mergedOptions.maxTokens!,
        temperature: mergedOptions.temperature,
        messages: formattedMessages
      });

      return this.parseResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }


  protected parseResponse(response: Anthropic.Message): AIResponse {
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
                   response.stop_reason === 'max_tokens' ? 'length' : 
                   'stop'
    };
  }

  async isHealthy(): Promise<boolean> {
    if (!this.initialized || !this.client) {
      return false;
    }

    try {
      // Simple health check with minimal token usage
      await this.client.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hi' }]
      });
      return true;
    } catch (error) {
      console.warn('Anthropic health check failed:', error);
      return false;
    }
  }

  getCapabilities(): AICapabilities {
    return {
      supportsStreaming: true,
      supportsSystemMessages: true,
      supportsFunctionCalling: false, // Claude doesn't have function calling like OpenAI
      maxContextLength: 200000, // Claude 3 context window
      supportedModalities: ['text']
    };
  }

  protected getDefaultOptions(): AIGenerationOptions {
    return {
      model: 'claude-3-5-haiku-20241022',
      maxTokens: 1000,
      temperature: 0.7
    };
  }

  /**
   * Anthropic-specific method to handle system messages
   * System messages need to be prepended to the first user message
   */
  private handleSystemMessage(messages: AIMessage[]): AIMessage[] {
    const systemMessages = messages.filter(msg => msg.role === 'system');
    const otherMessages = messages.filter(msg => msg.role !== 'system');
    
    if (systemMessages.length === 0) {
      return otherMessages;
    }
    
    // Combine system messages with first user message
    const systemContent = systemMessages.map(msg => msg.content).join('\n\n');
    const firstUserMessage = otherMessages.find(msg => msg.role === 'user');
    
    if (!firstUserMessage) {
      // No user message, create one with system content
      return [
        { role: 'user', content: systemContent },
        ...otherMessages
      ];
    }
    
    // Prepend system content to first user message
    const updatedMessages = otherMessages.map(msg => 
      msg === firstUserMessage 
        ? { ...msg, content: `${systemContent}\n\n${msg.content}` }
        : msg
    );
    
    return updatedMessages;
  }

  /**
   * Override formatMessages to handle system messages properly
   */
  protected formatMessages(messages: AIMessage[]): Anthropic.MessageParam[] {
    const processedMessages = this.handleSystemMessage(messages);
    
    return processedMessages.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content
    }));
  }
}
