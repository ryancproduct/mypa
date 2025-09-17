import React, { useState } from 'react';
import { aiService } from '../services/aiService';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

export const SimpleChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const addMessage = (content: string, role: 'user' | 'assistant') => {
    const newMessage: Message = {
      id: Date.now().toString(),
      content,
      role,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    addMessage(userMessage, 'user');
    setIsLoading(true);

    try {
      // Try to parse as tasks first
      const tasks = await aiService.parseNaturalLanguage(userMessage);
      
      if (tasks && tasks.length > 0) {
        const taskList = tasks.map(task => 
          `• ${task.content}${task.dueDate ? ` (Due: ${task.dueDate})` : ''}${task.priority ? ` [${task.priority}]` : ''}`
        ).join('\n');
        
        addMessage(`I've created these tasks for you:\n\n${taskList}`, 'assistant');
      } else {
        // Fallback to general AI response
        const response = await aiService.processNaturalLanguageCommand(userMessage);
        const responseText = typeof response === 'string' ? response : response?.response || 'I understand. How else can I help you?';
        addMessage(responseText, 'assistant');
      }
    } catch (error) {
      console.error('Chat error:', error);
      addMessage('Sorry, I encountered an error. Please try again.', 'assistant');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-neutral-200 dark:border-neutral-700">
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
          AI Assistant
        </h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Ask me to create tasks, schedule meetings, or help organize your day
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🤖</div>
            <h2 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
              What can I help with?
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
              Try saying something like:
            </p>
            <div className="space-y-2 text-sm text-neutral-500 dark:text-neutral-500">
              <div>"Add meeting with Sarah tomorrow at 2pm"</div>
              <div>"Schedule workout for Friday morning"</div>
              <div>"What should I focus on today?"</div>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100'
              }`}
            >
              <div className="whitespace-pre-wrap">{message.content}</div>
              <div className={`text-xs mt-1 ${
                message.role === 'user' ? 'text-blue-100' : 'text-neutral-500 dark:text-neutral-400'
              }`}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-neutral-100 dark:bg-neutral-800 px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-sm text-neutral-600 dark:text-neutral-400">Thinking...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex-shrink-0 p-4 border-t border-neutral-200 dark:border-neutral-700">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything..."
            disabled={isLoading}
            className="flex-1 px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg
                     bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100
                     focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                     disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700
                     disabled:opacity-50 disabled:cursor-not-allowed
                     focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};
