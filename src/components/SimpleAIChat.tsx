import React, { useState, useRef, useEffect } from 'react';
import { useMarkdownStore } from '../stores/useMarkdownStore';

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
  const { addTask, tasks, projects, currentDate, getCurrentSection } = useMarkdownStore();

  // Get current section for today's tasks
  const currentSection = getCurrentSection();
  const todaysTasks = currentSection ? [
    ...currentSection.priorities,
    ...currentSection.schedule,
    ...currentSection.followUps,
    ...currentSection.completed
  ] : [];

  useEffect(() => {
    // Check for stored API key
    const stored = localStorage.getItem('openai_api_key');
    if (stored) {
      setApiKey(stored);
      setShowSetup(false);

      // Add personalized greeting when assistant loads with existing key
      const greeting = getPersonalizedGreeting();
      setMessages([{
        id: '1',
        type: 'assistant',
        content: greeting,
        timestamp: new Date(),
      }]);
    }
  }, [currentSection, todaysTasks, currentDate]); // Re-run when data changes

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSetupSubmit = () => {
    if (!apiKey.trim()) return;
    localStorage.setItem('openai_api_key', apiKey.trim());
    setShowSetup(false);

    // Add personalized greeting when assistant is ready
    const greeting = getPersonalizedGreeting();
    setMessages([{
      id: '1',
      type: 'assistant',
      content: greeting,
      timestamp: new Date(),
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

    try {
      // Call OpenAI directly
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
              content: `You are Ryan's personal assistant. Help him manage his daily tasks and schedule.

Current date: ${currentDate}
Today's tasks: ${todaysTasks.length} tasks for ${currentDate}
Today's priorities: ${currentSection?.priorities.map(t => `"${t.content}"`).join(', ') || 'None'}
Today's schedule: ${currentSection?.schedule.map(t => `"${t.content}"`).join(', ') || 'None'}
Today's follow-ups: ${currentSection?.followUps.map(t => `"${t.content}"`).join(', ') || 'None'}
Projects: ${projects.map(p => p.name).join(', ')}

When Ryan asks you to add a task, respond with EXACTLY this format:
TASK_CREATE: {
  "content": "task description",
  "project": "#ProjectName" (optional),
  "priority": "P1|P2|P3" (optional),
  "dueDate": "YYYY-MM-DD" (optional),
  "sectionType": "priorities|schedule|followUps"
}

Then follow with a friendly confirmation message.

Examples:
- "Add task to review quarterly report" → TASK_CREATE: {"content": "Review quarterly report", "sectionType": "schedule"}
- "Create urgent meeting with team tomorrow" → TASK_CREATE: {"content": "Meeting with team", "priority": "P1", "sectionType": "priorities", "dueDate": "2025-09-18"}
- "Schedule follow-up call with Sarah" → TASK_CREATE: {"content": "Follow-up call with Sarah", "sectionType": "followUps"}

For other conversations, just be helpful and friendly.`
            },
            {
              role: 'user',
              content: input.trim()
            }
          ],
          max_tokens: 500,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0]?.message?.content || 'Sorry, I had trouble understanding that.';

      // Check if response contains a task creation command
      if (aiResponse.includes('TASK_CREATE:')) {
        const lines = aiResponse.split('\n');
        const taskLine = lines.find(line => line.includes('TASK_CREATE:'));
        const friendlyResponse = lines.filter(line => !line.includes('TASK_CREATE:')).join('\n').trim();

        if (taskLine) {
          try {
            const jsonStr = taskLine.replace('TASK_CREATE:', '').trim();
            const taskData = JSON.parse(jsonStr);

            // Create the task
            await addTask({
              content: taskData.content,
              status: 'pending',
              project: taskData.project,
              priority: taskData.priority,
              dueDate: taskData.dueDate,
            }, taskData.sectionType || 'schedule');

            const confirmMessage = friendlyResponse || `✅ I've added "${taskData.content}" to your ${taskData.sectionType || 'schedule'}.`;

            setMessages(prev => [...prev, {
              id: (Date.now() + 1).toString(),
              type: 'assistant',
              content: confirmMessage,
              timestamp: new Date(),
            }]);
          } catch (error) {
            console.error('Failed to parse task:', error);
            setMessages(prev => [...prev, {
              id: (Date.now() + 1).toString(),
              type: 'assistant',
              content: 'I understood you want to add a task, but had trouble with the details. Can you try rephrasing?',
              timestamp: new Date(),
            }]);
          }
        }
      } else {
        // Regular conversation
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: aiResponse,
          timestamp: new Date(),
        }]);
      }

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
    <div className={`mypa-card flex flex-col h-96 ${className}`}>
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