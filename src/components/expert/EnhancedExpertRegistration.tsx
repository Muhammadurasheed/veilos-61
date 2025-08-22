import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CountryPicker } from '@/components/ui/CountryPicker';
import { CityPicker } from '@/components/ui/LocationPicker';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Calendar as CalendarIcon, Plus, X, MapPin, Clock, Upload, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { apiRequest } from '@/services/api';

interface WorkExperience {
  id: string;
  title: string;
  company: string;
  location: string;
  startDate: Date | null;
  endDate: Date | null;
  current: boolean;
  description: string;
}

interface Education {
  id: string;
  degree: string;
  institution: string;
  location: string;
  graduationYear: string;
  field: string;
}

interface Certification {
  id: string;
  name: string;
  issuer: string;
  dateObtained: Date | null;
  expiryDate: Date | null;
  credentialId: string;
}

interface Availability {
  day: string;
  startTime: string;
  endTime: string;
  enabled: boolean;
}

const COUNTRIES = [
  'United States', 'Canada', 'United Kingdom', 'Australia', 'Germany', 
  'France', 'Spain', 'Italy', 'Netherlands', 'Belgium', 'Switzerland',
  'Sweden', 'Norway', 'Denmark', 'Finland', 'Japan', 'South Korea',
  'Singapore', 'New Zealand', 'Ireland', 'Austria', 'Portugal'
];

const SPECIALIZATIONS = [
  'Clinical Psychology', 'Counseling Psychology', 'Social Work', 
  'Marriage & Family Therapy', 'Addiction Counseling', 'Child Psychology',
  'Trauma Therapy', 'Cognitive Behavioral Therapy', 'EMDR Therapy',
  'Anxiety & Depression', 'ADHD & Learning Disorders', 'Eating Disorders',
  'Grief Counseling', 'Career Counseling', 'Life Coaching'
];

const DAYS_OF_WEEK = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

const TIMEZONES = [
  'UTC-08:00 (PST)', 'UTC-07:00 (MST)', 'UTC-06:00 (CST)', 'UTC-05:00 (EST)',
  'UTC+00:00 (GMT)', 'UTC+01:00 (CET)', 'UTC+02:00 (EET)', 'UTC+09:00 (JST)'
];

