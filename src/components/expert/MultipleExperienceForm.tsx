import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, X, Calendar as CalendarIcon, Briefcase } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface WorkExperience {
  id: string;
  jobTitle: string;
  company: string;
  location: string;
  startDate: Date | undefined;
  endDate: Date | undefined;
  isCurrent: boolean;
  description: string;
}

interface MultipleExperienceFormProps {
  experiences: WorkExperience[];
  onChange: (experiences: WorkExperience[]) => void;
  className?: string;
}

export function MultipleExperienceForm({ 
  experiences, 
  onChange, 
  className 
}: MultipleExperienceFormProps) {
  const addExperience = () => {
    const newExperience: WorkExperience = {
      id: `exp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      jobTitle: '',
      company: '',
      location: '',
      startDate: undefined,
      endDate: undefined,
      isCurrent: false,
      description: ''
    };
    onChange([...experiences, newExperience]);
  };

  const removeExperience = (id: string) => {
    if (experiences.length > 1) {
      onChange(experiences.filter(exp => exp.id !== id));
    }
  };

  const updateExperience = (id: string, field: keyof WorkExperience, value: any) => {
    onChange(experiences.map(exp => 
      exp.id === id ? { ...exp, [field]: value } : exp
    ));
  };

  const handleCurrentToggle = (id: string, isCurrent: boolean) => {
    updateExperience(id, 'isCurrent', isCurrent);
    if (isCurrent) {
      updateExperience(id, 'endDate', undefined);
    }
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Work Experience
          </CardTitle>
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={addExperience}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Experience
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {experiences.map((experience, index) => (
          <div key={experience.id} className="border rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">Experience {index + 1}</h4>
              {experiences.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeExperience(experience.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Job Title *</Label>
                <Input
                  placeholder="e.g., Senior Mental Health Counselor"
                  value={experience.jobTitle}
                  onChange={(e) => updateExperience(experience.id, 'jobTitle', e.target.value)}
                />
              </div>
              <div>
                <Label>Company/Organization *</Label>
                <Input
                  placeholder="e.g., Wellness Center Inc."
                  value={experience.company}
                  onChange={(e) => updateExperience(experience.id, 'company', e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label>Location</Label>
              <Input
                placeholder="e.g., New York, NY"
                value={experience.location}
                onChange={(e) => updateExperience(experience.id, 'location', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Start Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !experience.startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {experience.startDate ? format(experience.startDate, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 pointer-events-auto">
                    <Calendar
                      mode="single"
                      selected={experience.startDate}
                      onSelect={(date) => updateExperience(experience.id, 'startDate', date)}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      disabled={experience.isCurrent}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        (!experience.endDate || experience.isCurrent) && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {experience.isCurrent 
                        ? "Current" 
                        : experience.endDate 
                          ? format(experience.endDate, "PPP") 
                          : "Select date"
                      }
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 pointer-events-auto">
                    <Calendar
                      mode="single"
                      selected={experience.endDate}
                      onSelect={(date) => updateExperience(experience.id, 'endDate', date)}
                      initialFocus
                      disabled={experience.isCurrent}
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex items-center space-x-2 pt-6">
                <Switch
                  id={`current-${experience.id}`}
                  checked={experience.isCurrent}
                  onCheckedChange={(checked) => handleCurrentToggle(experience.id, checked)}
                />
                <Label htmlFor={`current-${experience.id}`} className="text-sm">
                  Current position
                </Label>
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                placeholder="Describe your responsibilities, achievements, and key contributions in this role..."
                value={experience.description}
                onChange={(e) => updateExperience(experience.id, 'description', e.target.value)}
                rows={3}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}