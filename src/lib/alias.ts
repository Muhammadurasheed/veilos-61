
const adjectives = [
  'Silent', 'Gentle', 'Whispered', 'Hidden', 'Quiet', 'Veiled', 'Soft', 'Calm',
  'Peaceful', 'Serene', 'Tender', 'Mellow', 'Tranquil', 'Soothing', 'Graceful', 'Subtle',
  'Delicate', 'Light', 'Dreamy', 'Floating', 'Dancing', 'Gliding', 'Free', 'Wise',
  'Honest', 'True', 'Kind', 'Brave', 'Noble', 'Pure', 'Open', 'Healing'
];

const nouns = [
  'River', 'Ocean', 'Wind', 'Rain', 'Cloud', 'Star', 'Moon', 'Sky',
  'Leaf', 'Tree', 'Flower', 'Meadow', 'Garden', 'Forest', 'Mountain', 'Valley',
  'Shadow', 'Light', 'Whisper', 'Song', 'Voice', 'Echo', 'Spirit', 'Soul',
  'Heart', 'Mind', 'Thought', 'Dream', 'Hope', 'Journey', 'Path', 'Story'
];

export function generateAlias(): string {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * 100);
  
  return `${adjective}${noun}${number}`;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(date);
}
