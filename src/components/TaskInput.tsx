import React, { useState } from 'react';
import { useTaskStore } from '../stores/useTaskStore';

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
  const { addTask, projects } = useTaskStore();
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
    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
      {!isExpanded ? (
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full text-left text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        >
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
            className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 resize-none"
            rows={2}
            autoFocus
          />

          {/* Metadata inputs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Project selector */}
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 text-sm"
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
              className="p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 text-sm"
            />

            {/* Due date */}
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 text-sm"
            />

            {/* Priority */}
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as 'P1' | 'P2' | 'P3' | '')}
              className="p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 text-sm"
            >
              <option value="">No priority</option>
              <option value="P1">P1 (High)</option>
              <option value="P2">P2 (Medium)</option>
              <option value="P3">P3 (Low)</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center">
            <div className="text-xs text-gray-500">
              Tip: Use Cmd+Enter to save, Esc to cancel
            </div>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => {
                  setIsExpanded(false);
                  setContent('');
                }}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!content.trim()}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Add Task
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};