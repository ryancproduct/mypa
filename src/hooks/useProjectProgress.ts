import { useMemo } from 'react';
import { useMarkdownStore } from '../stores/useMarkdownStore';
import type { Task, Project } from '../types';

interface ProjectProgress {
  project: Project;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  dueTodayTasks: number;
  completionRate: number;
  urgentTasks: number;
  recentActivity: Task[];
}

export const useProjectProgress = () => {
  const { tasks, projects } = useMarkdownStore();
  
  const projectProgress = useMemo((): ProjectProgress[] => {
    const today = new Date().toISOString().split('T')[0];
    
    return projects.map(project => {
      const projectTasks = tasks.filter(task => task.project === project.tag);
      
      const totalTasks = projectTasks.length;
      const completedTasks = projectTasks.filter(task => task.status === 'completed').length;
      const pendingTasks = projectTasks.filter(task => task.status !== 'completed').length;
      
      const overdueTasks = projectTasks.filter(task => 
        task.dueDate && 
        task.dueDate < today && 
        task.status !== 'completed'
      ).length;
      
      const dueTodayTasks = projectTasks.filter(task => 
        task.dueDate === today && 
        task.status !== 'completed'
      ).length;
      
      const urgentTasks = projectTasks.filter(task => 
        task.priority === 'P1' && task.status !== 'completed'
      ).length;
      
      const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
      
      // Recent activity (completed in last 7 days or created in last 3 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      
      const recentActivity = projectTasks.filter(task => {
        const completedAt = task.completedAt ? new Date(task.completedAt) : null;
        const createdAt = task.createdAt ? new Date(task.createdAt) : null;
        
        return (completedAt && completedAt >= sevenDaysAgo) || 
               (createdAt && createdAt >= threeDaysAgo);
      }).sort((a, b) => {
        const aDate = a.completedAt || a.createdAt || '';
        const bDate = b.completedAt || b.createdAt || '';
        return bDate.localeCompare(aDate);
      });
      
      return {
        project,
        totalTasks,
        completedTasks,
        pendingTasks,
        overdueTasks,
        dueTodayTasks,
        completionRate,
        urgentTasks,
        recentActivity: recentActivity.slice(0, 5) // Last 5 activities
      };
    }).sort((a, b) => {
      // Sort by most active projects first
      const aActivity = a.recentActivity.length + a.urgentTasks + a.dueTodayTasks;
      const bActivity = b.recentActivity.length + b.urgentTasks + b.dueTodayTasks;
      return bActivity - aActivity;
    });
  }, [tasks, projects]);
  
  const overallStats = useMemo(() => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    const overdueTasks = tasks.filter(task => {
      const today = new Date().toISOString().split('T')[0];
      return task.dueDate && task.dueDate < today && task.status !== 'completed';
    }).length;
    
    return {
      totalTasks,
      completedTasks,
      overdueTasks,
      completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
      activeProjects: projects.filter(project => 
        tasks.some(task => task.project === project.tag && task.status !== 'completed')
      ).length
    };
  }, [tasks, projects]);
  
  return {
    projectProgress,
    overallStats
  };
};