import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  Mic, 
  Users, 
  Play,
  Sparkles,
  Zap,
  Link2
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
      
      // Create instant session (no scheduling - starts immediately)
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
        tags: ['instant', 'live-audio'],
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
          description: `Your live session "${data.topic}" is now active and ready for participants.`,
        });

        // Navigate directly to the session - it's already live
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
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="text-6xl animate-pulse">🎤</div>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-green-500 text-white">
                <Zap className="h-3 w-3 mr-1" />
                Instant
              </Badge>
              <Badge variant="outline" className="border-green-300">
                <Link2 className="h-3 w-3 mr-1" />
                Shareable
              </Badge>
            </div>
          </div>
          <CardTitle className="text-2xl text-green-700 flex items-center justify-center gap-2">
            <Play className="h-6 w-6" />
            Start Instant Live Audio
          </CardTitle>
          <p className="text-gray-600">
            Go live immediately! Just like Google Meet instant meetings - no scheduling needed
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
                placeholder="e.g., Mental Health Support, Career Guidance, Life Advice..."
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
                placeholder="Tell participants what to expect in this live audio session..."
                className="mt-1"
                rows={3}
              />
            </div>

            {/* Emoji Selection */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Choose Session Emoji</Label>
              <div className="flex flex-wrap gap-2">
                {emojiOptions.map(emoji => (
                  <Button
                    key={emoji}
                    type="button"
                    variant={watchedValues.emoji === emoji ? "default" : "outline"}
                    className={`h-12 w-12 p-0 text-xl hover:scale-110 transition-transform ${
                      watchedValues.emoji === emoji ? "bg-green-500 text-white shadow-lg" : ""
                    }`}
                    onClick={() => setValue('emoji', emoji)}
                  >
                    {emoji}
                  </Button>
                ))}
              </div>
            </div>

            {/* Quick Settings Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Max Participants */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <Label className="text-sm font-medium flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4" />
                  Max Participants: {watchedValues.maxParticipants}
                </Label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setValue('maxParticipants', 10)}
                      className={watchedValues.maxParticipants === 10 ? "bg-green-100" : ""}
                    >
                      Small (10)
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setValue('maxParticipants', 50)}
                      className={watchedValues.maxParticipants === 50 ? "bg-green-100" : ""}
                    >
                      Medium (50)
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setValue('maxParticipants', 100)}
                      className={watchedValues.maxParticipants === 100 ? "bg-green-100" : ""}
                    >
                      Large (100)
                    </Button>
                  </div>
                </div>
              </div>

              {/* Duration */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <Label className="text-sm font-medium flex items-center gap-2 mb-2">
                  <Mic className="h-4 w-4" />
                  Duration: {watchedValues.duration} minutes
                </Label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setValue('duration', 30)}
                      className={watchedValues.duration === 30 ? "bg-green-100" : ""}
                    >
                      30min
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setValue('duration', 60)}
                      className={watchedValues.duration === 60 ? "bg-green-100" : ""}
                    >
                      1hr
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setValue('duration', 120)}
                      className={watchedValues.duration === 120 ? "bg-green-100" : ""}
                    >
                      2hr
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Instant Live Features */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-700 flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4" />
                Instant Live Features
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-700">
                <div className="flex items-center gap-2">
                  <span className="text-green-500">•</span>
                  <span>🎤 Go live immediately - no waiting!</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-500">•</span>
                  <span>🔗 Share link instantly with anyone</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-500">•</span>
                  <span>🎯 Perfect for impromptu discussions</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-500">•</span>
                  <span>🛡️ Built-in AI moderation & safety</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-500">•</span>
                  <span>📱 Works on all devices</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-500">•</span>
                  <span>🎙️ Voice modulation available</span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isCreating}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02]"
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

            <p className="text-xs text-center text-gray-500">
              Your session will be live immediately and accessible to anyone with the link
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default InstantLiveAudioCreator;