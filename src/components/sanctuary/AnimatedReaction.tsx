import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AnimatedReactionProps {
  emoji: string;
  participantId: string;
  id: string; // Unique identifier to prevent duplicates
  duration?: number;
  onComplete?: () => void;
}

export const AnimatedReaction: React.FC<AnimatedReactionProps> = ({
  emoji,
  participantId,
  id,
  duration = 2500,
  onComplete
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  // Generate consistent random values based on id to avoid layout shifts
  const randomValues = React.useMemo(() => {
    const seed = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const random = (seed * 9301 + 49297) % 233280;
    return {
      startX: (random % 80) + 10,
      startY: (random % 60) + 20,
      endX: ((random * 7) % 60) - 30,
      finalScale: 0.7 + ((random % 30) / 100)
    };
  }, [id]);

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          key={id}
          initial={{ 
            opacity: 0, 
            scale: 0.3, 
            y: 0,
            x: 0
          }}
          animate={{ 
            opacity: [0, 1, 0.8, 0], 
            scale: [0.3, 1.4, 1, randomValues.finalScale], 
            y: [-10, -30, -50, -80],
            x: [0, randomValues.endX * 0.3, randomValues.endX * 0.7, randomValues.endX],
            rotate: [0, 15, -10, 0]
          }}
          exit={{ 
            opacity: 0, 
            scale: 0.2,
            y: -100
          }}
          transition={{ 
            duration: duration / 1000,
            ease: [0.25, 0.46, 0.45, 0.94] // Custom easing for more natural motion
          }}
          className="absolute text-3xl pointer-events-none z-50 select-none"
          style={{
            left: `${randomValues.startX}%`,
            top: `${randomValues.startY}%`,
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
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
    // Only add new reactions that aren't already active
    reactions.forEach(reaction => {
      const isAlreadyActive = activeReactions.some(active => active.id === reaction.id);
      if (!isAlreadyActive) {
        const reactionWithId = { id: reaction.id, emoji: reaction.emoji };
        setActiveReactions(prev => [...prev, reactionWithId]);
      }
    });
  }, [reactions, activeReactions]);

  const handleReactionComplete = () => {
    // Remove completed reactions based on timestamp
    setActiveReactions(prev => prev.filter(r => Date.now() - parseInt(r.id.split('_')[1] || '0') < 3000));
  };

  return (
    <div className="fixed inset-0 pointer-events-none">
      {activeReactions.map(reaction => (
        <AnimatedReaction
          key={reaction.id}
          id={reaction.id}
          participantId="overlay"
          emoji={reaction.emoji}
          onComplete={handleReactionComplete}
        />
      ))}
    </div>
  );
};