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
    <div className="mypa-card p-4 mb-6 animate-slide-up">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h3 className="mypa-section-header !mb-0">
          <span className="flex items-center gap-2">
            <span className="text-lg">🎯</span>
            <span>Filter by Projects</span>
          </span>
        </h3>
        <div className="flex gap-2">
          <button
            onClick={onSelectAll}
            disabled={isAllSelected}
            className={`mypa-button-secondary text-sm py-1.5 px-3 ${
              isAllSelected ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            All
          </button>
          <button
            onClick={onClearAll}
            disabled={isNoneSelected}
            className={`mypa-button-secondary text-sm py-1.5 px-3 ${
              isNoneSelected ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            None
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        {projects.map((project) => {
          const isSelected = selectedProjects.includes(project.tag);
          
          return (
            <button
              key={project.id}
              onClick={() => onProjectToggle(project.tag)}
              className={`p-3 rounded-xl border-2 transition-all duration-200 text-left group active:scale-95 ${
                isSelected
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/20 text-primary-700 dark:text-primary-300 shadow-sm'
                  : 'border-neutral-200 dark:border-neutral-600 hover:border-primary-300 dark:hover:border-primary-500 text-neutral-700 dark:text-neutral-300 hover:bg-primary-50/30 dark:hover:bg-primary-500/5'
              }`}
            >
              <div className="font-medium text-sm group-hover:text-primary-700 dark:group-hover:text-primary-300 transition-colors">
                {project.name}
              </div>
              <div className="text-xs opacity-75 mt-1 mypa-project-tag !px-0 !py-0 !bg-transparent">
                {project.tag}
              </div>
              {isSelected && (
                <div className="mt-2 flex items-center">
                  <svg className="w-4 h-4 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {!isNoneSelected && (
        <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
          <div className="text-sm text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
            <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
            <span>Showing {selectedProjects.length} of {projects.length} projects</span>
          </div>
        </div>
      )}
    </div>
  );
};