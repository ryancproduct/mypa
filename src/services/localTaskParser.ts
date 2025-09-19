import type { TaskSuggestion, AIResponse } from './backendService';

/**
 * Simple local task parser that doesn't require external AI APIs
 * Handles basic task creation commands and queries
 */

const taskKeywords = ['add', 'create', 'make', 'todo', 'task', 'reminder', 'schedule', 'meeting', 'call'];
const priorityKeywords = ['urgent', 'important', 'high priority', 'asap', 'critical'];
const scheduleKeywords = ['meeting', 'call', 'appointment', 'session', 'standup', 'sync'];
const followUpKeywords = ['follow up', 'followup', 'check in', 'remind', 'chase', 'ping'];

const projectPatterns = [
  /#(\w+)/g,  // #ProjectName
  /for (\w+)/i,  // for ProjectName
  /on (\w+)/i,   // on ProjectName
];

const dueDatePatterns = [
  /tomorrow/i,
  /today/i,
  /next week/i,
  /(\d{4}-\d{2}-\d{2})/,  // YYYY-MM-DD
  /(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
];

export class LocalTaskParser {
  parseCommand(input: string): AIResponse {
    const lowerInput = input.toLowerCase();

    // Check if this is a task creation command
    const isTaskCommand = taskKeywords.some(keyword => lowerInput.includes(keyword));

    if (isTaskCommand) {
      return this.parseTaskCreation(input);
    }

    // Check if this is a query
    if (lowerInput.includes('show') || lowerInput.includes('list') || lowerInput.includes('what') || lowerInput.includes('how many')) {
      return {
        type: 'query',
        response: "I'll help you check your tasks. What specifically would you like to know?"
      };
    }

    // Default response
    return {
      type: 'unknown',
      response: "I understand you want to manage your tasks. Try saying something like 'Add task: Review project proposal' or 'Create meeting with team tomorrow'."
    };
  }

  private parseTaskCreation(input: string): AIResponse {
    // Extract task content
    const content = this.extractTaskContent(input);

    // Determine section type
    const sectionType = this.determineSectionType(input);

    // Extract project
    const project = this.extractProject(input);

    // Extract due date
    const dueDate = this.extractDueDate(input);

    // Determine priority
    const priority = this.extractPriority(input);

    // Extract assignee
    const assignee = this.extractAssignee(input);

    if (!content) {
      return {
        type: 'unknown',
        response: "I'd like to help create a task, but I need more details. Try something like 'Add task: Review the quarterly report'."
      };
    }

    const task: TaskSuggestion = {
      content,
      sectionType,
      project,
      dueDate,
      priority,
      assignee
    };

    return {
      type: 'create_tasks',
      tasks: [task],
      response: `I'll add this task to your ${sectionType}: "${content}"${project ? ` for ${project}` : ''}${dueDate ? ` due ${dueDate}` : ''}`,
      confidence: 0.8
    };
  }

  private extractTaskContent(input: string): string {
    // Remove common task prefixes and extract main content
    let content = input
      .replace(/^(add|create|make|todo|task|reminder|schedule)\s*(task|todo|reminder)?:?\s*/i, '')
      .replace(/^(please\s+)?(can you\s+)?/i, '')
      .trim();

    // Remove project and metadata to get clean content
    content = content
      .replace(/#\w+/g, '') // Remove #ProjectName
      .replace(/for \w+/gi, '') // Remove "for ProjectName"
      .replace(/on \w+/gi, '') // Remove "on ProjectName"
      .replace(/@\w+/g, '') // Remove @person
      .replace(/tomorrow|today|next week|\d{4}-\d{2}-\d{2}|(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/gi, '') // Remove dates
      .replace(/urgent|important|high priority|asap|critical/gi, '') // Remove priority words
      .replace(/\s+/g, ' ') // Clean up multiple spaces
      .trim();

    return content || 'New task';
  }

  private determineSectionType(input: string): 'priorities' | 'schedule' | 'followUps' {
    const lowerInput = input.toLowerCase();

    if (priorityKeywords.some(keyword => lowerInput.includes(keyword))) {
      return 'priorities';
    }

    if (scheduleKeywords.some(keyword => lowerInput.includes(keyword))) {
      return 'schedule';
    }

    if (followUpKeywords.some(keyword => lowerInput.includes(keyword))) {
      return 'followUps';
    }

    return 'schedule'; // default
  }

  private extractProject(input: string): string | undefined {
    // Look for #ProjectName
    const hashMatch = input.match(/#(\w+)/);
    if (hashMatch) {
      return `#${hashMatch[1]}`;
    }

    // Look for "for ProjectName" or "on ProjectName"
    const forMatch = input.match(/(?:for|on)\s+(\w+)/i);
    if (forMatch) {
      return `#${forMatch[1]}`;
    }

    return undefined;
  }

  private extractDueDate(input: string): string | undefined {
    const today = new Date();
    const lowerInput = input.toLowerCase();

    if (lowerInput.includes('today')) {
      return today.toISOString().split('T')[0];
    }

    if (lowerInput.includes('tomorrow')) {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString().split('T')[0];
    }

    if (lowerInput.includes('next week')) {
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      return nextWeek.toISOString().split('T')[0];
    }

    // Look for YYYY-MM-DD format
    const dateMatch = input.match(/(\d{4}-\d{2}-\d{2})/);
    if (dateMatch) {
      return dateMatch[1];
    }

    return undefined;
  }

  private extractPriority(input: string): 'P1' | 'P2' | 'P3' | undefined {
    const lowerInput = input.toLowerCase();

    if (lowerInput.includes('urgent') || lowerInput.includes('critical') || lowerInput.includes('asap')) {
      return 'P1';
    }

    if (lowerInput.includes('important') || lowerInput.includes('high priority')) {
      return 'P2';
    }

    return undefined;
  }

  private extractAssignee(input: string): string | undefined {
    // Look for @person
    const atMatch = input.match(/@(\w+)/);
    if (atMatch) {
      return atMatch[1];
    }

    // Look for "with PersonName"
    const withMatch = input.match(/with\s+(\w+)/i);
    if (withMatch) {
      return withMatch[1];
    }

    return undefined;
  }
}

export const localTaskParser = new LocalTaskParser();