import React from 'react';

interface SkeletonProps {
  className?: string;
  height?: string;
  width?: string;
  variant?: 'text' | 'rectangular' | 'circular';
  animation?: 'pulse' | 'wave' | 'none';
}

const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  height = '1rem',
  width = '100%',
  variant = 'text',
  animation = 'pulse'
}) => {
  const baseClasses = 'bg-neutral-200 dark:bg-neutral-700';

  const variantClasses = {
    text: 'rounded',
    rectangular: 'rounded-lg',
    circular: 'rounded-full'
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: ''
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={{ height, width }}
      aria-hidden="true"
    />
  );
};

// Task Item Skeleton
export const TaskItemSkeleton: React.FC<{ showMetadata?: boolean }> = ({
  showMetadata = true
}) => (
  <div className="flex items-start gap-3 p-3 animate-pulse">
    <Skeleton variant="circular" width="1.25rem" height="1.25rem" className="mt-0.5" />
    <div className="flex-1 space-y-2">
      <Skeleton height="1rem" width="85%" />
      {showMetadata && (
        <div className="flex items-center gap-2">
          <Skeleton height="0.75rem" width="60px" />
          <Skeleton height="0.75rem" width="80px" />
          <Skeleton height="0.75rem" width="40px" />
        </div>
      )}
    </div>
  </div>
);

// Task Section Skeleton
export const TaskSectionSkeleton: React.FC<{ itemCount?: number; showHeader?: boolean }> = ({
  itemCount = 3,
  showHeader = true
}) => (
  <div className="mypa-card p-6 animate-pulse">
    {showHeader && (
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Skeleton variant="circular" width="1.5rem" height="1.5rem" />
          <Skeleton height="1.25rem" width="120px" />
        </div>
        <Skeleton height="1rem" width="60px" />
      </div>
    )}
    <div className="space-y-3">
      {Array.from({ length: itemCount }).map((_, index) => (
        <TaskItemSkeleton key={index} />
      ))}
    </div>
  </div>
);

// Generic AI Interface Skeleton (simplified from removed chat components)
export const ChatInterfaceSkeleton: React.FC = () => (
  <div className="mypa-card p-4">
    <div className="space-y-3 animate-pulse">
      <Skeleton height="1rem" width="60%" />
      <Skeleton height="2rem" width="100%" />
      <Skeleton height="1rem" width="40%" />
    </div>
  </div>
);

// Dashboard Loading Skeleton
export const DashboardSkeleton: React.FC = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    {/* Header */}
    <header className="mb-8 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <Skeleton height="2rem" width="300px" />
          <Skeleton height="1rem" width="200px" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton height="2rem" width="100px" />
          <Skeleton height="2rem" width="80px" />
          <Skeleton height="2rem" width="90px" />
        </div>
      </div>
    </header>

    {/* Hero Section - Priorities */}
    <section className="mypa-card p-8 border-2 border-primary-200 dark:border-primary-800 bg-gradient-to-br from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 shadow-lg mb-8">
      <div className="flex items-center justify-between mb-6 animate-pulse">
        <div className="flex items-center gap-3">
          <Skeleton variant="circular" width="2rem" height="2rem" />
          <Skeleton height="1.5rem" width="200px" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton height="1.25rem" width="20px" />
          <Skeleton height="1rem" width="60px" />
        </div>
      </div>
      <div className="space-y-3">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="bg-white dark:bg-neutral-800 rounded-lg p-1 shadow-sm border border-primary-100 dark:border-primary-800">
            <TaskItemSkeleton />
          </div>
        ))}
      </div>
    </section>

    {/* Main Grid */}
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
      {/* Left Column */}
      <div className="space-y-6">
        <TaskSectionSkeleton itemCount={4} />
      </div>

      {/* Right Column */}
      <div className="space-y-6">
        <ChatInterfaceSkeleton />
        <TaskSectionSkeleton itemCount={2} />
      </div>
    </div>
  </div>
);

// Generic Loading State Component
interface LoadingStateProps {
  type?: 'spinner' | 'skeleton' | 'dots';
  message?: string;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  type = 'spinner',
  message = 'Loading...',
  className = ''
}) => {
  const renderLoader = () => {
    switch (type) {
      case 'spinner':
        return (
          <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        );
      case 'dots':
        return (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
            <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          </div>
        );
      case 'skeleton':
        return <Skeleton height="2rem" width="200px" />;
      default:
        return null;
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-3 p-6 ${className}`}>
      {renderLoader()}
      {message && (
        <p className="text-sm text-neutral-600 dark:text-neutral-400 text-center">
          {message}
        </p>
      )}
    </div>
  );
};

export default Skeleton;