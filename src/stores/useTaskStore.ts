import { create } from 'zustand';
import { AppState, Task, DailySection, Project } from '../types';
import { getCurrentDateAustralian } from '../utils/dateUtils';

interface TaskStore extends AppState {
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>, sectionType?: 'priorities' | 'schedule' | 'followUps') => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  completeTask: (id: string) => void;
  rolloverTasks: (fromDate: string, toDate: string) => void;
  setCurrentDate: (date: string) => void;
  addProject: (project: Omit<Project, 'id'>) => void;
  getCurrentSection: () => DailySection | undefined;
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  currentDate: getCurrentDateAustralian(),
  sections: [],
  projects: [
    { id: '1', name: 'Data Tables', tag: '#DataTables' },
    { id: '2', name: 'Lone Worker', tag: '#LoneWorker' },
    { id: '3', name: 'IKEA', tag: '#IKEA' },
    { id: '4', name: 'Cross Org', tag: '#CrossOrg' },
    { id: '5', name: 'Recurring', tag: '#Recurring' },
    { id: '6', name: 'Capture', tag: '#CAPTURE' },
  ],
  loading: false,
  error: null,

  addTask: (taskData, sectionType = 'schedule') => {
    const task: Task = {
      ...taskData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    set((state) => {
      const sections = [...state.sections];
      let currentSection = sections.find(s => s.date === state.currentDate);
      
      if (!currentSection) {
        currentSection = {
          id: crypto.randomUUID(),
          date: state.currentDate,
          priorities: [],
          schedule: [],
          followUps: [],
          notes: [],
          completed: [],
          blockers: [],
        };
        sections.push(currentSection);
      }

      // Add to specified section type, unless it has priority and goes to priorities
      if (sectionType === 'priorities' || (task.priority && sectionType !== 'followUps')) {
        currentSection.priorities.push(task);
      } else if (sectionType === 'followUps') {
        currentSection.followUps.push(task);
      } else {
        currentSection.schedule.push(task);
      }

      return { sections };
    });
  },

  updateTask: (id, updates) => {
    set((state) => ({
      sections: state.sections.map(section => ({
        ...section,
        priorities: section.priorities.map(task => 
          task.id === id ? { ...task, ...updates, updatedAt: new Date().toISOString() } : task
        ),
        schedule: section.schedule.map(task => 
          task.id === id ? { ...task, ...updates, updatedAt: new Date().toISOString() } : task
        ),
        followUps: section.followUps.map(task => 
          task.id === id ? { ...task, ...updates, updatedAt: new Date().toISOString() } : task
        ),
      })),
    }));
  },

  deleteTask: (id) => {
    set((state) => ({
      sections: state.sections.map(section => ({
        ...section,
        priorities: section.priorities.filter(task => task.id !== id),
        schedule: section.schedule.filter(task => task.id !== id),
        followUps: section.followUps.filter(task => task.id !== id),
      })),
    }));
  },

  completeTask: (id) => {
    const completedAt = new Date().toISOString();
    
    set((state) => {
      const sections = [...state.sections];
      
      sections.forEach(section => {
        ['priorities', 'schedule', 'followUps'].forEach(listName => {
          const list = section[listName as keyof DailySection] as Task[];
          const taskIndex = list.findIndex(task => task.id === id);
          
          if (taskIndex !== -1) {
            const completedTask = {
              ...list[taskIndex],
              status: 'completed' as const,
              completedAt,
              updatedAt: completedAt,
            };
            
            list.splice(taskIndex, 1);
            section.completed.push(completedTask);
          }
        });
      });
      
      return { sections };
    });
  },

  rolloverTasks: (fromDate, toDate) => {
    // Implementation for daily rollover logic
    console.log(`Rolling over tasks from ${fromDate} to ${toDate}`);
  },

  setCurrentDate: (date) => {
    set({ currentDate: date });
  },

  addProject: (projectData) => {
    const project: Project = {
      ...projectData,
      id: crypto.randomUUID(),
    };
    
    set((state) => ({
      projects: [...state.projects, project],
    }));
  },

  getCurrentSection: () => {
    const state = get();
    return state.sections.find(s => s.date === state.currentDate);
  },
}));