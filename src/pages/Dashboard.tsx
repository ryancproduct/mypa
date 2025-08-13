import React from 'react';
import { useTaskStore } from '../stores/useTaskStore';
import { getCurrentDateAustralian, getDayName } from '../utils/dateUtils';

const Dashboard: React.FC = () => {
  const { currentDate, getCurrentSection, projects } = useTaskStore();
  const currentSection = getCurrentSection();
  const dayName = getDayName(currentDate);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {currentDate} ({dayName})
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Local: Australia/Sydney
        </p>
      </header>

      <div className="grid gap-6">
        {/* Priorities Section */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            📌 Priorities (Top 3 max)
          </h2>
          <div className="space-y-2">
            {currentSection?.priorities.length ? (
              currentSection.priorities.map((task) => (
                <div key={task.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={task.status === 'completed'}
                    className="rounded"
                    readOnly
                  />
                  <span className={task.status === 'completed' ? 'line-through' : ''}>
                    {task.content}
                  </span>
                  {task.project && (
                    <span className="text-blue-600 text-sm">{task.project}</span>
                  )}
                </div>
              ))
            ) : (
              <p className="text-gray-500 italic">No priorities set for today</p>
            )}
          </div>
        </section>

        {/* Schedule Section */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            📅 Schedule
          </h2>
          <div className="space-y-2">
            {currentSection?.schedule.length ? (
              currentSection.schedule.map((task) => (
                <div key={task.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={task.status === 'completed'}
                    className="rounded"
                    readOnly
                  />
                  <span className={task.status === 'completed' ? 'line-through' : ''}>
                    {task.content}
                  </span>
                  {task.project && (
                    <span className="text-blue-600 text-sm">{task.project}</span>
                  )}
                </div>
              ))
            ) : (
              <p className="text-gray-500 italic">No scheduled tasks</p>
            )}
          </div>
        </section>

        {/* Follow-ups Section */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            🔄 Follow-ups
          </h2>
          <div className="space-y-2">
            {currentSection?.followUps.length ? (
              currentSection.followUps.map((task) => (
                <div key={task.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={task.status === 'completed'}
                    className="rounded"
                    readOnly
                  />
                  <span className={task.status === 'completed' ? 'line-through' : ''}>
                    {task.content}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 italic">No follow-ups</p>
            )}
          </div>
        </section>

        {/* Projects Overview */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            📋 Active Projects
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {projects.map((project) => (
              <div key={project.id} className="border rounded-lg p-3">
                <h3 className="font-medium">{project.name}</h3>
                <p className="text-sm text-blue-600">{project.tag}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;