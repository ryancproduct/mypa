import type { Task, DailySection } from '../types';
import { isOverdue, isDueToday } from '../utils/dateUtils';
import { aiService } from './aiService';

interface RolloverResult {
  newTasks: Task[];
  rolloverCount: number;
  overdueCount: number;
  dueTodayCount: number;
  summary: string;
}

export class RolloverService {
  static async performSmartRollover(
    previousDate: string,
    currentDate: string,
    previousSection: DailySection | null,
    allTasks: Task[]
  ): Promise<RolloverResult & { aiInsights: string }> {
    const basicRollover = this.performDailyRollover(previousDate, currentDate, previousSection, allTasks);
    
    if (basicRollover.newTasks.length === 0) {
      return { ...basicRollover, aiInsights: '🎉 All caught up! Ready for a productive new day.' };
    }

    try {
      // Get AI insights for smart rollover decisions
      const aiInsights = await aiService.processNaturalLanguageCommand(
        `Analyze these ${basicRollover.newTasks.length} rolled-over tasks and provide smart insights:
        
        Tasks: ${basicRollover.newTasks.map(t => `"${t.content.replace('⏭ ', '')}" (${t.priority || 'no priority'}, due: ${t.dueDate || 'no date'})`).join(', ')}
        
        Overdue: ${basicRollover.overdueCount}
        Due today: ${basicRollover.dueTodayCount}
        
        Provide actionable suggestions for prioritizing and organizing these tasks for maximum productivity.`
      );

      return {
        ...basicRollover,
        aiInsights: aiInsights.response || 'Tasks rolled over successfully. Consider reviewing priorities for the day.'
      };
    } catch (error) {
      console.error('AI rollover insights failed:', error);
      return {
        ...basicRollover,
        aiInsights: 'Tasks rolled over successfully. Consider reviewing priorities for the day.'
      };
    }
  }

  static performDailyRollover(
    previousDate: string,
    _currentDate: string,
    previousSection: DailySection | null,
    _allTasks: Task[]
  ): RolloverResult {
    if (!previousSection) {
      return {
        newTasks: [],
        rolloverCount: 0,
        overdueCount: 0,
        dueTodayCount: 0,
        summary: 'No previous tasks to roll over.'
      };
    }

    // Collect all uncompleted tasks from previous day
    const uncompletedTasks = [
      ...previousSection.priorities.filter(task => task.status !== 'completed'),
      ...previousSection.schedule.filter(task => task.status !== 'completed'),
      ...previousSection.followUps.filter(task => task.status !== 'completed')
    ];

    if (uncompletedTasks.length === 0) {
      return {
        newTasks: [],
        rolloverCount: 0,
        overdueCount: 0,
        dueTodayCount: 0,
        summary: '🎉 All tasks completed yesterday! Starting fresh today.'
      };
    }

    const rolledOverTasks: Task[] = [];
    let overdueCount = 0;
    let dueTodayCount = 0;

    for (const task of uncompletedTasks) {
      // Create new task for current day with rollover marker
      const newTask: Task = {
        ...task,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        content: `⏭ ${task.content}`, // Rollover marker
        createdAt: new Date().toISOString(),
        rolledFromDate: previousDate
      };

      // Add status indicators based on due date
      if (task.dueDate) {
        if (isOverdue(task.dueDate)) {
          newTask.content += ' (Overdue)';
          overdueCount++;
        } else if (isDueToday(task.dueDate)) {
          newTask.content += ' (Due today)';
          dueTodayCount++;
        }
      }

      rolledOverTasks.push(newTask);
    }

    // Sort tasks by priority for summary
    const priorityTasks = rolledOverTasks.filter(task => 
      task.priority === 'P1' || task.priority === 'P2' || task.priority === 'P3'
    ).sort((a, b) => {
      const priorityOrder = { 'P1': 1, 'P2': 2, 'P3': 3 };
      return (priorityOrder[a.priority as keyof typeof priorityOrder] || 4) - 
             (priorityOrder[b.priority as keyof typeof priorityOrder] || 4);
    });

    const summary = this.generateRolloverSummary(
      uncompletedTasks.length,
      overdueCount,
      dueTodayCount,
      priorityTasks.slice(0, 3).map(t => t.content.replace('⏭ ', ''))
    );

    return {
      newTasks: rolledOverTasks,
      rolloverCount: uncompletedTasks.length,
      overdueCount,
      dueTodayCount,
      summary
    };
  }

  static generateRolloverSummary(
    totalRolled: number,
    overdueCount: number,
    dueTodayCount: number,
    topPriorities: string[]
  ): string {
    const parts = [
      `📋 Rolled over ${totalRolled} task${totalRolled > 1 ? 's' : ''} from yesterday`
    ];

    if (overdueCount > 0) {
      parts.push(`⚠️ ${overdueCount} overdue`);
    }

    if (dueTodayCount > 0) {
      parts.push(`📅 ${dueTodayCount} due today`);
    }

    if (topPriorities.length > 0) {
      parts.push(`🎯 Top priorities: ${topPriorities.slice(0, 2).join(', ')}${topPriorities.length > 2 ? '...' : ''}`);
    }

    return parts.join('\n');
  }

  static shouldTriggerRollover(lastRolloverDate: string, currentDate: string): boolean {
    // Check if we need to perform rollover (new day)
    return lastRolloverDate !== currentDate;
  }

  static generateDailyInsight(
    currentSection: DailySection,
    allTasks: Task[],
    _currentDate: string
  ): string {
    const insights = [];

    // Priority analysis
    const priorityCount = currentSection.priorities.length;
    if (priorityCount === 0) {
      insights.push('🎯 Consider setting 1-3 priorities for today');
    } else if (priorityCount > 3) {
      insights.push('⚖️ You have more than 3 priorities - consider moving some to schedule');
    }

    // Overdue task analysis
    const overdueTasks = allTasks.filter(task => 
      task.dueDate && isOverdue(task.dueDate) && task.status !== 'completed'
    );
    if (overdueTasks.length > 0) {
      insights.push(`⚠️ ${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''} need attention`);
    }

    // Due today analysis
    const dueTodayTasks = allTasks.filter(task => 
      task.dueDate && isDueToday(task.dueDate) && task.status !== 'completed'
    );
    if (dueTodayTasks.length > 0) {
      insights.push(`📅 ${dueTodayTasks.length} task${dueTodayTasks.length > 1 ? 's' : ''} due today`);
    }

    // Follow-up analysis
    const followUps = currentSection.followUps.filter(task => task.status !== 'completed');
    if (followUps.length > 3) {
      insights.push('💬 Consider consolidating or scheduling some follow-ups');
    }

    // Project distribution
    const projectTasks = allTasks.filter(task => task.project && task.status !== 'completed');
    const projectGroups = projectTasks.reduce((acc, task) => {
      acc[task.project!] = (acc[task.project!] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topProject = Object.entries(projectGroups)
      .sort(([,a], [,b]) => b - a)[0];
    
    if (topProject) {
      insights.push(`📊 Most active project: ${topProject[0]} (${topProject[1]} tasks)`);
    }

    if (insights.length === 0) {
      insights.push('✨ Everything looks well organized! Have a productive day.');
    }

    return insights.join('\n');
  }
}