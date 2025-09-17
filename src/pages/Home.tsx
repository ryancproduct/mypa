import React from 'react';
import { SimpleAIChat } from '../components/SimpleAIChat';

const Home: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-900 text-green-400 font-mono overflow-hidden">
      {/* Terminal Header */}
      <div className="border-b border-neutral-700 px-4 py-2 bg-neutral-800">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
          <span className="text-neutral-400 text-sm ml-4">
            ryan@mypa:~/personal-assistant$
          </span>
        </div>
      </div>

      {/* Terminal Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Terminal Chat Interface */}
        <TerminalChat />
      </div>
    </div>
  );
};

const TerminalChat: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Override SimpleAIChat styles for terminal look */}
      <style jsx>{`
        .terminal-chat {
          background: #1a1a1a !important;
          color: #00ff00 !important;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace !important;
          border: none !important;
          border-radius: 0 !important;
        }
        .terminal-chat .mypa-card {
          background: transparent !important;
          border: none !important;
          border-radius: 0 !important;
          box-shadow: none !important;
        }
        .terminal-chat .bg-primary-500 {
          background: #00ff00 !important;
          color: #000000 !important;
        }
        .terminal-chat .bg-neutral-100 {
          background: #333333 !important;
          color: #00ff00 !important;
        }
        .terminal-chat .border-neutral-200 {
          border-color: #444444 !important;
        }
        .terminal-chat input {
          background: #1a1a1a !important;
          border: 1px solid #444444 !important;
          color: #00ff00 !important;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace !important;
        }
        .terminal-chat input::placeholder {
          color: #666666 !important;
        }
        .terminal-chat button {
          background: #00ff00 !important;
          color: #000000 !important;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace !important;
          font-weight: bold !important;
        }
        .terminal-chat button:hover {
          background: #00cc00 !important;
        }
        .terminal-chat button:disabled {
          background: #444444 !important;
          color: #666666 !important;
        }
      `}</style>

      <div className="terminal-chat flex-1 min-h-0">
        <SimpleAIChat className="h-full" />
      </div>
    </div>
  );
};

export default Home;