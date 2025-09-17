import { parseMarkdownContent, exportToMarkdown } from '../utils/markdownParser';
import type { DailySection, Task, Project } from '../types';

interface CachedData {
  content: string;
  sections: DailySection[];
  projects: Project[];
  lastModified: number;
  hash: string;
}

class OptimizedMarkdownService {
  private cache: CachedData | null = null;
  private fileHandle: FileSystemFileHandle | null = null;
  private isWatching = false;

  // Simple hash function for content comparison
  private hashContent(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  async connectToFile(): Promise<boolean> {
    try {
      // Type assertion for File System Access API
      const showOpenFilePicker = (window as Window & { showOpenFilePicker?: Function }).showOpenFilePicker;
      if (!showOpenFilePicker) {
        throw new Error('File System Access API not supported');
      }
      
      [this.fileHandle] = await showOpenFilePicker({
        types: [{
          description: 'Markdown files',
          accept: { 'text/markdown': ['.md'] }
        }],
        multiple: false
      });
      
      await this.loadFromFile();
      this.startWatching();
      return true;
    } catch (error) {
      console.error('Failed to connect to file:', error);
      return false;
    }
  }

  async loadFromFile(): Promise<{ sections: DailySection[], projects: Project[] }> {
    if (!this.fileHandle) {
      throw new Error('No file connected');
    }

    const file = await this.fileHandle.getFile();
    const content = await file.text();
    const lastModified = file.lastModified;
    const hash = this.hashContent(content);

    // Check if content has actually changed
    if (this.cache && 
        this.cache.hash === hash && 
        this.cache.lastModified === lastModified) {
      console.log('📋 Content unchanged, using cache');
      return {
        sections: this.cache.sections,
        projects: this.cache.projects
      };
    }

    console.log('📋 Content changed, parsing...');
    const parsed = parseMarkdownContent(content);
    
    // Update cache
    this.cache = {
      content,
      sections: parsed.sections,
      projects: parsed.projects,
      lastModified,
      hash
    };

    return {
      sections: parsed.sections,
      projects: parsed.projects
    };
  }

  async saveToFile(sections: DailySection[], projects: Project[]): Promise<boolean> {
    if (!this.fileHandle) {
      throw new Error('No file connected');
    }

    try {
      const content = exportToMarkdown(sections, projects);
      const writable = await this.fileHandle.createWritable();
      await writable.write(content);
      await writable.close();

      // Update cache after successful write
      const hash = this.hashContent(content);
      this.cache = {
        content,
        sections,
        projects,
        lastModified: Date.now(),
        hash
      };

      console.log('📋 File saved successfully');
      return true;
    } catch (error) {
      console.error('Failed to save file:', error);
      return false;
    }
  }

  // Incremental updates - only update specific tasks without full reload
  async updateTask(taskId: string, updates: Partial<Task>): Promise<boolean> {
    if (!this.cache) {
      await this.loadFromFile();
      if (!this.cache) return false;
    }

    // Update task in cache
    const taskFound = false;
    const updatedSections = this.cache.sections.map(section => ({
      ...section,
      priorities: section.priorities.map(task => 
        task.id === taskId ? { ...task, ...updates } : task
      ),
      schedule: section.schedule.map(task => 
        task.id === taskId ? { ...task, ...updates } : task
      ),
      followUps: section.followUps.map(task => 
        task.id === taskId ? { ...task, ...updates } : task
      ),
      completed: section.completed.map(task => 
        task.id === taskId ? { ...task, ...updates } : task
      )
    }));

    if (taskFound) {
      return await this.saveToFile(updatedSections, this.cache.projects);
    }
    return false;
  }

  private startWatching() {
    if (this.isWatching) return;
    
    // Poll for file changes every 5 seconds (when tab is active)
    this.isWatching = true;
    const checkForChanges = async () => {
      if (!document.hidden && this.fileHandle) {
        try {
          await this.loadFromFile();
        } catch (error) {
          console.error('Error checking for file changes:', error);
        }
      }
    };

    setInterval(checkForChanges, 5000);
  }

  getCachedData() {
    return this.cache;
  }

  isConnected(): boolean {
    return this.fileHandle !== null;
  }
}

export const optimizedMarkdownService = new OptimizedMarkdownService();
