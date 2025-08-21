import React, { useState } from 'react';
import { Star, MessageSquare, Send, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';

interface SessionRatingProps {
  sessionId: string;
  expertName: string;
  onRatingSubmit?: (rating: number, feedback: string) => void;
  className?: string;
}

const SessionRating: React.FC<SessionRatingProps> = ({
  sessionId,
  expertName,
  onRatingSubmit,
  className = ''
}) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const handleStarClick = (starRating: number) => {
    setRating(starRating);
  };

  const handleStarHover = (starRating: number) => {
    setHoverRating(starRating);
  };

  const handleStarLeave = () => {
    setHoverRating(0);
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        variant: 'destructive',
        title: 'Rating Required',
        description: 'Please select a star rating before submitting.',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Submit rating to backend
      const response = await fetch('/api/sessions/rating', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('veilo-auth-token') || localStorage.getItem('token') || '',
        },
        body: JSON.stringify({
          sessionId,
          rating,
          feedback: feedback.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit rating');
      }

      const result = await response.json();

      if (result.success) {
        setIsSubmitted(true);
        toast({
          title: 'Rating Submitted',
          description: 'Thank you for your feedback!',
        });

        // Call parent callback if provided
        if (onRatingSubmit) {
          onRatingSubmit(rating, feedback);
        }
      } else {
        throw new Error(result.error || 'Failed to submit rating');
      }
    } catch (error) {
      console.error('Rating submission error:', error);
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: error instanceof Error ? error.message : 'Failed to submit rating. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRatingText = (currentRating: number): string => {
    switch (currentRating) {
      case 1: return 'Poor';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Very Good';
      case 5: return 'Excellent';
      default: return 'Select Rating';
    }
  };

  if (isSubmitted) {
    return (
      <Card className={`bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 ${className}`}>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">
                Rating Submitted
              </h3>
              <p className="text-sm text-green-700 dark:text-green-300">
                Thank you for rating your session with {expertName}!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`shadow-sm ${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-center">
          Rate Your Session
        </CardTitle>
        <p className="text-sm text-muted-foreground text-center">
          How was your session with <span className="font-medium">{expertName}</span>?
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Star Rating */}
        <div className="flex flex-col items-center space-y-3">
          <div className="flex items-center space-x-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-full p-1"
                onClick={() => handleStarClick(star)}
                onMouseEnter={() => handleStarHover(star)}
                onMouseLeave={handleStarLeave}
                aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
              >
                <Star
                  className={`h-8 w-8 transition-colors duration-200 ${
                    star <= (hoverRating || rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300 dark:text-gray-600'
                  }`}
                />
              </button>
            ))}
          </div>
          <p className="text-sm font-medium text-center min-h-[20px]">
            {getRatingText(hoverRating || rating)}
          </p>
        </div>

        {/* Feedback Section */}
        <div className="space-y-3">
          <Label htmlFor="feedback" className="text-sm font-medium">
            Additional Feedback (Optional)
          </Label>
          <Textarea
            id="feedback"
            placeholder="Share your thoughts about the session..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="min-h-[100px] resize-none"
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground text-right">
            {feedback.length}/500 characters
          </p>
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || rating === 0}
          className="w-full"
        >
          {isSubmitting ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Submitting...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Send className="h-4 w-4" />
              <span>Submit Rating</span>
            </div>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default SessionRating;