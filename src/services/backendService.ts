/**
 * Backend Service Abstraction
 *
 * This service provides a clean interface for backend API calls.
 * Currently uses direct Anthropic API calls (development only),
 * but can be easily switched to use a backend proxy in production.
 */

import { aiService } from './aiService';
import type { Task, DailySection, Project } from '../types';

export interface BackendConfig {
  baseUrl?: string;
  apiKey?: string;
  mode: 'development' | 'production';
}

export interface TaskSuggestion {
  content: string;
  project?: string;
  assignee?: string;
  priority?: 'P1' | 'P2' | 'P3';
  dueDate?: string;
  sectionType: 'priorities' | 'schedule' | 'followUps';
}

export interface AIResponse {
  type: 'create_tasks' | 'query' | 'update' | 'unknown';
  tasks?: TaskSuggestion[];
  response?: string;
  query?: any;
}

class BackendService {
  private config: BackendConfig;

  constructor(config: BackendConfig = { mode: 'development' }) {
    this.config = config;
  }

  /**
   * Configure the service for different environments
   */
  configure(config: Partial<BackendConfig>) {
    this.config = { ...this.config, ...config };

    // In development, configure the AI service directly
    if (this.config.mode === 'development' && this.config.apiKey) {
      aiService.reconfigure(this.config.apiKey);
    }
  }

  /**
   * Process natural language commands
   * In production, this would call a backend API endpoint
   */
  async processCommand(input: string, context?: {
    currentTasks: Task[];
    projects: Project[];
    currentDate: string;
    dailySection?: DailySection;
  }): Promise<AIResponse> {
    if (this.config.mode === 'production' && this.config.baseUrl) {
      // Production: Call backend API
      return this.callBackendAPI('/api/ai/process-command', {
        input,
        context
      });
    } else {
      // Development: Use direct AI service
      if (context) {
        aiService.updateContext(context);
      }
      return aiService.processNaturalLanguageCommand(input);
    }
  }

  /**
   * Parse natural language into tasks
   */
  async parseNaturalLanguage(input: string): Promise<TaskSuggestion[]> {
    if (this.config.mode === 'production' && this.config.baseUrl) {
      // Production: Call backend API
      const response = await this.callBackendAPI('/api/ai/parse-tasks', { input });
      return response.tasks || [];
    } else {
      // Development: Use direct AI service
      return aiService.parseNaturalLanguage(input);
    }
  }

  /**
   * Generate daily insights
   */
  async generateInsights(): Promise<string> {
    if (this.config.mode === 'production' && this.config.baseUrl) {
      // Production: Call backend API
      const response = await this.callBackendAPI('/api/ai/generate-insights');
      return response.insights || 'Have a productive day!';
    } else {
      // Development: Use direct AI service
      return aiService.generateDailyInsights();
    }
  }

  /**
   * Sync tasks with backend storage
   * This would replace local storage in production
   */
  async syncTasks(tasks: Task[]): Promise<{ success: boolean; error?: string }> {
    if (this.config.mode === 'production' && this.config.baseUrl) {
      // Production: Sync with backend
      try {
        await this.callBackendAPI('/api/tasks/sync', { tasks });
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Sync failed'
        };
      }
    } else {
      // Development: Mock successful sync
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({ success: true });
        }, 500 + Math.random() * 1000); // Simulate network delay
      });
    }
  }

  /**
   * Load tasks from backend storage
   */
  async loadTasks(): Promise<{ tasks: Task[]; error?: string }> {
    if (this.config.mode === 'production' && this.config.baseUrl) {
      // Production: Load from backend
      try {
        const response = await this.callBackendAPI('/api/tasks/load');
        return { tasks: response.tasks || [] };
      } catch (error) {
        return {
          tasks: [],
          error: error instanceof Error ? error.message : 'Load failed'
        };
      }
    } else {
      // Development: Return empty tasks (using local storage instead)
      return { tasks: [] };
    }
  }

  /**
   * Generic method to call backend API endpoints
   */
  private async callBackendAPI(endpoint: string, data?: any): Promise<any> {
    if (!this.config.baseUrl) {
      throw new Error('Backend base URL not configured');
    }

    const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add authentication headers as needed
        ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
      },
      body: data ? JSON.stringify(data) : undefined
    });

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Check backend service health
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; latency?: number }> {
    if (this.config.mode === 'production' && this.config.baseUrl) {
      try {
        const start = Date.now();
        await fetch(`${this.config.baseUrl}/api/health`);
        const latency = Date.now() - start;
        return { status: 'healthy', latency };
      } catch {
        return { status: 'unhealthy' };
      }
    } else {
      // Development: Always healthy
      return { status: 'healthy', latency: 50 };
    }
  }
}

// Export singleton instance
export const backendService = new BackendService({
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  baseUrl: process.env.VITE_BACKEND_URL // Will be undefined in development
});

// Configuration helper
export const configureBackend = (config: Partial<BackendConfig>) => {
  backendService.configure(config);
};