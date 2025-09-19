import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useMarkdownStore } from '../stores/useMarkdownStore';
import type { Task } from '../types';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface SimpleAIChatProps {
  className?: string;
}

export const SimpleAIChat: React.FC<SimpleAIChatProps> = ({ className = '' }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showSetup, setShowSetup] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { addTask, updateTask, projects, currentDate, getCurrentSection, loading: storeLoading } = useMarkdownStore();

  // Conversation history for context
  const [conversationHistory, setConversationHistory] = useState<Message[]>([]);

  // Get current section for today's tasks (memoized for performance)
  const currentSection = getCurrentSection();
  const todaysTasks = useMemo(() => {
    if (!currentSection) return [];
    return [
      ...currentSection.priorities,
      ...currentSection.schedule,
      ...currentSection.followUps,
      ...currentSection.completed
    ];
  }, [currentSection]);

  useEffect(() => {
    // Check for stored API key
    const stored = localStorage.getItem('openai_api_key');
    if (stored) {
      setApiKey(stored);
      setShowSetup(false);

      // Load conversation history
      const savedHistory = localStorage.getItem('chat_history');
      if (savedHistory) {
        const history = JSON.parse(savedHistory);
        setConversationHistory(history);
        setMessages(history.filter((msg: any) => msg.id).map((msg: any) => ({
          id: msg.id || Date.now().toString(),
          type: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content,
          timestamp: new Date(msg.timestamp || Date.now())
        })));
      } else {
        // Add personalized greeting when assistant loads with existing key
        const greeting = getPersonalizedGreeting();
        const greetingMsg = {
          id: '1',
          type: 'assistant' as const,
          content: greeting,
          timestamp: new Date(),
        };
        setMessages([greetingMsg]);
        setConversationHistory([{
          role: 'assistant',
          content: greeting,
          timestamp: new Date().toISOString()
        }]);
      }
    }
  }, [currentSection, todaysTasks, currentDate]); // Re-run when data changes

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    // Save conversation history
    if (conversationHistory.length > 0) {
      localStorage.setItem('chat_history', JSON.stringify(conversationHistory));
    }
  }, [messages, conversationHistory]);

  const handleSetupSubmit = () => {
    if (!apiKey.trim()) return;
    localStorage.setItem('openai_api_key', apiKey.trim());
    setShowSetup(false);

    // Add personalized greeting when assistant is ready
    const greeting = getPersonalizedGreeting();
    const greetingMsg = {
      id: '1',
      type: 'assistant' as const,
      content: greeting,
      timestamp: new Date(),
    };
    setMessages([greetingMsg]);
    setConversationHistory([{
      role: 'assistant',
      content: greeting,
      timestamp: new Date().toISOString()
    }]);
  };

  const getPersonalizedGreeting = () => {
    const taskCount = todaysTasks.length;
    const priorityCount = currentSection?.priorities.length || 0;
    const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });

    let greeting = `Good ${getTimeOfDay()}! I'm your personal assistant, ready to help you manage your day.`;

    if (taskCount === 0) {
      greeting += `\n\nYou have a clean slate for ${dayName}, ${currentDate}. What would you like to accomplish today?`;
    } else {
      greeting += `\n\nFor ${dayName}, ${currentDate}, you have ${taskCount} task${taskCount > 1 ? 's' : ''}`;
      if (priorityCount > 0) {
        greeting += ` including ${priorityCount} priorit${priorityCount > 1 ? 'ies' : 'y'}`;
      }
      greeting += `.`;
    }

    greeting += `\n\nJust tell me what you need to do, like "Add a task to review the quarterly report" or "What's on my schedule today?"`;

    return greeting;
  };

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  };

  // OpenAI Functions for proper AI integration
  const openAIFunctions = [
    {
      name: "add_task",
      description: "Add a new task to the user's todo list",
      parameters: {
        type: "object",
        properties: {
          content: { type: "string", description: "The task description" },
          sectionType: {
            type: "string",
            enum: ["priorities", "schedule", "followUps"],
            description: "Which section to add the task to"
          },
          project: { type: "string", description: "Project tag (e.g., #DataTables)" },
          priority: {
            type: "string",
            enum: ["P1", "P2", "P3"],
            description: "Task priority level"
          },
          dueDate: { type: "string", description: "Due date in YYYY-MM-DD format" }
        },
        required: ["content", "sectionType"]
      }
    },
    {
      name: "complete_task",
      description: "Mark a task as completed using natural language description",
      parameters: {
        type: "object",
        properties: {
          taskDescription: {
            type: "string",
            description: "Natural language description of the completed task"
          }
        },
        required: ["taskDescription"]
      }
    },
    {
      name: "get_task_status",
      description: "Get current status of tasks (overdue, due today, priorities)",
      parameters: {
        type: "object",
        properties: {
          filter: {
            type: "string",
            enum: ["overdue", "due_today", "priorities", "all"],
            description: "Filter type for tasks to show"
          }
        }
      }
    }
  ];

  // Enhanced system prompt based on CLAUDE.md
  const getEnhancedSystemPrompt = () => {
    const overdueTasks = todaysTasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date());
    const dueTodayTasks = todaysTasks.filter(t => t.dueDate === currentDate);
    const priorityTasks = currentSection?.priorities || [];

    return `You are Ryan's persistent, context-aware personal assistant. Manage his day inside ToDo.md, keep it clean and current, and roll over any unfinished tasks to the new day automatically. Timezone: Australia/Sydney.

Current Context:
- Date: ${currentDate}
- Today's Tasks: ${todaysTasks.length}
- Priorities: ${priorityTasks.map(t => t.content).join(', ') || 'None'}
- Schedule: ${currentSection?.schedule.map(t => t.content).join(', ') || 'None'}
- Follow-ups: ${currentSection?.followUps.map(t => t.content).join(', ') || 'None'}
- Overdue Tasks: ${overdueTasks.length}
- Due Today: ${dueTodayTasks.length}
- Projects: ${projects.map(p => p.name).join(', ')}

## Core Capabilities

When users mention:
- Adding tasks → Use add_task function
- Completing work → Use complete_task function with natural language matching
- Status requests → Use get_task_status function
- "What's urgent?", "What's overdue?" → Show relevant filtered tasks

## Natural Language Processing
- Parse fuzzy references: "finished the data tables thing" → find matching task
- Handle commands: "push to tomorrow", "block this task", "what's urgent?"
- Smart actions: reschedule, prioritize, focus mode

## Task Management Rules
- Max 3 priorities, overflow to schedule
- Use project tags: #DataTables, #LoneWorker, #IKEA, #CrossOrg, #Recurring, #CAPTURE, #PWA, #ExternalWork
- Track with metadata: Due: YYYY-MM-DD, @person, !P1/P2/P3
- Status indicators: [⚠️ Overdue X days], [🆕 New], [🔄 Day X]

## Response Style
- Be conversational and helpful like terminal assistant
- Provide context ("You have 3 overdue tasks...")
- Suggest next steps
- Confirm actions taken
- Use Australian timezone references

## Project Context
Active Projects:
- #DataTables - Data tables feature development and launch
- #LoneWorker - Lone worker safety management system rollout
- #IKEA - IKEA deviation investigation and implementation
- #CrossOrg - Cross-organization sharing functionality
- #Recurring - Weekly/monthly recurring tasks and maintenance
- #CAPTURE - General Capture team work and improvements
- #PWA - Personal assistant PWA development
- #ExternalWork - External client work

Don't make assumptions about task details. Ask for clarification if ambiguous. Always use functions for task operations.`;
  };

  // Task completion by natural language (memoized for performance)
  const completeTaskByDescription = useCallback(async (description: string) => {
    const keywords = description.toLowerCase().split(' ');
    const matchingTask = todaysTasks.find(task =>
      keywords.some(keyword =>
        task.content.toLowerCase().includes(keyword)
      )
    );

    if (matchingTask) {
      await updateTask(matchingTask.id, {
        status: 'completed',
        completedAt: new Date().toISOString()
      });
      return `✅ Completed: "${matchingTask.content}"`;
    } else {
      return `❓ Couldn't find a matching task for "${description}". Could you be more specific?`;
    }
  }, [todaysTasks, updateTask]);

  // Get task status with filtering (memoized for performance)
  const getTaskStatus = useCallback((filter: string) => {
    const now = new Date();
    const today = currentDate;

    switch (filter) {
      case 'overdue':
        const overdue = todaysTasks.filter(t => t.dueDate && new Date(t.dueDate) < now);
        return overdue.length > 0
          ? `⚠️ ${overdue.length} overdue tasks:\n${overdue.map(t => `- ${t.content} (Due: ${t.dueDate})`).join('\n')}`
          : "✅ No overdue tasks!";

      case 'due_today':
        const dueToday = todaysTasks.filter(t => t.dueDate === today);
        return dueToday.length > 0
          ? `📅 ${dueToday.length} due today:\n${dueToday.map(t => `- ${t.content}`).join('\n')}`
          : "📅 Nothing due today.";

      case 'priorities':
        const priorities = currentSection?.priorities || [];
        return priorities.length > 0
          ? `🎯 Today's priorities:\n${priorities.map((t, i) => `${i + 1}. ${t.content}`).join('\n')}`
          : "🎯 No priorities set for today.";

      case 'all':
      default:
        return `📊 Task Summary for ${today}:\n- Total: ${todaysTasks.length}\n- Priorities: ${currentSection?.priorities.length || 0}\n- Schedule: ${currentSection?.schedule.length || 0}\n- Follow-ups: ${currentSection?.followUps.length || 0}\n- Completed: ${currentSection?.completed.length || 0}`;
    }
  }, [todaysTasks, currentDate, currentSection]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Update conversation history
    const newConversationHistory = [
      ...conversationHistory,
      { role: 'user', content: input.trim(), timestamp: new Date().toISOString() }
    ];
    setConversationHistory(newConversationHistory);

    try {
      // Call OpenAI with function calling
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: getEnhancedSystemPrompt()
            },
            ...newConversationHistory.slice(-10) // Keep last 10 messages for context
          ],
          functions: openAIFunctions,
          function_call: "auto",
          max_tokens: 800,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const message = data.choices[0]?.message;

      let assistantResponse = '';

      // Handle function calls
      if (message.function_call) {
        const functionName = message.function_call.name;
        const args = JSON.parse(message.function_call.arguments);

        console.log('Function call:', functionName, args);

        switch (functionName) {
          case 'add_task':
            try {
              await addTask({
                content: args.content,
                status: 'pending',
                project: args.project,
                priority: args.priority,
                dueDate: args.dueDate,
              }, args.sectionType || 'schedule');
              assistantResponse = `✅ Added "${args.content}" to your ${args.sectionType || 'schedule'}.`;
            } catch (error) {
              assistantResponse = "❌ Sorry, I had trouble adding that task. Could you try again?";
            }
            break;

          case 'complete_task':
            assistantResponse = await completeTaskByDescription(args.taskDescription);
            break;

          case 'get_task_status':
            assistantResponse = getTaskStatus(args.filter || 'all');
            break;

          default:
            assistantResponse = "I tried to help but encountered an unexpected function call.";
        }
      } else {
        // Regular conversation response
        assistantResponse = message.content || 'Sorry, I had trouble understanding that.';
      }

      // Add assistant response to messages
      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant' as const,
        content: assistantResponse,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Update conversation history
      setConversationHistory(prev => [
        ...prev,
        { role: 'assistant', content: assistantResponse, timestamp: new Date().toISOString() }
      ]);

    } catch (error) {
      console.error('AI Error:', error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Sorry, I had trouble connecting. Please check your API key and try again.',
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (storeLoading) {
    return (
      <div className={`mypa-card flex items-center justify-center p-6 ${className}`}>
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">Loading tasks...</p>
        </div>
      </div>
    );
  }

  if (showSetup) {
    return (
      <div className={`mypa-card p-6 ${className}`}>
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-4">Setup AI Assistant</h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
            Enter your OpenAI API key to enable your personal assistant
          </p>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-proj-..."
            className="w-full px-3 py-2 border rounded-lg mb-4"
          />
          <button
            onClick={handleSetupSubmit}
            className="w-full px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
          >
            Connect Assistant
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`mypa-card flex flex-col ${className.includes('h-full') ? 'h-full' : 'h-96'} ${className.replace('h-full', '')}`}>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.type === 'user'
                  ? 'bg-primary-500 text-white'
                  : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100'
              }`}
            >
              <p className="text-sm">{message.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-neutral-100 dark:bg-neutral-700 px-4 py-2 rounded-lg">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-neutral-200 dark:border-neutral-700">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tell me what you need to do..."
            className="flex-1 px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};