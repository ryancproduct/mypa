import React, { useState, useEffect } from 'react';
import { aiService } from '../services/aiService';
import type { AIProviderType } from '../services/ai/types';

interface AIProviderSettingsProps {
  onClose?: () => void;
}

export const AIProviderSettings: React.FC<AIProviderSettingsProps> = ({ onClose }) => {
  const [selectedProvider, setSelectedProvider] = useState<AIProviderType>('anthropic');
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);

  const availableProviders = aiService.getAvailableProviders();
  const currentProvider = aiService.getCurrentProvider();

  useEffect(() => {
    // Check current provider health on mount
    checkProviderHealth();
  }, []);

  const checkProviderHealth = async () => {
    try {
      const healthy = await aiService.isHealthy();
      setIsHealthy(healthy);
    } catch (error) {
      setIsHealthy(false);
    }
  };

  const handleProviderChange = (provider: AIProviderType) => {
    setSelectedProvider(provider);
    setError('');
    setSuccess('');
  };

  const handleSave = async () => {
    if (!apiKey.trim()) {
      setError('API key is required');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      await aiService.reconfigure(apiKey, selectedProvider);
      
      // Test the connection
      const healthy = await aiService.isHealthy();
      setIsHealthy(healthy);
      
      if (healthy) {
        setSuccess(`Successfully connected to ${selectedProvider}!`);
        // Store in localStorage for persistence
        localStorage.setItem('mypa_ai_provider', selectedProvider);
        localStorage.setItem('mypa_ai_key', apiKey);
      } else {
        setError('Connection test failed. Please check your API key.');
      }
    } catch (error) {
      setError(`Failed to configure ${selectedProvider}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsHealthy(false);
    } finally {
      setIsLoading(false);
    }
  };

  const getProviderInfo = (type: AIProviderType) => {
    const provider = availableProviders.find(p => p.type === type);
    return provider?.metadata || {};
  };

  const getStatusColor = () => {
    if (isHealthy === null) return 'text-gray-500';
    return isHealthy ? 'text-green-600' : 'text-red-600';
  };

  const getStatusText = () => {
    if (isHealthy === null) return 'Unknown';
    return isHealthy ? 'Connected' : 'Disconnected';
  };

  return (
    <div className="mypa-card p-6 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          AI Provider Settings
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
          >
            ✕
          </button>
        )}
      </div>

      {/* Current Status */}
      <div className="mb-6 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm text-neutral-600 dark:text-neutral-400">Status:</span>
          <span className={`text-sm font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </span>
        </div>
        {currentProvider && (
          <div className="flex items-center justify-between mt-1">
            <span className="text-sm text-neutral-600 dark:text-neutral-400">Current:</span>
            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
              {currentProvider.name}
            </span>
          </div>
        )}
      </div>

      {/* Show different UI for secure proxy vs direct providers */}
      {currentProvider?.name === 'Secure Proxy' ? (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center space-x-2 mb-2">
            <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h4 className="font-medium text-green-800 dark:text-green-200">Secure Proxy Active</h4>
          </div>
          <p className="text-sm text-green-700 dark:text-green-300 mb-3">
            Your app is using the secure backend proxy. AI providers (OpenAI, Anthropic) are configured on the server - no API keys needed in your browser!
          </p>
          <div className="text-xs text-green-600 dark:text-green-400">
            ✓ API keys safely stored on backend<br/>
            ✓ No browser exposure<br/>
            ✓ Multiple providers available
          </div>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              AI Provider
            </label>
            <div className="space-y-2">
              {availableProviders.map((provider) => (
                <label key={provider.type} className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                name="provider"
                value={provider.type}
                checked={selectedProvider === provider.type}
                onChange={(e) => handleProviderChange(e.target.value as AIProviderType)}
                className="text-blue-600 focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="font-medium text-neutral-900 dark:text-neutral-100">
                  {provider.name}
                </div>
                <div className="text-sm text-neutral-500 dark:text-neutral-400">
                  {getProviderInfo(provider.type).description || 'AI provider'}
                </div>
              </div>
            </label>
              ))}
            </div>
          </div>

          {/* API Key Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
          API Key
        </label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder={`Enter your ${selectedProvider} API key`}
          className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md 
                   bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100
                   focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
          Your API key is stored locally and never sent to our servers
        </p>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
          <p className="text-sm text-green-700 dark:text-green-400">{success}</p>
        </div>
      )}
        </>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-3">
        <button
          onClick={handleSave}
          disabled={isLoading || !apiKey.trim()}
          className="flex-1 mypa-button-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Connecting...' : 'Save & Test Connection'}
        </button>
        
        <button
          onClick={checkProviderHealth}
          disabled={isLoading}
          className="px-4 py-2 text-sm border border-neutral-300 dark:border-neutral-600 
                   text-neutral-700 dark:text-neutral-300 rounded-md hover:bg-neutral-50 
                   dark:hover:bg-neutral-800 disabled:opacity-50"
        >
          Test
        </button>
      </div>

      {/* Provider Capabilities */}
      {selectedProvider && (
        <div className="mt-6 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
          <h4 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-2">
            Provider Capabilities
          </h4>
          <div className="text-xs text-neutral-600 dark:text-neutral-400 space-y-1">
            <div>Default Model: {getProviderInfo(selectedProvider).defaultModel}</div>
            <div>Features: {getProviderInfo(selectedProvider).supportedFeatures?.join(', ')}</div>
          </div>
        </div>
      )}
    </div>
  );
};
