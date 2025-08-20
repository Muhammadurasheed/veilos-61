/**
 * Generate a unique alias
 */


export const generateAlias = (): string => {
  const adjectives = [
    'Gentle', 'Peaceful', 'Mindful', 'Brave', 'Wise', 
    'Kind', 'Calm', 'Happy', 'Serene', 'Quiet',
    'Silent', 'Noble', 'Humble', 'Honest', 'Bold'
  ];
  
  const nouns = [
    'Soul', 'Spirit', 'Mind', 'Heart', 'Star', 
    'Light', 'Wind', 'Shadow', 'River', 'Ocean',
    'Mountain', 'Forest', 'Leaf', 'Tree', 'Journey'
  ];
  
  const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  const randomNumber = Math.floor(Math.random() * 100);
  
  return `${randomAdjective}${randomNoun}${randomNumber}`;
};

/**
 * Format a timestamp for display
 */
export const formatDate = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  
  // If today, show time only
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  // If yesterday
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }
  
  // If this week, show day name
  const daysAgo = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (daysAgo < 7) {
    return date.toLocaleString(undefined, { weekday: 'long' });
  }
  
  // Otherwise show date
  return date.toLocaleDateString();
};

/**
 * Format seconds into MM:SS format
 */
export const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};
