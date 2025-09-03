import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { 
  Calendar as CalendarIcon,
  Clock,
  Users, 
  Mic, 
  Share2,
  CheckSquare,
  Star
} from 'lucide-react';
import { format, addDays, startOfTomorrow } from 'date-fns';
import { FlagshipSanctuaryApi } from '@/services/flagshipSanctuaryApi';

interface ScheduledLiveAudioFormData {
  topic: string;
  description?: string;
  emoji: string;
  scheduledDate: Date;
  scheduledTime: string;
  duration: number;
  maxParticipants: number;
  timezone: string;
}

const ScheduledLiveAudioCreatorEnhanced: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);

  const { register, handleSubmit, control, formState: { errors }, watch, setValue } = useForm<ScheduledLiveAudioFormData>({
    defaultValues: {
      topic: '',
      description: '',
      emoji: '📅',
      scheduledDate: startOfTomorrow(),
      scheduledTime: '19:00', // 7 PM
      duration: 60,
      maxParticipants: 50,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    },
  });

  const watchedValues = watch();

  const onSubmit = async (data: ScheduledLiveAudioFormData) => {
    setIsCreating(true);
    
    try {
      console.log('📅 Creating scheduled live audio session:', data);
      
      // Combine date and time
      const [hours, minutes] = data.scheduledTime.split(':').map(Number);
      const scheduledDateTime = new Date(data.scheduledDate);
      scheduledDateTime.setHours(hours, minutes, 0, 0);
      
      const response = await FlagshipSanctuaryApi.scheduleSession({
        topic: data.topic,
        description: data.description,
        emoji: data.emoji,
        scheduledDateTime: scheduledDateTime.toISOString(),
        duration: data.duration,
        maxParticipants: data.maxParticipants,
        timezone: data.timezone,
        accessType: 'public',
        voiceModulationEnabled: true,
        moderationEnabled: true,
        recordingEnabled: false,
        allowAnonymous: true,
        tags: ['scheduled', 'live-audio'],
        category: 'support'
      });

      console.log('📡 Scheduled session creation response:', response);

      if (response.success && response.data) {
        toast({
          title: '📅 Session Scheduled!',
          description: `Your session "${data.topic}" is scheduled for ${format(scheduledDateTime, 'PPP p')}`,
        });

        // Navigate to the scheduled session (will show waiting room)
        navigate(`/flagship-sanctuary/${response.data.id}?role=host&scheduled=true`);
      } else {
        throw new Error(response.error || 'Failed to schedule live audio session');
      }
    } catch (error: any) {
      console.error('❌ Scheduled live audio creation failed:', error);
      
      toast({
        title: 'Failed to schedule session',
        description: error.message || 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const emojiOptions = ['📅', '⏰', '🎙️', '💭', '❤️', '🤝', '🌟', '🙏', '✨', '🌈'];

  // Quick date presets
  const quickDates = [
    { label: 'Tomorrow', date: addDays(new Date(), 1) },
    { label: 'This Weekend', date: addDays(new Date(), 7 - new Date().getDay()) },
    { label: 'Next Monday', date: addDays(new Date(), (8 - new Date().getDay()) % 7) },
    { label: 'Next Week', date: addDays(new Date(), 7) }
  ];

  const timeOptions = [
    '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', 
    '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'
  ];

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card className="border-blue-200 shadow-lg bg-gradient-to-b from-blue-50 to-white">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="text-6xl animate-bounce">📅</div>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-blue-500 text-white">
                <Clock className="h-3 w-3 mr-1" />
                Scheduled
              </Badge>
              <Badge variant="outline" className="border-blue-300">
                <Share2 className="h-3 w-3 mr-1" />
                Pre-register
              </Badge>
            </div>
          </div>
          <CardTitle className="text-2xl text-blue-700 flex items-center justify-center gap-2">
            <CalendarIcon className="h-6 w-6" />
            Schedule Live Audio Session
          </CardTitle>
          <p className="text-gray-600">
            Plan ahead! Let participants register and get reminders before your session starts
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Topic */}
            <div>
              <Label htmlFor="topic" className="text-sm font-medium">
                Session Topic *
              </Label>
              <Input
                id="topic"
                {...register('topic', { 
                  required: 'Topic is required',
                  minLength: { value: 5, message: 'Topic must be at least 5 characters' }
                })}
                placeholder="e.g., Evening Mental Health Circle, Weekend Career Chat..."
                className="mt-1"
              />
              {errors.topic && (
                <p className="text-red-500 text-sm mt-1">{errors.topic.message}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description" className="text-sm font-medium">
                Session Description (Optional)
              </Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Describe what participants can expect, topics you'll cover, or guidelines..."
                className="mt-1"
                rows={3}
              />
            </div>

            {/* Emoji */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Session Icon</Label>
              <div className="flex flex-wrap gap-2">
                {emojiOptions.map(emoji => (
                  <Button
                    key={emoji}
                    type="button"
                    variant={watchedValues.emoji === emoji ? "default" : "outline"}
                    className={`h-12 w-12 p-0 text-xl hover:scale-110 transition-transform ${
                      watchedValues.emoji === emoji ? "bg-blue-500 text-white shadow-lg" : ""
                    }`}
                    onClick={() => setValue('emoji', emoji)}
                  >
                    {emoji}
                  </Button>
                ))}
              </div>
            </div>

            {/* Date & Time Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Date Selection */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Select Date</Label>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    {quickDates.map(({ label, date }) => (
                      <Button
                        key={label}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setValue('scheduledDate', date)}
                        className={format(watchedValues.scheduledDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd') ? "bg-blue-100" : ""}
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                  <Controller
                    name="scheduledDate"
                    control={control}
                    render={({ field }) => (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {format(field.value, 'PPP')}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => date && field.onChange(date)}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    )}
                  />
                </div>
              </div>

              {/* Time Selection */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Select Time</Label>
                <div className="grid grid-cols-3 gap-2">
                  {timeOptions.map(time => (
                    <Button
                      key={time}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setValue('scheduledTime', time)}
                      className={watchedValues.scheduledTime === time ? "bg-blue-100" : ""}
                    >
                      {time}
                    </Button>
                  ))}
                </div>
                <Input
                  type="time"
                  {...register('scheduledTime')}
                  className="mt-2"
                />
              </div>
            </div>

            {/* Session Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <Label className="text-sm font-medium flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4" />
                  Max Participants: {watchedValues.maxParticipants}
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {[25, 50, 100].map(count => (
                    <Button
                      key={count}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setValue('maxParticipants', count)}
                      className={watchedValues.maxParticipants === count ? "bg-blue-100" : ""}
                    >
                      {count}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <Label className="text-sm font-medium flex items-center gap-2 mb-2">
                  <Mic className="h-4 w-4" />
                  Duration: {watchedValues.duration} minutes
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {[60, 90, 120].map(duration => (
                    <Button
                      key={duration}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setValue('duration', duration)}
                      className={watchedValues.duration === duration ? "bg-blue-100" : ""}
                    >
                      {duration}m
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Scheduled Features */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-700 flex items-center gap-2 mb-2">
                <Star className="h-4 w-4" />
                Scheduled Session Benefits
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-700">
                <div className="flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 text-blue-500" />
                  <span>Participants can pre-register</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 text-blue-500" />
                  <span>Automatic reminder notifications</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 text-blue-500" />
                  <span>Waiting room before session starts</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 text-blue-500" />
                  <span>Better attendance & engagement</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 text-blue-500" />
                  <span>Host can prepare in advance</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 text-blue-500" />
                  <span>Session analytics & feedback</span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isCreating}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02]"
            >
              {isCreating ? (
                <>
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Scheduling Session...
                </>
              ) : (
                <>
                  <CalendarIcon className="h-5 w-5 mr-2" />
                  📅 Schedule Live Audio Session
                </>
              )}
            </Button>

            <p className="text-xs text-center text-gray-500">
              Participants will be able to register and receive reminders for your scheduled session
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ScheduledLiveAudioCreatorEnhanced;