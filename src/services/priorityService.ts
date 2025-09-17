import type { Task, DailySection } from '../types';
import { getTaskUrgency, isOverdue, isDueToday } from '../utils/dateUtils';
import { backendService, type AIContextInput } from './backendService';

interface PrioritySuggestion {
  taskId: string;
  currentPriority?: string;
  suggestedPriority: 'P1' | 'P2' | 'P3';
  reason: string;
  confidence: number; // 0-1
}

interface PriorityInsights {
  suggestions: PrioritySuggestion[];
  dailyFocus: string[];
  workloadAnalysis: string;
  aiRecommendations: string;
}

export class PriorityService {
  static async generateIntelligentSuggestions(
    currentSection: DailySection,
    allTasks: Task[]
  ): Promise<PriorityInsights> {
    const suggestions = this.generateRuleBased(currentSection, allTasks);
    
    try {
      const aiAnalysis = await this.getAIInsights(currentSection, allTasks);
      return {
        suggestions,
        dailyFocus: this.identifyDailyFocus(currentSection, allTasks),
        workloadAnalysis: this.analyzeWorkload(currentSection, allTasks),
        aiRecommendations: aiAnalysis
      };
    } catch (error) {
      console.error('AI priority analysis failed:', error);
      return {
        suggestions,
        dailyFocus: this.identifyDailyFocus(currentSection, allTasks),
        workloadAnalysis: this.analyzeWorkload(currentSection, allTasks),
        aiRecommendations: 'Consider focusing on overdue and high-urgency tasks first.'
      };
    }
  }

