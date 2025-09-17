// AI Provider Types and Interfaces

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model?: string;
  finishReason?: 'stop' | 'length' | 'content_filter' | 'tool_calls';
}

export interface AIProviderConfig {
  apiKey: string;
  baseUrl?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  timeout?: number;
}

export interface AIProvider {
  readonly name: string;
  readonly models: string[];
  
  // Core methods
  initialize(config: AIProviderConfig): Promise<void>;
  generateResponse(messages: AIMessage[], options?: AIGenerationOptions): Promise<AIResponse>;
  
  // Health check
  isHealthy(): Promise<boolean>;
  
  // Provider-specific capabilities
  getCapabilities(): AICapabilities;
}

export interface AIGenerationOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  stopSequences?: string[];
  stream?: boolean;
}

export interface AICapabilities {
  supportsStreaming: boolean;
  supportsSystemMessages: boolean;
  supportsFunctionCalling: boolean;
  maxContextLength: number;
  supportedModalities: ('text' | 'image' | 'audio')[];
}

export type AIProviderType = 'anthropic' | 'openai' | 'google' | 'local' | 'custom';

export interface AIProviderMetadata {
  type: AIProviderType;
  name: string;
  description: string;
  defaultModel: string;
  requiresApiKey: boolean;
  supportedFeatures: string[];
}

// Task-specific types (existing from current service)
export interface TaskSuggestion {
  content: string;
  project?: string;
  assignee?: string;
  priority?: 'P1' | 'P2' | 'P3';
  dueDate?: string;
  sectionType: 'priorities' | 'schedule' | 'followUps';
}

export interface AICommandResult {
  type: 'create_tasks' | 'query' | 'update' | 'unknown';
  tasks?: TaskSuggestion[];
  response?: string;
  query?: any;
}

export interface AIContext {
  currentTasks: any[];
  projects: any[];
  currentDate: string;
  dailySection?: any;
}
