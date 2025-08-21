import Anthropic from '@anthropic-ai/sdk';
import type { Task, DailySection, Project } from '../types';

interface AIServiceConfig {
  apiKey: string;
}

interface TaskSuggestion {
  content: string;
  project?: string;
  assignee?: string;
  priority?: 'P1' | 'P2' | 'P3';
  dueDate?: string;
  sectionType: 'priorities' | 'schedule' | 'followUps';
}

interface AIContext {
  currentTasks: Task[];
  projects: Project[];
  currentDate: string;
  dailySection?: DailySection;
}

export class AIService {
  private anthropic: Anthropic;
  private context: AIContext = {
    currentTasks: [],
    projects: [],
    currentDate: new Date().toISOString().split('T')[0]
  };

  constructor(config: AIServiceConfig) {
    this.anthropic = new Anthropic({
      apiKey: config.apiKey,
      dangerouslyAllowBrowser: true // Note: In production, use a backend proxy
    });
  }

  reconfigure(apiKey: string) {
    this.anthropic = new Anthropic({
      apiKey,
      dangerouslyAllowBrowser: true
    });
  }

  updateContext(context: Partial<AIContext>) {
    this.context = { ...this.context, ...context };
  }

  async parseNaturalLanguage(input: string): Promise<TaskSuggestion[]> {
    try {
      const contextString = this.buildContextString();
      
      const response = await this.anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `You are MyPA, a personal productivity assistant. Parse the following natural language input into structured tasks.

CURRENT CONTEXT:
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
        }]
      });

      const content = response.content[0];
      if (content.type === 'text') {
        try {
          const parsed = JSON.parse(content.text);
          return Array.isArray(parsed) ? parsed : [parsed];
        } catch (e) {
          console.error('Failed to parse AI response:', content.text);
          return this.fallbackTaskParsing(input);
        }
      }
      
      return this.fallbackTaskParsing(input);
    } catch (error) {
      console.error('AI parsing error:', error);
      return this.fallbackTaskParsing(input);
    }
  }

  async processNaturalLanguageCommand(input: string): Promise<{
    type: 'create_tasks' | 'query' | 'update' | 'unknown';
    tasks?: TaskSuggestion[];
    response?: string;
    query?: any;
  }> {
    try {
      const contextString = this.buildContextString();
      
      const response = await this.anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1500,
        messages: [{
          role: 'user',
          content: `You are MyPA, a personal productivity assistant helping Ryan manage his daily tasks.

CURRENT CONTEXT:
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
        }]
      });

      const content = response.content[0];
      if (content.type === 'text') {
        try {
          return JSON.parse(content.text);
        } catch (e) {
          console.error('Failed to parse AI command response:', content.text);
          return {
            type: 'unknown',
            response: 'I had trouble understanding that. Could you rephrase?'
          };
        }
      }

      return {
        type: 'unknown',
        response: 'I had trouble processing that request.'
      };
    } catch (error) {
      console.error('AI command processing error:', error);
      return {
        type: 'unknown',
        response: 'I encountered an error. Please try again.'
      };
    }
  }

  async generateDailyInsights(): Promise<string> {
    try {
      const contextString = this.buildContextString();
      
      const response = await this.anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 800,
        messages: [{
          role: 'user',
          content: `You are MyPA, Ryan's personal productivity assistant. Review his current tasks and provide brief, actionable insights.

CURRENT CONTEXT:
${contextString}

Provide a concise daily insight focusing on:
1. Priority items that need attention
2. Any overdue tasks
3. Potential scheduling conflicts
4. One actionable suggestion for the day

Keep it brief, friendly, and actionable. Start with "Good ${this.getTimeOfDay()}! Here's your daily overview:"`
        }]
      });

      const content = response.content[0];
      return content.type === 'text' ? content.text : 'Have a productive day!';
    } catch (error) {
      console.error('Daily insights error:', error);
      return 'Have a productive day! I\'m here to help manage your tasks.';
    }
  }

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
Active Projects: ${projects.map(p => `${p.tag} (${p.name})`).join(', ')}
Total Pending Tasks: ${currentTasks.filter(t => t.status !== 'completed').length}
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

// Export singleton instance that will be configured with API key
export const aiService = new AIService({ apiKey: '' }); // Will be configured later