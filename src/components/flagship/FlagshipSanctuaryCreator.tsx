import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, addHours, addDays } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { useFlagshipSanctuary } from '@/hooks/useFlagshipSanctuary';
import {
  Calendar as CalendarIcon,
  Clock,
  Users,
  Shield,
  Mic,
  Eye,
  Link2,
  Sparkles,
  Settings,
  Lock,
  Globe,
  Timer,
  BookOpen,
  AlertTriangle,
  Headphones
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CreateFlagshipSanctuaryRequest } from '@/types/flagship-sanctuary';

interface FlagshipSanctuaryCreatorProps {
  onClose?: () => void;
}

const SANCTUARY_EMOJIS = [
  '🏛️', '🕊️', '🌅', '🌸', '🍃', '💎', '🌟', '🔮',
  '🦋', '🌺', '🍀', '🌙', '✨', '🌈', '🕯️', '🪷'
];

const CATEGORIES = [
  { value: 'support', label: 'Emotional Support', icon: '💚' },
  { value: 'wellness', label: 'Wellness & Mindfulness', icon: '🧘' },
  { value: 'discussion', label: 'Open Discussion', icon: '💬' },
  { value: 'education', label: 'Educational', icon: '📚' },
  { value: 'social', label: 'Social Connection', icon: '🤝' },
  { value: 'crisis', label: 'Crisis Support', icon: '🆘' },
  { value: 'other', label: 'Other', icon: '💫' }
];

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'ar', label: 'Arabic' },
  { value: 'zh', label: 'Chinese' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' }
];

