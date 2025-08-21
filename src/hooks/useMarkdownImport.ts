import { useState } from 'react';
import { parseMarkdownContent } from '../utils/markdownParser';
import { useTaskStore } from '../stores/useTaskStore';

export const useMarkdownImport = () => {
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const { } = useTaskStore(); // sections removed as unused

  const importFromFile = async (file: File) => {
    setIsImporting(true);
    setImportError(null);

    try {
      const content = await file.text();
      const parsed = parseMarkdownContent(content);
      
      // Store the parsed sections
      useTaskStore.setState({ sections: parsed.sections });
      
      return parsed.sections;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to import file';
      setImportError(message);
      throw error;
    } finally {
      setIsImporting(false);
    }
  };

  const importFromText = (text: string) => {
    setIsImporting(true);
    setImportError(null);

    try {
      const parsed = parseMarkdownContent(text);
      
      // Store the parsed sections
      useTaskStore.setState({ sections: parsed.sections });
      
      return parsed.sections;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to parse content';
      setImportError(message);
      throw error;
    } finally {
      setIsImporting(false);
    }
  };

  return {
    importFromFile,
    importFromText,
    isImporting,
    importError,
  };
};