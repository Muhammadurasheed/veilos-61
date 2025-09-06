import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AnimatedReactionProps {
  emoji: string;
  id: string;
  onComplete: (id: string) => void;
}

export const AnimatedReaction = ({ emoji, id, onComplete }: AnimatedReactionProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onComplete(id), 300);
    }, 2500);

    return () => clearTimeout(timer);
  }, [id, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ 
            y: 20, 
            x: Math.random() * 100 - 50,
            opacity: 0,
            scale: 0.5
          }}
          animate={{ 
            y: -100, 
            x: Math.random() * 200 - 100,
            opacity: 1,
            scale: [0.5, 1.2, 1]
          }}
          exit={{ 
            opacity: 0, 
            scale: 0.3,
            y: -150
          }}
          transition={{ 
            duration: 2.5,
            ease: "easeOut",
            scale: { times: [0, 0.2, 1], duration: 0.5 }
          }}
          className="absolute pointer-events-none select-none text-4xl drop-shadow-lg"
          style={{
            left: `${Math.random() * 80 + 10}%`,
            bottom: '10%',
            zIndex: 1000
          }}
        >
          {emoji}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

interface ReactionOverlayProps {
  reactions: Array<{ id: string; emoji: string; timestamp: number }>;
}

export const ReactionOverlay = ({ reactions }: ReactionOverlayProps) => {
  const [activeReactions, setActiveReactions] = useState<Array<{ id: string; emoji: string }>>([]);

  useEffect(() => {
    reactions.forEach(reaction => {
      const reactionWithId = { id: reaction.id, emoji: reaction.emoji };
      setActiveReactions(prev => [...prev, reactionWithId]);
    });
  }, [reactions]);

  const handleReactionComplete = (id: string) => {
    setActiveReactions(prev => prev.filter(r => r.id !== id));
  };

  return (
    <div className="fixed inset-0 pointer-events-none">
      {activeReactions.map(reaction => (
        <AnimatedReaction
          key={reaction.id}
          id={reaction.id}
          emoji={reaction.emoji}
          onComplete={handleReactionComplete}
        />
      ))}
    </div>
  );
};