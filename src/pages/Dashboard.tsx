import React, { useState } from 'react';
import { Link } from 'react-router-dom';
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
  const { currentDate, getCurrentSection, projects, loading, error } = useMarkdownStore();
  const currentSection = getCurrentSection();
  const dayName = getDayName(currentDate);

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
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
            <Link
              to="/settings"
              className="mypa-button-secondary text-sm flex items-center gap-2 hover:scale-105 transition-transform duration-200"
              title="Settings"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="hidden sm:inline">Settings</span>
            </Link>
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
      <section className="mypa-card mypa-card-hero animate-slide-up p-8 shadow-elegant-xl mb-8 relative overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <h2 className="mypa-section-header-hero flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center shadow-sm">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <span>Today's Priorities</span>
          </h2>
          <div className="mypa-badge bg-primary-100 text-primary-700 border-primary-200">
            <span className="font-semibold">
              {filterTasks(currentSection?.priorities || []).length}
            </span>
            <span className="text-xs opacity-75">/ 3 max</span>
          </div>
        </div>

        <div className="space-y-3">
          {filterTasks(currentSection?.priorities || []).map((task, index) => (
            <div key={task.id} className="mypa-task-item-priority bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-xl p-4 shadow-premium border border-primary-200/50 dark:border-primary-700/50 animate-slide-up" style={{animationDelay: `${index * 100}ms`}}>
              {renderTaskItem(task)}
            </div>
          ))}

          {filterTasks(currentSection?.priorities || []).length === 0 && (
            <div className="text-center py-12 text-primary-600 dark:text-primary-400">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-float">
                <svg className="w-8 h-8 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <p className="text-lg font-semibold mb-2">Focus on what matters most</p>
              <p className="text-sm opacity-75">Add your top 3 priorities for today</p>
            </div>
          )}
        </div>

        {(!currentSection?.priorities.length || currentSection.priorities.length < 3) && (
          <div className="mt-8">
            <TaskInput
              sectionType="priorities"
              placeholder="✨ Add your most important task for today..."
            />
          </div>
        )}

        {/* Subtle gradient overlay for premium feel */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary-300/10 to-transparent rounded-bl-full pointer-events-none"></div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-5 gap-6 lg:gap-8">
        {/* LEFT COLUMN - Urgent & Time-Sensitive */}
        <div className="space-y-6 lg:col-span-2 xl:col-span-3">
          {/* Due Today / Overdue - High Priority Visual Treatment */}
          {(currentSection?.schedule || []).some(task =>
            task.dueDate && (new Date(task.dueDate) <= new Date() || task.dueDate === new Date().toISOString().split('T')[0])
          ) && (
            <section className="mypa-card animate-slide-up p-6 border-l-4 border-warning-500 bg-gradient-to-r from-warning-50/80 to-transparent dark:from-warning-900/20 dark:to-transparent backdrop-blur-sm">
              <h3 className="text-lg font-semibold text-warning-700 dark:text-warning-300 mb-4 flex items-center gap-3">
                <div className="w-6 h-6 bg-warning-500 rounded-md flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <span>Due Today & Overdue</span>
              </h3>
              <div className="space-y-2">
                {filterTasks(currentSection?.schedule || [])
                  .filter(task => task.dueDate && (new Date(task.dueDate) <= new Date() || task.dueDate === new Date().toISOString().split('T')[0]))
                  .slice(0, 3)
                  .map((task, index) => (
                    <div key={task.id} className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-lg p-3 border border-warning-200 dark:border-warning-800 shadow-sm animate-bounce-gentle" style={{animationDelay: `${index * 150}ms`}}>
                      {renderTaskItem(task)}
                    </div>
                  ))}
              </div>
            </section>
          )}

          {/* Schedule Section - Secondary Priority */}
          <section className="mypa-card animate-slide-up p-6 hover:shadow-premium-lg transition-all duration-300">
            <h3 className="mypa-section-header">
              <span className="flex items-center gap-3">
                <div className="w-6 h-6 bg-neutral-200 dark:bg-neutral-600 rounded-md flex items-center justify-center">
                  <svg className="w-4 h-4 text-neutral-600 dark:text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <span>Schedule</span>
              </span>
              <span className="mypa-badge">
                {filterTasks(currentSection?.schedule || []).length} tasks
              </span>
            </h3>

            <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-300 dark:scrollbar-thumb-neutral-600">
              {filterTasks(currentSection?.schedule || []).map((task) => (
                <div key={task.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded-lg transition-colors duration-200">
                  {renderTaskItem(task)}
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-700">
              <TaskInput
                sectionType="schedule"
                placeholder="📋 Add scheduled task or meeting..."
              />
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN - Support & Secondary Functions */}
        <div className="space-y-6 lg:col-span-1 xl:col-span-2">
          {/* AI Assistant - Supporting Role */}
          <section className="mypa-card animate-slide-up p-6 bg-gradient-to-br from-primary-50/50 to-transparent dark:from-primary-900/10 dark:to-transparent">
            <h3 className="mypa-section-header">
              <span className="flex items-center gap-3">
                <div className="w-6 h-6 bg-primary-500 rounded-md flex items-center justify-center animate-pulse">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <span>AI Assistant</span>
              </span>
              <span className="mypa-badge bg-primary-100 text-primary-700 border-primary-200">
                Claude
              </span>
            </h3>
            <LazyChatInterface />
          </section>

          {/* Follow-ups Section - Supporting Information */}
          <section className="mypa-card animate-slide-up p-6 hover:shadow-premium-lg transition-all duration-300">
            <h3 className="mypa-section-header">
              <span className="flex items-center gap-3">
                <div className="w-6 h-6 bg-neutral-200 dark:bg-neutral-600 rounded-md flex items-center justify-center">
                  <svg className="w-4 h-4 text-neutral-600 dark:text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <span>Follow-ups</span>
              </span>
              <span className="mypa-badge">
                {filterTasks(currentSection?.followUps || []).length} pending
              </span>
            </h3>

            <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-300 dark:scrollbar-thumb-neutral-600">
              {filterTasks(currentSection?.followUps || []).map((task) => (
                <div key={task.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded-lg transition-colors duration-200">
                  {renderTaskItem(task)}
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-700">
              <TaskInput
                sectionType="followUps"
                placeholder="🔄 Add follow-up item..."
              />
            </div>
          </section>
        </div>
      </div>

      {/* BOTTOM SECTION - Completed Tasks & Projects Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8 mt-8">
        {/* Completed Tasks - Collapsible lower priority */}
        {currentSection?.completed.length > 0 && (
          <section className="mypa-card animate-slide-up p-6 opacity-80 hover:opacity-100 transition-all duration-300 hover:shadow-premium-lg lg:col-span-3">
            <h3 className="mypa-section-header">
              <span className="flex items-center gap-3">
                <div className="w-6 h-6 bg-success-500 rounded-md flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span>Completed Today</span>
              </span>
              <span className="mypa-badge bg-success-100 text-success-700 border-success-200">
                {filterTasks(currentSection.completed).length} done
              </span>
            </h3>

            <div className="space-y-1 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-300 dark:scrollbar-thumb-neutral-600">
              {filterTasks(currentSection.completed).slice(0, 5).map((task) => (
                <div key={task.id} className="opacity-60 hover:opacity-80 transition-opacity duration-200">
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
        <section className="mypa-card animate-slide-up p-6 hover:shadow-premium-lg transition-all duration-300 lg:col-span-2">
          <h3 className="mypa-section-header">
            <span className="flex items-center gap-3">
              <div className="w-6 h-6 bg-neutral-200 dark:bg-neutral-600 rounded-md flex items-center justify-center">
                <svg className="w-4 h-4 text-neutral-600 dark:text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <span>Active Projects</span>
            </span>
            <span className="mypa-badge">
              {projects.length} projects
            </span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {projects.slice(0, 6).map((project, index) => (
              <div key={project.id} className="group border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-premium hover:bg-neutral-25 dark:hover:bg-neutral-800/50 transition-all duration-200 animate-fade-in" style={{animationDelay: `${index * 50}ms`}}>
                <h4 className="font-medium text-neutral-900 dark:text-neutral-100 text-sm mb-2">{project.name}</h4>
                <p className="mypa-project-tag text-xs">{project.tag}</p>
              </div>
            ))}
            {projects.length > 6 && (
              <div className="flex items-center justify-center text-xs text-neutral-500 dark:text-neutral-400 border-2 border-dashed border-neutral-200 dark:border-neutral-700 rounded-lg p-4 hover:border-primary-300 dark:hover:border-primary-600 transition-colors duration-200">
                <span className="font-medium">+{projects.length - 6} more projects</span>
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
        <div className="backdrop-blur-sm bg-white/80 dark:bg-neutral-800/80 rounded-lg shadow-premium border border-neutral-200/50 dark:border-neutral-700/50">
          <StatusIndicator className="!text-xs !px-3 !py-2" />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;