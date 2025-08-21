import type { Task, DailySection, Note, Blocker } from '../types';

export interface ParsedMarkdown {
  sections: DailySection[];
}

export const parseMarkdownContent = (content: string): ParsedMarkdown => {
  const lines = content.split('\n');
  const sections: DailySection[] = [];
  let currentSection: DailySection | null = null;
  let currentSectionType: string | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Match date headers like "# 2025-08-13 (Local: Australia/Sydney)"
    const dateMatch = line.match(/^# (\d{4}-\d{2}-\d{2}) \(Local: Australia\/Sydney\)$/);
    if (dateMatch) {
      // Save previous section if exists
      if (currentSection) {
        sections.push(currentSection);
      }

      // Create new section
      currentSection = {
        id: crypto.randomUUID(),
        date: dateMatch[1],
        priorities: [],
        schedule: [],
        followUps: [],
        notes: [],
        completed: [],
        blockers: [],
      };
      currentSectionType = null;
      continue;
    }

    if (!currentSection) continue;

    // Match section headers
    if (line.startsWith('## 📌 Priorities')) {
      currentSectionType = 'priorities';
      continue;
    } else if (line.startsWith('## 📅 Schedule')) {
      currentSectionType = 'schedule';
      continue;
    } else if (line.startsWith('## 🔄 Follow-ups')) {
      currentSectionType = 'followUps';
      continue;
    } else if (line.startsWith('## 🧠 Notes & Ideas')) {
      currentSectionType = 'notes';
      continue;
    } else if (line.startsWith('## ✅ Completed')) {
      currentSectionType = 'completed';
      continue;
    } else if (line.startsWith('## 🧱 Blockers')) {
      currentSectionType = 'blockers';
      continue;
    }

    // Skip section headers, empty lines, and markdown elements
    if (line.startsWith('#') || line === '' || line.startsWith('---') || line.startsWith('>')) {
      continue;
    }

    // Parse tasks
    if (currentSectionType && (line.startsWith('- [ ]') || line.startsWith('- [x]'))) {
      const task = parseTaskLine(line);
      if (task) {
        switch (currentSectionType) {
          case 'priorities':
            currentSection.priorities.push(task);
            break;
          case 'schedule':
            currentSection.schedule.push(task);
            break;
          case 'followUps':
            currentSection.followUps.push(task);
            break;
          case 'completed':
            currentSection.completed.push(task);
            break;
        }
      }
    }

    // Parse notes (lines that don't start with -)
    if (currentSectionType === 'notes' && line && !line.startsWith('-')) {
      const note: Note = {
        id: crypto.randomUUID(),
        content: line,
        timestamp: new Date().toISOString(),
      };
      currentSection.notes.push(note);
    }

    // Parse blockers
    if (currentSectionType === 'blockers' && line.startsWith('-')) {
      const blockerContent = line.replace(/^-\s*/, '');
      const [content, nextStep] = blockerContent.split(' → ');
      
      const blocker: Blocker = {
        id: crypto.randomUUID(),
        content: content.trim(),
        nextStep: nextStep?.trim(),
        createdAt: new Date().toISOString(),
      };
      currentSection.blockers.push(blocker);
    }
  }

  // Add the last section
  if (currentSection) {
    sections.push(currentSection);
  }

  return { sections };
};

const parseTaskLine = (line: string): Task | null => {
  // Parse task status
  const isCompleted = line.includes('[x]');
  const status = isCompleted ? 'completed' : 'pending';

  // Remove checkbox and extract content
  let content = line.replace(/^-\s*\[[x\s]\]\s*/, '');

  // Extract metadata
  const projectMatch = content.match(/#(\w+)/);
  const project = projectMatch ? `#${projectMatch[1]}` : undefined;

  const assigneeMatch = content.match(/@(\w+)/);
  const assignee = assigneeMatch ? assigneeMatch[1] : undefined;

  const dueDateMatch = content.match(/Due: (\d{4}-\d{2}-\d{2})/);
  const dueDate = dueDateMatch ? dueDateMatch[1] : undefined;

  const priorityMatch = content.match(/!P([123])/);
  const priority = priorityMatch ? `P${priorityMatch[1]}` as 'P1' | 'P2' | 'P3' : undefined;

  // Clean up content by removing metadata
  content = content
    .replace(/#\w+/g, '')
    .replace(/@\w+/g, '')
    .replace(/Due: \d{4}-\d{2}-\d{2}/g, '')
    .replace(/!P[123]/g, '')
    .replace(/\[🆕 New\]/g, '')
    .replace(/\[🔄 Day \d+\]/g, '')
    .replace(/\[⚠️ Overdue \d+ days\]/g, '')
    .replace(/\[🚧 Blocked\]/g, '')
    .replace(/⏭\s*/, '') // Remove rollover marker
    .trim();

  if (!content) return null;

  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    content,
    status,
    project,
    assignee,
    dueDate,
    priority,
    createdAt: now,
    updatedAt: now,
    completedAt: isCompleted ? now : undefined,
  };
};

export const exportToMarkdown = (sections: DailySection[]): string => {
  let markdown = '';

  sections.forEach((section) => {
    markdown += `# ${section.date} (Local: Australia/Sydney)\n\n`;

    // Priorities
    markdown += '## 📌 Priorities (Top 3 max)\n';
    section.priorities.forEach((task) => {
      markdown += formatTaskToMarkdown(task);
    });
    markdown += '\n';

    // Schedule
    markdown += '## 📅 Schedule\n';
    section.schedule.forEach((task) => {
      markdown += formatTaskToMarkdown(task);
    });
    markdown += '\n';

    // Follow-ups
    markdown += '## 🔄 Follow-ups\n';
    section.followUps.forEach((task) => {
      markdown += formatTaskToMarkdown(task);
    });
    markdown += '\n';

    // Notes
    markdown += '## 🧠 Notes & Ideas\n';
    section.notes.forEach((note) => {
      markdown += `- ${note.content}\n`;
    });
    markdown += '\n';

    // Completed
    markdown += '## ✅ Completed\n';
    section.completed.forEach((task) => {
      markdown += formatTaskToMarkdown(task);
    });
    markdown += '\n';

    // Blockers
    markdown += '## 🧱 Blockers\n';
    section.blockers.forEach((blocker) => {
      markdown += `- ${blocker.content}`;
      if (blocker.nextStep) {
        markdown += ` → ${blocker.nextStep}`;
      }
      markdown += '\n';
    });
    markdown += '\n---\n\n';
  });

  return markdown;
};

const formatTaskToMarkdown = (task: Task): string => {
  const checkbox = task.status === 'completed' ? '[x]' : '[ ]';
  let line = `- ${checkbox} ${task.content}`;

  if (task.project) line += ` ${task.project}`;
  if (task.assignee) line += ` @${task.assignee}`;
  if (task.dueDate) line += ` Due: ${task.dueDate}`;
  if (task.priority) line += ` !${task.priority}`;

  return line + '\n';
};