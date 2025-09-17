// File system service for reading/writing ToDo.md
// Note: This uses web APIs that require user permission
// Configured to prioritize local ToDo.md and Instructions.md files

export class FileSystemService {
  private fileHandle: FileSystemFileHandle | null = null;
  private todoFilePath = '/Users/ryanclement/Desktop/Notes/notes-pwa/ToDo.md';
  private instructionsFilePath = '/Users/ryanclement/Desktop/Notes/notes-pwa/Instructions.md';

  // Request file access using the File System Access API
  async requestFileAccess(): Promise<boolean> {
    try {
      if ('showOpenFilePicker' in window) {
        // Use File System Access API (Chrome/Edge)
        const [fileHandle] = await (window as any).showOpenFilePicker({
          types: [
            {
              description: 'Markdown files',
              accept: {
                'text/markdown': ['.md'],
              },
            },
          ],
        });
        this.fileHandle = fileHandle;
        return true;
      } else {
        // Fallback: use input element
        return this.requestFileAccessFallback();
      }
    } catch (error) {
      console.error('File access denied:', error);
      return false;
    }
  }

  private async requestFileAccessFallback(): Promise<boolean> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.md';
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          resolve(true);
        } else {
          resolve(false);
        }
      };
      input.click();
    });
  }

  // Read the ToDo.md file content
  async readTodoFile(): Promise<string> {
    try {
      if (this.fileHandle) {
        const file = await this.fileHandle.getFile();
        return await file.text();
      } else {
        // Try to read the local file directly (development mode)
        return await this.readLocalTodoFile();
      }
    } catch (error) {
      console.error('Error reading file:', error);
      throw error;
    }
  }

  // Read the local ToDo.md file (development mode)
  private async readLocalTodoFile(): Promise<string> {
    try {
      // In development, try to read the file using Node.js-style require or fetch
      if (typeof window !== 'undefined') {
        // Browser environment - try fetch with relative path
        const response = await fetch('/ToDo.md');
        if (response.ok) {
          return await response.text();
        }
      }

      // Fallback: return empty template for today's date
      const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD format
      return `# ${today} (Local: Australia/Sydney)

## 📌 Priorities (Top 3 max)
- [ ]

## 📅 Schedule
- [ ]

## 🔄 Follow-ups
- [ ]

## 🧠 Notes & Ideas
-

## ✅ Completed
-

## 🧱 Blockers
- `;
    } catch (error) {
      console.error('Could not read local ToDo.md file:', error);
      throw new Error('No file access - please select your ToDo.md file or place it in the project root');
    }
  }

  // Read the Instructions.md file
  async readInstructionsFile(): Promise<string> {
    try {
      if (typeof window !== 'undefined') {
        const response = await fetch('/Instructions.md');
        if (response.ok) {
          return await response.text();
        }
      }
      return 'Instructions file not found';
    } catch (error) {
      console.error('Error reading instructions file:', error);
      return 'Instructions file not accessible';
    }
  }

  // Write content back to the ToDo.md file
  async writeTodoFile(content: string): Promise<boolean> {
    try {
      if (this.fileHandle) {
        const writable = await this.fileHandle.createWritable();
        await writable.write(content);
        await writable.close();
        return true;
      } else {
        // Fallback: download the updated file
        this.downloadUpdatedFile(content);
        return true;
      }
    } catch (error) {
      console.error('Error writing file:', error);
      return false;
    }
  }

  private downloadUpdatedFile(content: string) {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ToDo.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Check if we have file access
  hasFileAccess(): boolean {
    return this.fileHandle !== null;
  }

  // Get file info
  async getFileInfo(): Promise<{ name: string; lastModified: number } | null> {
    if (this.fileHandle) {
      const file = await this.fileHandle.getFile();
      return {
        name: file.name,
        lastModified: file.lastModified
      };
    }
    return null;
  }
}

export const fileSystemService = new FileSystemService();