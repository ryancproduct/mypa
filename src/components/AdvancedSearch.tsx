import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useMarkdownStore } from '../stores/useMarkdownStore';
import { TaskItem } from './TaskItem';
import { isOverdue, isDueToday, getTaskUrgency } from '../utils/dateUtils';
import type { Task } from '../types';

interface SearchFilters {
  query: string;
  status: 'all' | 'pending' | 'completed' | 'in_progress';
  priority: 'all' | 'P1' | 'P2' | 'P3' | 'none';
  project: string;
  assignee: string;
  dueDateFilter: 'all' | 'overdue' | 'today' | 'week' | 'none';
  dateRange: {
    start: string;
    end: string;
  };
}

export const AdvancedSearch: React.FC = () => {
  const { tasks, projects } = useMarkdownStore();
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    status: 'all',
    priority: 'all',
    project: '',
    assignee: '',
    dueDateFilter: 'all',
    dateRange: {
      start: '',
      end: ''
    }
  });

  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Advanced search algorithm
  const searchResults = useMemo(() => {
    let filtered = tasks;

    // Text search across content, project, assignee
    if (filters.query.trim()) {
      const query = filters.query.toLowerCase();
      filtered = filtered.filter(task =>
        task.content.toLowerCase().includes(query) ||
        task.project?.toLowerCase().includes(query) ||
        task.assignee?.toLowerCase().includes(query) ||
        (task.notes && task.notes.some(note => note.content.toLowerCase().includes(query)))
      );
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(task => task.status === filters.status);
    }

    // Priority filter
    if (filters.priority !== 'all') {
      if (filters.priority === 'none') {
        filtered = filtered.filter(task => !task.priority);
      } else {
        filtered = filtered.filter(task => task.priority === filters.priority);
      }
    }

    // Project filter
    if (filters.project) {
      filtered = filtered.filter(task => task.project === filters.project);
    }

    // Assignee filter
    if (filters.assignee) {
      filtered = filtered.filter(task => 
        task.assignee?.toLowerCase().includes(filters.assignee.toLowerCase())
      );
    }

    // Due date filter
    if (filters.dueDateFilter !== 'all') {
      const today = new Date().toISOString().split('T')[0];
      const weekFromNow = new Date();
      weekFromNow.setDate(weekFromNow.getDate() + 7);
      const weekStr = weekFromNow.toISOString().split('T')[0];

      filtered = filtered.filter(task => {
        switch (filters.dueDateFilter) {
          case 'overdue':
            return task.dueDate && isOverdue(task.dueDate);
          case 'today':
            return task.dueDate && isDueToday(task.dueDate);
          case 'week':
            return task.dueDate && task.dueDate >= today && task.dueDate <= weekStr;
          case 'none':
            return !task.dueDate;
          default:
            return true;
        }
      });
    }

    // Date range filter
    if (filters.dateRange.start && filters.dateRange.end) {
      filtered = filtered.filter(task => {
        if (!task.dueDate) return false;
        return task.dueDate >= filters.dateRange.start && task.dueDate <= filters.dateRange.end;
      });
    }

    // Sort by relevance and urgency
    return filtered.sort((a, b) => {
      // If searching, prioritize text match relevance
      if (filters.query.trim()) {
        const aScore = getRelevanceScore(a, filters.query);
        const bScore = getRelevanceScore(b, filters.query);
        if (aScore !== bScore) return bScore - aScore;
      }
      
      // Then by urgency
      return getTaskUrgency(b) - getTaskUrgency(a);
    });
  }, [tasks, filters]);

  const getRelevanceScore = (task: Task, query: string): number => {
    let score = 0;
    const q = query.toLowerCase();
    
    // Exact matches in content get highest score
    if (task.content.toLowerCase().includes(q)) {
      score += task.content.toLowerCase() === q ? 10 : 5;
    }
    
    // Project matches
    if (task.project?.toLowerCase().includes(q)) {
      score += 3;
    }
    
    // Assignee matches
    if (task.assignee?.toLowerCase().includes(q)) {
      score += 2;
    }
    
    return score;
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const clearFilters = () => {
    setFilters({
      query: '',
      status: 'all',
      priority: 'all',
      project: '',
      assignee: '',
      dueDateFilter: 'all',
      dateRange: { start: '', end: '' }
    });
  };

  const hasActiveFilters = 
    filters.query || 
    filters.status !== 'all' || 
    filters.priority !== 'all' ||
    filters.project ||
    filters.assignee ||
    filters.dueDateFilter !== 'all' ||
    filters.dateRange.start ||
    filters.dateRange.end;

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="mypa-button-secondary text-sm flex items-center gap-2"
        title="Advanced Search (⌘K)"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span className="hidden sm:inline">Search</span>
        {hasActiveFilters && (
          <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-neutral-950/50 backdrop-blur-sm z-50 flex items-start justify-center pt-20">
      <div ref={searchRef} className="mypa-card w-full max-w-4xl mx-4 max-h-[80vh] flex flex-col">
        {/* Search Header */}
        <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              Advanced Search
            </h2>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-full transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Main Search Input */}
          <input
            ref={inputRef}
            type="text"
            value={filters.query}
            onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value }))}
            placeholder="Search tasks, projects, assignees..."
            className="mypa-input mb-4"
            autoFocus
          />

          {/* Filters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Status Filter */}
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
              className="mypa-input text-sm py-2"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>

            {/* Priority Filter */}
            <select
              value={filters.priority}
              onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value as any }))}
              className="mypa-input text-sm py-2"
            >
              <option value="all">All Priorities</option>
              <option value="P1">🔴 P1 (High)</option>
              <option value="P2">🟡 P2 (Medium)</option>
              <option value="P3">🔵 P3 (Low)</option>
              <option value="none">No Priority</option>
            </select>

            {/* Project Filter */}
            <select
              value={filters.project}
              onChange={(e) => setFilters(prev => ({ ...prev, project: e.target.value }))}
              className="mypa-input text-sm py-2"
            >
              <option value="">All Projects</option>
              {projects.map(project => (
                <option key={project.id} value={project.tag}>
                  {project.tag} - {project.name}
                </option>
              ))}
            </select>

            {/* Assignee Filter */}
            <input
              type="text"
              value={filters.assignee}
              onChange={(e) => setFilters(prev => ({ ...prev, assignee: e.target.value }))}
              placeholder="Assignee name"
              className="mypa-input text-sm py-2"
            />

            {/* Due Date Filter */}
            <select
              value={filters.dueDateFilter}
              onChange={(e) => setFilters(prev => ({ ...prev, dueDateFilter: e.target.value as any }))}
              className="mypa-input text-sm py-2"
            >
              <option value="all">All Due Dates</option>
              <option value="overdue">⚠️ Overdue</option>
              <option value="today">📅 Due Today</option>
              <option value="week">📆 Due This Week</option>
              <option value="none">No Due Date</option>
            </select>

            {/* Clear Filters */}
            <button
              onClick={clearFilters}
              disabled={!hasActiveFilters}
              className="mypa-button-secondary text-sm py-2 disabled:opacity-50"
            >
              Clear Filters
            </button>
          </div>

          {/* Date Range (if needed) */}
          {filters.dueDateFilter === 'all' && (
            <div className="grid grid-cols-2 gap-4 mt-4">
              <input
                type="date"
                value={filters.dateRange.start}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  dateRange: { ...prev.dateRange, start: e.target.value }
                }))}
                className="mypa-input text-sm py-2"
                placeholder="Start date"
              />
              <input
                type="date"
                value={filters.dateRange.end}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  dateRange: { ...prev.dateRange, end: e.target.value }
                }))}
                className="mypa-input text-sm py-2"
                placeholder="End date"
              />
            </div>
          )}
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-neutral-900 dark:text-neutral-100">
              Results ({searchResults.length})
            </h3>
            {hasActiveFilters && (
              <span className="text-sm text-primary-600 dark:text-primary-400">
                Filters active
              </span>
            )}
          </div>

          {searchResults.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-12 h-12 text-neutral-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.5-.816-6.211-2.177M12 9a3 3 0 100-6 3 3 0 000 6z" />
              </svg>
              <p className="text-neutral-500 dark:text-neutral-400">
                No tasks found matching your criteria
              </p>
              <button
                onClick={clearFilters}
                className="mypa-button-secondary mt-4"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {searchResults.map(task => (
                <TaskItem key={task.id} task={task} />
              ))}
            </div>
          )}
        </div>

        {/* Search Tips */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            💡 <strong>Tips:</strong> Use ⌘K to open search • Search across task content, projects, and assignees • 
            Combine filters for precise results
          </p>
        </div>
      </div>
    </div>
  );
};