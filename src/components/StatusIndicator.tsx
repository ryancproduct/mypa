import React from 'react';

interface StatusIndicatorProps {
  isOnline?: boolean;
  syncStatus?: 'synced' | 'syncing' | 'offline' | 'error';
  className?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ 
  isOnline = navigator.onLine, 
  syncStatus = 'synced',
  className = '' 
}) => {
  const getStatusConfig = () => {
    if (!isOnline || syncStatus === 'offline') {
      return {
        icon: '📴',
        text: 'Working offline',
        className: 'mypa-status-offline'
      };
    }
    
    switch (syncStatus) {
      case 'syncing':
        return {
          icon: '🔄',
          text: 'Syncing...',
          className: 'mypa-status-indicator bg-primary-50 text-primary-600 dark:bg-primary-500/20 dark:text-primary-400'
        };
      case 'error':
        return {
          icon: '⚠️',
          text: 'Sync error',
          className: 'mypa-status-indicator bg-danger-50 text-danger-600 dark:bg-danger-500/20 dark:text-danger-400'
        };
      case 'synced':
      default:
        return {
          icon: '✅',
          text: 'All changes saved',
          className: 'mypa-status-sync'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`mypa-status-indicator ${config.className} ${className}`}>
      <span className={syncStatus === 'syncing' ? 'animate-spin' : ''}>{config.icon}</span>
      <span className="text-xs font-medium">{config.text}</span>
    </div>
  );
};