import React from 'react';
import { useDashboardStore } from '../stores/useDashboardStore';

export const DashboardCustomizer: React.FC = () => {
  const { layout, setCustomizing, toggleSectionVisibility, resetToDefault } = useDashboardStore();

  const visibleSections = layout.sections.filter(s => s.visible);
  const hiddenSections = layout.sections.filter(s => !s.visible);

  return (
    <div className="mypa-card p-6 mb-6 border-2 border-dashed border-primary-300 dark:border-primary-600 bg-primary-50/50 dark:bg-primary-900/20">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center animate-pulse">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-primary-900 dark:text-primary-100">
              Dashboard Customization
            </h3>
            <p className="text-sm text-primary-600 dark:text-primary-400">
              Drag sections to reorder • Click eye icon to hide • Use controls below
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCustomizing(false)}
            className="mypa-button-secondary text-sm"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Done
          </button>
          <button
            onClick={resetToDefault}
            className="mypa-button-secondary text-sm text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reset Layout
          </button>
        </div>
      </div>

      {/* Hidden Sections */}
      {hiddenSections.length > 0 && (
        <div className="mt-6 pt-4 border-t border-primary-200 dark:border-primary-700">
          <h4 className="text-sm font-medium text-primary-800 dark:text-primary-200 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
            </svg>
            Hidden Sections ({hiddenSections.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {hiddenSections.map((section) => (
              <button
                key={section.id}
                onClick={() => toggleSectionVisibility(section.id)}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-800 hover:text-primary-700 dark:hover:text-primary-300 transition-colors duration-200"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {section.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Section Order Preview */}
      <div className="mt-6 pt-4 border-t border-primary-200 dark:border-primary-700">
        <h4 className="text-sm font-medium text-primary-800 dark:text-primary-200 mb-3 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
          Current Layout ({visibleSections.length} sections)
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {visibleSections
            .sort((a, b) => a.position - b.position)
            .map((section, index) => (
              <div
                key={section.id}
                className="flex items-center gap-2 p-2 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs"
              >
                <span className="w-5 h-5 bg-primary-100 dark:bg-primary-800 text-primary-600 dark:text-primary-300 rounded text-center font-medium">
                  {index + 1}
                </span>
                <span className="flex-1 text-neutral-900 dark:text-neutral-100 font-medium">
                  {section.title}
                </span>
                <button
                  onClick={() => toggleSectionVisibility(section.id)}
                  className="text-neutral-400 hover:text-red-500 transition-colors duration-200"
                  title="Hide section"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};