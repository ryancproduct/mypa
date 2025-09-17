import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface DashboardSection {
  id: string;
  title: string;
  component: string;
  visible: boolean;
  position: number;
  gridArea?: {
    column: number;
    row: number;
    colSpan: number;
    rowSpan: number;
  };
}

export interface DashboardLayout {
  sections: DashboardSection[];
  isCustomizing: boolean;
  gridColumns: number;
}

interface DashboardStore {
  layout: DashboardLayout;
  setCustomizing: (customizing: boolean) => void;
  moveSectionToPosition: (sectionId: string, newPosition: number) => void;
  toggleSectionVisibility: (sectionId: string) => void;
  updateSectionGridArea: (sectionId: string, gridArea: DashboardSection['gridArea']) => void;
  resetToDefault: () => void;
  reorderSections: (sourceIndex: number, destinationIndex: number) => void;
}

const defaultSections: DashboardSection[] = [
  {
    id: 'priorities',
    title: "Today's Priorities",
    component: 'priorities',
    visible: true,
    position: 0,
    gridArea: { column: 1, row: 1, colSpan: 5, rowSpan: 1 }
  },
  {
    id: 'due-overdue',
    title: 'Due Today & Overdue',
    component: 'due-overdue',
    visible: true,
    position: 1,
    gridArea: { column: 1, row: 2, colSpan: 3, rowSpan: 1 }
  },
  {
    id: 'schedule',
    title: 'Schedule',
    component: 'schedule',
    visible: true,
    position: 2,
    gridArea: { column: 1, row: 3, colSpan: 3, rowSpan: 1 }
  },
  {
    id: 'ai-assistant',
    title: 'AI Assistant',
    component: 'ai-assistant',
    visible: true,
    position: 3,
    gridArea: { column: 4, row: 2, colSpan: 2, rowSpan: 1 }
  },
  {
    id: 'follow-ups',
    title: 'Follow-ups',
    component: 'follow-ups',
    visible: true,
    position: 4,
    gridArea: { column: 4, row: 3, colSpan: 2, rowSpan: 1 }
  },
  {
    id: 'completed',
    title: 'Completed Today',
    component: 'completed',
    visible: true,
    position: 5,
    gridArea: { column: 1, row: 4, colSpan: 3, rowSpan: 1 }
  },
  {
    id: 'projects',
    title: 'Active Projects',
    component: 'projects',
    visible: true,
    position: 6,
    gridArea: { column: 4, row: 4, colSpan: 2, rowSpan: 1 }
  }
];

const defaultLayout: DashboardLayout = {
  sections: defaultSections,
  isCustomizing: false,
  gridColumns: 5
};

export const useDashboardStore = create<DashboardStore>()(
  persist(
    (set, get) => ({
      layout: defaultLayout,

      setCustomizing: (customizing: boolean) =>
        set((state) => ({
          layout: { ...state.layout, isCustomizing: customizing }
        })),

      moveSectionToPosition: (sectionId: string, newPosition: number) =>
        set((state) => {
          const sections = [...state.layout.sections];
          const sectionIndex = sections.findIndex(s => s.id === sectionId);

          if (sectionIndex === -1) return state;

          const [movedSection] = sections.splice(sectionIndex, 1);
          movedSection.position = newPosition;
          sections.splice(newPosition, 0, movedSection);

          // Update positions for all sections
          sections.forEach((section, index) => {
            section.position = index;
          });

          return {
            layout: { ...state.layout, sections }
          };
        }),

      reorderSections: (sourceIndex: number, destinationIndex: number) =>
        set((state) => {
          const sections = [...state.layout.sections];
          const [reorderedSection] = sections.splice(sourceIndex, 1);
          sections.splice(destinationIndex, 0, reorderedSection);

          // Update positions
          sections.forEach((section, index) => {
            section.position = index;
          });

          return {
            layout: { ...state.layout, sections }
          };
        }),

      toggleSectionVisibility: (sectionId: string) =>
        set((state) => {
          const sections = state.layout.sections.map(section =>
            section.id === sectionId
              ? { ...section, visible: !section.visible }
              : section
          );

          return {
            layout: { ...state.layout, sections }
          };
        }),

      updateSectionGridArea: (sectionId: string, gridArea: DashboardSection['gridArea']) =>
        set((state) => {
          const sections = state.layout.sections.map(section =>
            section.id === sectionId
              ? { ...section, gridArea }
              : section
          );

          return {
            layout: { ...state.layout, sections }
          };
        }),

      resetToDefault: () =>
        set(() => ({
          layout: { ...defaultLayout, sections: [...defaultSections] }
        }))
    }),
    {
      name: 'dashboard-layout',
      version: 1
    }
  )
);