  private static generateRuleBased(
    currentSection: DailySection,
    _allTasks: Task[]
  ): PrioritySuggestion[] {
    const suggestions: PrioritySuggestion[] = [];

    // Analyze all pending tasks for priority suggestions
    const pendingTasks = [
      ...currentSection.priorities,
      ...currentSection.schedule,
      ...currentSection.followUps
    ].filter(task => task.status !== 'completed');

    for (const task of pendingTasks) {
      const urgency = getTaskUrgency(task);
      let suggestedPriority: 'P1' | 'P2' | 'P3' | null = null;
      let reason = '';
      let confidence = 0.7;

      // Rule 1: Overdue tasks should be P1
      if (task.dueDate && isOverdue(task.dueDate)) {
        suggestedPriority = 'P1';
        reason = `Overdue by ${Math.ceil((new Date().getTime() - new Date(task.dueDate).getTime()) / (1000 * 60 * 60 * 24))} days`;
        confidence = 0.9;
      }
      // Rule 2: Due today should be P1 or P2
      else if (task.dueDate && isDueToday(task.dueDate)) {
        suggestedPriority = task.priority === 'P1' ? 'P1' : 'P2';
        reason = 'Due today';
        confidence = 0.8;
      }
      // Rule 3: High urgency tasks without priority
      else if (urgency >= 5 && !task.priority) {
        suggestedPriority = 'P2';
        reason = 'High urgency score based on due date and project importance';
        confidence = 0.7;
      }
      // Rule 4: Tasks with people involved (follow-ups)
      else if (task.assignee && !task.priority) {
        suggestedPriority = 'P3';
        reason = 'Involves other people - good for follow-up';
        confidence = 0.6;
      }
      // Rule 5: Downgrade low-urgency P1 tasks
      else if (task.priority === 'P1' && urgency < 3) {
        suggestedPriority = 'P2';
        reason = 'Currently P1 but low urgency - consider P2';
        confidence = 0.7;
      }

      // Only suggest if different from current priority
      if (suggestedPriority && suggestedPriority !== task.priority) {
        suggestions.push({
          taskId: task.id,
          currentPriority: task.priority,
          suggestedPriority,
          reason,
          confidence
        });
      }
    }

    // Sort by confidence
    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  private static identifyDailyFocus(
    currentSection: DailySection,
    allTasks: Task[]
  ): string[] {
    const focus: string[] = [];
    
    // Check priority distribution
    const p1Count = currentSection.priorities.filter(t => t.priority === 'P1' && t.status !== 'completed').length;
    
    if (p1Count === 0) {
      focus.push('🎯 Consider adding 1-2 high-priority (P1) tasks for today');
    } else if (p1Count > 2) {
      focus.push('⚖️ Too many P1 tasks - consider moving some to P2');
    }

    // Check for overdue items
    const overdueCount = allTasks.filter(t => 
      t.dueDate && isOverdue(t.dueDate) && t.status !== 'completed'
    ).length;
    
    if (overdueCount > 0) {
      focus.push(`⚠️ ${overdueCount} overdue task${overdueCount > 1 ? 's' : ''} need immediate attention`);
    }

    // Check workload balance
    const totalPending = currentSection.priorities.length + currentSection.schedule.length + currentSection.followUps.length;
    if (totalPending > 10) {
      focus.push('📋 Heavy workload today - consider deferring some tasks');
    } else if (totalPending < 3) {
      focus.push('✨ Light schedule - good opportunity for deep work');
    }

    return focus;
  }

  private static analyzeWorkload(
    currentSection: DailySection,
    _allTasks: Task[]
  ): string {
    const totalTasks = currentSection.priorities.length + currentSection.schedule.length + currentSection.followUps.length;
    const completedToday = currentSection.priorities.filter(t => t.status === 'completed').length +
                          currentSection.schedule.filter(t => t.status === 'completed').length +
                          currentSection.followUps.filter(t => t.status === 'completed').length;
    
    const completionRate = totalTasks > 0 ? (completedToday / totalTasks) * 100 : 0;
    
    if (completionRate >= 80) {
      return '🎉 Excellent progress today! You\'re on track to complete most tasks.';
    } else if (completionRate >= 50) {
      return '👍 Good progress! Focus on your remaining priorities.';
    } else if (completionRate >= 25) {
      return '⚡ Some progress made. Consider focusing on your most important tasks.';
    } else {
      return '🚀 Getting started! Break down large tasks into smaller, actionable steps.';
    }
  }

  private static async getAIInsights(
    currentSection: DailySection,
    allTasks: Task[]
  ): Promise<string> {
    const pendingTasks = [
      ...currentSection.priorities,
      ...currentSection.schedule,
      ...currentSection.followUps
    ].filter(task => task.status !== 'completed');

    if (pendingTasks.length === 0) {
      return '🎉 All tasks completed! Consider planning for tomorrow or taking on additional projects.';
    }

    const taskSummary = pendingTasks.map(task => 
      `"${task.content}" (${task.priority || 'no priority'}, due: ${task.dueDate || 'no date'}, project: ${task.project || 'none'})`
    ).join(', ');

    const context: AIContextInput = {
      currentTasks: allTasks,
      projects: [],
      currentDate: currentSection.date,
      dailySection: currentSection,
    };

    const result = await backendService.processCommand(
      `Analyze this workload and provide strategic priority recommendations:

      Pending tasks: ${taskSummary}
      
      Priorities: ${currentSection.priorities.length} tasks
      Schedule: ${currentSection.schedule.length} tasks  
      Follow-ups: ${currentSection.followUps.length} tasks
      
      Provide 2-3 actionable insights about:
      1. What to focus on first
      2. How to organize the day for maximum productivity
      3. Any tasks that could be deferred or delegated
      
      Keep it concise and actionable.`,
      context
    );

    return result.response || 'Focus on completing high-priority and overdue tasks first.';
  }

  static async suggestOptimalPriorities(tasks: Task[]): Promise<string> {
    if (tasks.length === 0) return 'No tasks to prioritize.';

    try {
      const taskDescriptions = tasks.map(t => 
        `"${t.content}" (current: ${t.priority || 'none'}, due: ${t.dueDate || 'none'})`
      ).join(', ');

      const context: AIContextInput = {
        currentTasks: tasks,
        projects: [],
        currentDate: new Date().toISOString().split('T')[0],
      };

      const result = await backendService.processCommand(
        `Given these tasks: ${taskDescriptions}
        
        Suggest optimal P1/P2/P3 priorities considering:
        - Due dates and urgency
        - Dependencies and blockers
        - Energy levels throughout the day
        - Project importance
        
        Provide specific recommendations for priority assignments.`,
        context
      );

      return result.response || 'Consider prioritizing by urgency and impact.';
    } catch (error) {
      return 'Consider prioritizing by urgency and impact.';
    }
  }
}
