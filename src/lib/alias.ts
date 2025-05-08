
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
