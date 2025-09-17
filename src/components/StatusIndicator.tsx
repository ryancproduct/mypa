import React, { useState, useEffect } from 'react';
import { useToast } from './Toast';

interface StatusIndicatorProps {
  isOnline?: boolean;
  syncStatus?: 'synced' | 'syncing' | 'offline' | 'error';
  className?: string;
}

// Custom hook for network status and sync monitoring
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'error'>('synced');
  const toast = useToast();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setSyncStatus('synced');
      toast.success('Connection restored', {
        title: 'Back online',
        duration: 3000
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus('offline');
      toast.warning('Working offline - changes will sync when reconnected', {
        title: 'Connection lost',
        persistent: true
      });
    };

    // Simulate sync status changes for demo
    const simulateSync = () => {
      if (isOnline && Math.random() > 0.95) {
        setSyncStatus('syncing');
        setTimeout(() => {
          setSyncStatus('synced');
        }, 1000 + Math.random() * 2000);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check sync status periodically
    const syncInterval = setInterval(simulateSync, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(syncInterval);
    };
  }, [isOnline, toast]);

  return { isOnline, syncStatus, setSyncStatus };
};

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  isOnline: propIsOnline,
  syncStatus: propSyncStatus,
  className = ''
}) => {
  // Use hook for automatic status management or fall back to props
  const { isOnline: hookIsOnline, syncStatus: hookSyncStatus } = propIsOnline !== undefined || propSyncStatus !== undefined
    ? { isOnline: propIsOnline ?? navigator.onLine, syncStatus: propSyncStatus ?? 'synced' }
    : useNetworkStatus();

  const isOnline = propIsOnline ?? hookIsOnline;
  const syncStatus = propSyncStatus ?? hookSyncStatus;
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