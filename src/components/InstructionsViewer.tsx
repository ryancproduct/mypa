import React, { useState, useEffect } from 'react';
import { fileSystemService } from '../services/fileSystemService';

export const InstructionsViewer: React.FC = () => {
  const [instructions, setInstructions] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInstructions = async () => {
      try {
        const content = await fileSystemService.readInstructionsFile();
        setInstructions(content);
      } catch (error) {
        console.error('Failed to load instructions:', error);
        setInstructions('Instructions file not accessible');
      } finally {
        setLoading(false);
      }
    };

    loadInstructions();
  }, []);

  if (loading) {
    return (
      <div className="mypa-card p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="mypa-card p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
          Assistant Instructions
        </h3>
      </div>

      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <pre className="whitespace-pre-wrap text-sm bg-neutral-50 dark:bg-neutral-800 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-x-auto">
          {instructions}
        </pre>
      </div>

      <div className="mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-700">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          <span className="font-medium">Source:</span> Instructions.md
        </p>
        <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">
          These instructions define how Claude Code should behave as your personal assistant and manage your ToDo.md file.
        </p>
      </div>
    </div>
  );
};