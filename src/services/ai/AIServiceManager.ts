import type { 
  AIProvider, 
  AIProviderConfig, 
  AIMessage, 
  AIResponse, 
  AIGenerationOptions,
  AIProviderType,
  TaskSuggestion,
  AICommandResult,
  AIContext
} from './types';

import { AnthropicProvider } from './providers/AnthropicProvider';
import { OpenAIProvider } from './providers/OpenAIProvider';
import { ProxyProvider } from './providers/ProxyProvider';

/**
 * Central AI service that manages multiple AI providers
 * Provides a unified interface for all AI operations
 */
export class AIServiceManager {
  private providers = new Map<AIProviderType, AIProvider>();
  private activeProvider: AIProvider | null = null;
  private context: AIContext = {
    currentTasks: [],
    projects: [],
    currentDate: new Date().toISOString().split('T')[0]
  };

  constructor() {
    // Register available providers
    this.registerProvider('anthropic', new AnthropicProvider());
    this.registerProvider('openai', new OpenAIProvider());
    this.registerProvider('custom', new ProxyProvider()); // Secure proxy provider
  }

  /**
   * Register a new AI provider
   */
  registerProvider(type: AIProviderType, provider: AIProvider): void {
    this.providers.set(type, provider);
  }

  /**
   * Get list of available providers
   */
  getAvailableProviders(): Array<{ type: AIProviderType; name: string; metadata: any }> {
    return Array.from(this.providers.entries()).map(([type, provider]) => ({
      type,
      name: provider.name,
      metadata: (provider as any).getMetadata?.() || {}
    }));
  }

  /**
   * Initialize and set active provider
   */
  async setActiveProvider(type: AIProviderType, config: AIProviderConfig): Promise<void> {
    const provider = this.providers.get(type);
    if (!provider) {
      throw new Error(`Provider ${type} not found. Available: ${Array.from(this.providers.keys()).join(', ')}`);
    }

    await provider.initialize(config);
    this.activeProvider = provider;
  }

  /**
   * Get current active provider
   */
  getActiveProvider(): AIProvider | null {
    return this.activeProvider;
  }

  /**
   * Update context for AI operations
   */
  updateContext(context: Partial<AIContext>): void {
    this.context = { ...this.context, ...context };
  }

  /**
   * Generate a response using the active provider
   */
  async generateResponse(messages: AIMessage[], options?: AIGenerationOptions): Promise<AIResponse> {
    if (!this.activeProvider) {
      throw new Error('No active AI provider. Call setActiveProvider() first.');
    }

    return this.activeProvider.generateResponse(messages, options);
  }

  /**
   * Parse natural language input into structured tasks
   */
  async parseNaturalLanguage(input: string): Promise<TaskSuggestion[]> {
    const contextString = this.buildContextString();
    
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: `You are MyPA, a personal productivity assistant. Parse natural language input into structured tasks.`
      },
      {
        role: 'user',
        content: `CURRENT CONTEXT:
${contextString}

USER INPUT: "${input}"

Parse this into tasks and respond with a JSON array of task objects. Each task should have:
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

Respond only with valid JSON array, no other text:`
      }
    ];

    try {
      const response = await this.generateResponse(messages, { maxTokens: 1000 });
      
      try {
        const parsed = JSON.parse(response.content);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch (e) {
        console.error('Failed to parse AI response:', response.content);
        return this.fallbackTaskParsing(input);
      }
    } catch (error) {
      console.error('AI parsing error:', error);
      return this.fallbackTaskParsing(input);
    }
  }

  /**
   * Process natural language commands
   */
  async processNaturalLanguageCommand(input: string): Promise<AICommandResult> {
    const contextString = this.buildContextString();
    
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: `You are MyPA, a personal productivity assistant helping Ryan manage his daily tasks.`
      },
      {
        role: 'user',
        content: `CURRENT CONTEXT:
${contextString}

USER INPUT: "${input}"

Analyze this input and determine what the user wants to do. Respond with JSON in this format:

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

For queries, include relevant information about what they're asking for.
For task creation, include the task objects as defined earlier.

Respond only with valid JSON:`
      }
    ];

    try {
      const response = await this.generateResponse(messages, { maxTokens: 1500 });
      
      try {
        return JSON.parse(response.content);
      } catch (e) {
        console.error('Failed to parse AI command response:', response.content);
        return {
          type: 'unknown',
          response: 'I had trouble understanding that. Could you rephrase?'
        };
      }
    } catch (error) {
      console.error('AI command processing error:', error);
      return {
        type: 'unknown',
        response: 'I encountered an error. Please try again.'
      };
    }
  }

  /**
   * Generate daily insights
   */
  async generateDailyInsights(): Promise<string> {
    const contextString = this.buildContextString();
    
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: `You are MyPA, Ryan's personal productivity assistant. Review his current tasks and provide brief, actionable insights.`
      },
      {
        role: 'user',
        content: `CURRENT CONTEXT:
${contextString}

Provide a concise daily insight focusing on:
1. Priority items that need attention
2. Any overdue tasks
3. Potential scheduling conflicts
4. One actionable suggestion for the day

Keep it brief, friendly, and actionable. Start with "Good ${this.getTimeOfDay()}! Here's your daily overview:"`
      }
    ];

    try {
      const response = await this.generateResponse(messages, { maxTokens: 800 });
      return response.content;
    } catch (error) {
      console.error('Daily insights error:', error);
      return 'Have a productive day! I\'m here to help manage your tasks.';
    }
  }

  /**
   * Check if the active provider is healthy
   */
  async isHealthy(): Promise<boolean> {
    if (!this.activeProvider) {
      return false;
    }
    
    return this.activeProvider.isHealthy();
  }

  /**
   * Get capabilities of the active provider
   */
  getCapabilities() {
    if (!this.activeProvider) {
      return null;
    }
    
    return this.activeProvider.getCapabilities();
  }

  /**
   * Switch to a fallback provider if the current one fails
   */
  async switchToFallback(): Promise<boolean> {
    // Implementation for automatic fallback logic
    // This could try different providers in order of preference
    return false;
  }

  // Private helper methods
  private buildContextString(): string {
    const { currentTasks, projects, currentDate, dailySection } = this.context;
    
    const overdueTasks = currentTasks.filter(task => 
      task.dueDate && new Date(task.dueDate) < new Date(currentDate) && task.status !== 'completed'
    );
    
    const todayTasks = currentTasks.filter(task =>
      task.dueDate === currentDate && task.status !== 'completed'
    );

    return `
Current Date: ${currentDate}
Active Projects: ${projects.map((p: any) => `${p.tag} (${p.name})`).join(', ')}
Total Pending Tasks: ${currentTasks.filter((t: any) => t.status !== 'completed').length}
Overdue Tasks: ${overdueTasks.length}
Due Today: ${todayTasks.length}
Today's Priorities: ${dailySection?.priorities?.length || 0}/3
`;
  }

  private fallbackTaskParsing(input: string): TaskSuggestion[] {
    // Simple fallback parsing
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

// Export singleton instance
export const aiServiceManager = new AIServiceManager();
