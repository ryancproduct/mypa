import { create } from 'zustand';
import type { AppState, Task, DailySection, Project } from '../types';
import { getCurrentDateAustralian } from '../utils/dateUtils';
import { hybridStorageService, type StorageMode } from '../services/hybridStorageService';
import { generateUUID } from '../utils/uuid';

interface MarkdownTaskStore extends AppState {
  tasks: Task[]; // Computed property that returns all tasks from all sections
  fileConnected: boolean;
  lastSync: string | null;
  storageMode: StorageMode;
  
  // Storage operations
  initStorage: () => Promise<void>;
  connectToFile: () => Promise<boolean>;
  setStorageMode: (mode: StorageMode) => void;
  
  // Task operations
  addTask: (taskData: Omit<Task, 'id' | 'createdAt' | 'completedAt' | 'updatedAt'>, sectionType?: 'priorities' | 'schedule' | 'followUps') => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  completeTask: (id: string) => Promise<void>;
  addProject: (projectData: Omit<Project, 'id'>) => Promise<void>;
  
  // Navigation
  setCurrentDate: (date: string) => void;
  getCurrentSection: () => DailySection | undefined;
  
  // Data loading
  loadDataForDate: (date: string) => Promise<void>;
}

export const useMarkdownStore = create<MarkdownTaskStore>((set, get) => ({
  currentDate: getCurrentDateAustralian(),
  sections: [],
  projects: [
    // Default projects
    { id: '1', name: 'Data Tables', tag: '#DataTables', color: '#0ea5e9' },
    { id: '2', name: 'Lone Worker', tag: '#LoneWorker', color: '#10b981' },
    { id: '3', name: 'IKEA Project', tag: '#IKEA', color: '#f59e0b' },
    { id: '4', name: 'MyPA', tag: '#MyPA', color: '#8b5cf6' },
    { id: '5', name: 'Productivity', tag: '#Productivity', color: '#ef4444' },
  ],
  loading: false,
  error: null,
  fileConnected: false,
  lastSync: null,
  storageMode: 'hybrid' as StorageMode,

  // Computed property for all tasks
  get tasks() {
    const state = get();
    return state.sections.flatMap((section: DailySection) => [
      ...section.priorities,
      ...section.schedule,
      ...section.followUps,
      ...section.completed
    ]);
  },

  // Initialize storage system
  initStorage: async () => {
    set({ loading: true, error: null });
    try {
      const { storageMode } = get();
      await hybridStorageService.init(storageMode);
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  // Connect to file (for hybrid/file-only modes)
  connectToFile: async () => {
    set({ loading: true, error: null });
    try {
      const success = await hybridStorageService.connectToFile();
      if (success) {
        await get().loadDataForDate(get().currentDate);
        set({ fileConnected: true, loading: false });
        return true;
      } else {
        set({ fileConnected: false, loading: false });
        return false;
      }
    } catch (error: any) {
      set({ error: error.message, loading: false, fileConnected: false });
      return false;
    }
  },

  // Set storage mode
  setStorageMode: (mode: StorageMode) => {
    set({ storageMode: mode });
    hybridStorageService.setMode(mode);
  },

  // Load data for a specific date
  loadDataForDate: async (date: string) => {
    set({ loading: true, error: null });
    try {
      const { section, tasks } = await hybridStorageService.getTasksForDate(date);
      const projects = await hybridStorageService.getAllProjects();
      
      // Organize tasks into sections
      const sections: DailySection[] = section ? [section] : [];
      
      set({ 
        sections,
        projects: projects.length > 0 ? projects : get().projects, // Keep defaults if no projects
        currentDate: date,
        loading: false,
        lastSync: new Date().toISOString()
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  setCurrentDate: (date) => {
    set({ currentDate: date });
    // Load data for the new date
    get().loadDataForDate(date);
  },

  getCurrentSection: () => {
    const { sections, currentDate } = get();
    return sections.find(s => s.date === currentDate);
  },

  // Task operations using hybrid storage
  addTask: async (taskData, sectionType = 'priorities') => {
    try {
      await hybridStorageService.addTask(taskData, sectionType);
      
      // Refresh current data
      await get().loadDataForDate(get().currentDate);
      
      set({ lastSync: new Date().toISOString() });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  updateTask: async (id: string, updates: Partial<Task>) => {
    try {
      await hybridStorageService.updateTask(id, updates);
      
      // Refresh current data
      await get().loadDataForDate(get().currentDate);
      
      set({ lastSync: new Date().toISOString() });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  deleteTask: async (id: string) => {
    try {
      await hybridStorageService.deleteTask(id);
      
      // Refresh current data
      await get().loadDataForDate(get().currentDate);
      
      set({ lastSync: new Date().toISOString() });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  completeTask: async (id: string) => {
    try {
      const completedAt = new Date().toISOString();
      await hybridStorageService.updateTask(id, { 
        status: 'completed' as const, 
        completedAt 
      });
      
      // Refresh current data
      await get().loadDataForDate(get().currentDate);
      
      set({ lastSync: new Date().toISOString() });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  addProject: async (projectData) => {
    try {
      const newProject: Project = {
        ...projectData,
        id: generateUUID()
      };
      
      // Add to current state immediately for better UX
      set(state => ({ 
        projects: [...state.projects, newProject] 
      }));
      
      // TODO: Add to hybrid storage service
      // await hybridStorageService.addProject(newProject);
      
      set({ lastSync: new Date().toISOString() });
    } catch (error: any) {
      set({ error: error.message });
    }
  }
}));

// Initialize the store
(async () => {
  try {
    console.log('Initializing hybrid storage...');
    const store = useMarkdownStore.getState();
    await store.initStorage();
    console.log('Hybrid storage initialized successfully');
  } catch (error) {
    console.log('Could not initialize hybrid storage:', error);
  }
})();
