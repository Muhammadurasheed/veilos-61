import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, addDays, addHours, isAfter } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/optimized/AuthContextRefactored';
import { LiveAudioApi } from '@/services/liveAudioApi';
import { cn } from '@/lib/utils';
import { CalendarIcon, Clock, Users, Mic, Settings, Calendar as CalendarLucide } from 'lucide-react';

const scheduledSessionSchema = z.object({
  topic: z.string().min(3, 'Topic must be at least 3 characters').max(100, 'Topic too long'),
  description: z.string().optional(),
  emoji: z.string().default('🎙️'),
  scheduledDateTime: z.date({
    required_error: 'Please select a date and time.',
  }).refine((date) => isAfter(date, new Date()), {
    message: "Scheduled time must be in the future",
  }),
  duration: z.string().min(1, 'Please select duration'),
  maxParticipants: z.number().min(2).max(200).default(50),
  allowAnonymous: z.boolean().default(true),
  moderationLevel: z.enum(['low', 'medium', 'high']).default('medium'),
  emergencyProtocols: z.boolean().default(true),
  aiMonitoring: z.boolean().default(true),
  isRecorded: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  language: z.string().default('en'),
});

type ScheduledSessionFormValues = z.infer<typeof scheduledSessionSchema>;

interface ScheduledLiveAudioCreatorProps {
  onSessionCreated?: (sessionId: string) => void;
  onCancel?: () => void;
}

