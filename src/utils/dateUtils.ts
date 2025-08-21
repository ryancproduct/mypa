export const formatDateAustralian = (date: Date): string => {
  return new Intl.DateTimeFormat('en-AU', {
    timeZone: 'Australia/Sydney',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date).split('/').reverse().join('-');
};

export const getCurrentDateAustralian = (): string => {
  return formatDateAustralian(new Date());
};

export const formatTimeAustralian = (date: Date): string => {
  return new Intl.DateTimeFormat('en-AU', {
    timeZone: 'Australia/Sydney',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
};

export const getDayName = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-AU', {
    timeZone: 'Australia/Sydney',
    weekday: 'long',
  }).format(date);
};

export const isOverdue = (dueDate: string): boolean => {
  const today = getCurrentDateAustralian();
  return dueDate < today;
};

export const isDueToday = (dueDate: string): boolean => {
  const today = getCurrentDateAustralian();
  return dueDate === today;
};

export const getDaysOverdue = (dueDate: string): number => {
  const today = new Date(getCurrentDateAustralian());
  const due = new Date(dueDate);
  const diffTime = today.getTime() - due.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const formatDueDate = (dueDate: string): string => {
  const date = new Date(dueDate);
  const today = new Date(getCurrentDateAustralian());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // Compare dates (ignoring time)
  const dueDateString = date.toDateString();
  const todayString = today.toDateString();
  const tomorrowString = tomorrow.toDateString();
  
  if (dueDateString === todayString) {
    return 'Today';
  } else if (dueDateString === tomorrowString) {
    return 'Tomorrow';
  } else if (isOverdue(dueDate)) {
    const days = getDaysOverdue(dueDate);
    return `${days} day${days > 1 ? 's' : ''} overdue`;
  } else {
    // Future date
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 7) {
      return `In ${diffDays} day${diffDays > 1 ? 's' : ''}`;
    } else {
      return date.toLocaleDateString('en-AU', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  }
};

export const getTaskUrgency = (task: { dueDate?: string; priority?: string }): number => {
  let urgency = 0;
  
  // Priority scoring
  if (task.priority === 'P1') urgency += 3;
  else if (task.priority === 'P2') urgency += 2;
  else if (task.priority === 'P3') urgency += 1;
  
  // Due date scoring
  if (task.dueDate) {
    if (isOverdue(task.dueDate)) {
      urgency += 5 + getDaysOverdue(task.dueDate); // Higher for more overdue
    } else if (isDueToday(task.dueDate)) {
      urgency += 4;
    } else {
      const date = new Date(task.dueDate);
      const today = new Date(getCurrentDateAustralian());
      const diffTime = date.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays <= 3) urgency += 3;
      else if (diffDays <= 7) urgency += 2;
      else if (diffDays <= 14) urgency += 1;
    }
  }
  
  return urgency;
};

export const sortTasksByUrgency = <T extends { dueDate?: string; priority?: string }>(tasks: T[]): T[] => {
  return [...tasks].sort((a, b) => getTaskUrgency(b) - getTaskUrgency(a));
};