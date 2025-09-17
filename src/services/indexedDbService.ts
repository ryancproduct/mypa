import type { Task, DailySection, Project } from '../types';

interface DBSchema {
  tasks: Task;
  sections: DailySection;
  projects: Project;
  metadata: { key: string; value: any };
}

class IndexedDbService {
  private db: IDBDatabase | null = null;
  private readonly dbName = 'MyPA';
  private readonly version = 1;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Tasks store
        if (!db.objectStoreNames.contains('tasks')) {
          const taskStore = db.createObjectStore('tasks', { keyPath: 'id' });
          taskStore.createIndex('sectionId', 'sectionId');
          taskStore.createIndex('status', 'status');
          taskStore.createIndex('dueDate', 'dueDate');
        }

        // Sections store
        if (!db.objectStoreNames.contains('sections')) {
          const sectionStore = db.createObjectStore('sections', { keyPath: 'id' });
          sectionStore.createIndex('date', 'date');
        }

        // Projects store
        if (!db.objectStoreNames.contains('projects')) {
          db.createObjectStore('projects', { keyPath: 'id' });
        }

        // Metadata store (for sync info, settings, etc.)
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' });
        }
      };
    });
  }

  // Task operations
  async addTask(task: Task): Promise<void> {
    const transaction = this.db!.transaction(['tasks'], 'readwrite');
    const store = transaction.objectStore('tasks');
    await store.add(task);
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<void> {
    const transaction = this.db!.transaction(['tasks'], 'readwrite');
    const store = transaction.objectStore('tasks');
    const task = await store.get(id);
    if (task) {
      const updatedTask = { ...task, ...updates, updatedAt: new Date().toISOString() };
      await store.put(updatedTask);
    }
  }

  async deleteTask(id: string): Promise<void> {
    const transaction = this.db!.transaction(['tasks'], 'readwrite');
    const store = transaction.objectStore('tasks');
    await store.delete(id);
  }

  async getTasksBySection(sectionId: string): Promise<Task[]> {
    const transaction = this.db!.transaction(['tasks'], 'readonly');
    const store = transaction.objectStore('tasks');
    const index = store.index('sectionId');
    const request = index.getAll(sectionId);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Section operations
  async addSection(section: DailySection): Promise<void> {
    const transaction = this.db!.transaction(['sections'], 'readwrite');
    const store = transaction.objectStore('sections');
    await store.add(section);
  }

  async getSectionByDate(date: string): Promise<DailySection | null> {
    const transaction = this.db!.transaction(['sections'], 'readonly');
    const store = transaction.objectStore('sections');
    const index = store.index('date');
    const request = index.get(date);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  // Project operations
  async getAllProjects(): Promise<Project[]> {
    const transaction = this.db!.transaction(['projects'], 'readonly');
    const store = transaction.objectStore('projects');
    const request = store.getAll();
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async addProject(project: Project): Promise<void> {
    const transaction = this.db!.transaction(['projects'], 'readwrite');
    const store = transaction.objectStore('projects');
    await store.add(project);
  }

  // Sync with markdown file
  async exportToMarkdown(): Promise<string> {
    const sections = await this.getAllSections();
    const projects = await this.getAllProjects();
    
    // Use existing markdown export function
    const { exportToMarkdown } = await import('../utils/markdownParser');
    return exportToMarkdown(sections, projects);
  }

  async importFromMarkdown(content: string): Promise<void> {
    const { parseMarkdownContent } = await import('../utils/markdownParser');
    const parsed = parseMarkdownContent(content);
    
    // Clear existing data
    await this.clearAll();
    
    // Import sections and tasks
    for (const section of parsed.sections) {
      await this.addSection(section);
      
      // Add all tasks from this section
      for (const task of [...section.priorities, ...section.schedule, ...section.followUps, ...section.completed]) {
        await this.addTask(task);
      }
    }
    
    // Import projects
    for (const project of parsed.projects) {
      await this.addProject(project);
    }
    
    // Update sync metadata
    await this.setMetadata('lastSync', new Date().toISOString());
  }

  private async getAllSections(): Promise<DailySection[]> {
    const transaction = this.db!.transaction(['sections'], 'readonly');
    const store = transaction.objectStore('sections');
    const request = store.getAll();
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async clearAll(): Promise<void> {
    const transaction = this.db!.transaction(['tasks', 'sections', 'projects'], 'readwrite');
    await Promise.all([
      transaction.objectStore('tasks').clear(),
      transaction.objectStore('sections').clear(),
      transaction.objectStore('projects').clear()
    ]);
  }

  async setMetadata(key: string, value: any): Promise<void> {
    const transaction = this.db!.transaction(['metadata'], 'readwrite');
    const store = transaction.objectStore('metadata');
    await store.put({ key, value });
  }

  async getMetadata(key: string): Promise<any> {
    const transaction = this.db!.transaction(['metadata'], 'readonly');
    const store = transaction.objectStore('metadata');
    const request = store.get(key);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result?.value);
      request.onerror = () => reject(request.error);
    });
  }
}

export const indexedDbService = new IndexedDbService();
