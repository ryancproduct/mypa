import React, { useState, useEffect } from 'react';
import { useMarkdownStore } from '../stores/useMarkdownStore';
import { getDayName } from '../utils/dateUtils';
import { TaskItem } from '../components/TaskItem';
import { SwipeableTaskItem } from '../components/SwipeableTaskItem';
import { TaskInput } from '../components/TaskInput';
import { ProjectFilter } from '../components/ProjectFilter';
import { StatusIndicator } from '../components/StatusIndicator';
import { FloatingActionButton } from '../components/FloatingActionButton';
import { ThemeToggle } from '../components/ThemeToggle';
import { LazyChatInterface } from '../components/LazyChatInterface';
import { AdvancedSearch } from '../components/AdvancedSearch';

import { useNotifications } from '../hooks/useNotifications';
import { DashboardSkeleton } from '../components/LoadingSkeleton';

import type { Task } from '../types';

const Dashboard: React.FC = () => {
  const { currentDate, getCurrentSection, projects, loading, error, initialize } = useMarkdownStore();
  const currentSection = getCurrentSection();
  const dayName = getDayName(currentDate);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Initialize notifications
  useNotifications();

  // Detect mobile device for swipe gestures
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;

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

  // Render appropriate task component based on device type
  const renderTaskItem = (task: Task, showMetadata = true) => {
    const TaskComponent = isMobile ? SwipeableTaskItem : TaskItem;
    return (
      <TaskComponent
        key={task.id}
        task={task}
        showMetadata={showMetadata}
      />
    );
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <div className="mypa-card max-w-md w-full p-8 text-center border-l-4 border-red-500">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
            Unable to Load Data
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mypa-button-primary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!currentSection) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <div className="mypa-card max-w-md w-full p-8 text-center">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
            Ready to Start
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">
            No tasks for today yet. Start organizing your day by adding your first priority.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mypa-button-secondary"
          >
            Refresh
          </button>
        </div>
      </div>
    );
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

      {/* Mobile Swipe Instructions */}
      {isMobile && (
        <div className="mypa-card p-4 mb-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-blue-700 dark:text-blue-300">
              <p className="font-medium">Touch gestures enabled</p>
              <p>Swipe right to complete • Swipe left to delete</p>
            </div>
          </div>
        </div>
      )}

      {/* Project Filters */}
      {showFilters && (
        <ProjectFilter
          selectedProjects={selectedProjects}
          onProjectToggle={handleProjectToggle}
          onClearAll={handleClearAll}
          onSelectAll={handleSelectAll}
        />
      )}

      

      {/* HERO SECTION - Today's Priorities (Highest Visual Priority) */}
      <section className="mypa-card animate-slide-up p-8 border-2 border-primary-200 dark:border-primary-800 bg-gradient-to-br from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 shadow-lg mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-primary-900 dark:text-primary-100 flex items-center gap-3">
            <span className="text-2xl">📌</span>
            <span>Today's Priorities</span>
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
              {filterTasks(currentSection?.priorities || []).length}
            </span>
            <span className="text-sm text-primary-600 dark:text-primary-400">/ 3 max</span>
          </div>
        </div>

        <div className="space-y-3">
          {filterTasks(currentSection?.priorities || []).map((task) => (
            <div key={task.id} className="bg-white dark:bg-neutral-800 rounded-lg p-1 shadow-sm border border-primary-100 dark:border-primary-800">
              {renderTaskItem(task)}
            </div>
          ))}

          {filterTasks(currentSection?.priorities || []).length === 0 && (
            <div className="text-center py-8 text-primary-600 dark:text-primary-400">
              <p className="text-lg font-medium mb-2">🎯 Focus on what matters most</p>
              <p className="text-sm opacity-75">Add your top 3 priorities for today</p>
            </div>
          )}
        </div>

        {(!currentSection?.priorities.length || currentSection.priorities.length < 3) && (
          <div className="mt-6">
            <TaskInput
              sectionType="priorities"
              placeholder="Add your most important task for today..."
            />
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* LEFT COLUMN - Urgent & Time-Sensitive */}
        <div className="space-y-6">
          {/* Due Today / Overdue - High Priority Visual Treatment */}
          {(currentSection?.schedule || []).some(task =>
            task.dueDate && (new Date(task.dueDate) <= new Date() || task.dueDate === new Date().toISOString().split('T')[0])
          ) && (
            <section className="mypa-card animate-slide-up p-6 border-l-4 border-warning-400 bg-warning-50/50 dark:bg-warning-900/10">
              <h3 className="text-lg font-semibold text-warning-700 dark:text-warning-300 mb-4 flex items-center gap-2">
                <span>⚡</span>
                <span>Due Today & Overdue</span>
              </h3>
              <div className="space-y-2">
                {filterTasks(currentSection?.schedule || [])
                  .filter(task => task.dueDate && (new Date(task.dueDate) <= new Date() || task.dueDate === new Date().toISOString().split('T')[0]))
                  .slice(0, 3)
                  .map((task) => (
                    <div key={task.id} className="bg-white dark:bg-neutral-800 rounded-lg p-1 border border-warning-200 dark:border-warning-800">
                      {renderTaskItem(task)}
                    </div>
                  ))}
              </div>
            </section>
          )}

          {/* Schedule Section - Secondary Priority */}
          <section className="mypa-card animate-slide-up p-6">
            <h3 className="mypa-section-header">
              <span className="flex items-center gap-2">
                <span className="text-lg">📅</span>
                <span>Schedule</span>
              </span>
              <span className="text-sm font-medium px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300">
                {filterTasks(currentSection?.schedule || []).length} tasks
              </span>
            </h3>

            <div className="space-y-1 max-h-64 overflow-y-auto">
              {filterTasks(currentSection?.schedule || []).map((task) =>
                renderTaskItem(task)
              )}
            </div>

            <div className="mt-4">
              <TaskInput
                sectionType="schedule"
                placeholder="Add scheduled task or meeting..."
              />
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN - Support & Secondary Functions */}
        <div className="space-y-6">
          {/* AI Assistant - Supporting Role */}
          <section className="mypa-card animate-slide-up p-6">
            <h3 className="mypa-section-header">
              <span className="flex items-center gap-2">
                <span className="text-lg">🤖</span>
                <span>AI Assistant</span>
              </span>
              <span className="text-sm font-medium px-2.5 py-1 rounded-full bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400">
                Claude
              </span>
            </h3>
            <LazyChatInterface />
          </section>

          {/* Follow-ups Section - Supporting Information */}
          <section className="mypa-card animate-slide-up p-6">
            <h3 className="mypa-section-header">
              <span className="flex items-center gap-2">
                <span className="text-lg">🔄</span>
                <span>Follow-ups</span>
              </span>
              <span className="text-sm font-medium px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300">
                {filterTasks(currentSection?.followUps || []).length} pending
              </span>
            </h3>

            <div className="space-y-1 max-h-48 overflow-y-auto">
              {filterTasks(currentSection?.followUps || []).map((task) =>
                renderTaskItem(task)
              )}
            </div>

            <div className="mt-4">
              <TaskInput
                sectionType="followUps"
                placeholder="Add follow-up item..."
              />
            </div>
          </section>
        </div>
      </div>

      {/* BOTTOM SECTION - Completed Tasks & Projects Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        {/* Completed Tasks - Collapsible lower priority */}
        {currentSection?.completed.length > 0 && (
          <section className="mypa-card animate-slide-up p-6 opacity-75 hover:opacity-100 transition-opacity duration-200">
            <h3 className="mypa-section-header">
              <span className="flex items-center gap-2">
                <span className="text-lg">✅</span>
                <span>Completed Today</span>
              </span>
              <span className="text-sm font-medium px-2.5 py-1 rounded-full bg-success-50 dark:bg-success-500/20 text-success-600 dark:text-success-400">
                {filterTasks(currentSection.completed).length} done
              </span>
            </h3>

            <div className="space-y-1 max-h-48 overflow-y-auto">
              {filterTasks(currentSection.completed).slice(0, 5).map((task) => (
                <div key={task.id} className="opacity-60">
                  {renderTaskItem(task, false)}
                </div>
              ))}
              {filterTasks(currentSection.completed).length > 5 && (
                <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center pt-2">
                  +{filterTasks(currentSection.completed).length - 5} more completed tasks
                </p>
              )}
            </div>
          </section>
        )}

        {/* Projects Overview - Reference Information */}
        <section className="mypa-card animate-slide-up p-6">
          <h3 className="mypa-section-header">
            <span className="flex items-center gap-2">
              <span className="text-lg">📋</span>
              <span>Active Projects</span>
            </span>
            <span className="text-sm font-medium px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300">
              {projects.length} projects
            </span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {projects.slice(0, 6).map((project) => (
              <div key={project.id} className="group border border-neutral-200 dark:border-neutral-700 rounded-lg p-3 hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-sm transition-all duration-200">
                <h4 className="font-medium text-neutral-900 dark:text-neutral-100 text-sm mb-1">{project.name}</h4>
                <p className="mypa-project-tag text-xs">{project.tag}</p>
              </div>
            ))}
            {projects.length > 6 && (
              <div className="flex items-center justify-center text-xs text-neutral-500 dark:text-neutral-400 border-2 border-dashed border-neutral-200 dark:border-neutral-700 rounded-lg p-3">
                +{projects.length - 6} more projects
              </div>
            )}
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