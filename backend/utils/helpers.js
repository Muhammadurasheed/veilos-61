
// Helper function to generate random aliases
// Note: This is a simple implementation, in production you'd want more robust word lists
exports.generateAlias = () => {
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
};
