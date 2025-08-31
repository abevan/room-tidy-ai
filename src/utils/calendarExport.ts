interface Task {
  id: string;
  description: string;
  timeEstimate: number;
  completed: boolean;
  category: string;
  subtasks?: Subtask[];
}

interface Subtask {
  id: string;
  description: string;
  timeEstimate: number;
  completed: boolean;
}

export const exportToCalendar = (tasks: Task[]): void => {
  console.log(`Starting calendar export for ${tasks.length} tasks`);
  
  // Create calendar header
  let icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Room Tidy AI//Room Cleaning Plan//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Room Cleaning Plan
X-WR-TIMEZONE:${Intl.DateTimeFormat().resolvedOptions().timeZone}
`;

  const now = new Date();
  let currentTime = new Date(now.getTime() + 2 * 60 * 1000); // Start in 2 minutes
  let eventCount = 0;

  tasks.forEach((task, taskIndex) => {
    if (task.subtasks && task.subtasks.length > 0) {
      // Export individual subtasks for broken down tasks
      task.subtasks.forEach((subtask, subtaskIndex) => {
        const startTime = new Date(currentTime);
        const endTime = new Date(currentTime.getTime() + subtask.timeEstimate * 60 * 1000);
        
        const uid = `${Date.now()}-${taskIndex}-${subtaskIndex}@roomtidy.ai`;
        const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        
        icsContent += `BEGIN:VEVENT
UID:${uid}
DTSTAMP:${timestamp}
DTSTART:${formatDateForICS(startTime)}
DTEND:${formatDateForICS(endTime)}
SUMMARY:${escapeICSText(subtask.description)}
DESCRIPTION:${escapeICSText(`Part of: ${task.description}\\n\\nCategory: ${task.category}\\n\\nEstimated time: ${subtask.timeEstimate} minutes\\n\\nHow to complete this task:\\n• Take your time and focus on this specific step\\n• Remember that small progress is still progress\\n• You've got this! 💪`)}
LOCATION:Your Room
CATEGORIES:${task.category},Room Cleaning,AI Generated
STATUS:CONFIRMED
TRANSP:OPAQUE
END:VEVENT
`;
        
        currentTime = new Date(endTime.getTime() + 5 * 60 * 1000); // 5 minute break between subtasks
        eventCount++;
      });
    } else {
      // Export single task
      const startTime = new Date(currentTime);
      const endTime = new Date(currentTime.getTime() + task.timeEstimate * 60 * 1000);
      
      const uid = `${Date.now()}-${taskIndex}@roomtidy.ai`;
      const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      
      icsContent += `BEGIN:VEVENT
UID:${uid}
DTSTAMP:${timestamp}
DTSTART:${formatDateForICS(startTime)}
DTEND:${formatDateForICS(endTime)}
SUMMARY:${escapeICSText(task.description)}
DESCRIPTION:${escapeICSText(`Category: ${task.category}\\n\\nEstimated time: ${task.timeEstimate} minutes\\n\\nHow to complete this task:\\n• Break it down into smaller steps if needed\\n• Focus on one area at a time\\n• Remember: progress over perfection!\\n• You've got this! 💪`)}
LOCATION:Your Room
CATEGORIES:${task.category},Room Cleaning,AI Generated
STATUS:CONFIRMED
TRANSP:OPAQUE
END:VEVENT
`;
      
      currentTime = new Date(endTime.getTime() + 10 * 60 * 1000); // 10 minute break between main tasks
      eventCount++;
    }
  });

  // Close calendar
  icsContent += `END:VCALENDAR`;

  console.log(`Created calendar with ${eventCount} events`);

  // Download the file
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'room-cleaning-plan.ics';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Helper function to format date for ICS format
function formatDateForICS(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

// Helper function to escape special characters in ICS text
function escapeICSText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '');
}