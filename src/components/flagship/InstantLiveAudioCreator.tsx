import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  Mic, 
  Users, 
  Play,
  Sparkles
} from 'lucide-react';
import { FlagshipSanctuaryApi } from '@/services/flagshipSanctuaryApi';

interface InstantLiveAudioFormData {
  topic: string;
  description?: string;
  emoji: string;
  maxParticipants: number;
  duration: number;
}

const InstantLiveAudioCreator: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<InstantLiveAudioFormData>({
    defaultValues: {
      topic: '',
      description: '',
      emoji: '🎤',
      maxParticipants: 50,
      duration: 60,
    },
  });

  const watchedValues = watch();

  const onSubmit = async (data: InstantLiveAudioFormData) => {
    setIsCreating(true);
    
    try {
      console.log('🎤 Creating instant live audio session:', data);
      
      const response = await FlagshipSanctuaryApi.createSession({
        topic: data.topic,
        description: data.description,
        emoji: data.emoji,
        maxParticipants: data.maxParticipants,
        duration: data.duration,
        accessType: 'public',
        voiceModulationEnabled: true,
        moderationEnabled: true,
        recordingEnabled: false,
        allowAnonymous: true,
        tags: [],
        category: 'support'
      });

      console.log('📡 Instant session creation response:', response);

      if (response.success && response.data) {
        // Store host token for recovery
        if (response.data.hostToken) {
          const expiryDate = new Date();
          expiryDate.setHours(expiryDate.getHours() + 48);
          
          localStorage.setItem(`flagship-sanctuary-host-${response.data.id}`, response.data.hostToken);
          localStorage.setItem(`flagship-sanctuary-host-${response.data.id}-expires`, expiryDate.toISOString());
        }
        
        toast({
          title: '🎤 Live Audio Started!',
          description: `Your live session "${data.topic}" is now active.`,
        });

        // Navigate directly to the live session
        navigate(`/flagship-sanctuary/${response.data.id}?role=host&instant=true`);
      } else {
        throw new Error(response.error || 'Failed to create instant live audio session');
      }
    } catch (error: any) {
      console.error('❌ Instant live audio creation failed:', error);
      
      toast({
        title: 'Failed to start live audio',
        description: error.message || 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const emojiOptions = ['🎤', '💭', '❤️', '🤝', '🌟', '🙏', '✨', '🌈', '💫', '🔥'];

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card className="border-green-200 shadow-lg bg-gradient-to-b from-green-50 to-white">
        <CardHeader className="text-center">
          <div className="text-6xl mb-4 animate-pulse">🎤</div>
          <CardTitle className="text-2xl text-green-700 flex items-center justify-center gap-2">
            <Play className="h-6 w-6" />
            Start Instant Live Audio
          </CardTitle>
          <p className="text-gray-600">
            Go live immediately! No scheduling needed - just like Google Meet instant meetings
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Topic */}
            <div>
              <Label htmlFor="topic" className="text-sm font-medium">
                What would you like to discuss? *
              </Label>
              <Input
                id="topic"
                {...register('topic', { 
                  required: 'Topic is required',
                  minLength: { value: 3, message: 'Topic must be at least 3 characters' }
                })}
                placeholder="e.g., Mental Health Support, Career Advice..."
                className="mt-1"
              />
              {errors.topic && (
                <p className="text-red-500 text-sm mt-1">{errors.topic.message}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description" className="text-sm font-medium">
                Brief Description (Optional)
              </Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Tell participants what to expect..."
                className="mt-1"
                rows={3}
              />
            </div>

            {/* Emoji Selection */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Choose an Emoji</Label>
              <div className="flex flex-wrap gap-2">
                {emojiOptions.map(emoji => (
                  <Button
                    key={emoji}
                    type="button"
                    variant={watchedValues.emoji === emoji ? "default" : "outline"}
                    className={`h-12 w-12 p-0 text-xl ${
                      watchedValues.emoji === emoji ? "bg-green-500 text-white" : ""
                    }`}
                    onClick={() => setValue('emoji', emoji)}
                  >
                    {emoji}
                  </Button>
                ))}
              </div>
            </div>

            {/* Settings */}
            <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
              {/* Max Participants */}
              <div>
                <Label className="text-sm font-medium flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4" />
                  Max Participants: {watchedValues.maxParticipants}
                </Label>
                <Slider
                  value={[watchedValues.maxParticipants]}
                  onValueChange={(values) => setValue('maxParticipants', values[0])}
                  min={2}
                  max={100}
                  step={1}
                  className="py-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  How many people can join your session
                </p>
              </div>

              {/* Duration */}
              <div>
                <Label className="text-sm font-medium flex items-center gap-2 mb-2">
                  <Mic className="h-4 w-4" />
                  Duration: {watchedValues.duration} minutes
                </Label>
                <Slider
                  value={[watchedValues.duration]}
                  onValueChange={(values) => setValue('duration', values[0])}
                  min={15}
                  max={180}
                  step={15}
                  className="py-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  How long your session will run
                </p>
              </div>
            </div>

            {/* Instant Live Features */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-700 flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4" />
                Instant Live Features
              </h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• 🎤 Go live immediately - no waiting!</li>
                <li>• 🔗 Share link instantly with anyone</li>
                <li>• 🎯 Perfect for impromptu discussions</li>
                <li>• 🛡️ Built-in AI moderation & safety</li>
                <li>• 📱 Works on all devices</li>
              </ul>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isCreating}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-3 text-lg"
            >
              {isCreating ? (
                <>
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Starting Live Session...
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 mr-2" />
                  🎤 Go Live Now!
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default InstantLiveAudioCreator;