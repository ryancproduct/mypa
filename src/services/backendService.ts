/**
 * Backend Service Abstraction
 *
 * Routes AI-related calls through the secure backend gateway when available
 * and falls back to direct Anthropic access in development.
 */

import { TIMEZONE_CONFIG } from '../config/app';
import type { Task, DailySection, Project } from '../types';
import { aiService } from './aiService';

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
  query?: unknown;
  confidence?: number;
  processingTimeMs?: number;
}

interface BackendTaskSuggestion {
  content: string;
  project?: string;
  assignee?: string;
  priority?: 'P1' | 'P2' | 'P3';
  due_date?: string | null;
  section_type: 'priorities' | 'schedule' | 'followUps';
}

interface BackendParseResponse {
  tasks: BackendTaskSuggestion[];
  confidence: number;
  processing_time_ms: number;
}

interface BackendCommandResponse {
  type: 'create_tasks' | 'query' | 'update' | 'unknown';
  response: string;
  tasks?: BackendTaskSuggestion[];
  query?: unknown;
  confidence: number;
  processing_time_ms: number;
}

interface BackendDailyInsightsResponse {
  insights: string;
  priority_suggestions: string[];
  warning_flags: string[];
  processing_time_ms: number;
}

export interface AIContextInput {
  currentTasks: Task[];
  projects: Project[];
  currentDate: string;
  dailySection?: DailySection;
  timezone?: string;
}

const hasBackendUrl = Boolean(import.meta.env.VITE_API_BASE_URL);
const defaultMode: 'development' | 'production' = hasBackendUrl
  ? 'production'
  : import.meta.env.PROD
    ? 'production'
    : 'development';

class BackendService {
  private config: BackendConfig;

  constructor(config: BackendConfig) {
    this.config = {
      ...config,
      baseUrl: this.normalizeBaseUrl(config.baseUrl),
    };
  }

  configure(config: Partial<BackendConfig>) {
    const nextConfig: BackendConfig = {
      ...this.config,
      ...config,
      baseUrl: this.normalizeBaseUrl(config.baseUrl ?? this.config.baseUrl),
    };

    this.config = nextConfig;

    if (!this.isBackendMode(nextConfig)) {
      aiService.reconfigure(nextConfig.apiKey || '');
    }
  }

  async processCommand(input: string, context?: AIContextInput): Promise<AIResponse> {
    const backendContext = this.mapContextForBackend(context);

    if (this.isBackendMode()) {
      const response = await this.callBackendAPI<BackendCommandResponse>('/ai/process-command', {
        method: 'POST',
        data: {
          input,
          context: backendContext,
        },
      });

      return {
        type: response.type,
        response: response.response,
        query: response.query,
        tasks: response.tasks?.map(this.normalizeTaskSuggestion),
        confidence: response.confidence,
        processingTimeMs: response.processing_time_ms,
      };
    }

    if (context) {
      aiService.updateContext({
        currentTasks: context.currentTasks,
        projects: context.projects,
        currentDate: context.currentDate,
        dailySection: context.dailySection,
      });
    }

    const fallback = await aiService.processNaturalLanguageCommand(input);
    return fallback;
  }

  async parseNaturalLanguage(input: string, context?: AIContextInput): Promise<TaskSuggestion[]> {
    const backendContext = this.mapContextForBackend(context);

    if (this.isBackendMode()) {
      const response = await this.callBackendAPI<BackendParseResponse>('/ai/parse-natural-language', {
        method: 'POST',
        data: {
          input,
          context: backendContext,
        },
      });

      return response.tasks?.map(this.normalizeTaskSuggestion) ?? [];
    }

    if (context) {
      aiService.updateContext({
        currentTasks: context.currentTasks,
        projects: context.projects,
        currentDate: context.currentDate,
        dailySection: context.dailySection,
      });
    }

    return aiService.parseNaturalLanguage(input);
  }

  async generateInsights(context?: AIContextInput): Promise<string> {
    const backendContext = this.mapContextForBackend(context);

    if (this.isBackendMode()) {
      const response = await this.callBackendAPI<BackendDailyInsightsResponse>('/ai/daily-insights', {
        method: 'POST',
        data: {
          context: backendContext,
        },
      });

      return response.insights ?? 'Have a productive day!';
    }

    if (context) {
      aiService.updateContext({
        currentTasks: context.currentTasks,
        projects: context.projects,
        currentDate: context.currentDate,
        dailySection: context.dailySection,
      });
    }

    return aiService.generateDailyInsights();
  }

  async syncTasks(tasks: Task[]): Promise<{ success: boolean; error?: string }> {
    if (this.isBackendMode()) {
      try {
        await this.callBackendAPI('/tasks/sync', {
          method: 'POST',
          data: { tasks },
        });
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Sync failed',
        };
      }
    }

