/**
 * Application Configuration
 * Centralized configuration management for the MyPA application
 */

interface AppConfig {
  name: string;
  shortName: string;
  version: string;
  description: string;
  themeColor: string;
  backgroundColor: string;
  timezone: string;
  features: {
    offlineMode: boolean;
    notifications: boolean;
    fileSync: boolean;
    advancedSearch: boolean;
    devTools: boolean;
    debugInfo: boolean;
  };
  security: {
    storagePrefix: string;
    encryptionIterations: number;
  };
  analytics?: {
    id: string;
    sentryDsn?: string;
  };
}

// Helper function to parse boolean environment variables
const parseBoolean = (value: string | undefined, defaultValue: boolean = false): boolean => {
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === 'true' || value === '1';
};

// Helper function to parse number environment variables
const parseNumber = (value: string | undefined, defaultValue: number): number => {
  if (value === undefined) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

// Application configuration
export const config: AppConfig = {
  name: import.meta.env.VITE_APP_NAME || 'MyPA - Personal Assistant',
  shortName: import.meta.env.VITE_PWA_SHORT_NAME || 'MyPA',
  version: import.meta.env.VITE_APP_VERSION || '1.0.0',
  description: import.meta.env.VITE_APP_DESCRIPTION || 'AI-powered personal productivity assistant',
  themeColor: import.meta.env.VITE_PWA_THEME_COLOR || '#3b82f6',
  backgroundColor: import.meta.env.VITE_PWA_BACKGROUND_COLOR || '#ffffff',
  timezone: import.meta.env.VITE_DEFAULT_TIMEZONE || 'Australia/Sydney',
  
  features: {
    offlineMode: parseBoolean(import.meta.env.VITE_ENABLE_OFFLINE_MODE, true),
    notifications: parseBoolean(import.meta.env.VITE_ENABLE_NOTIFICATIONS, true),
    fileSync: parseBoolean(import.meta.env.VITE_ENABLE_FILE_SYNC, true),
    advancedSearch: parseBoolean(import.meta.env.VITE_ENABLE_ADVANCED_SEARCH, true),
    devTools: parseBoolean(import.meta.env.VITE_ENABLE_DEV_TOOLS, import.meta.env.DEV),
    debugInfo: parseBoolean(import.meta.env.VITE_SHOW_DEBUG_INFO, false),
  },
  
  security: {
    storagePrefix: import.meta.env.VITE_SECURE_STORAGE_PREFIX || 'mypa_secure_',
    encryptionIterations: parseNumber(import.meta.env.VITE_ENCRYPTION_ITERATIONS, 100000),
  },
  
  // Analytics configuration (optional)
  ...(import.meta.env.VITE_ANALYTICS_ID && {
    analytics: {
      id: import.meta.env.VITE_ANALYTICS_ID,
      sentryDsn: import.meta.env.VITE_SENTRY_DSN,
    }
  }),
};

// Environment detection
export const isDevelopment = import.meta.env.DEV;
export const isProduction = import.meta.env.PROD;
export const mode = import.meta.env.MODE;

// API Configuration
export const apiConfig = {
  // Backend API configuration (secure proxy)
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001',
  
  // JWT token for backend authentication (replaces direct API keys)
  apiToken: import.meta.env.VITE_API_TOKEN || '',
  
  // Legacy: Direct API keys (deprecated - use backend proxy instead)
  anthropicApiKey: import.meta.env.VITE_ANTHROPIC_API_KEY || '',
  timeout: parseNumber(import.meta.env.VITE_API_TIMEOUT, 30000),
};

// Debug logging (only in development)
if (isDevelopment && config.features.debugInfo) {
  console.log('🔧 App Configuration:', {
    name: config.name,
    version: config.version,
    mode,
    features: config.features,
    security: config.security,
  });
}

// Feature flag helpers
export const isFeatureEnabled = (feature: keyof typeof config.features): boolean => {
  return config.features[feature];
};

// Environment helpers
export const getAppInfo = () => ({
  name: config.name,
  version: config.version,
  description: config.description,
  buildTime: new Date().toISOString(),
  mode,
});

// Export specific configurations for easy access
export const PWA_CONFIG = {
  name: config.name,
  shortName: config.shortName,
  themeColor: config.themeColor,
  backgroundColor: config.backgroundColor,
};

export const SECURITY_CONFIG = {
  storagePrefix: config.security.storagePrefix,
  encryptionIterations: config.security.encryptionIterations,
};

export const TIMEZONE_CONFIG = {
  default: config.timezone,
};

export default config;