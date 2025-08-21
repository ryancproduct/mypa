import { create } from 'zustand';
import type { AppState, Task, DailySection, Project } from '../types';
import { getCurrentDateAustralian } from '../utils/dateUtils';
import { supabase } from '../lib/supabaseClient';


interface TaskStore extends AppState {
  tasks: Task[]; // Computed property that returns all tasks from all sections
  fetchAndSetStateForDate: (date: string) => Promise<void>;
  addTask: (taskData: Omit<Task, 'id' | 'createdAt' | 'completedAt' | 'updatedAt' | 'daily_section_id'>, sectionType?: 'priorities' | 'schedule' | 'followUps') => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  completeTask: (id: string) => Promise<void>;
  addProject: (projectData: Omit<Project, 'id'>) => Promise<void>;
  setCurrentDate: (date: string) => void;
  getCurrentSection: () => DailySection | undefined;
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  currentDate: getCurrentDateAustralian(),
  sections: [],
  projects: [],
  loading: true,
  error: null,

  // Computed property that returns all tasks from all sections
  get tasks() {
    const { sections } = get();
    return sections.flatMap(section => [
      ...section.priorities,
      ...section.schedule,
      ...section.followUps,
      ...section.completed
    ]);
  },



  fetchAndSetStateForDate: async (date) => {
    set({ loading: true, error: null });
    try {
      // 1. Fetch projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*');
      if (projectsError) throw projectsError;

      // 2. Find or create the daily section
      let { data: section, error: sectionError } = await supabase
        .from('daily_sections')
        .select('*, tasks(*)')
        .eq('date', date)
        .single();

      if (sectionError && sectionError.code !== 'PGRST116') { // PGRST116: 'exact-one-row-not-found'
        throw sectionError;
      }

      if (!section) {
        const { data: newSection, error: newSectionError } = await supabase.from('daily_sections').insert({ date }).select().single();
        if (newSectionError) throw newSectionError;
        section = newSection;
      }

      // 3. Fetch tasks for the section
      const { data: tasks, error: tasksError } = await supabase.from('tasks').select('*').eq('daily_section_id', section.id);
      if (tasksError) throw tasksError;

      // 4. Organize tasks and update state
      const dailySection: DailySection = {
        id: section.id,
        date: section.date,
        priorities: tasks.filter(t => t.task_type === 'priority'),
        schedule: tasks.filter(t => t.task_type === 'schedule'),
        followUps: tasks.filter(t => t.task_type === 'followUp'),
        notes: [], // Assuming notes are not yet in db
        completed: [], // Assuming completed are handled differently or not fetched here
        blockers: [], // Assuming blockers are not yet in db
      };

      set({ projects: projectsData || [], sections: [dailySection], loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      console.error("Error fetching data:", error);
    }
  },

  setCurrentDate: (date) => {
    set({ currentDate: date });
    get().fetchAndSetStateForDate(date);
  },

  getCurrentSection: () => {
    const { sections, currentDate } = get();
    return sections.find(s => s.date === currentDate);
  },

  addTask: async (taskData, sectionType = 'schedule') => {
    const { getCurrentSection } = get();
    const currentSection = getCurrentSection();

    if (!currentSection) {
      console.error("Cannot add task: No current section found.");
      return;
    }

    const newTaskPayload = {
      ...taskData,
      daily_section_id: currentSection.id,
      task_type: sectionType,
      project_id: taskData.project || null,
      updatedAt: new Date().toISOString(),
    };
    delete (newTaskPayload as any).project;

    const { data: newTask, error } = await supabase
      .from('tasks')
      .insert(newTaskPayload)
      .select()
      .single();

    if (error) {
      set({ error: error.message });
      console.error("Error adding task:", error);
      return;
    }

    if (newTask) {
      set(state => {
        const sections = state.sections.map(section => {
          if (section.id === currentSection.id) {
            const updatedSection = { ...section };
            switch (newTask.task_type) {
              case 'priority':
                updatedSection.priorities = [...updatedSection.priorities, newTask as Task];
                break;
              case 'schedule':
                updatedSection.schedule = [...updatedSection.schedule, newTask as Task];
                break;
              case 'followUp':
                updatedSection.followUps = [...updatedSection.followUps, newTask as Task];
                break;
            }
            return updatedSection;
          }
          return section;
        });
        return { sections };
      });
    }
  },
  updateTask: async (id, updates) => {
    const { data: updatedTask, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      set({ error: error.message });
      console.error("Error updating task:", error);
      return;
    }

    if (updatedTask) {
      set(state => {
        const sections = state.sections.map(section => {
          const updateList = (list: Task[]) => 
            list.map(task => (task.id === id ? { ...task, ...updatedTask } : task));

          return {
            ...section,
            priorities: updateList(section.priorities),
            schedule: updateList(section.schedule),
            followUps: updateList(section.followUps),
          };
        });
        return { sections };
      });
    }
  },
  deleteTask: async (id) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id);

    if (error) {
      set({ error: error.message });
      console.error("Error deleting task:", error);
    } else {
      set(state => {
        const sections = state.sections.map(section => ({
          ...section,
          priorities: section.priorities.filter(task => task.id !== id),
          schedule: section.schedule.filter(task => task.id !== id),
          followUps: section.followUps.filter(task => task.id !== id),
        }));
        return { sections };
      });
    }
  },
  completeTask: async (id) => {
    const completedAt = new Date().toISOString();
    const { data: completedTask, error } = await supabase
      .from('tasks')
      .update({ status: 'completed', completed_at: completedAt })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      set({ error: error.message });
      console.error("Error completing task:", error);
      return;
    }

    if (completedTask) {
      set(state => {
        const sections = [...state.sections];
        sections.forEach(section => {
          let taskFound = false;
          ['priorities', 'schedule', 'followUps'].forEach(listName => {
            if (taskFound) return;
            const list = section[listName as keyof DailySection] as Task[];
            const taskIndex = list.findIndex(task => task.id === id);

            if (taskIndex > -1) {
              list.splice(taskIndex, 1);
              section.completed.push(completedTask as Task);
              taskFound = true;
            }
          });
        });
        return { sections };
      });
    }
  },
  addProject: async (projectData) => {
    const { data: newProject, error } = await supabase
      .from('projects')
      .insert(projectData)
      .select()
      .single();

    if (error) {
      set({ error: error.message });
      console.error("Error adding project:", error);
    } else if (newProject) {
      set(state => ({ projects: [...state.projects, newProject] }));
    }
  },
  rolloverTasks: () => console.log('rolloverTasks not implemented for Supabase yet'),
}));

// Initial fetch
useTaskStore.getState().fetchAndSetStateForDate(useTaskStore.getState().currentDate);