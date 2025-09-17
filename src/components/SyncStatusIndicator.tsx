import React from 'react';
import { useMarkdownStore } from '../stores/useMarkdownStore';

interface SyncStatusIndicatorProps {
  className?: string;
  showText?: boolean;
}

export const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({ 
  className = '', 
  showText = true 
}) => {
  const { fileConnected, lastSync, storageMode, loading } = useMarkdownStore();

  const getSyncStatus = () => {
    if (loading) {
      return {
        status: 'syncing',
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-100 dark:bg-blue-500/20',
        borderColor: 'border-blue-200 dark:border-blue-800',
        icon: (
          <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        ),
        text: 'Syncing...'
      };
    }

    if (storageMode === 'db-only') {
      return {
        status: 'db-only',
        color: 'text-purple-600 dark:text-purple-400',
        bgColor: 'bg-purple-100 dark:bg-purple-500/20',
        borderColor: 'border-purple-200 dark:border-purple-800',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
          </svg>
        ),
        text: 'Database Only'
      };
    }

    if (fileConnected) {
      return {
        status: 'connected',
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-100 dark:bg-green-500/20',
        borderColor: 'border-green-200 dark:border-green-800',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        text: storageMode === 'hybrid' ? 'Hybrid Sync' : 'File Connected'
      };
    }

    return {
      status: 'disconnected',
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-100 dark:bg-amber-500/20',
      borderColor: 'border-amber-200 dark:border-amber-800',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      ),
      text: 'No File Connection'
    };
  };

  const statusInfo = getSyncStatus();
  const lastSyncText = lastSync ? new Date(lastSync).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  }) : null;

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${statusInfo.bgColor} ${statusInfo.borderColor} ${className}`}>
      <div className={statusInfo.color}>
        {statusInfo.icon}
      </div>
      
      {showText && (
        <div className="flex flex-col">
          <span className={`text-xs font-medium ${statusInfo.color}`}>
            {statusInfo.text}
          </span>
          {lastSyncText && statusInfo.status !== 'db-only' && (
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              {lastSyncText}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

// Compact version for mobile/small spaces
export const CompactSyncStatus: React.FC<{ className?: string }> = ({ className = '' }) => {
  return <SyncStatusIndicator className={className} showText={false} />;
};
