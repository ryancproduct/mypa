import React, { useState } from 'react';
import { useMarkdownStore } from '../stores/useMarkdownStore';
import { fileSystemService } from '../services/fileSystemService';

export const FileConnection: React.FC = () => {
  const { 
    fileConnected, 
    lastSync, 
    loading, 
    error, 
    connectToFile, 
    loadFromFile, 
    saveToFile,
    autoSave,
    setAutoSave 
  } = useMarkdownStore();
  
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await connectToFile();
    } finally {
      setIsConnecting(false);
    }
  };

  const handleRefresh = async () => {
    if (fileConnected) {
      await loadFromFile();
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveToFile();
    } finally {
      setIsSaving(false);
    }
  };

  const formatLastSync = (timestamp: string | null) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  if (!fileConnected) {
    return (
      <div className="mypa-card p-8 border-l-4 border-yellow-500 mb-8">
        <div className="flex items-start gap-6">
          <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-500/20 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
              Connect to your ToDo.md file
            </h3>
            <p className="text-base text-neutral-600 dark:text-neutral-400 mb-6 leading-relaxed">
              Connect to your actual ToDo.md file at <code className="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded text-sm">/Users/ryanclement/Desktop/Notes/ToDo.md</code> to sync with your real task data.
            </p>
            {error && (
              <div className="text-sm text-red-600 dark:text-red-400 mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                {error}
              </div>
            )}
            <button
              onClick={handleConnect}
              disabled={isConnecting || loading}
              className="mypa-button-primary disabled:opacity-50 text-base px-6 py-3"
            >
              {isConnecting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Connecting...
                </>
              ) : (
                'Connect to File'
              )}
            </button>
            <div className="mt-4 text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
              📝 <strong>How it works:</strong> This will ask for permission to read and write your ToDo.md file using the browser's File System Access API.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mypa-card p-6 border-l-4 border-green-500 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <div className="font-semibold text-neutral-900 dark:text-neutral-100 text-base">
              📝 Connected to ToDo.md
            </div>
            <div className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              Last sync: {formatLastSync(lastSync)}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
            <input
              type="checkbox"
              checked={autoSave}
              onChange={(e) => setAutoSave(e.target.checked)}
              className="rounded"
            />
            Auto-save
          </label>
          
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
            title="Refresh from file"
          >
            <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          
          {!autoSave && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="mypa-button-secondary text-sm py-2 px-4 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};