import React, { useState } from 'react';
import type { Task } from '../types';
import { useMarkdownStore } from '../stores/useMarkdownStore';
import { isOverdue, isDueToday, getDaysOverdue } from '../utils/dateUtils';

interface TaskItemProps {
  task: Task;
  onEdit?: (task: Task) => void;
  showMetadata?: boolean;
}

export const TaskItem: React.FC<TaskItemProps> = ({ 
  task, 
  onEdit, 
  showMetadata = true 
}) => {
  const { updateTask, completeTask, deleteTask } = useMarkdownStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(task.content);

  const handleToggleComplete = () => {
    if (task.status === 'completed') {
      updateTask(task.id, { status: 'pending', completedAt: undefined });
    } else {
      completeTask(task.id);
    }
  };

  const handleEdit = () => {
    if (isEditing) {
      updateTask(task.id, { content: editContent });
      setIsEditing(false);
      onEdit?.(task);
    } else {
      setIsEditing(true);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEdit();
    } else if (e.key === 'Escape') {
      setEditContent(task.content);
      setIsEditing(false);
    }
  };

  const getStatusBadge = () => {
    if (task.status === 'completed') return null;
    if (task.dueDate && isOverdue(task.dueDate)) {
      const days = getDaysOverdue(task.dueDate);
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-danger-50 text-danger-600 dark:bg-danger-500/20 dark:text-danger-400">
          ⚠️ Overdue {days}d
        </span>
      );
    }
    if (task.dueDate && isDueToday(task.dueDate)) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-warning-50 text-warning-600 dark:bg-warning-500/20 dark:text-warning-400">
          📅 Due today
        </span>
      );
    }
    if (task.status === 'in_progress') {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary-50 text-primary-600 dark:bg-primary-500/20 dark:text-primary-400">
          🔄 In Progress
        </span>
      );
    }
    return null;
  };

  const getPriorityColor = () => {
    switch (task.priority) {
      case 'P1': return 'text-danger-600 dark:text-danger-400 font-semibold';
      case 'P2': return 'text-warning-600 dark:text-warning-400 font-medium';
      case 'P3': return 'text-primary-600 dark:text-primary-400 font-medium';
      default: return 'text-neutral-700 dark:text-neutral-300';
    }
  };

  return (
    <div className="mypa-task-item group">
      {/* Checkbox */}
      <button
        onClick={handleToggleComplete}
        className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
          task.status === 'completed'
            ? 'bg-success-500 border-success-500 text-white shadow-sm animate-task-complete'
            : 'border-neutral-300 hover:border-primary-400 dark:border-neutral-600 dark:hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-500/10'
        }`}
      >
        {task.status === 'completed' && (
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <input
            type="text"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            onBlur={handleEdit}
            onKeyDown={handleKeyPress}
            className="mypa-input text-sm py-2"
            autoFocus
          />
        ) : (
          <div className="space-y-2">
            {/* Task content */}
            <div className="flex items-center space-x-2 flex-wrap">
              <span
                className={`cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-150 ${
                  task.status === 'completed' ? 'line-through text-neutral-500 dark:text-neutral-400' : getPriorityColor()
                }`}
                onClick={() => setIsEditing(true)}
              >
                {task.content}
              </span>
              
              {/* Project tag */}
              {showMetadata && task.project && (
                <span className="mypa-project-tag">
                  {task.project}
                </span>
              )}

              {/* Assignee */}
              {showMetadata && task.assignee && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-700 dark:bg-primary-500/20 dark:text-primary-300">
                  @{task.assignee}
                </span>
              )}

              {/* Priority */}
              {showMetadata && task.priority && (
                <span className={`mypa-priority-indicator ${
                  task.priority === 'P1' ? 'mypa-priority-p1' :
                  task.priority === 'P2' ? 'mypa-priority-p2' :
                  'mypa-priority-p3'
                }`}>
                  !{task.priority}
                </span>
              )}
            </div>

            {/* Status badges and due date */}
            {showMetadata && (
              <div className="flex items-center space-x-2">
                {getStatusBadge()}
                
                {task.dueDate && !isOverdue(task.dueDate) && !isDueToday(task.dueDate) && (
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    Due: {task.dueDate}
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center space-x-1">
        <button
          onClick={handleEdit}
          className="p-1.5 text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-500/10 rounded-md transition-all duration-150"
          title="Edit task"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        
        <button
          onClick={() => deleteTask(task.id)}
          className="p-1.5 text-neutral-400 hover:text-danger-600 dark:hover:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-500/10 rounded-md transition-all duration-150"
          title="Delete task"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
};