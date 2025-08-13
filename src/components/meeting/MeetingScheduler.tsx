import React, { useState, useEffect } from 'react';
import { format, addDays, setHours, setMinutes } from 'date-fns';
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, Clock, Video, Mic, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface MeetingSchedulerProps {
  sessionId: string;
  expertId: string;
  expertName: string;
  onMeetingScheduled: (meeting: any) => void;
  onCancel: () => void;
}

const timeSlots = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30'
];

const meetingTypes = [
  { value: 'video', label: 'Video Call', icon: Video, description: 'Face-to-face conversation with video' },
  { value: 'voice', label: 'Voice Call', icon: Mic, description: 'Audio-only conversation' },
  { value: 'chat', label: 'Text Chat', icon: MessageSquare, description: 'Written conversation' }
];

const durations = [
  { value: 30, label: '30 minutes' },
  { value: 45, label: '45 minutes' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' }
];

export const MeetingScheduler: React.FC<MeetingSchedulerProps> = ({
  sessionId,
  expertId,
  expertName,
  onMeetingScheduled,
  onCancel
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedDuration, setSelectedDuration] = useState<number>(60);
  const [meetingType, setMeetingType] = useState<string>('video');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [timezone, setTimezone] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Get user's timezone
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setTimezone(userTimezone);
    
    // Set default title
    setTitle(`Session with ${expertName}`);
  }, [expertName]);

  const handleScheduleMeeting = async () => {
    if (!selectedDate || !selectedTime || !title) {
      toast({
        title: "Incomplete Information",
        description: "Please select date, time, and provide a title",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Parse time and create datetime
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const scheduledDateTime = setMinutes(setHours(selectedDate, hours), minutes);
      
      // Convert to ISO string for API
      const scheduledTime = scheduledDateTime.toISOString();

      const response = await fetch('/api/meetings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          sessionId,
          expertId,
          title,
          description,
          scheduledTime,
          duration: selectedDuration,
          timezone,
          meetingType
        })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Meeting Scheduled",
          description: `Your ${meetingType} session is scheduled for ${format(scheduledDateTime, 'PPP')} at ${selectedTime}`
        });
        onMeetingScheduled(data.data);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error scheduling meeting:', error);
      toast({
        title: "Scheduling Failed",
        description: error.message || "Failed to schedule meeting",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const disabledDates = (date: Date) => {
    // Disable past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const selectedMeetingType = meetingTypes.find(type => type.value === meetingType);

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          Schedule Meeting with {expertName}
        </CardTitle>
        <CardDescription>
          Choose your preferred date, time, and meeting format
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Meeting Type Selection */}
        <div className="space-y-3">
          <Label>Meeting Type</Label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {meetingTypes.map((type) => {
              const Icon = type.icon;
              return (
                <div
                  key={type.value}
                  className={cn(
                    "p-4 border rounded-lg cursor-pointer transition-all hover:border-primary",
                    meetingType === type.value && "border-primary bg-primary/5"
                  )}
                  onClick={() => setMeetingType(type.value)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="h-4 w-4" />
                    <span className="font-medium">{type.label}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{type.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Date Selection */}
        <div className="space-y-3">
          <Label>Select Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={disabledDates}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Time Selection */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <Label>Select Time</Label>
            <Select value={selectedTime} onValueChange={setSelectedTime}>
              <SelectTrigger>
                <SelectValue placeholder="Choose time">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {selectedTime || "Select time"}
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {timeSlots.map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Duration</Label>
            <Select value={selectedDuration.toString()} onValueChange={(value) => setSelectedDuration(Number(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {durations.map((duration) => (
                  <SelectItem key={duration.value} value={duration.value.toString()}>
                    {duration.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Meeting Details */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Meeting Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter meeting title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add any notes or agenda items..."
              rows={3}
            />
          </div>
        </div>

        {/* Timezone Display */}
        <div className="bg-muted/50 p-3 rounded-lg">
          <p className="text-sm text-muted-foreground">
            Meeting will be scheduled in your timezone: <span className="font-medium">{timezone}</span>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleScheduleMeeting}
            disabled={loading || !selectedDate || !selectedTime || !title}
            className="flex-1"
          >
            {loading ? 'Scheduling...' : 'Schedule Meeting'}
          </Button>
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};