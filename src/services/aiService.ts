import { aiServiceManager } from './ai';
import type { TaskSuggestion, AIContext, AIProviderType } from './ai/types';

interface AIServiceConfig {
  apiKey: string;
  provider?: AIProviderType;
}

export class AIService {
  private context: AIContext = {
    currentTasks: [],
    projects: [],
    currentDate: new Date().toISOString().split('T')[0]
  };

  constructor(config: AIServiceConfig) {
    this.initialize(config);
  }

  async initialize(config: AIServiceConfig) {
    // Use secure proxy by default in production, direct providers in development
    const provider = config.provider || (import.meta.env.PROD ? 'custom' : 'anthropic');
    
    const providerConfig = {
      apiKey: config.apiKey,
      baseUrl: import.meta.env.VITE_API_BASE_URL
    };
    
    await aiServiceManager.setActiveProvider(provider, providerConfig);
  }

  async reconfigure(apiKey: string, provider?: AIProviderType) {
    const providerType = provider || 'anthropic';
    await aiServiceManager.setActiveProvider(providerType, {
      apiKey
    });
  }

  updateContext(context: Partial<AIContext>) {
    this.context = { ...this.context, ...context };
    aiServiceManager.updateContext(context);
  }

  async parseNaturalLanguage(input: string): Promise<TaskSuggestion[]> {
    return aiServiceManager.parseNaturalLanguage(input);
  }

  async processNaturalLanguageCommand(input: string) {
    return aiServiceManager.processNaturalLanguageCommand(input);
  }

  async generateDailyInsights(): Promise<string> {
    return aiServiceManager.generateDailyInsights();
  }

  // Get available AI providers
  getAvailableProviders() {
    return aiServiceManager.getAvailableProviders();
  }

  // Get current provider info
  getCurrentProvider() {
    return aiServiceManager.getActiveProvider();
  }

  // Check if AI service is healthy
  async isHealthy(): Promise<boolean> {
    return aiServiceManager.isHealthy();
  }

  // Get current provider capabilities
  getCapabilities() {
    return aiServiceManager.getCapabilities();
  }
}

// Export singleton instance that will be configured with API key
// In production, use secure proxy with JWT token
const apiKey = import.meta.env.VITE_API_TOKEN || 'dev-token';
export const aiService = new AIService({ 
  apiKey,
  provider: 'custom' // Use secure proxy by default
});