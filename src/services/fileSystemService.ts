// File system service for reading/writing ToDo.md
// Note: This uses web APIs that require user permission

export class FileSystemService {
  private fileHandle: FileSystemFileHandle | null = null;
  private todoFilePath = '/Users/ryanclement/Desktop/Notes/ToDo.md';

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
        // For development, try to read using fetch (won't work for local files in production)
        // This is mainly for demonstration - in production, user would need to select the file
        throw new Error('No file access - please select your ToDo.md file');
      }
    } catch (error) {
      console.error('Error reading file:', error);
      throw error;
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