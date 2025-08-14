import React, { useState } from 'react';
import { useTaskStore } from '../stores/useTaskStore';
import { getDayName } from '../utils/dateUtils';
import { TaskItem } from '../components/TaskItem';
import { TaskInput } from '../components/TaskInput';
import { ProjectFilter } from '../components/ProjectFilter';
import type { Task } from '../types';

const Dashboard: React.FC = () => {
  const { currentDate, getCurrentSection, projects, loading, error } = useTaskStore();
  const currentSection = getCurrentSection();
  const dayName = getDayName(currentDate);
  
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const handleProjectToggle = (project: string) => {
    setSelectedProjects(prev => 
      prev.includes(project) 
        ? prev.filter(p => p !== project)
        : [...prev, project]
    );
  };

  const handleClearAll = () => setSelectedProjects([]);
  const handleSelectAll = () => setSelectedProjects(projects.map(p => p.tag));

  const filterTasks = (tasks: Task[]) => {
    if (selectedProjects.length === 0) return tasks;
    return tasks.filter(task => 
      !task.project || selectedProjects.includes(task.project)
    );
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-screen">Error: {error}</div>;
  }

  if (!currentSection) {
    return <div className="flex justify-center items-center h-screen">No data for today.</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {currentDate} ({dayName})
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Local: Australia/Sydney
            </p>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            {showFilters ? 'Hide' : 'Show'} Filters
          </button>
        </div>
      </header>

      {/* Project Filters */}
      {showFilters && (
        <ProjectFilter
          selectedProjects={selectedProjects}
          onProjectToggle={handleProjectToggle}
          onClearAll={handleClearAll}
          onSelectAll={handleSelectAll}
        />
      )}

      <div className="grid gap-6">
        {/* Priorities Section */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center justify-between">
            <span>📌 Priorities (Top 3 max)</span>
            <span className="text-sm text-gray-500">
              {filterTasks(currentSection?.priorities || []).length} / 3
            </span>
          </h2>
          
          <div className="space-y-1">
            {filterTasks(currentSection?.priorities || []).map((task) => (
              <TaskItem key={task.id} task={task} />
            ))}
          </div>
          
          {(!currentSection?.priorities.length || currentSection.priorities.length < 3) && (
            <div className="mt-4">
              <TaskInput 
                sectionType="priorities" 
                placeholder="Add high-priority task..."
              />
            </div>
          )}
        </section>

        {/* Schedule Section */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center justify-between">
            <span>📅 Schedule</span>
            <span className="text-sm text-gray-500">
              {filterTasks(currentSection?.schedule || []).length} tasks
            </span>
          </h2>
          
          <div className="space-y-1">
            {filterTasks(currentSection?.schedule || []).map((task) => (
              <TaskItem key={task.id} task={task} />
            ))}
          </div>
          
          <div className="mt-4">
            <TaskInput 
              sectionType="schedule" 
              placeholder="Add scheduled task or meeting..."
            />
          </div>
        </section>

        {/* Follow-ups Section */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center justify-between">
            <span>🔄 Follow-ups</span>
            <span className="text-sm text-gray-500">
              {filterTasks(currentSection?.followUps || []).length} pending
            </span>
          </h2>
          
          <div className="space-y-1">
            {filterTasks(currentSection?.followUps || []).map((task) => (
              <TaskItem key={task.id} task={task} />
            ))}
          </div>
          
          <div className="mt-4">
            <TaskInput 
              sectionType="followUps" 
              placeholder="Add follow-up item..."
            />
          </div>
        </section>

        {/* Completed Tasks */}
        {currentSection?.completed.length > 0 && (
          <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center justify-between">
              <span>✅ Completed</span>
              <span className="text-sm text-gray-500">
                {filterTasks(currentSection.completed).length} done today
              </span>
            </h2>
            
            <div className="space-y-1">
              {filterTasks(currentSection.completed).map((task) => (
                <TaskItem key={task.id} task={task} showMetadata={false} />
              ))}
            </div>
          </section>
        )}

        {/* Projects Overview */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            📋 Active Projects
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {projects.map((project) => (
              <div key={project.id} className="border rounded-lg p-3 hover:shadow-md transition-shadow">
                <h3 className="font-medium">{project.name}</h3>
                <p className="text-sm text-blue-600">{project.tag}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;