import React, { Suspense, lazy } from 'react';
import { ChatInterfaceSkeleton } from './LoadingSkeleton';
import { ErrorBoundary } from './ErrorBoundary';

// Lazy load the ChatInterface component
const ChatInterface = lazy(() => import('./ChatInterface').then(module => ({ default: module.ChatInterface })));

interface LazyChatInterfaceProps {
  onTasksCreated?: (tasks: any[]) => void;
  className?: string;
}

export const LazyChatInterface: React.FC<LazyChatInterfaceProps> = (props) => {
  return (
    <ErrorBoundary
      fallback={
        <div className="mypa-card p-6 border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                AI Assistant Unavailable
              </h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                The AI chat feature is temporarily unavailable. Your tasks and data are safe.
              </p>
            </div>
          </div>
        </div>
      }
    >
      <Suspense fallback={<ChatInterfaceSkeleton />}>
        <ChatInterface {...props} />
      </Suspense>
    </ErrorBoundary>
  );
};