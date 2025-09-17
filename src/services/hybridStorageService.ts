import { indexedDbService } from './indexedDbService';
import { optimizedMarkdownService } from './optimizedMarkdownService';
import type { Task, DailySection, Project } from '../types';

export type StorageMode = 'file-only' | 'db-only' | 'hybrid';

class HybridStorageService {
  private mode: StorageMode = 'hybrid';
  private syncInterval: number | null = null;

  async init(mode: StorageMode = 'hybrid'): Promise<void> {
    this.mode = mode;
    
    if (mode === 'db-only' || mode === 'hybrid') {
      await indexedDbService.init();
    }
    
    if (mode === 'hybrid') {
      this.startAutoSync();
    }
  }

  async connectToFile(): Promise<boolean> {
    if (this.mode === 'db-only') return false;
    
    const connected = await optimizedMarkdownService.connectToFile();
    
    if (connected && this.mode === 'hybrid') {
      // Initial sync from file to DB
      await this.syncFromFileToDb();
    }
    
    return connected;
  }

  // Task operations - always use DB for speed, sync to file
  async addTask(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>, sectionType: 'priorities' | 'schedule' | 'followUps' = 'priorities'): Promise<Task> {
    const task: Task = {
      ...taskData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (this.mode === 'file-only') {
      // Handle file-only mode
      return task; // Implement file-only logic
    }

    // Add to IndexedDB
    await indexedDbService.addTask(task);
    
    // Queue sync to file if in hybrid mode
    if (this.mode === 'hybrid') {
      this.queueSync();
    }
    
    return task;
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<void> {
    if (this.mode === 'file-only') {
      await optimizedMarkdownService.updateTask(id, updates);
      return;
    }

    await indexedDbService.updateTask(id, updates);
    
    if (this.mode === 'hybrid') {
      this.queueSync();
    }
  }

  async deleteTask(id: string): Promise<void> {
    if (this.mode === 'file-only') {
      // Handle file deletion
      return;
    }

    await indexedDbService.deleteTask(id);
    
    if (this.mode === 'hybrid') {
      this.queueSync();
    }
  }

  async getTasksForDate(date: string): Promise<{ section: DailySection | null, tasks: Task[] }> {
    if (this.mode === 'file-only') {
      const data = await optimizedMarkdownService.loadFromFile();
      const section = data.sections.find(s => s.date === date) || null;
      const tasks = section ? [...section.priorities, ...section.schedule, ...section.followUps, ...section.completed] : [];
      return { section, tasks };
    }

    const section = await indexedDbService.getSectionByDate(date);
    const tasks = section ? await indexedDbService.getTasksBySection(section.id) : [];
    
    return { section, tasks };
  }

  async getAllProjects(): Promise<Project[]> {
    if (this.mode === 'file-only') {
      const data = await optimizedMarkdownService.loadFromFile();
      return data.projects;
    }

    return await indexedDbService.getAllProjects();
  }

  // Sync operations
  private async syncFromFileToDb(): Promise<void> {
    if (!optimizedMarkdownService.isConnected()) return;
    
    try {
      const data = await optimizedMarkdownService.loadFromFile();
      
      // Convert to markdown and import to DB
      const { exportToMarkdown } = await import('../utils/markdownParser');
      const content = exportToMarkdown(data.sections, data.projects);
      await indexedDbService.importFromMarkdown(content);
      
      console.log('📋 Synced from file to database');
    } catch (error) {
      console.error('Failed to sync from file to DB:', error);
    }
  }

  private async syncFromDbToFile(): Promise<void> {
    if (!optimizedMarkdownService.isConnected()) return;
    
    try {
      const content = await indexedDbService.exportToMarkdown();
      
      // Parse and save to file
      const { parseMarkdownContent } = await import('../utils/markdownParser');
      const parsed = parseMarkdownContent(content);
      
      await optimizedMarkdownService.saveToFile(parsed.sections, parsed.projects);
      
      console.log('📋 Synced from database to file');
    } catch (error) {
      console.error('Failed to sync from DB to file:', error);
    }
  }

  private queueSync(): void {
    if (this.syncInterval) {
      clearTimeout(this.syncInterval);
    }
    
    // Debounce sync - only sync after 2 seconds of no changes
    this.syncInterval = window.setTimeout(() => {
      this.syncFromDbToFile();
      this.syncInterval = null;
    }, 2000);
  }

  private startAutoSync(): void {
    // Sync every 30 seconds if there are changes
    setInterval(async () => {
      if (optimizedMarkdownService.isConnected()) {
        // Check if file was modified externally
        const cached = optimizedMarkdownService.getCachedData();
        if (cached) {
          try {
            const data = await optimizedMarkdownService.loadFromFile();
            // If file changed, sync to DB
            if (data.sections !== cached.sections) {
              await this.syncFromFileToDb();
            }
          } catch (error) {
            console.error('Auto-sync check failed:', error);
          }
        }
      }
    }, 30000);
  }

  // Configuration
  setMode(mode: StorageMode): void {
    this.mode = mode;
  }

  getMode(): StorageMode {
    return this.mode;
  }

  isFileConnected(): boolean {
    return optimizedMarkdownService.isConnected();
  }
}

export const hybridStorageService = new HybridStorageService();