const DURATIONS = [
  { value: 30, label: '30 minutes' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' },
  { value: 180, label: '3 hours' },
  { value: 240, label: '4 hours' }
];

export const FlagshipSanctuaryCreator: React.FC<FlagshipSanctuaryCreatorProps> = ({
  onClose
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { createSession } = useFlagshipSanctuary();
  
  const [step, setStep] = useState(1);
  const [isScheduled, setIsScheduled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form Data
  const [formData, setFormData] = useState<CreateFlagshipSanctuaryRequest>({
    topic: '',
    description: '',
    emoji: '🏛️',
    maxParticipants: 20,
    allowAnonymous: true,
    audioOnly: true,
    moderationEnabled: true,
    emergencyContactEnabled: true,
    recordingEnabled: false,
    voiceModulationEnabled: true,
    accessType: 'public',
    moderationLevel: 'medium',
    tags: [],
    category: 'support',
    language: 'en',
    duration: 60
  });
  
  const [scheduledDate, setScheduledDate] = useState<Date>();
  const [scheduledTime, setScheduledTime] = useState('');
  const [timezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);

  const updateFormData = (updates: Partial<CreateFlagshipSanctuaryRequest>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const addTag = (tag: string) => {
    if (tag.trim() && formData.tags && !formData.tags.includes(tag.trim())) {
      updateFormData({
        tags: [...(formData.tags || []), tag.trim()]
      });
    }
  };

  const removeTag = (tagToRemove: string) => {
    updateFormData({
      tags: formData.tags?.filter(tag => tag !== tagToRemove) || []
    });
  };

  const handleSubmit = async () => {
    if (!formData.topic.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please provide a topic for your sanctuary',
        variant: 'destructive'
      });
      return;
    }

    if (isScheduled && (!scheduledDate || !scheduledTime)) {
      toast({
        title: 'Missing Schedule',
        description: 'Please set the date and time for your scheduled sanctuary',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);

    try {
      const sessionData = { ...formData };

      // Add scheduling information
      if (isScheduled && scheduledDate && scheduledTime) {
        const [hours, minutes] = scheduledTime.split(':').map(Number);
        const scheduledDateTime = new Date(scheduledDate);
        scheduledDateTime.setHours(hours, minutes, 0, 0);
        
        sessionData.scheduledDateTime = scheduledDateTime.toISOString();
        sessionData.timezone = timezone;
      }

      const session = await createSession(sessionData);
      
      if (session) {
        toast({
          title: 'Sanctuary Created',
          description: isScheduled 
            ? 'Your scheduled sanctuary has been created successfully' 
            : 'Your sanctuary is now live and ready for participants',
        });

        // Navigate to the session
        navigate(`/flagship-sanctuary/${session.id}${session.hostToken ? `?role=host&token=${session.hostToken}` : ''}`);
        onClose?.();
      }
    } catch (error: any) {
      toast({
        title: 'Creation Failed',
        description: error.message || 'Failed to create sanctuary',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      {/* Sanctuary Type */}
      <div className="grid grid-cols-2 gap-4">
        <Card 
          className={cn(
            "cursor-pointer transition-all hover:shadow-md",
            !isScheduled && "border-primary bg-primary/5"
          )}
          onClick={() => setIsScheduled(false)}
        >
          <CardContent className="flex flex-col items-center p-6 text-center">
            <Sparkles className="h-8 w-8 mb-3 text-primary" />
            <h3 className="font-semibold mb-2">Start Now</h3>
            <p className="text-sm text-muted-foreground">Create and launch immediately</p>
          </CardContent>
        </Card>

        <Card 
          className={cn(
            "cursor-pointer transition-all hover:shadow-md",
            isScheduled && "border-primary bg-primary/5"
          )}
          onClick={() => setIsScheduled(true)}
        >
          <CardContent className="flex flex-col items-center p-6 text-center">
            <Clock className="h-8 w-8 mb-3 text-primary" />
            <h3 className="font-semibold mb-2">Schedule</h3>
            <p className="text-sm text-muted-foreground">Set for a future date & time</p>
          </CardContent>
        </Card>
      </div>

      {/* Basic Information */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="topic">Sanctuary Topic *</Label>
          <Input
            id="topic"
            placeholder="e.g., Anxiety Support Circle, Grief Healing Space"
            value={formData.topic}
            onChange={(e) => updateFormData({ topic: e.target.value })}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="description">Description (Optional)</Label>
          <Textarea
            id="description"
            placeholder="Describe what participants can expect in this sanctuary..."
            value={formData.description}
            onChange={(e) => updateFormData({ description: e.target.value })}
            rows={3}
            className="mt-1"
          />
        </div>

        {/* Emoji Selection */}
        <div>
          <Label>Sanctuary Icon</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {SANCTUARY_EMOJIS.map((emoji) => (
              <Button
                key={emoji}
                variant={formData.emoji === emoji ? "default" : "outline"}
                size="sm"
                onClick={() => updateFormData({ emoji })}
                className="text-lg"
              >
                {emoji}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Scheduling (if selected) */}
      {isScheduled && (
        <Card className="bg-muted/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarIcon className="h-5 w-5" />
              Schedule Your Sanctuary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal mt-1",
                        !scheduledDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {scheduledDate ? format(scheduledDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={scheduledDate}
                      onSelect={setScheduledDate}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="duration">Duration</Label>
              <Select value={formData.duration?.toString()} onValueChange={(value) => updateFormData({ duration: Number(value) })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURATIONS.map((duration) => (
                    <SelectItem key={duration.value} value={duration.value.toString()}>
                      {duration.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="text-sm text-muted-foreground bg-background p-3 rounded-lg">
              <strong>Your timezone:</strong> {timezone}
              {scheduledDate && scheduledTime && (
                <div className="mt-1">
                  <strong>Scheduled for:</strong> {format(scheduledDate, 'MMM d, yyyy')} at {scheduledTime}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      {/* Category & Language */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Category</Label>
          <Select value={formData.category} onValueChange={(value) => updateFormData({ category: value })}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((category) => (
                <SelectItem key={category.value} value={category.value}>
                  <div className="flex items-center gap-2">
                    <span>{category.icon}</span>
                    {category.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Language</Label>
          <Select value={formData.language} onValueChange={(value) => updateFormData({ language: value })}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((language) => (
                <SelectItem key={language.value} value={language.value}>
                  {language.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tags */}
      <div>
        <Label>Tags (Optional)</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {formData.tags?.map((tag) => (
            <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
              {tag} ×
            </Badge>
          ))}
        </div>
        <Input
          placeholder="Add tags (press Enter)"
          className="mt-2"
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              addTag(e.currentTarget.value);
              e.currentTarget.value = '';
            }
          }}
        />
      </div>

      {/* Access Control */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lock className="h-5 w-5" />
            Access & Privacy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Access Type</Label>
            <Select value={formData.accessType} onValueChange={(value: any) => updateFormData({ accessType: value })}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Public - Anyone can join
                  </div>
                </SelectItem>
                <SelectItem value="link_only">
                  <div className="flex items-center gap-2">
                    <Link2 className="h-4 w-4" />
                    Link Only - Join via invitation link
                  </div>
                </SelectItem>
                <SelectItem value="invite_only">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Invite Only - Host approval required
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="anonymous">Allow Anonymous Participants</Label>
            <Switch
              id="anonymous"
              checked={formData.allowAnonymous}
              onCheckedChange={(checked) => updateFormData({ allowAnonymous: checked })}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      {/* Capacity */}
      <div>
        <Label htmlFor="capacity">Maximum Participants</Label>
        <Select value={formData.maxParticipants?.toString()} onValueChange={(value) => updateFormData({ maxParticipants: Number(value) })}>
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[5, 10, 15, 20, 25, 30, 40, 50].map((num) => (
              <SelectItem key={num} value={num.toString()}>
                {num} participants
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Settings className="h-5 w-5" />
            Features & Safety
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Headphones className="h-4 w-4" />
              <Label htmlFor="voice-modulation">Voice Modulation</Label>
            </div>
            <Switch
              id="voice-modulation"
              checked={formData.voiceModulationEnabled}
              onCheckedChange={(checked) => updateFormData({ voiceModulationEnabled: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <Label htmlFor="moderation">AI Moderation</Label>
            </div>
            <Switch
              id="moderation"
              checked={formData.moderationEnabled}
              onCheckedChange={(checked) => updateFormData({ moderationEnabled: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <Label htmlFor="emergency">Emergency Protocols</Label>
            </div>
            <Switch
              id="emergency"
              checked={formData.emergencyContactEnabled}
              onCheckedChange={(checked) => updateFormData({ emergencyContactEnabled: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mic className="h-4 w-4" />
              <Label htmlFor="recording">Session Recording</Label>
            </div>
            <Switch
              id="recording"
              checked={formData.recordingEnabled}
              onCheckedChange={(checked) => updateFormData({ recordingEnabled: checked })}
            />
          </div>

          {formData.moderationEnabled && (
            <div>
              <Label>Moderation Level</Label>
              <Select value={formData.moderationLevel} onValueChange={(value: any) => updateFormData({ moderationLevel: value })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low - Basic filtering</SelectItem>
                  <SelectItem value="medium">Medium - Balanced approach</SelectItem>
                  <SelectItem value="high">High - Strict monitoring</SelectItem>
                  <SelectItem value="strict">Strict - Maximum protection</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="text-lg">Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{formData.emoji}</span>
              <span className="font-semibold">{formData.topic}</span>
            </div>
            <div className="text-muted-foreground">
              {CATEGORIES.find(c => c.value === formData.category)?.label} • {LANGUAGES.find(l => l.value === formData.language)?.label}
            </div>
            <div className="flex items-center gap-4 text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                Up to {formData.maxParticipants}
              </span>
              <span className="flex items-center gap-1">
                <Timer className="h-4 w-4" />
                {formData.duration} min
              </span>
            </div>
            {isScheduled && scheduledDate && scheduledTime && (
              <div className="text-muted-foreground">
                Scheduled for {format(scheduledDate, 'MMM d, yyyy')} at {scheduledTime}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Create Flagship Sanctuary
          </CardTitle>
          
          {/* Step Indicator */}
          <div className="flex items-center gap-2 mt-4">
            {[1, 2, 3].map((stepNum) => (
              <React.Fragment key={stepNum}>
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                  step >= stepNum 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted text-muted-foreground"
                )}>
                  {stepNum}
                </div>
                {stepNum < 3 && (
                  <div className={cn(
                    "flex-1 h-0.5",
                    step > stepNum ? "bg-primary" : "bg-muted"
                  )} />
                )}
              </React.Fragment>
            ))}
          </div>
          
          <div className="text-sm text-muted-foreground mt-2">
            Step {step} of 3: {
              step === 1 ? 'Basic Information' :
              step === 2 ? 'Access & Privacy' :
              'Features & Review'
            }
          </div>
        </CardHeader>

        <CardContent>
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}

          <Separator className="my-6" />

          {/* Navigation */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => step === 1 ? onClose?.() : setStep(step - 1)}
              disabled={isLoading}
            >
              {step === 1 ? 'Cancel' : 'Previous'}
            </Button>

            <div className="flex gap-2">
              {step < 3 ? (
                <Button
                  onClick={() => setStep(step + 1)}
                  disabled={!formData.topic.trim()}
                >
                  Next
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading || !formData.topic.trim()}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                      Creating...
                    </>
                  ) : (
                    isScheduled ? 'Schedule Sanctuary' : 'Create & Launch'
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};