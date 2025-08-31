import { createEvent, EventAttributes } from 'ics';

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
  const events: EventAttributes[] = [];
  const now = new Date();
  let currentTime = new Date(now.getTime() + 2 * 60 * 1000); // Start in 2 minutes

  tasks.forEach((task) => {
    if (task.subtasks && task.subtasks.length > 0) {
      // Export individual subtasks for broken down tasks
      task.subtasks.forEach((subtask) => {
        const startTime = new Date(currentTime);
        const endTime = new Date(currentTime.getTime() + subtask.timeEstimate * 60 * 1000);
        
        events.push({
          title: subtask.description,
          description: `Part of: ${task.description}\n\nCategory: ${task.category}\n\nEstimated time: ${subtask.timeEstimate} minutes\n\nHow to complete this task:\n• Take your time and focus on this specific step\n• Remember that small progress is still progress\n• You've got this! 💪`,
          start: [
            startTime.getFullYear(),
            startTime.getMonth() + 1,
            startTime.getDate(),
            startTime.getHours(),
            startTime.getMinutes()
          ],
          end: [
            endTime.getFullYear(),
            endTime.getMonth() + 1,
            endTime.getDate(),
            endTime.getHours(),
            endTime.getMinutes()
          ],
          location: 'Your Room',
          categories: [task.category, 'Room Cleaning', 'AI Generated'],
          status: 'CONFIRMED',
          busyStatus: 'BUSY',
          organizer: { name: 'Room Tidy AI', email: 'ai@roomtidy.app' }
        });
        
        currentTime = new Date(endTime.getTime() + 5 * 60 * 1000); // 5 minute break between subtasks
      });
    } else {
      // Export single task
      const startTime = new Date(currentTime);
      const endTime = new Date(currentTime.getTime() + task.timeEstimate * 60 * 1000);
      
      events.push({
        title: task.description,
        description: `Category: ${task.category}\n\nEstimated time: ${task.timeEstimate} minutes\n\nHow to complete this task:\n• Break it down into smaller steps if needed\n• Focus on one area at a time\n• Remember: progress over perfection!\n• You've got this! 💪`,
        start: [
          startTime.getFullYear(),
          startTime.getMonth() + 1,
          startTime.getDate(),
          startTime.getHours(),
          startTime.getMinutes()
        ],
        end: [
          endTime.getFullYear(),
          endTime.getMonth() + 1,
          endTime.getDate(),
          endTime.getHours(),
          endTime.getMinutes()
        ],
        location: 'Your Room',
        categories: [task.category, 'Room Cleaning', 'AI Generated'],
        status: 'CONFIRMED',
        busyStatus: 'BUSY',
        organizer: { name: 'Room Tidy AI', email: 'ai@roomtidy.app' }
      });
      
      currentTime = new Date(endTime.getTime() + 10 * 60 * 1000); // 10 minute break between main tasks
    }
  });

  // Create the calendar file
  const allEventsValue = events.map(event => {
    const { error, value } = createEvent(event);
    if (error) {
      console.error('Error creating event:', error);
      return null;
    }
    return value;
  }).filter(Boolean);

  console.log(`Creating calendar with ${allEventsValue.length} events from ${tasks.length} tasks`);

  // Join all events into one calendar
  const calendar = allEventsValue.join('');

  // Download the file
  const blob = new Blob([calendar], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'room-cleaning-plan.ics';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};