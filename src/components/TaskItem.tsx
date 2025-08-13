import React, { useState } from 'react';
import { Task } from '../types';
import { useTaskStore } from '../stores/useTaskStore';
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
  const { updateTask, completeTask, deleteTask } = useTaskStore();
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
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          ⚠️ Overdue {days}d
        </span>
      );
    }
    if (task.dueDate && isDueToday(task.dueDate)) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          📅 Due today
        </span>
      );
    }
    if (task.status === 'in_progress') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          🔄 In Progress
        </span>
      );
    }
    return null;
  };

  const getPriorityColor = () => {
    switch (task.priority) {
      case 'P1': return 'text-red-600 font-semibold';
      case 'P2': return 'text-orange-600 font-medium';
      case 'P3': return 'text-yellow-600';
      default: return '';
    }
  };

  return (
    <div className="group flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
      {/* Checkbox */}
      <button
        onClick={handleToggleComplete}
        className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
          task.status === 'completed'
            ? 'bg-green-500 border-green-500 text-white'
            : 'border-gray-300 hover:border-gray-400 dark:border-gray-600'
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
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600"
            autoFocus
          />
        ) : (
          <div className="space-y-2">
            {/* Task content */}
            <div className="flex items-center space-x-2 flex-wrap">
              <span
                className={`${
                  task.status === 'completed' ? 'line-through text-gray-500' : ''
                } ${getPriorityColor()}`}
                onClick={() => setIsEditing(true)}
              >
                {task.content}
              </span>
              
              {/* Project tag */}
              {showMetadata && task.project && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  {task.project}
                </span>
              )}

              {/* Assignee */}
              {showMetadata && task.assignee && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                  @{task.assignee}
                </span>
              )}

              {/* Priority */}
              {showMetadata && task.priority && (
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  task.priority === 'P1' ? 'bg-red-100 text-red-800' :
                  task.priority === 'P2' ? 'bg-orange-100 text-orange-800' :
                  'bg-yellow-100 text-yellow-800'
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
                  <span className="text-xs text-gray-500">
                    Due: {task.dueDate}
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-2">
        <button
          onClick={handleEdit}
          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
          title="Edit task"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        
        <button
          onClick={() => deleteTask(task.id)}
          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
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