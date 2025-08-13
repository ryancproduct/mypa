import React from 'react';
import { useTaskStore } from '../stores/useTaskStore';

interface ProjectFilterProps {
  selectedProjects: string[];
  onProjectToggle: (project: string) => void;
  onClearAll: () => void;
  onSelectAll: () => void;
}

export const ProjectFilter: React.FC<ProjectFilterProps> = ({
  selectedProjects,
  onProjectToggle,
  onClearAll,
  onSelectAll,
}) => {
  const { projects } = useTaskStore();

  const isAllSelected = selectedProjects.length === projects.length;
  const isNoneSelected = selectedProjects.length === 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Filter by Projects
        </h3>
        <div className="flex space-x-2">
          <button
            onClick={onSelectAll}
            disabled={isAllSelected}
            className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            All
          </button>
          <button
            onClick={onClearAll}
            disabled={isNoneSelected}
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            None
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {projects.map((project) => {
          const isSelected = selectedProjects.includes(project.tag);
          
          return (
            <button
              key={project.id}
              onClick={() => onProjectToggle(project.tag)}
              className={`p-3 rounded-lg border-2 transition-all text-left ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
              }`}
            >
              <div className="font-medium text-sm">{project.name}</div>
              <div className="text-xs opacity-75">{project.tag}</div>
            </button>
          );
        })}
      </div>

      {!isNoneSelected && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing {selectedProjects.length} of {projects.length} projects
          </div>
        </div>
      )}
    </div>
  );
};