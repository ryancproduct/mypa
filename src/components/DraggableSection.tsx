import React, { ReactNode, useState } from 'react';
import { useDashboardStore } from '../stores/useDashboardStore';
import type { DashboardSection } from '../stores/useDashboardStore';

interface DraggableSectionProps {
  section: DashboardSection;
  children: ReactNode;
  className?: string;
}

export const DraggableSection: React.FC<DraggableSectionProps> = ({
  section,
  children,
  className = ''
}) => {
  const { layout, reorderSections, toggleSectionVisibility } = useDashboardStore();
  const [isDragging, setIsDragging] = useState(false);
  const [draggedOver, setDraggedOver] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', section.id);
    e.dataTransfer.effectAllowed = 'move';
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDraggedOver(true);
  };

  const handleDragLeave = () => {
    setDraggedOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDraggedOver(false);

    const draggedSectionId = e.dataTransfer.getData('text/plain');
    if (draggedSectionId === section.id) return;

    const currentSections = layout.sections.filter(s => s.visible);
    const sourceIndex = currentSections.findIndex(s => s.id === draggedSectionId);
    const destinationIndex = currentSections.findIndex(s => s.id === section.id);

    if (sourceIndex !== -1 && destinationIndex !== -1) {
      reorderSections(sourceIndex, destinationIndex);
    }
  };

  if (!section.visible) return null;

  return (
    <div
      draggable={layout.isCustomizing}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative transition-all duration-200
        ${className}
        ${layout.isCustomizing ? 'cursor-move' : ''}
        ${isDragging ? 'opacity-50 scale-95 rotate-2' : ''}
        ${draggedOver && layout.isCustomizing ? 'border-2 border-primary-400 border-dashed bg-primary-50/20 dark:bg-primary-900/20' : ''}
        ${layout.isCustomizing ? 'hover:shadow-premium-lg hover:scale-[1.02]' : ''}
      `}
    >
      {/* Customization Controls */}
      {layout.isCustomizing && (
        <div className="absolute -top-2 -right-2 z-10 flex items-center gap-1">
          {/* Drag Handle */}
          <div className="mypa-glass rounded-lg p-2 shadow-premium cursor-move">
            <svg className="w-4 h-4 text-neutral-600 dark:text-neutral-300" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </div>

          {/* Visibility Toggle */}
          <button
            onClick={() => toggleSectionVisibility(section.id)}
            className="mypa-glass rounded-lg p-2 shadow-premium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
            title="Hide section"
          >
            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
            </svg>
          </button>
        </div>
      )}

      {/* Section Label for Customization Mode */}
      {layout.isCustomizing && (
        <div className="absolute -top-6 left-0 z-10">
          <span className="mypa-badge bg-primary-100 text-primary-700 border-primary-200 text-xs font-medium">
            {section.title}
          </span>
        </div>
      )}

      {/* Drop Zone Indicator */}
      {layout.isCustomizing && draggedOver && (
        <div className="absolute inset-0 flex items-center justify-center z-20 bg-primary-100/80 dark:bg-primary-900/40 rounded-xl">
          <div className="text-center">
            <svg className="w-8 h-8 text-primary-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
            <p className="text-sm font-medium text-primary-700 dark:text-primary-300">Drop here</p>
          </div>
        </div>
      )}

      {children}
    </div>
  );
};