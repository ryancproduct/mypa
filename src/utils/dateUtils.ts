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