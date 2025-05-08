
/**
 * Generate a random alias for anonymous users
 * @returns A random alias in the format "AdjectiveNounXX"
 */
export function generateAlias(): string {
  const adjectives = [
    'Wise', 'Silent', 'Gentle', 'Peaceful', 'Hidden', 'Noble', 'Subtle', 'Calm', 
    'Patient', 'Honest', 'Graceful', 'Dreamy', 'Humble', 'Ancient', 'Serene'
  ];
  
  const nouns = [
    'Soul', 'Wind', 'Rain', 'Mountain', 'River', 'Shadow', 'Light', 'Forest',
    'Wave', 'Stone', 'Bird', 'Ocean', 'Moon', 'Star', 'Meadow'
  ];
  
  const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  const randomNumber = Math.floor(Math.random() * 100);
  
  return `${randomAdjective}${randomNoun}${randomNumber}`;
}

/**
 * Format a date string to a more readable format
 * @param dateString - ISO date string
 * @returns Formatted date string
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  
  // Check if the date is today
  const today = new Date();
  if (date.toDateString() === today.toDateString()) {
    return `Today at ${date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
  }
  
  // Check if the date is yesterday
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday at ${date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
  }
  
  // If date is within the last 7 days
  const oneWeekAgo = new Date(today);
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  if (date > oneWeekAgo) {
    return `${date.toLocaleDateString(undefined, { weekday: 'long' })} at ${date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
  }
  
  // Default formatting for older dates
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
