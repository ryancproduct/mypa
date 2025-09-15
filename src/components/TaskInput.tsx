import React, { useState, useRef, useEffect } from 'react';
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
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [content, setContent] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [assignee, setAssignee] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<'P1' | 'P2' | 'P3' | ''>('');
  const [parsedPreview, setParsedPreview] = useState<{
    content: string;
    project?: string;
    assignee?: string;
    priority?: string;
  } | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Smart parsing function
  const parseTaskContent = (inputContent: string) => {
    let parsedContent = inputContent;
    let detectedProject = selectedProject;
    let detectedAssignee = assignee;
    let detectedPriority = priority;

    // Auto-detect project from #tags
    const projectMatch = inputContent.match(/#(\w+)/);
    if (projectMatch && !detectedProject) {
      const tag = `#${projectMatch[1]}`;
      const project = projects.find(p => p.tag === tag);
      if (project) {
        detectedProject = tag;
        parsedContent = parsedContent.replace(/#\w+/, '').trim();
      }
    }

    // Auto-detect assignee from @mentions
    const assigneeMatch = inputContent.match(/@(\w+)/);
    if (assigneeMatch && !detectedAssignee) {
      detectedAssignee = assigneeMatch[1];
      parsedContent = parsedContent.replace(/@\w+/, '').trim();
    }

    // Auto-detect priority from !P1, !P2, !P3
    const priorityMatch = inputContent.match(/!P([123])/);
    if (priorityMatch && !detectedPriority) {
      detectedPriority = `P${priorityMatch[1]}` as 'P1' | 'P2' | 'P3';
      parsedContent = parsedContent.replace(/!P[123]/, '').trim();
    }

    return {
      content: parsedContent,
      project: detectedProject,
      assignee: detectedAssignee,
      priority: detectedPriority
    };
  };

  // Update preview when content changes
  useEffect(() => {
    if (content.trim() && (content.includes('#') || content.includes('@') || content.includes('!'))) {
      const parsed = parseTaskContent(content);
      setParsedPreview(parsed);
    } else {
      setParsedPreview(null);
    }
  }, [content, selectedProject, assignee, priority]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) return;

    const parsed = parseTaskContent(content);

    // Determine priority based on section type
    let finalPriority = parsed.priority;
    if (sectionType === 'priorities' && !finalPriority) {
      finalPriority = 'P2'; // Default priority for priority section
    }

    addTask({
      content: parsed.content,
      status: 'pending',
      project: parsed.project || undefined,
      assignee: parsed.assignee || undefined,
      dueDate: dueDate || undefined,
      priority: finalPriority || undefined,
    }, sectionType);

    // Reset form
    resetForm();
  };

  const resetForm = () => {
    setContent('');
    setSelectedProject('');
    setAssignee('');
    setDueDate('');
    setPriority('');
    setIsExpanded(false);
    setShowAdvanced(false);
    setParsedPreview(null);
    onTaskAdded?.();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit(e as any);
    } else if (e.key === 'Escape') {
      resetForm();
    } else if (e.key === 'Tab' && !showAdvanced && content.trim()) {
      e.preventDefault();
      setShowAdvanced(true);
    }
  };

  const hasMetadata = () => {
    return selectedProject || assignee || dueDate || priority || parsedPreview;
  };

  const getPriorityIcon = (p: string) => {
    switch (p) {
      case 'P1': return '🔴';
      case 'P2': return '🟡';
      case 'P3': return '🔵';
      default: return '';
    }
  };

  return (
    <div
      className={`border-2 border-dashed rounded-xl p-4 transition-all duration-300 ${
        isExpanded
          ? 'border-primary-300 dark:border-primary-600 bg-primary-50/30 dark:bg-primary-500/5'
          : 'border-neutral-200 dark:border-neutral-700 hover:border-primary-300 dark:hover:border-primary-600 hover:bg-primary-50/30 dark:hover:bg-primary-500/5'
      }`}
      role="region"
      aria-label={`Add new ${sectionType.slice(0, -1)}`}
    >
      {!isExpanded ? (
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full text-left text-neutral-500 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200 flex items-center gap-2"
          aria-label={`Add new ${sectionType.slice(0, -1)}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {placeholder || `Add new ${sectionType.slice(0, -1)}...`}
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Stage 1: Smart text input with preview */}
          <div className="space-y-2">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Enter task... (try: #project @person !P1 for quick tagging)"
              className="mypa-input resize-none transition-all duration-200"
              rows={content.includes('\n') ? 3 : 2}
              autoFocus
              aria-label="Task content"
            />

            {/* Smart parsing preview */}
            {parsedPreview && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm animate-fade-in-up">
                <div className="flex items-center gap-2 mb-1">
                  <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span className="text-blue-700 dark:text-blue-300 font-medium">Smart parsing preview:</span>
                </div>
                <div className="space-y-1">
                  <div><strong>Task:</strong> {parsedPreview.content}</div>
                  {parsedPreview.project && <div><strong>Project:</strong> {parsedPreview.project}</div>}
                  {parsedPreview.assignee && <div><strong>Assignee:</strong> @{parsedPreview.assignee}</div>}
                  {parsedPreview.priority && <div><strong>Priority:</strong> {getPriorityIcon(parsedPreview.priority)} {parsedPreview.priority}</div>}
                </div>
              </div>
            )}
          </div>

          {/* Stage 2: Progressive disclosure for metadata */}
          {(content.trim() || hasMetadata()) && (
            <div className="space-y-3 animate-slide-down">
              {!showAdvanced && !hasMetadata() && (
                <button
                  type="button"
                  onClick={() => setShowAdvanced(true)}
                  className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center gap-1 transition-colors duration-200"
                  aria-label="Show additional options"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                  </svg>
                  Add details (project, assignee, due date) - Press Tab
                </button>
              )}

              {/* Stage 3: Advanced metadata options */}
              {(showAdvanced || hasMetadata()) && (
                <div className="space-y-3 animate-fade-in-up">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Task Details</h4>
                    <button
                      type="button"
                      onClick={() => setShowAdvanced(false)}
                      className="text-sm text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                      aria-label="Hide additional options"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Project selector */}
                    <div>
                      <label htmlFor="project-select" className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                        Project
                      </label>
                      <select
                        id="project-select"
                        value={selectedProject}
                        onChange={(e) => setSelectedProject(e.target.value)}
                        className="mypa-input text-sm py-2 px-3 w-full"
                      >
                        <option value="">No project</option>
                        {projects.map((project) => (
                          <option key={project.id} value={project.tag}>
                            {project.tag} {project.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Assignee */}
                    <div>
                      <label htmlFor="assignee-input" className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                        Assignee
                      </label>
                      <input
                        id="assignee-input"
                        type="text"
                        value={assignee}
                        onChange={(e) => setAssignee(e.target.value)}
                        placeholder="@person"
                        className="mypa-input text-sm py-2 px-3 w-full"
                      />
                    </div>

                    {/* Due date */}
                    <div>
                      <label htmlFor="due-date-input" className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                        Due Date
                      </label>
                      <input
                        id="due-date-input"
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="mypa-input text-sm py-2 px-3 w-full"
                      />
                    </div>

                    {/* Priority */}
                    <div>
                      <label htmlFor="priority-select" className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                        Priority
                      </label>
                      <select
                        id="priority-select"
                        value={priority}
                        onChange={(e) => setPriority(e.target.value as 'P1' | 'P2' | 'P3' | '')}
                        className="mypa-input text-sm py-2 px-3 w-full"
                      >
                        <option value="">No priority</option>
                        <option value="P1">🔴 P1 (High)</option>
                        <option value="P2">🟡 P2 (Medium)</option>
                        <option value="P3">🔵 P3 (Low)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 pt-2 border-t border-neutral-200 dark:border-neutral-700">
            <div className="text-xs text-neutral-500 dark:text-neutral-400 space-y-1">
              <div>💡 <kbd className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-xs">Cmd+Enter</kbd> to save</div>
              <div>⌨️ <kbd className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-xs">Esc</kbd> to cancel, <kbd className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-xs">Tab</kbd> for options</div>
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={resetForm}
                className="mypa-button-secondary text-sm py-2 px-4"
                aria-label="Cancel task creation"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!content.trim()}
                className={`mypa-button-primary text-sm py-2 px-4 flex items-center gap-2 ${
                  !content.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
                }`}
                aria-label="Add task"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Task
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};