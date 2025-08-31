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
PRODID:-//Room Tidy AI//Room Cleaning Schedule//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:🏠 Room Cleaning Schedule - AI Generated
X-WR-CALDESC:Smart cleaning plan created by Room Tidy AI to efficiently organize your space
X-WR-TIMEZONE:${Intl.DateTimeFormat().resolvedOptions().timeZone}
`;

  const now = new Date();
  let currentTime = new Date(now.getTime() + 5 * 60 * 1000); // Start in 5 minutes
  let eventCount = 0;

  // Add a welcome/prep event first
  const prepStartTime = new Date(now.getTime() + 2 * 60 * 1000);
  const prepEndTime = new Date(prepStartTime.getTime() + 3 * 60 * 1000);
  const prepUid = `prep-${Date.now()}@roomtidy.ai`;
  const prepTimestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  
  icsContent += `BEGIN:VEVENT
UID:${prepUid}
DTSTAMP:${prepTimestamp}
DTSTART:${formatDateForICS(prepStartTime)}
DTEND:${formatDateForICS(prepEndTime)}
SUMMARY:🚀 Preparation - Room Cleaning Session
DESCRIPTION:Get ready for your AI-guided room cleaning session!\\n\\n✅ What to do now:\\n• Put on comfortable clothes\\n• Play your favorite music\\n• Gather cleaning supplies if needed\\n• Take a "before" photo\\n\\n💪 You've got this! This organized approach will make cleaning much more manageable.
LOCATION:Your Room
CATEGORIES:Preparation,Room Cleaning,AI Generated
STATUS:CONFIRMED
TRANSP:OPAQUE
PRIORITY:5
BEGIN:VALARM
ACTION:DISPLAY
DESCRIPTION:🏠 Time to start your room cleaning session!
TRIGGER:-PT5M
END:VALARM
END:VEVENT
`;

  tasks.forEach((task, taskIndex) => {
    if (task.subtasks && task.subtasks.length > 0) {
      // Export individual subtasks for broken down tasks
      task.subtasks.forEach((subtask, subtaskIndex) => {
        const startTime = new Date(currentTime);
        const endTime = new Date(currentTime.getTime() + subtask.timeEstimate * 60 * 1000);
        
        const uid = `subtask-${Date.now()}-${taskIndex}-${subtaskIndex}@roomtidy.ai`;
        const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        
        icsContent += `BEGIN:VEVENT
UID:${uid}
DTSTAMP:${timestamp}
DTSTART:${formatDateForICS(startTime)}
DTEND:${formatDateForICS(endTime)}
SUMMARY:${getCategoryEmoji(task.category)} ${escapeICSText(subtask.description)}
DESCRIPTION:📋 Part of: ${escapeICSText(task.description)}\\n🏷️ Category: ${task.category}\\n⏱️ Estimated time: ${subtask.timeEstimate} minutes\\n\\n🎯 Focus Points:\\n• Take your time with this specific step\\n• Work systematically, one area at a time\\n• Small progress is still meaningful progress\\n• Remember: you're creating a more organized space!\\n\\n💡 Pro tip: Take breaks when needed and celebrate small wins!
LOCATION:Your Room - ${task.category} Area
CATEGORIES:${task.category},Room Cleaning,AI Generated,Subtask
STATUS:CONFIRMED
TRANSP:OPAQUE
PRIORITY:3
BEGIN:VALARM
ACTION:DISPLAY
DESCRIPTION:⏰ Time for: ${subtask.description}
TRIGGER:-PT2M
END:VALARM
END:VEVENT
`;
        
        currentTime = new Date(endTime.getTime() + 3 * 60 * 1000); // 3 minute break between subtasks
        eventCount++;
      });
    } else {
      // Export single task
      const startTime = new Date(currentTime);
      const endTime = new Date(currentTime.getTime() + task.timeEstimate * 60 * 1000);
      
      const uid = `task-${Date.now()}-${taskIndex}@roomtidy.ai`;
      const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      
      icsContent += `BEGIN:VEVENT
UID:${uid}
DTSTAMP:${timestamp}
DTSTART:${formatDateForICS(startTime)}
DTEND:${formatDateForICS(endTime)}
SUMMARY:${getCategoryEmoji(task.category)} ${escapeICSText(task.description)}
DESCRIPTION:🏷️ Category: ${task.category}\\n⏱️ Estimated time: ${task.timeEstimate} minutes\\n\\n🎯 Action Plan:\\n• Break this down into smaller steps\\n• Focus on one section at a time\\n• Use the "progress over perfection" mindset\\n• Take photos of your progress for motivation\\n\\n🌟 Remember: Each completed task brings you closer to your ideal space!
LOCATION:Your Room - ${task.category} Area
CATEGORIES:${task.category},Room Cleaning,AI Generated,Main Task
STATUS:CONFIRMED
TRANSP:OPAQUE
PRIORITY:2
BEGIN:VALARM
ACTION:DISPLAY
DESCRIPTION:🔔 Time to work on: ${task.description}
TRIGGER:-PT5M
END:VALARM
END:VEVENT
`;
      
      currentTime = new Date(endTime.getTime() + 8 * 60 * 1000); // 8 minute break between main tasks
      eventCount++;
    }
  });

  // Add completion celebration event
  const celebrationStart = new Date(currentTime);
  const celebrationEnd = new Date(celebrationStart.getTime() + 10 * 60 * 1000);
  const celebrationUid = `celebration-${Date.now()}@roomtidy.ai`;
  const celebrationTimestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  
  icsContent += `BEGIN:VEVENT
UID:${celebrationUid}
DTSTAMP:${celebrationTimestamp}
DTSTART:${formatDateForICS(celebrationStart)}
DTEND:${formatDateForICS(celebrationEnd)}
SUMMARY:🎉 Celebration - Room Cleaning Complete!
DESCRIPTION:🏆 Congratulations! You've completed your AI-guided room cleaning session!\\n\\n🎊 Time to celebrate your achievement:\\n• Take "after" photos and compare with "before"\\n• Treat yourself to something special\\n• Share your success with friends/family\\n• Enjoy your newly organized space\\n\\n✨ You should feel proud of what you've accomplished today. Your dedication to creating a more organized environment is inspiring!
LOCATION:Your Beautiful, Clean Room
CATEGORIES:Celebration,Room Cleaning,AI Generated
STATUS:CONFIRMED
TRANSP:OPAQUE
PRIORITY:1
BEGIN:VALARM
ACTION:DISPLAY
DESCRIPTION:🎉 Time to celebrate your cleaning success!
TRIGGER:-PT0M
END:VALARM
END:VEVENT
`;

  // Close calendar
  icsContent += `END:VCALENDAR`;

  console.log(`Created professional calendar with ${eventCount + 2} events (including prep and celebration)`);

  // Download the file
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `room-cleaning-schedule-${new Date().toISOString().split('T')[0]}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Helper function to get category emoji
function getCategoryEmoji(category: string): string {
  const emojiMap: Record<string, string> = {
    'General': '🧹',
    'Clothing': '👕', 
    'Surface': '🪟',
    'Items': '📦',
    'Kitchen': '🍽️',
    'Bathroom': '🚿',
    'Bedroom': '🛏️',
    'Living Room': '🛋️'
  };
  return emojiMap[category] || '✨';
}

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