export const ScheduledLiveAudioCreator = ({ 
  onSessionCreated, 
  onCancel 
}: ScheduledLiveAudioCreatorProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [tagInput, setTagInput] = useState('');

  const form = useForm<ScheduledSessionFormValues>({
    resolver: zodResolver(scheduledSessionSchema),
    defaultValues: {
      emoji: '🎙️',
      duration: '60',
      maxParticipants: 50,
      allowAnonymous: true,
      moderationLevel: 'medium',
      emergencyProtocols: true,
      aiMonitoring: true,
      isRecorded: false,
      tags: [],
      language: 'en',
    },
  });

  const watchedTags = form.watch('tags');

  const generateTimeSlots = (selectedDate: Date) => {
    const slots = [];
    const now = new Date();
    
    // Generate slots from current time to end of day, then next day slots
    const startHour = selectedDate.toDateString() === now.toDateString() 
      ? Math.max(now.getHours() + 1, 8) // Next hour or 8 AM
      : 8;
    
    const endHour = selectedDate.toDateString() === now.toDateString() ? 23 : 22;
    
    for (let hour = startHour; hour <= endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const slotTime = new Date(selectedDate);
        slotTime.setHours(hour, minute, 0, 0);
        
        // Only show future slots
        if (slotTime > now) {
          slots.push({
            time: slotTime,
            label: format(slotTime, 'h:mm a'),
          });
        }
      }
    }
    
    return slots;
  };

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim().toLowerCase();
    if (trimmedTag && !watchedTags.includes(trimmedTag) && watchedTags.length < 5) {
      form.setValue('tags', [...watchedTags, trimmedTag]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    form.setValue('tags', watchedTags.filter(tag => tag !== tagToRemove));
  };

  const onSubmit = async (values: ScheduledSessionFormValues) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to create a scheduled session",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Calculate expiration time based on scheduled time + duration + buffer
      const durationMinutes = parseInt(values.duration);
      const expirationTime = new Date(values.scheduledDateTime);
      expirationTime.setMinutes(expirationTime.getMinutes() + durationMinutes + 30); // 30min buffer
      
      const response = await LiveAudioApi.createSession({
        topic: values.topic,
        description: values.description,
        emoji: values.emoji,
        maxParticipants: values.maxParticipants,
        audioOnly: true,
        allowAnonymous: values.allowAnonymous,
        moderationEnabled: values.moderationLevel !== 'low',
        emergencyContactEnabled: values.emergencyProtocols,
        expireHours: Math.ceil((expirationTime.getTime() - Date.now()) / (1000 * 60 * 60)),
        scheduledDateTime: values.scheduledDateTime,
        estimatedDuration: durationMinutes,
        tags: values.tags,
        language: values.language,
        moderationLevel: values.moderationLevel,
        aiMonitoring: values.aiMonitoring,
        isRecorded: values.isRecorded
      });

      if (response.success && response.data?.session?.id) {
        toast({
          title: "Session Scheduled Successfully!",
          description: `Your live audio session "${values.topic}" has been scheduled for ${format(values.scheduledDateTime, 'PPP p')}`,
        });

        // Store scheduled session info for tracking
        const scheduledSession = {
          id: response.data.session.id,
          topic: values.topic,
          scheduledDateTime: values.scheduledDateTime.toISOString(),
          hostToken: response.data.hostToken || response.data.session.hostToken,
          type: 'scheduled_live_audio',
          createdAt: new Date().toISOString()
        };

        const existingSessions = JSON.parse(localStorage.getItem('scheduled_sessions') || '[]');
        existingSessions.push(scheduledSession);
        localStorage.setItem('scheduled_sessions', JSON.stringify(existingSessions));

        onSessionCreated?.(response.data.session.id);
      } else {
        throw new Error(response.error || 'Failed to create scheduled session');
      }
    } catch (error: any) {
      console.error('Scheduled session creation error:', error);
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to schedule session. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const timeSlots = selectedDate ? generateTimeSlots(selectedDate) : [];

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <CalendarLucide className="h-5 w-5 mr-2" />
          Schedule Live Audio Session
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="topic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Session Topic</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Morning Mindfulness, Career Guidance..." 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="emoji"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Emoji</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="🎙️" 
                        maxLength={2}
                        className="text-center text-2xl"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe what this session will cover..."
                      className="resize-none"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Scheduling */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="scheduledDateTime"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Scheduled Date & Time</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP 'at' p")
                            ) : (
                              <span>Pick a date and time</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <div className="flex">
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            disabled={(date) =>
                              date < new Date() || date < addDays(new Date(), -1)
                            }
                            initialFocus
                            className="pointer-events-auto"
                          />
                          {selectedDate && (
                            <div className="border-l p-4">
                              <h4 className="font-medium mb-3">Available Times</h4>
                              <div className="space-y-2 max-h-64 overflow-y-auto">
                                {timeSlots.map((slot) => (
                                  <Button
                                    key={slot.label}
                                    variant={field.value && format(field.value, 'h:mm a') === slot.label ? "default" : "outline"}
                                    size="sm"
                                    className="w-full justify-start"
                                    onClick={() => field.onChange(slot.time)}
                                  >
                                    <Clock className="h-4 w-4 mr-2" />
                                    {slot.label}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="45">45 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="90">1.5 hours</SelectItem>
                        <SelectItem value="120">2 hours</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Session Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="maxParticipants"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Participants</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="2" 
                        max="200"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="moderationLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Moderation Level</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low - Minimal moderation</SelectItem>
                        <SelectItem value="medium">Medium - Balanced</SelectItem>
                        <SelectItem value="high">High - Strict moderation</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label>Tags (Optional, max 5)</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {watchedTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Add a tag..."
                  maxLength={20}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag(tagInput);
                    }
                  }}
                  disabled={watchedTags.length >= 5}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addTag(tagInput)}
                  disabled={!tagInput.trim() || watchedTags.length >= 5}
                >
                  Add
                </Button>
              </div>
            </div>

            {/* Toggle Options */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="allowAnonymous"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Allow Anonymous Users</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Let users join without creating an account
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="emergencyProtocols"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Emergency Protocols</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Enable emergency alert system
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="aiMonitoring"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">AI Monitoring</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Automated content moderation
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isRecorded"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Record Session</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Save audio for later review (requires participant consent)
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Actions */}
            <div className="flex space-x-4 pt-4">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                  Cancel
                </Button>
              )}
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4 mr-2" />
                    Schedule Session
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};