    // Development fallback simulates latency
    return new Promise(resolve => {
      setTimeout(() => resolve({ success: true }), 500 + Math.random() * 1000);
    });
  }

  async loadTasks(): Promise<{ tasks: Task[]; error?: string }> {
    if (this.isBackendMode()) {
      try {
        const response = await this.callBackendAPI<{ tasks?: Task[] }>('/tasks/load', {
          method: 'POST',
        });
        return { tasks: response.tasks || [] };
      } catch (error) {
        return {
          tasks: [],
          error: error instanceof Error ? error.message : 'Load failed',
        };
      }
    }

    return { tasks: [] };
  }

  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; latency?: number }> {
    if (this.isBackendMode()) {
      try {
        const start = performance.now();
        await this.callBackendAPI('/ai/health', { method: 'GET' });
        const latency = Math.round(performance.now() - start);
        return { status: 'healthy', latency };
      } catch {
        return { status: 'unhealthy' };
      }
    }

    return { status: 'healthy', latency: 50 };
  }

  private normalizeTaskSuggestion = (suggestion: BackendTaskSuggestion): TaskSuggestion => ({
    content: suggestion.content,
    project: suggestion.project || undefined,
    assignee: suggestion.assignee || undefined,
    priority: suggestion.priority,
    dueDate: suggestion.due_date || undefined,
    sectionType: suggestion.section_type,
  });

  private mapContextForBackend(context?: AIContextInput) {
    if (!context) {
      return undefined;
    }

    return {
      current_tasks: this.mapTasksForBackend(context.currentTasks),
      projects: context.projects.map(project => ({
        id: project.id,
        name: project.name,
        tag: project.tag,
        description: project.description,
        color: project.color,
      })),
      current_date: context.currentDate,
      daily_section: this.mapDailySectionForBackend(context.dailySection),
      user_timezone: context.timezone || TIMEZONE_CONFIG.default,
    };
  }

  private mapTasksForBackend(tasks: Task[]) {
    return tasks.map(task => this.mapTaskForBackend(task));
  }

  private mapTaskForBackend(task: Task) {
    return {
      id: task.id,
      content: task.content,
      status: task.status,
      project: task.project,
      assignee: task.assignee,
      priority: task.priority,
      due_date: task.dueDate,
      created_at: task.createdAt,
      updated_at: task.updatedAt,
      completed_at: task.completedAt,
      rolled_from_date: task.rolledFromDate,
      notes: task.notes?.map(note => ({
        id: note.id,
        content: note.content,
        timestamp: note.timestamp,
      })),
    };
  }

  private mapDailySectionForBackend(section?: DailySection) {
    if (!section) {
      return undefined;
    }

    return {
      id: section.id,
      date: section.date,
      priorities: section.priorities.map(task => this.mapTaskForBackend(task)),
      schedule: section.schedule.map(task => this.mapTaskForBackend(task)),
      follow_ups: section.followUps.map(task => this.mapTaskForBackend(task)),
      completed: section.completed.map(task => this.mapTaskForBackend(task)),
      notes: section.notes?.map(note => ({
        id: note.id,
        content: note.content,
        timestamp: note.timestamp,
      })),
      blockers: section.blockers?.map(blocker => ({
        id: blocker.id,
        content: blocker.content,
        next_step: blocker.nextStep,
        created_at: blocker.createdAt,
      })),
    };
  }

  private isBackendMode(config: BackendConfig = this.config): boolean {
    return Boolean(config.mode === 'production' && config.baseUrl);
  }

  private normalizeBaseUrl(url?: string) {
    if (!url) {
      return undefined;
    }

    return url.replace(/\/+$/, '');
  }

  private async callBackendAPI<T>(endpoint: string, options: { method?: 'GET' | 'POST'; data?: unknown } = {}): Promise<T> {
    if (!this.config.baseUrl) {
      throw new Error('Backend base URL not configured');
    }

    const method = options.method ?? 'POST';
    const url = `${this.config.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };

    if (method !== 'GET') {
      headers['Content-Type'] = 'application/json';
    }

    if (this.config.apiKey) {
      headers['X-API-Key'] = this.config.apiKey;
    }

    const response = await fetch(url, {
      method,
      headers,
      body: method !== 'GET' && options.data ? JSON.stringify(options.data) : undefined,
    });

    if (!response.ok) {
      let errorDetail = '';
      try {
        errorDetail = await response.text();
      } catch (error) {
        errorDetail = String(error);
      }
      throw new Error(`Backend API error: ${response.status} ${response.statusText}${errorDetail ? ` - ${errorDetail}` : ''}`);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return (await response.json()) as T;
    }

    return undefined as T;
  }
}

const defaultBaseUrl = typeof import.meta.env.VITE_API_BASE_URL === 'string'
  ? String(import.meta.env.VITE_API_BASE_URL)
  : undefined;

export const backendService = new BackendService({
  mode: defaultMode,
  baseUrl: defaultBaseUrl,
  apiKey: undefined,
});

export const configureBackend = (config: Partial<BackendConfig>) => {
  backendService.configure(config);
};
