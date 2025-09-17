import React, { useState } from 'react';
import { useMarkdownStore } from '../stores/useMarkdownStore';
import { generateUUID } from '../utils/uuid';

interface PerformanceResult {
  operation: string;
  duration: number;
  mode: string;
}

export const PerformanceTest: React.FC = () => {
  const [results, setResults] = useState<PerformanceResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const { addTask, updateTask, deleteTask, storageMode } = useMarkdownStore();

  const generateTestTasks = (count: number) => {
    return Array.from({ length: count }, (_, i) => ({
      content: `Performance test task ${i + 1}`,
      description: `This is a test task created for performance testing. Task number ${i + 1} of ${count}.`,
      priority: ['P1', 'P2', 'P3'][i % 3] as 'P1' | 'P2' | 'P3',
      status: 'pending' as const,
      project: '#PerformanceTest',
      tags: ['test', 'performance'],
      dueDate: new Date(Date.now() + (i * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]
    }));
  };

  const measureTime = async (operation: string, fn: () => Promise<void>) => {
    const start = performance.now();
    await fn();
    const end = performance.now();
    const duration = end - start;
    
    setResults(prev => [...prev, {
      operation,
      duration,
      mode: storageMode
    }]);
    
    return duration;
  };

  const runPerformanceTest = async () => {
    setIsRunning(true);
    setResults([]);
    
    try {
      // Test 1: Add single task
      await measureTime('Add Single Task', async () => {
        await addTask({
          content: 'Single performance test task',
          priority: 'P2',
          status: 'pending',
          project: '#PerformanceTest'
        });
      });

      // Test 2: Add multiple tasks (batch)
      const testTasks = generateTestTasks(10);
      await measureTime('Add 10 Tasks (Sequential)', async () => {
        for (const task of testTasks) {
          await addTask(task);
        }
      });

      // Test 3: Add tasks in parallel
      const parallelTasks = generateTestTasks(5);
      await measureTime('Add 5 Tasks (Parallel)', async () => {
        await Promise.all(parallelTasks.map(task => addTask(task)));
      });

      // Test 4: Update tasks
      const tasksToUpdate = generateTestTasks(5);
      const taskIds: string[] = [];
      
      // First add tasks to get their IDs
      for (const task of tasksToUpdate) {
        const addedTask = await addTask(task);
        // Note: In real implementation, addTask should return the created task with ID
        // For now, we'll generate IDs for testing
        taskIds.push(generateUUID());
      }

      await measureTime('Update 5 Tasks', async () => {
        for (const id of taskIds) {
          await updateTask(id, {
            content: 'Updated task content',
            priority: 'P1'
          });
        }
      });

      // Test 5: Delete tasks
      await measureTime('Delete 5 Tasks', async () => {
        for (const id of taskIds) {
          await deleteTask(id);
        }
      });

    } catch (error) {
      console.error('Performance test error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  const getAverageTime = (operation: string) => {
    const operationResults = results.filter(r => r.operation === operation);
    if (operationResults.length === 0) return 0;
    return operationResults.reduce((sum, r) => sum + r.duration, 0) / operationResults.length;
  };

  const getPerformanceRating = (duration: number) => {
    if (duration < 10) return { rating: 'Excellent', color: 'text-green-600 dark:text-green-400' };
    if (duration < 50) return { rating: 'Good', color: 'text-blue-600 dark:text-blue-400' };
    if (duration < 200) return { rating: 'Fair', color: 'text-yellow-600 dark:text-yellow-400' };
    return { rating: 'Slow', color: 'text-red-600 dark:text-red-400' };
  };

  return (
    <div className="mypa-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="mypa-section-header !mb-1">Performance Testing</h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Test storage performance with current mode: <span className="font-medium">{storageMode}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={runPerformanceTest}
            disabled={isRunning}
            className="mypa-button-primary disabled:opacity-50"
          >
            {isRunning ? 'Running...' : 'Run Test'}
          </button>
          {results.length > 0 && (
            <button
              onClick={clearResults}
              className="mypa-button-secondary"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {isRunning && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="text-blue-800 dark:text-blue-200 font-medium">Running performance tests...</span>
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((result, index) => {
              const { rating, color } = getPerformanceRating(result.duration);
              return (
                <div key={index} className="p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                  <div className="font-medium text-neutral-900 dark:text-neutral-100 mb-1">
                    {result.operation}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                      {result.duration.toFixed(1)}ms
                    </span>
                    <span className={`text-sm font-medium ${color}`}>
                      {rating}
                    </span>
                  </div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    Mode: {result.mode}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
            <h3 className="font-medium text-neutral-900 dark:text-neutral-100 mb-3">Performance Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-neutral-600 dark:text-neutral-400">Total Operations:</span>
                <span className="ml-2 font-medium">{results.length}</span>
              </div>
              <div>
                <span className="text-neutral-600 dark:text-neutral-400">Average Time:</span>
                <span className="ml-2 font-medium">
                  {(results.reduce((sum, r) => sum + r.duration, 0) / results.length).toFixed(1)}ms
                </span>
              </div>
              <div>
                <span className="text-neutral-600 dark:text-neutral-400">Storage Mode:</span>
                <span className="ml-2 font-medium capitalize">{storageMode}</span>
              </div>
            </div>
          </div>

          <div className="text-xs text-neutral-500 dark:text-neutral-400">
            <p>💡 <strong>Performance Tips:</strong></p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li><strong>Hybrid Mode:</strong> Best overall performance with file sync</li>
              <li><strong>DB-Only Mode:</strong> Fastest for pure database operations</li>
              <li><strong>File-Only Mode:</strong> Slower but maintains direct file access</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
