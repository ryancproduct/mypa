import React, { useState, useRef, useEffect } from 'react';
import { aiService } from '../services/aiService';
import { useMarkdownStore } from '../stores/useMarkdownStore';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  loading?: boolean;
}

interface ChatInterfaceProps {
  onTasksCreated?: (tasks: any[]) => void;
  className?: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ onTasksCreated, className = '' }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Hi! I\'m Claude, your AI productivity assistant. I can help you manage tasks, schedule meetings, and organize your day. Try saying something like "Add meeting with Sarah tomorrow" or "Show me overdue tasks".',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState(localStorage.getItem('anthropic_api_key') || '');
  const [showApiKeySetup, setShowApiKeySetup] = useState(!apiKey);

  // Configure AI service with stored API key on component mount
  useEffect(() => {
    if (apiKey) {
      aiService.reconfigure(apiKey);
    }
  }, []);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { addTask, tasks, projects, getCurrentSection } = useMarkdownStore();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Update AI service context whenever tasks/projects change
    const currentSection = getCurrentSection();
    aiService.updateContext({
      currentTasks: tasks,
      projects,
      currentDate: new Date().toISOString().split('T')[0],
      dailySection: currentSection
    });
  }, [tasks, projects, getCurrentSection]);

  const handleApiKeySubmit = () => {
    if (apiKey.trim()) {
      localStorage.setItem('anthropic_api_key', apiKey);
      // Reconfigure AI service with new key
      aiService.reconfigure(apiKey);
      setShowApiKeySetup(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Process the command through AI service
      const result = await aiService.processNaturalLanguageCommand(input.trim());
      
      let assistantResponse = result.response || 'I processed your request.';
      
      // Handle different command types
      if (result.type === 'create_tasks' && result.tasks) {
        // Create tasks in the app
        for (const taskData of result.tasks) {
          addTask({
            content: taskData.content,
            status: 'pending',
            project: taskData.project,
            assignee: taskData.assignee,
            priority: taskData.priority,
            dueDate: taskData.dueDate
          }, taskData.sectionType);
        }
        
        assistantResponse = `✅ I've added ${result.tasks.length} task${result.tasks.length > 1 ? 's' : ''} for you: ${result.tasks.map(t => t.content).join(', ')}`;
        onTasksCreated?.(result.tasks);
      } else if (result.type === 'query') {
        // Handle queries about existing data
        if (input.toLowerCase().includes('overdue')) {
          const overdueTasks = tasks.filter(task => 
            task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed'
          );
          assistantResponse = overdueTasks.length > 0 
            ? `📅 You have ${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''}: ${overdueTasks.map(t => t.content).join(', ')}`
            : '🎉 Great news! You have no overdue tasks.';
        } else if (input.toLowerCase().includes('today')) {
          const todayTasks = tasks.filter(task => 
            task.dueDate === new Date().toISOString().split('T')[0] && task.status !== 'completed'
          );
          assistantResponse = todayTasks.length > 0
            ? `📋 You have ${todayTasks.length} task${todayTasks.length > 1 ? 's' : ''} due today: ${todayTasks.map(t => t.content).join(', ')}`
            : '✨ No tasks due today. Great job staying on top of things!';
        }
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: assistantResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please check your API key and try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit(e as any);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  if (showApiKeySetup) {
    return (
      <div className={`mypa-card p-6 ${className}`}>
        <div className="text-center space-y-4">
          <div className="w-12 h-12 bg-primary-100 dark:bg-primary-500/20 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            Connect Claude AI
          </h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Enter your Anthropic API key to enable AI-powered task management
          </p>
          <div className="space-y-3">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-ant-..."
              className="mypa-input text-sm"
              onKeyPress={(e) => e.key === 'Enter' && handleApiKeySubmit()}
            />
            <button
              onClick={handleApiKeySubmit}
              disabled={!apiKey.trim()}
              className="mypa-button-primary w-full"
            >
              Connect Claude
            </button>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Your API key is stored locally and never shared. Get one at{' '}
            <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700">
              console.anthropic.com
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`mypa-card flex flex-col h-96 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-700">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-100 dark:bg-primary-500/20 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <span className="font-medium text-neutral-900 dark:text-neutral-100">Claude AI</span>
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
        </div>
        <button
          onClick={() => setShowApiKeySetup(true)}
          className="text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
          title="Change API Key"
        >
          ⚙️
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-3 py-2 ${
                message.type === 'user'
                  ? 'bg-primary-500 text-white'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100'
              }`}
            >
              <p className="text-sm">{message.content}</p>
              <p className={`text-xs mt-1 ${
                message.type === 'user' 
                  ? 'text-primary-100' 
                  : 'text-neutral-500 dark:text-neutral-400'
              }`}>
                {formatTime(message.timestamp)}
              </p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-neutral-100 dark:bg-neutral-800 rounded-lg px-3 py-2">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-neutral-200 dark:border-neutral-700">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask Claude to help with your tasks..."
            className="mypa-input flex-1 text-sm"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="mypa-button-primary px-4 py-2 disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
          💡 Try: "Add meeting with Sarah tomorrow", "Show overdue tasks", or "What should I focus on?"
        </p>
      </form>
    </div>
  );
};