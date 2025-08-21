import React, { useState } from 'react';
import { useMarkdownStore } from '../stores/useMarkdownStore';
import { getDayName } from '../utils/dateUtils';
import { TaskItem } from '../components/TaskItem';
import { TaskInput } from '../components/TaskInput';
import { ProjectFilter } from '../components/ProjectFilter';
import { StatusIndicator } from '../components/StatusIndicator';
import { FloatingActionButton } from '../components/FloatingActionButton';
import { ThemeToggle } from '../components/ThemeToggle';
import { ChatInterface } from '../components/ChatInterface';
import { AdvancedSearch } from '../components/AdvancedSearch';
import { FileConnection } from '../components/FileConnection';
import { useNotifications } from '../hooks/useNotifications';

import type { Task } from '../types';

const Dashboard: React.FC = () => {
  const { currentDate, getCurrentSection, projects, loading, error } = useMarkdownStore();
  const currentSection = getCurrentSection();
  const dayName = getDayName(currentDate);
  
  // Initialize notifications
  useNotifications();


  
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <header className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-semibold text-neutral-900 dark:text-neutral-100">
              {currentDate} ({dayName})
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 flex items-center gap-2">
              <span className="w-2 h-2 bg-primary-500 rounded-full animate-pulse-subtle"></span>
              Local: Australia/Sydney
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:block">
              <StatusIndicator />
            </div>
            <AdvancedSearch />
            <ThemeToggle />
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`mypa-button-${showFilters ? 'primary' : 'secondary'} text-sm`}
            >
              <span className="hidden sm:inline">{showFilters ? 'Hide' : 'Show'} </span>Filters
            </button>
          </div>
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

      {/* File Connection */}
      <FileConnection />

      <div className="grid gap-6 lg:gap-8">
        {/* Claude AI Assistant */}
        <section className="mypa-card animate-slide-up p-6">
          <h2 className="mypa-section-header">
            <span className="flex items-center gap-2">
              <span className="text-lg">🤖</span>
              <span>AI Assistant</span>
            </span>
            <span className="text-sm font-medium px-2.5 py-1 rounded-full bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400">
              Claude
            </span>
          </h2>
          <ChatInterface />
        </section>

        {/* Priorities Section */}
        <section className="mypa-card animate-slide-up p-6">
          <h2 className="mypa-section-header">
            <span className="flex items-center gap-2">
              <span className="text-lg">📌</span>
              <span>Priorities (Top 3 max)</span>
            </span>
            <span className="text-sm font-medium px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300">
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
        <section className="mypa-card animate-slide-up p-6">
          <h2 className="mypa-section-header">
            <span className="flex items-center gap-2">
              <span className="text-lg">📅</span>
              <span>Schedule</span>
            </span>
            <span className="text-sm font-medium px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300">
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
        <section className="mypa-card animate-slide-up p-6">
          <h2 className="mypa-section-header">
            <span className="flex items-center gap-2">
              <span className="text-lg">🔄</span>
              <span>Follow-ups</span>
            </span>
            <span className="text-sm font-medium px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300">
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
          <section className="mypa-card animate-slide-up p-6">
            <h2 className="mypa-section-header">
              <span className="flex items-center gap-2">
                <span className="text-lg">✅</span>
                <span>Completed</span>
              </span>
              <span className="text-sm font-medium px-2.5 py-1 rounded-full bg-success-50 dark:bg-success-500/20 text-success-600 dark:text-success-400">
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
        <section className="mypa-card animate-slide-up p-6">
          <h2 className="mypa-section-header">
            <span className="flex items-center gap-2">
              <span className="text-lg">📋</span>
              <span>Active Projects</span>
            </span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <div key={project.id} className="group border border-neutral-200 dark:border-neutral-700 rounded-xl p-4 hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-elegant transition-all duration-200">
                <h3 className="font-medium text-neutral-900 dark:text-neutral-100 mb-1">{project.name}</h3>
                <p className="mypa-project-tag">{project.tag}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
      
      {/* Mobile FAB - only show on mobile */}
      <div className="md:hidden">
        <FloatingActionButton />
      </div>
      
      {/* Mobile status indicator */}
      <div className="fixed bottom-6 left-6 sm:hidden z-40">
        <StatusIndicator className="!text-xs !px-2 !py-1" />
      </div>
    </div>
  );
};

export default Dashboard;