const EnhancedExpertRegistration = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Basic Information
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    country: '',
    city: '',
    timezone: '',
    specialization: '',
    bio: '',
    voiceMasking: false,
    skills: [] as string[],
    languages: [] as string[]
  });

  // Professional Background
  const [workExperience, setWorkExperience] = useState<WorkExperience[]>([
    {
      id: '1',
      title: '',
      company: '',
      location: '',
      startDate: null,
      endDate: null,
      current: false,
      description: ''
    }
  ]);

  const [education, setEducation] = useState<Education[]>([
    {
      id: '1',
      degree: '',
      institution: '',
      location: '',
      graduationYear: '',
      field: ''
    }
  ]);

  const [certifications, setCertifications] = useState<Certification[]>([]);
  
  // Availability
  const [availability, setAvailability] = useState<Availability[]>(
    DAYS_OF_WEEK.map(day => ({
      day,
      startTime: '09:00',
      endTime: '17:00',
      enabled: day !== 'Saturday' && day !== 'Sunday'
    }))
  );

  // Document uploads
  const [documents, setDocuments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Skill management
  const [newSkill, setNewSkill] = useState('');
  const [newLanguage, setNewLanguage] = useState('');

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
  };

  const addLanguage = () => {
    if (newLanguage.trim() && !formData.languages.includes(newLanguage.trim())) {
      setFormData(prev => ({
        ...prev,
        languages: [...prev.languages, newLanguage.trim()]
      }));
      setNewLanguage('');
    }
  };

  const removeLanguage = (language: string) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.filter(l => l !== language)
    }));
  };

  // Work Experience Management
  const addWorkExperience = () => {
    const newExp: WorkExperience = {
      id: Date.now().toString(),
      title: '',
      company: '',
      location: '',
      startDate: null,
      endDate: null,
      current: false,
      description: ''
    };
    setWorkExperience(prev => [...prev, newExp]);
  };

  const updateWorkExperience = (id: string, field: keyof WorkExperience, value: any) => {
    setWorkExperience(prev => 
      prev.map(exp => 
        exp.id === id ? { ...exp, [field]: value } : exp
      )
    );
  };

  const removeWorkExperience = (id: string) => {
    if (workExperience.length > 1) {
      setWorkExperience(prev => prev.filter(exp => exp.id !== id));
    }
  };

  // Education Management
  const addEducation = () => {
    const newEd: Education = {
      id: Date.now().toString(),
      degree: '',
      institution: '',
      location: '',
      graduationYear: '',
      field: ''
    };
    setEducation(prev => [...prev, newEd]);
  };

  const updateEducation = (id: string, field: keyof Education, value: any) => {
    setEducation(prev => 
      prev.map(ed => 
        ed.id === id ? { ...ed, [field]: value } : ed
      )
    );
  };

  const removeEducation = (id: string) => {
    if (education.length > 1) {
      setEducation(prev => prev.filter(ed => ed.id !== id));
    }
  };

  // Certification Management
  const addCertification = () => {
    const newCert: Certification = {
      id: Date.now().toString(),
      name: '',
      issuer: '',
      dateObtained: null,
      expiryDate: null,
      credentialId: ''
    };
    setCertifications(prev => [...prev, newCert]);
  };

  const updateCertification = (id: string, field: keyof Certification, value: any) => {
    setCertifications(prev => 
      prev.map(cert => 
        cert.id === id ? { ...cert, [field]: value } : cert
      )
    );
  };

  const removeCertification = (id: string) => {
    setCertifications(prev => prev.filter(cert => cert.id !== id));
  };

  // Availability Management
  const updateAvailability = (day: string, field: keyof Availability, value: any) => {
    setAvailability(prev => 
      prev.map(avail => 
        avail.day === day ? { ...avail, [field]: value } : avail
      )
    );
  };

  // Document Management
  const handleDocumentUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setDocuments(prev => [...prev, ...Array.from(files)]);
    }
  };

  const removeDocument = (index: number) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Prepare form data for submission
      const submissionData = {
        ...formData,
        workExperience: workExperience.filter(exp => exp.title && exp.company),
        education: education.filter(ed => ed.degree && ed.institution),
        certifications: certifications.filter(cert => cert.name && cert.issuer),
        availability: availability.filter(avail => avail.enabled),
        documents: documents.map(doc => ({
          name: doc.name,
          type: doc.type,
          size: doc.size
        }))
      };

      const response = await apiRequest('POST', '/experts/register', submissionData);

      if (response.success) {
        toast({
          title: "Registration Submitted",
          description: "Your expert application has been submitted for review. You'll receive an email confirmation shortly.",
        });
        navigate('/expert-dashboard');
      } else {
        throw new Error(response.error || 'Registration failed');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: "Registration Failed",
        description: error.message || "Please check your information and try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Become a Veilo Expert</h1>
        <p className="text-muted-foreground">
          Join our network of verified professionals and help people on their journey to better mental health.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="country">Country *</Label>
                <CountryPicker
                  value={formData.country}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, country: value }))}
                  placeholder="Select country..."
                />
              </div>
              <div>
                <Label htmlFor="city">City *</Label>
                <CityPicker
                  value={formData.city}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, city: value }))}
                  placeholder="Select city..."
                />
              </div>
              <div>
                <Label htmlFor="timezone">Timezone *</Label>
                <Select onValueChange={(value) => setFormData(prev => ({ ...prev, timezone: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map(tz => (
                      <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="specialization">Primary Specialization *</Label>
              <Select onValueChange={(value) => setFormData(prev => ({ ...prev, specialization: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your specialization" />
                </SelectTrigger>
                <SelectContent>
                  {SPECIALIZATIONS.map(spec => (
                    <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="bio">Professional Bio *</Label>
              <Textarea
                id="bio"
                placeholder="Tell us about your background, experience, and approach to helping clients..."
                value={formData.bio}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                rows={4}
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="voiceMasking"
                checked={formData.voiceMasking}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, voiceMasking: checked }))}
              />
              <Label htmlFor="voiceMasking">Enable voice masking for anonymous sessions</Label>
            </div>
          </CardContent>
        </Card>

        {/* Skills and Languages */}
        <Card>
          <CardHeader>
            <CardTitle>Skills & Languages</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Professional Skills</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="Add a skill..."
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                />
                <Button type="button" onClick={addSkill} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.skills.map(skill => (
                  <Badge key={skill} variant="secondary" className="cursor-pointer" onClick={() => removeSkill(skill)}>
                    {skill} <X className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label>Languages Spoken</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="Add a language..."
                  value={newLanguage}
                  onChange={(e) => setNewLanguage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLanguage())}
                />
                <Button type="button" onClick={addLanguage} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.languages.map(language => (
                  <Badge key={language} variant="secondary" className="cursor-pointer" onClick={() => removeLanguage(language)}>
                    {language} <X className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Work Experience */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Work Experience</CardTitle>
              <Button type="button" onClick={addWorkExperience} size="sm">
                <Plus className="h-4 w-4 mr-1" /> Add Experience
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {workExperience.map((exp, index) => (
              <div key={exp.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-start">
                  <h4 className="font-medium">Experience {index + 1}</h4>
                  {workExperience.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeWorkExperience(exp.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Job Title *</Label>
                    <Input
                      value={exp.title}
                      onChange={(e) => updateWorkExperience(exp.id, 'title', e.target.value)}
                      placeholder="e.g., Clinical Psychologist"
                    />
                  </div>
                  <div>
                    <Label>Company/Organization *</Label>
                    <Input
                      value={exp.company}
                      onChange={(e) => updateWorkExperience(exp.id, 'company', e.target.value)}
                      placeholder="e.g., Health Center"
                    />
                  </div>
                </div>

                <div>
                  <Label>Location</Label>
                  <Input
                    value={exp.location}
                    onChange={(e) => updateWorkExperience(exp.id, 'location', e.target.value)}
                    placeholder="City, Country"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {exp.startDate ? format(exp.startDate, "MMM yyyy") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={exp.startDate || undefined}
                          onSelect={(date) => updateWorkExperience(exp.id, 'startDate', date)}
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
                          className="w-full justify-start text-left"
                          disabled={exp.current}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {exp.current ? "Present" : exp.endDate ? format(exp.endDate, "MMM yyyy") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={exp.endDate || undefined}
                          onSelect={(date) => updateWorkExperience(exp.id, 'endDate', date)}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={exp.current}
                    onCheckedChange={(checked) => updateWorkExperience(exp.id, 'current', checked)}
                  />
                  <Label>I currently work here</Label>
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={exp.description}
                    onChange={(e) => updateWorkExperience(exp.id, 'description', e.target.value)}
                    placeholder="Describe your responsibilities and achievements..."
                    rows={3}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Education */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Education</CardTitle>
              <Button type="button" onClick={addEducation} size="sm">
                <Plus className="h-4 w-4 mr-1" /> Add Education
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {education.map((ed, index) => (
              <div key={ed.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-start">
                  <h4 className="font-medium">Education {index + 1}</h4>
                  {education.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeEducation(ed.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Degree *</Label>
                    <Input
                      value={ed.degree}
                      onChange={(e) => updateEducation(ed.id, 'degree', e.target.value)}
                      placeholder="e.g., Ph.D. in Psychology"
                    />
                  </div>
                  <div>
                    <Label>Institution *</Label>
                    <Input
                      value={ed.institution}
                      onChange={(e) => updateEducation(ed.id, 'institution', e.target.value)}
                      placeholder="e.g., University of California"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Field of Study</Label>
                    <Input
                      value={ed.field}
                      onChange={(e) => updateEducation(ed.id, 'field', e.target.value)}
                      placeholder="e.g., Clinical Psychology"
                    />
                  </div>
                  <div>
                    <Label>Graduation Year</Label>
                    <Input
                      value={ed.graduationYear}
                      onChange={(e) => updateEducation(ed.id, 'graduationYear', e.target.value)}
                      placeholder="e.g., 2020"
                    />
                  </div>
                  <div>
                    <Label>Location</Label>
                    <Input
                      value={ed.location}
                      onChange={(e) => updateEducation(ed.id, 'location', e.target.value)}
                      placeholder="City, Country"
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Document Upload */}
        <Card>
          <CardHeader>
            <CardTitle>Professional Documents</CardTitle>
            <p className="text-sm text-muted-foreground">
              Upload your license, certifications, resume, and other relevant documents.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="documents">Upload Documents</Label>
              <div className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-gray-300 rounded-md">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary/80"
                    >
                      <span>Upload files</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        multiple
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={handleDocumentUpload}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    PDF, DOC, DOCX, JPG, PNG up to 10MB each
                  </p>
                </div>
              </div>
            </div>

            {documents.length > 0 && (
              <div className="space-y-2">
                <Label>Uploaded Documents</Label>
                {documents.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4" />
                      <span className="text-sm">{doc.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({Math.round(doc.size / 1024)} KB)
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDocument(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Availability */}
        <Card>
          <CardHeader>
            <CardTitle>Availability</CardTitle>
            <p className="text-sm text-muted-foreground">
              Set your general availability. You can update this later in your dashboard.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {availability.map(avail => (
              <div key={avail.day} className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center space-x-3">
                  <Switch
                    checked={avail.enabled}
                    onCheckedChange={(checked) => updateAvailability(avail.day, 'enabled', checked)}
                  />
                  <Label className="min-w-[100px]">{avail.day}</Label>
                </div>
                
                {avail.enabled && (
                  <div className="flex items-center space-x-2">
                    <Input
                      type="time"
                      value={avail.startTime}
                      onChange={(e) => updateAvailability(avail.day, 'startTime', e.target.value)}
                      className="w-24"
                    />
                    <span>to</span>
                    <Input
                      type="time"
                      value={avail.endTime}
                      onChange={(e) => updateAvailability(avail.day, 'endTime', e.target.value)}
                      className="w-24"
                    />
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Application"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EnhancedExpertRegistration;