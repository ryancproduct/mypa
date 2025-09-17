import React from 'react';
import { SimpleChatInterface } from './SimpleChatInterface';
import type { TaskSuggestion } from '../services/backendService';

interface LazyChatInterfaceProps {
  onTasksCreated?: (tasks: TaskSuggestion[]) => void;
  className?: string;
}

export const LazyChatInterface: React.FC<LazyChatInterfaceProps> = () => {
  return (
    <div className="h-96 flex flex-col">
      <SimpleChatInterface />
    </div>
  );
};
