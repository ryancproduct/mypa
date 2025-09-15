import React, { useState, useRef, useCallback } from 'react';
import type { Task } from '../types';
import { TaskItem } from './TaskItem';
import { useSwipeGestures } from '../hooks/useSwipeGestures';
import { useMarkdownStore } from '../stores/useMarkdownStore';

interface SwipeableTaskItemProps {
  task: Task;
  onEdit?: (task: Task) => void;
  showMetadata?: boolean;
}

export const SwipeableTaskItem: React.FC<SwipeableTaskItemProps> = ({
  task,
  onEdit,
  showMetadata = true
}) => {
  const { completeTask, deleteTask } = useMarkdownStore();
  const [swipeState, setSwipeState] = useState<'none' | 'complete' | 'delete'>('none');
  const [isAnimating, setIsAnimating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSwipeRight = useCallback(() => {
    // Right swipe = Complete task
    if (task.status !== 'completed') {
      setSwipeState('complete');
      setIsAnimating(true);

      // Add visual feedback
      if (containerRef.current) {
        containerRef.current.style.transform = 'translateX(100px)';
        containerRef.current.style.transition = 'transform 0.3s ease-out';
      }

      // Delay action to show animation
      setTimeout(() => {
        completeTask(task.id);
        setSwipeState('none');
        setIsAnimating(false);
        if (containerRef.current) {
          containerRef.current.style.transform = '';
          containerRef.current.style.transition = '';
        }
      }, 300);
    }
  }, [task.id, task.status, completeTask]);

  const handleSwipeLeft = useCallback(() => {
    // Left swipe = Show delete confirmation
    setSwipeState('delete');
    setIsAnimating(true);

    // Add visual feedback
    if (containerRef.current) {
      containerRef.current.style.transform = 'translateX(-100px)';
      containerRef.current.style.transition = 'transform 0.3s ease-out';
      containerRef.current.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
    }

    // Auto-hide after 3 seconds if no action taken
    setTimeout(() => {
      if (swipeState === 'delete') {
        setSwipeState('none');
        setIsAnimating(false);
        if (containerRef.current) {
          containerRef.current.style.transform = '';
          containerRef.current.style.transition = '';
          containerRef.current.style.backgroundColor = '';
        }
      }
    }, 3000);
  }, [swipeState]);

  const handleConfirmDelete = useCallback(() => {
    deleteTask(task.id);
  }, [task.id, deleteTask]);

  const handleCancelDelete = useCallback(() => {
    setSwipeState('none');
    setIsAnimating(false);
    if (containerRef.current) {
      containerRef.current.style.transform = '';
      containerRef.current.style.transition = '';
      containerRef.current.style.backgroundColor = '';
    }
  }, []);

  const { swipeHandlers } = useSwipeGestures({
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight,
    threshold: 80,
    preventScroll: false,
  });

  return (
    <div className="relative">
      {/* Swipe indicators */}
      {swipeState === 'complete' && (
        <div className="absolute inset-0 bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 rounded-lg flex items-center justify-center z-10">
          <div className="flex items-center gap-2 text-success-700 dark:text-success-300 font-medium">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span>Marking complete...</span>
          </div>
        </div>
      )}

      {swipeState === 'delete' && (
        <div className="absolute inset-0 bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 rounded-lg flex items-center justify-between px-4 z-10">
          <div className="flex items-center gap-2 text-danger-700 dark:text-danger-300 font-medium">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>Delete task?</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCancelDelete}
              className="px-3 py-1 text-sm bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors duration-150"
              aria-label="Cancel delete"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              className="px-3 py-1 text-sm bg-danger-500 text-white rounded-md hover:bg-danger-600 transition-colors duration-150"
              aria-label="Confirm delete"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Task item with swipe handlers */}
      <div
        ref={containerRef}
        className={`transition-all duration-200 ${isAnimating ? 'pointer-events-none' : ''}`}
        {...swipeHandlers}
      >
        <TaskItem
          task={task}
          onEdit={onEdit}
          showMetadata={showMetadata}
        />
      </div>

      {/* Swipe hints for first-time users */}
      {!isAnimating && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Right swipe hint (complete) */}
          {task.status !== 'completed' && (
            <div className="absolute left-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-30 transition-opacity duration-300">
              <div className="flex items-center gap-1 text-success-500 text-xs">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span>Swipe to complete</span>
              </div>
            </div>
          )}

          {/* Left swipe hint (delete) */}
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-30 transition-opacity duration-300">
            <div className="flex items-center gap-1 text-danger-500 text-xs">
              <span>Swipe to delete</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* Screen reader announcement for swipe actions */}
      <div className="sr-only" aria-live="polite">
        {swipeState === 'complete' && 'Task is being marked as complete'}
        {swipeState === 'delete' && 'Delete confirmation shown. Choose an action within 3 seconds.'}
      </div>
    </div>
  );
};