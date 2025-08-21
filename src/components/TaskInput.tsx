import React, { useState } from 'react';
import { useMarkdownStore } from '../stores/useMarkdownStore';

interface TaskInputProps {
  sectionType: 'priorities' | 'schedule' | 'followUps';
  placeholder?: string;
  onTaskAdded?: () => void;
}

export const TaskInput: React.FC<TaskInputProps> = ({ 
  sectionType, 
  placeholder, 
  onTaskAdded 
}) => {
  const { addTask, projects } = useMarkdownStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [content, setContent] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [assignee, setAssignee] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<'P1' | 'P2' | 'P3' | ''>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) return;

    // Parse smart input for project tags, assignees, etc.
    let parsedContent = content;
    let detectedProject = selectedProject;
    let detectedAssignee = assignee;
    let detectedPriority = priority;

    // Auto-detect project from #tags
    const projectMatch = content.match(/#(\w+)/);
    if (projectMatch && !detectedProject) {
      const tag = `#${projectMatch[1]}`;
      const project = projects.find(p => p.tag === tag);
      if (project) {
        detectedProject = tag;
        parsedContent = parsedContent.replace(/#\w+/, '').trim();
      }
    }

    // Auto-detect assignee from @mentions
    const assigneeMatch = content.match(/@(\w+)/);
    if (assigneeMatch && !detectedAssignee) {
      detectedAssignee = assigneeMatch[1];
      parsedContent = parsedContent.replace(/@\w+/, '').trim();
    }

    // Auto-detect priority from !P1, !P2, !P3
    const priorityMatch = content.match(/!P([123])/);
    if (priorityMatch && !detectedPriority) {
      detectedPriority = `P${priorityMatch[1]}` as 'P1' | 'P2' | 'P3';
      parsedContent = parsedContent.replace(/!P[123]/, '').trim();
    }

    // Determine priority based on section type
    let finalPriority = detectedPriority;
    if (sectionType === 'priorities' && !finalPriority) {
      finalPriority = 'P2'; // Default priority for priority section
    }

    addTask({
      content: parsedContent,
      status: 'pending',
      project: detectedProject || undefined,
      assignee: detectedAssignee || undefined,
      dueDate: dueDate || undefined,
      priority: finalPriority || undefined,
    }, sectionType);

    // Reset form
    setContent('');
    setSelectedProject('');
    setAssignee('');
    setDueDate('');
    setPriority('');
    setIsExpanded(false);
    onTaskAdded?.();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit(e as any);
    } else if (e.key === 'Escape') {
      setIsExpanded(false);
      setContent('');
    }
  };

  return (
    <div className="border-2 border-dashed border-neutral-200 dark:border-neutral-700 rounded-xl p-4 hover:border-primary-300 dark:hover:border-primary-600 hover:bg-primary-50/30 dark:hover:bg-primary-500/5 transition-all duration-200">
      {!isExpanded ? (
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full text-left text-neutral-500 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {placeholder || `Add new ${sectionType.slice(0, -1)}...`}
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Main input */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Enter task... (#project @person !P1 for quick tagging)"
            className="mypa-input resize-none"
            rows={2}
            autoFocus
          />

          {/* Metadata inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Project selector */}
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="mypa-input text-sm py-2 px-3"
            >
              <option value="">No project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.tag}>
                  {project.tag} {project.name}
                </option>
              ))}
            </select>

            {/* Assignee */}
            <input
              type="text"
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              placeholder="Assignee"
              className="mypa-input text-sm py-2 px-3"
            />

            {/* Due date */}
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="mypa-input text-sm py-2 px-3"
            />

            {/* Priority */}
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as 'P1' | 'P2' | 'P3' | '')}
              className="mypa-input text-sm py-2 px-3"
            >
              <option value="">No priority</option>
              <option value="P1">🔴 P1 (High)</option>
              <option value="P2">🟡 P2 (Medium)</option>
              <option value="P3">🔵 P3 (Low)</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            <div className="text-xs text-neutral-500 dark:text-neutral-400">
              💡 Tip: Use Cmd+Enter to save, Esc to cancel
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => {
                  setIsExpanded(false);
                  setContent('');
                }}
                className="mypa-button-secondary text-sm py-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!content.trim()}
                className={`mypa-button-primary text-sm py-2 ${
                  !content.trim() ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                ✨ Add Task
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};