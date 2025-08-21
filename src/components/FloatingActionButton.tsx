import React, { useState } from 'react';
import { TaskInput } from './TaskInput';

interface FloatingActionButtonProps {
  className?: string;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ className = '' }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleTaskAdded = () => {
    setIsExpanded(false);
  };

  return (
    <>
      {/* Overlay */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-neutral-950/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* FAB */}
      <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
        {isExpanded ? (
          <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-elegant-lg border border-neutral-200/50 dark:border-neutral-700/50 p-4 w-80 max-w-[calc(100vw-3rem)] animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">Quick Add</h3>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-full transition-colors"
              >
                <svg className="w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <TaskInput 
              sectionType="priorities" 
              placeholder="Add a priority task..."
              onTaskAdded={handleTaskAdded}
            />
          </div>
        ) : (
          <button
            onClick={() => setIsExpanded(true)}
            className="w-14 h-14 bg-primary-500 hover:bg-primary-600 text-white rounded-full shadow-elegant-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group active:scale-95"
            aria-label="Add new task"
          >
            <svg className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        )}
      </div>
    </>
  );
};