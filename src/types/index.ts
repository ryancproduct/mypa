export interface Task {
  id: string;
  content: string;
  status: 'pending' | 'in_progress' | 'completed';
  project?: string;
  assignee?: string;
  dueDate?: string;
  priority?: 'P1' | 'P2' | 'P3';
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface Project {
  id: string;
  name: string;
  tag: string;
  description?: string;
  color?: string;
}

export interface DailySection {
  id: string;
  date: string;
  priorities: Task[];
  schedule: Task[];
  followUps: Task[];
  notes: Note[];
  completed: Task[];
  blockers: Blocker[];
}

export interface Note {
  id: string;
  content: string;
  timestamp: string;
}

export interface Blocker {
  id: string;
  content: string;
  nextStep?: string;
  createdAt: string;
}

export interface AppState {
  currentDate: string;
  sections: DailySection[];
  projects: Project[];
  loading: boolean;
  error: string | null;
}