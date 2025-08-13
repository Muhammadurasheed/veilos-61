import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { 
  Star, 
  Heart, 
  ThumbsUp, 
  MessageSquare,
  Award,
  Shield,
  Users,
  Clock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface SessionRatingProps {
  sessionId: string;
  expertId: string;
  expertName: string;
  onRatingSubmitted?: (rating: any) => void;
  showDialog: boolean;
  onClose: () => void;
}

interface RatingData {
  rating: number;
  feedback: string;
  categories: {
    professionalism: number;
    expertise: number;
    communication: number;
    helpfulness: number;
  };
  wouldRecommend: boolean;
  isAnonymous: boolean;
}

const ratingLabels = {
  1: 'Poor',
  2: 'Fair', 
  3: 'Good',
  4: 'Very Good',
  5: 'Excellent'
};

const categoryDescriptions = {
  professionalism: 'Professional conduct and approach',
  expertise: 'Knowledge and skill in their field',
  communication: 'Clear and effective communication',
  helpfulness: 'Willingness to help and support'
};

export const SessionRating: React.FC<SessionRatingProps> = ({
  sessionId,
  expertId,
  expertName,
  onRatingSubmitted,
  showDialog,
  onClose
}) => {
  const [step, setStep] = useState<'rating' | 'details' | 'submitted'>('rating');
  const [loading, setLoading] = useState(false);
  const [ratingData, setRatingData] = useState<RatingData>({
    rating: 0,
    feedback: '',
    categories: {
      professionalism: 0,
      expertise: 0,
      communication: 0,
      helpfulness: 0
    },
    wouldRecommend: true,
    isAnonymous: false
  });
  
  const { toast } = useToast();

  const handleOverallRating = (rating: number) => {
    setRatingData(prev => ({
      ...prev,
      rating,
      // Auto-fill categories with the same rating as a starting point
      categories: {
        professionalism: rating,
        expertise: rating,
        communication: rating,
        helpfulness: rating
      }
    }));
    
    if (rating > 0) {
      setStep('details');
    }
  };

  const handleCategoryRating = (category: keyof RatingData['categories'], rating: number) => {
    setRatingData(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [category]: rating
      }
    }));
  };

  const handleSubmitRating = async () => {
    if (ratingData.rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please provide an overall rating",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/session-ratings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          sessionId,
          ...ratingData
        })
      });

      const data = await response.json();

      if (data.success) {
        setStep('submitted');
        onRatingSubmitted?.(data.data);
        toast({
          title: "Rating Submitted",
          description: "Thank you for your feedback!"
        });
        
        // Auto-close after 3 seconds
        setTimeout(() => {
          onClose();
        }, 3000);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit rating",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (
    rating: number,
    onRatingChange: (rating: number) => void,
    size: 'sm' | 'md' | 'lg' = 'md'
  ) => {
    const sizeClasses = {
      sm: 'h-4 w-4',
      md: 'h-6 w-6',
      lg: 'h-8 w-8'
    };

    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onRatingChange(star)}
            className={cn(
              "transition-colors hover:scale-110",
              rating >= star ? "text-yellow-400" : "text-gray-300 hover:text-yellow-400"
            )}
          >
            <Star className={cn(sizeClasses[size], rating >= star && "fill-current")} />
          </button>
        ))}
      </div>
    );
  };

  const resetRating = () => {
    setStep('rating');
    setRatingData({
      rating: 0,
      feedback: '',
      categories: {
        professionalism: 0,
        expertise: 0,
        communication: 0,
        helpfulness: 0
      },
      wouldRecommend: true,
      isAnonymous: false
    });
  };

  const canSubmit = ratingData.rating > 0 && 
    Object.values(ratingData.categories).every(rating => rating > 0);

  return (
    <Dialog open={showDialog} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        {step === 'rating' && (
          <>
            <DialogHeader>
              <DialogTitle>Rate Your Session</DialogTitle>
              <DialogDescription>
                How was your session with {expertName}?
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-8 py-6">
              <div className="text-center space-y-4">
                <div className="text-6xl mb-4">
                  {ratingData.rating === 0 && '🤔'}
                  {ratingData.rating === 1 && '😞'}
                  {ratingData.rating === 2 && '😐'}
                  {ratingData.rating === 3 && '🙂'}
                  {ratingData.rating === 4 && '😊'}
                  {ratingData.rating === 5 && '😍'}
                </div>
                
                <div className="space-y-2">
                  {renderStars(ratingData.rating, handleOverallRating, 'lg')}
                  <p className="text-lg font-medium">
                    {ratingData.rating > 0 && ratingLabels[ratingData.rating as keyof typeof ratingLabels]}
                  </p>
                </div>
              </div>

              <div className="text-center">
                <p className="text-muted-foreground">
                  Tap a star to rate your overall experience
                </p>
              </div>
            </div>
          </>
        )}

        {step === 'details' && (
          <>
            <DialogHeader>
              <DialogTitle>Detailed Feedback</DialogTitle>
              <DialogDescription>
                Help us understand what went well and what could be improved
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Category Ratings */}
              <div className="space-y-4">
                <h4 className="font-medium">Rate specific aspects:</h4>
                
                {Object.entries(categoryDescriptions).map(([category, description]) => (
                  <div key={category} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <Label className="capitalize font-medium">{category}</Label>
                        <p className="text-xs text-muted-foreground">{description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {renderStars(
                          ratingData.categories[category as keyof RatingData['categories']],
                          (rating) => handleCategoryRating(category as keyof RatingData['categories'], rating),
                          'sm'
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Written Feedback */}
              <div className="space-y-2">
                <Label htmlFor="feedback">Additional Comments (Optional)</Label>
                <Textarea
                  id="feedback"
                  placeholder="Share more details about your experience..."
                  value={ratingData.feedback}
                  onChange={(e) => setRatingData(prev => ({ ...prev, feedback: e.target.value }))}
                  rows={4}
                />
              </div>

              {/* Recommendation */}
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <ThumbsUp className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">Would you recommend {expertName}?</p>
                    <p className="text-sm text-muted-foreground">Help others find great experts</p>
                  </div>
                </div>
                <Switch
                  checked={ratingData.wouldRecommend}
                  onCheckedChange={(checked) => setRatingData(prev => ({ ...prev, wouldRecommend: checked }))}
                />
              </div>

              {/* Anonymous Option */}
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Submit anonymously</p>
                    <p className="text-sm text-muted-foreground">Your name won't be shown with this review</p>
                  </div>
                </div>
                <Switch
                  checked={ratingData.isAnonymous}
                  onCheckedChange={(checked) => setRatingData(prev => ({ ...prev, isAnonymous: checked }))}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={resetRating} className="flex-1">
                Back
              </Button>
              <Button 
                onClick={handleSubmitRating} 
                disabled={!canSubmit || loading}
                className="flex-1"
              >
                {loading ? 'Submitting...' : 'Submit Rating'}
              </Button>
            </div>
          </>
        )}

        {step === 'submitted' && (
          <>
            <DialogHeader>
              <DialogTitle className="text-center">Thank You!</DialogTitle>
            </DialogHeader>

            <div className="text-center space-y-6 py-8">
              <div className="text-6xl">🙏</div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Your feedback has been submitted</h3>
                <p className="text-muted-foreground">
                  Your rating helps {expertName} improve and helps other users find great experts.
                </p>
              </div>

              <Card className="bg-green-50 border-green-200">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-center gap-3 text-green-700">
                    <Award className="h-5 w-5" />
                    <span className="font-medium">
                      {ratingData.rating >= 4 ? 'Excellent session!' : 'Thanks for the feedback!'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Button onClick={onClose} className="w-full">
                Continue
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};