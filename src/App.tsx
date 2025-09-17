import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import { PWAPrompt } from './components/PWAPrompt';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastProvider } from './components/Toast';

function App() {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Log to console in development
        if (process.env.NODE_ENV === 'development') {
          console.error('App Error Boundary caught:', error, errorInfo);
        }
        // In production, you might want to send this to an error reporting service
      }}
    >
      <ToastProvider position="top-right" maxToasts={5}>
        <Router>
          <div className="min-h-screen bg-neutral-25 dark:bg-neutral-950 transition-colors duration-200">
            <ErrorBoundary
              fallback={
                <div className="flex flex-col items-center justify-center min-h-screen p-6">
                  <div className="mypa-card max-w-md w-full p-8 text-center border-l-4 border-red-500">
                    <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                      MyPA Application Error
                    </h1>
                    <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                      The application encountered an error. Your data is safe - please refresh the page to continue.
                    </p>
                    <button
                      onClick={() => window.location.reload()}
                      className="mypa-button-primary"
                    >
                      Refresh Application
                    </button>
                  </div>
                </div>
              }
            >
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </ErrorBoundary>
            <PWAPrompt />
          </div>
        </Router>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
