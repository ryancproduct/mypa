import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ThemeToggle } from '../components/ThemeToggle';
import { AIProviderSettings } from '../components/AIProviderSettings';
import { InstructionsViewer } from '../components/InstructionsViewer';
import { useMarkdownStore } from '../stores/useMarkdownStore';

const Settings: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('general');
  const { fileConnected, lastSync, connectToFile, loadFromFile } = useMarkdownStore();

  const sections = [
    {
      id: 'general',
      name: 'General',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      id: 'appearance',
      name: 'Appearance',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
        </svg>
      ),
    },
    {
      id: 'ai',
      name: 'AI Assistant',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
    },
    {
      id: 'productivity',
      name: 'Productivity',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
    },
    {
      id: 'notifications',
      name: 'Notifications',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM11 17a1 1 0 01-1-1v-5a1 1 0 012 0v5a1 1 0 01-1 1zM8 12a4 4 0 118 0v5a1 1 0 01-1 1H9a1 1 0 01-1-1v-5z" />
        </svg>
      ),
    },
    {
      id: 'data',
      name: 'Data & Privacy',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
    },
    {
      id: 'instructions',
      name: 'Instructions',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
  ];

  const SettingItem: React.FC<{
    title: string;
    description: string;
    children: React.ReactNode;
  }> = ({ title, description, children }) => (
    <div className="flex items-center justify-between py-4 border-b border-neutral-100 dark:border-neutral-700 last:border-b-0">
      <div className="flex-1 pr-4">
        <h3 className="font-medium text-neutral-900 dark:text-neutral-100">{title}</h3>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{description}</p>
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );

  const Toggle: React.FC<{
    enabled: boolean;
    onChange: (enabled: boolean) => void;
    disabled?: boolean;
  }> = ({ enabled, onChange, disabled = false }) => (
    <button
      onClick={() => !disabled && onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
        enabled
          ? 'bg-primary-500'
          : 'bg-neutral-200 dark:bg-neutral-700'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      disabled={disabled}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  const Select: React.FC<{
    value: string;
    onChange: (value: string) => void;
    options: Array<{ value: string; label: string }>;
  }> = ({ value, onChange, options }) => (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="mypa-input w-auto min-w-[120px] text-sm py-2"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );

  const renderSection = () => {
    switch (activeSection) {
      case 'general':
        return (
          <div className="space-y-6">
            <div className="mypa-card p-6">
              <h2 className="mypa-section-header">User Preferences</h2>
              <div className="space-y-4">
                <SettingItem
                  title="Auto-save interval"
                  description="How often your changes are automatically saved"
                >
                  <Select
                    value="30"
                    onChange={() => {}}
                    options={[
                      { value: '10', label: '10 seconds' },
                      { value: '30', label: '30 seconds' },
                      { value: '60', label: '1 minute' },
                      { value: '300', label: '5 minutes' },
                    ]}
                  />
                </SettingItem>

                <SettingItem
                  title="Default priority level"
                  description="The priority assigned to new tasks by default"
                >
                  <Select
                    value="P3"
                    onChange={() => {}}
                    options={[
                      { value: 'none', label: 'None' },
                      { value: 'P3', label: 'P3 (Normal)' },
                      { value: 'P2', label: 'P2 (Important)' },
                      { value: 'P1', label: 'P1 (Critical)' },
                    ]}
                  />
                </SettingItem>

                <SettingItem
                  title="Smart task suggestions"
                  description="Get AI-powered suggestions for task organization"
                >
                  <Toggle enabled={true} onChange={() => {}} />
                </SettingItem>
              </div>
            </div>

            <div className="mypa-card p-6">
              <h2 className="mypa-section-header">Productivity Features</h2>
              <div className="space-y-4">
                <SettingItem
                  title="Focus mode"
                  description="Hide completed tasks and minimize distractions"
                >
                  <Toggle enabled={false} onChange={() => {}} />
                </SettingItem>

                <SettingItem
                  title="Time tracking"
                  description="Track time spent on tasks automatically"
                >
                  <Toggle enabled={false} onChange={() => {}} />
                </SettingItem>

                <SettingItem
                  title="Daily review reminders"
                  description="Get prompted to review your daily progress"
                >
                  <Toggle enabled={true} onChange={() => {}} />
                </SettingItem>
              </div>
            </div>

            <div className="mypa-card p-6">
              <h2 className="mypa-section-header">File Connection</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-4 border-b border-neutral-100 dark:border-neutral-700">
                  <div className="flex-1 pr-4">
                    <h3 className="font-medium text-neutral-900 dark:text-neutral-100">ToDo.md Connection</h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                      Status: {fileConnected ? 'Connected' : 'Not connected'}
                      {lastSync && (
                        <span className="block">Last sync: {new Date(lastSync).toLocaleString()}</span>
                      )}
                    </p>
                  </div>
                  <div className="flex-shrink-0 flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${fileConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <button
                      onClick={connectToFile}
                      className="mypa-button-secondary text-sm"
                    >
                      {fileConnected ? 'Reconnect' : 'Connect'}
                    </button>
                    {fileConnected && (
                      <button
                        onClick={loadFromFile}
                        className="mypa-button-secondary text-sm"
                      >
                        Reload
                      </button>
                    )}
                  </div>
                </div>

                <div className="pt-4">
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Your ToDo.md file is the source of truth for all tasks and data.
                    The app automatically loads this file on startup and syncs changes.
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-2">
                    <span className="font-medium">File location:</span> /Users/ryanclement/Desktop/Notes/notes-pwa/ToDo.md
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'appearance':
        return (
          <div className="space-y-6">
            <div className="mypa-card p-6">
              <h2 className="mypa-section-header">Theme & Display</h2>
              <div className="space-y-4">
                <SettingItem
                  title="Theme mode"
                  description="Choose your preferred color scheme"
                >
                  <ThemeToggle />
                </SettingItem>

                <SettingItem
                  title="Density"
                  description="Adjust the spacing and size of interface elements"
                >
                  <Select
                    value="comfortable"
                    onChange={() => {}}
                    options={[
                      { value: 'compact', label: 'Compact' },
                      { value: 'comfortable', label: 'Comfortable' },
                      { value: 'spacious', label: 'Spacious' },
                    ]}
                  />
                </SettingItem>

                <SettingItem
                  title="Animations"
                  description="Enable smooth transitions and micro-interactions"
                >
                  <Toggle enabled={true} onChange={() => {}} />
                </SettingItem>

                <SettingItem
                  title="Reduce motion"
                  description="Minimize animations for better accessibility"
                >
                  <Toggle enabled={false} onChange={() => {}} />
                </SettingItem>
              </div>
            </div>

            <div className="mypa-card p-6">
              <h2 className="mypa-section-header">Layout Preferences</h2>
              <div className="space-y-4">
                <SettingItem
                  title="Sidebar position"
                  description="Choose where to display the navigation sidebar"
                >
                  <Select
                    value="left"
                    onChange={() => {}}
                    options={[
                      { value: 'left', label: 'Left' },
                      { value: 'right', label: 'Right' },
                      { value: 'hidden', label: 'Hidden' },
                    ]}
                  />
                </SettingItem>

                <SettingItem
                  title="Show completed tasks"
                  description="Display completed tasks in the main view"
                >
                  <Toggle enabled={true} onChange={() => {}} />
                </SettingItem>
              </div>
            </div>
          </div>
        );

      case 'ai':
        return (
          <div className="space-y-6">
            <AIProviderSettings />

            <div className="mypa-card p-6">
              <h2 className="mypa-section-header">AI Features</h2>
              <div className="space-y-4">
                <SettingItem
                  title="Smart auto-complete"
                  description="Get AI suggestions while typing tasks"
                >
                  <Toggle enabled={true} onChange={() => {}} />
                </SettingItem>

                <SettingItem
                  title="Context awareness"
                  description="Allow AI to learn from your task patterns"
                >
                  <Toggle enabled={true} onChange={() => {}} />
                </SettingItem>

                <SettingItem
                  title="Privacy mode"
                  description="Process AI requests locally when possible"
                >
                  <Toggle enabled={false} onChange={() => {}} />
                </SettingItem>
              </div>
            </div>
          </div>
        );

      case 'productivity':
        return (
          <div className="space-y-6">
            <div className="mypa-card p-6">
              <h2 className="mypa-section-header">Task Management</h2>
              <div className="space-y-4">
                <SettingItem
                  title="Maximum priorities"
                  description="Limit the number of priority tasks per day"
                >
                  <Select
                    value="3"
                    onChange={() => {}}
                    options={[
                      { value: '1', label: '1 task' },
                      { value: '3', label: '3 tasks' },
                      { value: '5', label: '5 tasks' },
                      { value: 'unlimited', label: 'Unlimited' },
                    ]}
                  />
                </SettingItem>

                <SettingItem
                  title="Auto-archive completed"
                  description="Automatically move completed tasks to archive"
                >
                  <Toggle enabled={false} onChange={() => {}} />
                </SettingItem>

                <SettingItem
                  title="Weekend mode"
                  description="Reduce notifications and reminders on weekends"
                >
                  <Toggle enabled={true} onChange={() => {}} />
                </SettingItem>
              </div>
            </div>

            <div className="mypa-card p-6">
              <h2 className="mypa-section-header">Keyboard Shortcuts</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-neutral-700 dark:text-neutral-300">Quick add task</span>
                  <kbd className="px-2 py-1 text-xs bg-neutral-100 dark:bg-neutral-700 rounded border">Cmd + K</kbd>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-neutral-700 dark:text-neutral-300">Focus mode</span>
                  <kbd className="px-2 py-1 text-xs bg-neutral-100 dark:bg-neutral-700 rounded border">Cmd + F</kbd>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-neutral-700 dark:text-neutral-300">Search</span>
                  <kbd className="px-2 py-1 text-xs bg-neutral-100 dark:bg-neutral-700 rounded border">Cmd + /</kbd>
                </div>
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <div className="mypa-card p-6">
              <h2 className="mypa-section-header">Push Notifications</h2>
              <div className="space-y-4">
                <SettingItem
                  title="Enable notifications"
                  description="Receive push notifications for important updates"
                >
                  <Toggle enabled={true} onChange={() => {}} />
                </SettingItem>

                <SettingItem
                  title="Due date reminders"
                  description="Get notified when tasks are approaching their due date"
                >
                  <Toggle enabled={true} onChange={() => {}} />
                </SettingItem>

                <SettingItem
                  title="Daily summary"
                  description="Receive a daily summary of your tasks and progress"
                >
                  <Toggle enabled={false} onChange={() => {}} />
                </SettingItem>
              </div>
            </div>

            <div className="mypa-card p-6">
              <h2 className="mypa-section-header">Quiet Hours</h2>
              <div className="space-y-4">
                <SettingItem
                  title="Enable quiet hours"
                  description="Silence notifications during specified times"
                >
                  <Toggle enabled={false} onChange={() => {}} />
                </SettingItem>

                <SettingItem
                  title="Start time"
                  description="When to begin quiet hours"
                >
                  <Select
                    value="22:00"
                    onChange={() => {}}
                    options={[
                      { value: '20:00', label: '8:00 PM' },
                      { value: '21:00', label: '9:00 PM' },
                      { value: '22:00', label: '10:00 PM' },
                      { value: '23:00', label: '11:00 PM' },
                    ]}
                  />
                </SettingItem>

                <SettingItem
                  title="End time"
                  description="When to end quiet hours"
                >
                  <Select
                    value="07:00"
                    onChange={() => {}}
                    options={[
                      { value: '06:00', label: '6:00 AM' },
                      { value: '07:00', label: '7:00 AM' },
                      { value: '08:00', label: '8:00 AM' },
                      { value: '09:00', label: '9:00 AM' },
                    ]}
                  />
                </SettingItem>
              </div>
            </div>
          </div>
        );

      case 'data':
        return (
          <div className="space-y-6">
            <div className="mypa-card p-6">
              <h2 className="mypa-section-header">Data Management</h2>
              <div className="space-y-4">
                <SettingItem
                  title="Auto-backup"
                  description="Automatically backup your data to cloud storage"
                >
                  <Toggle enabled={true} onChange={() => {}} />
                </SettingItem>

                <SettingItem
                  title="Offline mode"
                  description="Continue working when internet connection is unavailable"
                >
                  <Toggle enabled={true} onChange={() => {}} />
                </SettingItem>

                <SettingItem
                  title="Sync frequency"
                  description="How often to sync data across devices"
                >
                  <Select
                    value="realtime"
                    onChange={() => {}}
                    options={[
                      { value: 'realtime', label: 'Real-time' },
                      { value: '5min', label: 'Every 5 minutes' },
                      { value: '15min', label: 'Every 15 minutes' },
                      { value: 'manual', label: 'Manual only' },
                    ]}
                  />
                </SettingItem>
              </div>
            </div>

            <div className="mypa-card p-6">
              <h2 className="mypa-section-header">Privacy & Security</h2>
              <div className="space-y-4">
                <SettingItem
                  title="Local encryption"
                  description="Encrypt data stored locally on your device"
                >
                  <Toggle enabled={true} onChange={() => {}} />
                </SettingItem>

                <SettingItem
                  title="Analytics"
                  description="Share anonymous usage data to help improve the app"
                >
                  <Toggle enabled={false} onChange={() => {}} />
                </SettingItem>

                <div className="pt-4 border-t border-neutral-100 dark:border-neutral-700">
                  <div className="space-y-3">
                    <button className="mypa-button-secondary w-full">
                      Export Data
                    </button>
                    <button className="mypa-button-secondary w-full text-warning-600 border-warning-300 hover:bg-warning-50">
                      Clear All Data
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'instructions':
        return (
          <div className="space-y-6">
            <InstructionsViewer />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors duration-200 group"
              title="Back to Dashboard"
            >
              <svg className="w-5 h-5 text-neutral-600 dark:text-neutral-400 group-hover:text-primary-600 dark:group-hover:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">Settings</h1>
              <p className="text-neutral-500 dark:text-neutral-400 mt-1">
                Customize your productivity workspace to match your workflow
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Navigation */}
        <nav className="lg:w-64 flex-shrink-0">
          <div className="mypa-card p-4">
            <div className="space-y-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                    activeSection === section.id
                      ? 'bg-primary-100 text-primary-700 border border-primary-200 dark:bg-primary-900/30 dark:text-primary-300 dark:border-primary-700'
                      : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                  }`}
                >
                  <div className={`${activeSection === section.id ? 'text-primary-600 dark:text-primary-400' : 'text-neutral-500 dark:text-neutral-400'}`}>
                    {section.icon}
                  </div>
                  {section.name}
                </button>
              ))}
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <div className="animate-fade-in">
            {renderSection()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Settings;