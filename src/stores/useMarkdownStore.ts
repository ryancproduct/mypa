import { create } from 'zustand';
import type { AppState, Task, DailySection, Project } from '../types';
import { getCurrentDateAustralian } from '../utils/dateUtils';
import { parseMarkdownContent, exportToMarkdown } from '../utils/markdownParser';
import { generateUUID } from '../utils/uuid';

interface MarkdownTaskStore extends AppState {
  tasks: Task[]; // Computed property that returns all tasks from all sections
  fileConnected: boolean;
  lastSync: string | null;

  // File operations
  loadFromFile: () => Promise<void>;
  saveToFile: () => Promise<boolean>;

  // Task operations
  addTask: (taskData: Omit<Task, 'id' | 'createdAt' | 'completedAt' | 'updatedAt'>, sectionType?: 'priorities' | 'schedule' | 'followUps') => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  completeTask: (id: string) => Promise<void>;
  addProject: (projectData: Omit<Project, 'id'>) => Promise<void>;

  // Navigation
  setCurrentDate: (date: string) => void;
  getCurrentSection: () => DailySection | undefined;

  // Auto-save
  autoSave: boolean;
  setAutoSave: (enabled: boolean) => void;
}

export const useMarkdownStore = create<MarkdownTaskStore>((set, get) => ({
  currentDate: getCurrentDateAustralian(),
  sections: [],
  projects: [
    { id: '1', name: 'Data Tables', tag: '#DataTables', color: '#0ea5e9' },
    { id: '2', name: 'Lone Worker', tag: '#LoneWorker', color: '#10b981' },
    { id: '3', name: 'IKEA Project', tag: '#IKEA', color: '#f59e0b' },
    { id: '4', name: 'Cross Organization', tag: '#CrossOrg', color: '#8b5cf6' },
    { id: '5', name: 'Recurring Tasks', tag: '#Recurring', color: '#6b7280' },
    { id: '6', name: 'CAPTURE Team', tag: '#CAPTURE', color: '#ef4444' },
    { id: '7', name: 'PWA Development', tag: '#PWA', color: '#06b6d4' },
    { id: '8', name: 'External Work', tag: '#ExternalWork', color: '#84cc16' },
  ],
  loading: false,
  error: null,
  fileConnected: false,
  lastSync: null,
  autoSave: true,

  // Computed property that returns all tasks from all sections
  get tasks() {
    const { sections } = get();
    return sections.flatMap(section => [
      ...section.priorities,
      ...section.schedule,
      ...section.followUps,
      ...section.completed
    ]);
  },

  loadFromFile: async () => {
    console.log('Loading from ToDo.md file...');
    set({ loading: true, error: null });
    try {
      // Read the file from public directory
      const response = await fetch('/ToDo.md');
      if (!response.ok) {
        throw new Error(`Failed to load ToDo.md: ${response.status}`);
      }

      const content = await response.text();
      console.log('File content loaded, parsing...');

      const parsed = parseMarkdownContent(content);
      console.log('Parsed sections:', parsed.sections.length);
      console.log('Parsed projects:', parsed.projects.length);

      set({
        sections: parsed.sections,
        projects: parsed.projects.length > 0 ? parsed.projects : get().projects, // Keep defaults if no projects
        loading: false,
        fileConnected: true,
        lastSync: new Date().toISOString()
      });

      console.log('Store updated successfully');
    } catch (error: any) {
      console.error('Error loading file:', error);
      set({ error: error.message, loading: false, fileConnected: false });
      throw error;
    }
  },

  saveToFile: async () => {
    // For now, just return true as we're reading from public file
    // In a real implementation, this would save back to the file
    console.log('Save to file called (read-only mode)');
    return true;
  },

  setCurrentDate: (date) => {
    set({ currentDate: date });
  },

  getCurrentSection: () => {
    const { sections, currentDate } = get();
    const section = sections.find(s => s.date === currentDate);
    console.log(`Looking for section with date: ${currentDate}, found:`, section ? 'YES' : 'NO');
    return section;
  },

  addTask: async (taskData, sectionType = 'schedule') => {
    const { getCurrentSection, autoSave } = get();
    let currentSection = getCurrentSection();

    // If no section exists for current date, create one
    if (!currentSection) {
      const { currentDate } = get();
      currentSection = {
        id: generateUUID(),
        date: currentDate,
        priorities: [],
        schedule: [],
        followUps: [],
        notes: [],
        completed: [],
        blockers: [],
      };

      set(state => ({
        sections: [...state.sections, currentSection!]
      }));
    }

    const newTask: Task = {
      id: generateUUID(),
      ...taskData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    set(state => {
      const sections = state.sections.map(section => {
        if (section.id === currentSection!.id) {
          const updatedSection = { ...section };
          switch (sectionType) {
            case 'priorities':
              updatedSection.priorities = [...updatedSection.priorities, newTask];
              break;
            case 'schedule':
              updatedSection.schedule = [...updatedSection.schedule, newTask];
              break;
            case 'followUps':
              updatedSection.followUps = [...updatedSection.followUps, newTask];
              break;
          }
          return updatedSection;
        }
        return section;
      });
      return { sections };
    });

    if (autoSave) {
      await get().saveToFile();
    }
  },

  updateTask: async (id, updates) => {
    const { autoSave } = get();

    set(state => {
      const sections = state.sections.map(section => {
        const updateList = (list: Task[]) =>
          list.map(task =>
            task.id === id
              ? { ...task, ...updates, updatedAt: new Date().toISOString() }
              : task
          );

        return {
          ...section,
          priorities: updateList(section.priorities),
          schedule: updateList(section.schedule),
          followUps: updateList(section.followUps),
          completed: updateList(section.completed),
        };
      });
      return { sections };
    });

    if (autoSave) {
      await get().saveToFile();
    }
  },

  deleteTask: async (id) => {
    const { autoSave } = get();

    set(state => {
      const sections = state.sections.map(section => ({
        ...section,
        priorities: section.priorities.filter(task => task.id !== id),
        schedule: section.schedule.filter(task => task.id !== id),
        followUps: section.followUps.filter(task => task.id !== id),
        completed: section.completed.filter(task => task.id !== id),
      }));
      return { sections };
    });

    if (autoSave) {
      await get().saveToFile();
    }
  },

  completeTask: async (id) => {
    const { autoSave } = get();
    const completedAt = new Date().toISOString();

    set(state => {
      const sections = [...state.sections];
      sections.forEach(section => {
        let taskFound = false;
        ['priorities', 'schedule', 'followUps'].forEach(listName => {
          if (taskFound) return;
          const list = section[listName as keyof DailySection] as Task[];
          const taskIndex = list.findIndex(task => task.id === id);

          if (taskIndex > -1) {
            const [task] = list.splice(taskIndex, 1);
            const completedTask = {
              ...task,
              status: 'completed' as const,
              completedAt,
              updatedAt: completedAt
            };
            section.completed.push(completedTask);
            taskFound = true;
          }
        });
      });
      return { sections };
    });

    if (autoSave) {
      await get().saveToFile();
    }
  },

  addProject: async (projectData) => {
    const newProject: Project = {
      id: generateUUID(),
      ...projectData,
    };

    set(state => ({
      projects: [...state.projects, newProject]
    }));
  },

  setAutoSave: (enabled) => {
    set({ autoSave: enabled });
  },
}));

// Initialize the store by automatically loading ToDo.md
const initializeStore = async () => {
  try {
    console.log('Initializing store with ToDo.md...');
    const store = useMarkdownStore.getState();
    await store.loadFromFile();
    console.log('Store initialized successfully');
  } catch (error) {
    console.log('Could not auto-load ToDo.md:', error);
    // Keep default state if file loading fails
  }
};

// Auto-initialize when store is created
if (typeof window !== 'undefined') {
  initializeStore();
}