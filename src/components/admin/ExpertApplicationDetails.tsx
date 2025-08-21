
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import { Expert } from '@/types';
import { 
  FileText, 
  User, 
  Mail, 
  Phone, 
  Award, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock,
  Download,
  Eye,
  MapPin,
  Globe,
  DollarSign,
  Star,
  Briefcase,
  GraduationCap,
  Settings,
  Camera,
  MessageCircle,
  Video,
  Headphones,
  Shield
} from 'lucide-react';
import { EnhancedAdminApi } from '@/services/adminApi';
import { format } from 'date-fns';

interface ExpertApplicationDetailsProps {
  expert: Expert | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusUpdate?: () => void;
}

interface DocumentViewerProps {
  document: {
    id: string;
    type: string;
    fileName: string;
    fileUrl: string;
    status: 'pending' | 'approved' | 'rejected';
    uploadedAt: string;
  };
}

const DocumentViewer = ({ document }: DocumentViewerProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleViewDocument = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const filename = document.fileUrl.split('/').pop();
      
      // Use the secure admin route for document viewing
      const secureUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/admin/documents/view/${filename}`;
      
      // Open in new tab with authorization
      const newTab = window.open();
      if (newTab) {
        newTab.location.href = secureUrl + `?token=${token}`;
      } else {
        // Fallback: fetch and create blob URL
        const response = await fetch(secureUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        });
        
        if (response.ok) {
          const blob = await response.blob();
          const blobUrl = URL.createObjectURL(blob);
          window.open(blobUrl, '_blank');
          setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
        } else {
          throw new Error('Failed to load document');
        }
      }
    } catch (error) {
      console.error('Document view error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to open document. Please check your permissions.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getDocumentIcon = (type: string) => {
    const icons: Record<string, any> = {
      id: User,
      credential: Award,
      certificate: Award,
      resume: FileText,
      cv: FileText,
      photo: Camera,
      other: FileText,
    };
    const Icon = icons[type] || FileText;
    return <Icon className="h-4 w-4" />;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-amber-100 text-amber-800 border-amber-300',
      approved: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      rejected: 'bg-red-100 text-red-800 border-red-300',
    };
    return colors[status] || colors.pending;
  };

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 text-muted-foreground">
          {getDocumentIcon(document.type)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-900 truncate">
            {document.fileName}
          </p>
          <p className="text-xs text-gray-500">
            {document.type.replace('_', ' ').toUpperCase()} • {format(new Date(document.uploadedAt), 'MMM dd, yyyy')}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Badge variant="outline" className={getStatusColor(document.status)}>
          {document.status}
        </Badge>
        
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleViewDocument}
            disabled={isLoading}
          >
            <Eye className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleViewDocument}
          >
            <Download className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export function ExpertApplicationDetails({ 
  expert, 
  open, 
  onOpenChange, 
  onStatusUpdate 
}: ExpertApplicationDetailsProps) {
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | ''>('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!expert) return null;

  const handleSubmitReview = async () => {
    if (!reviewAction) {
      toast({
        variant: 'destructive',
        title: 'Action Required',
        description: 'Please select an action (approve or reject)',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await EnhancedAdminApi.bulkExpertAction({
        expertIds: [expert.id],
        action: reviewAction,
        notes: reviewNotes || undefined,
      });

      if (response.success) {
        toast({
          title: 'Application Reviewed',
          description: `Expert application ${reviewAction}d successfully`,
        });
        onStatusUpdate?.();
        onOpenChange(false);
        setReviewAction('');
        setReviewNotes('');
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Review Failed',
        description: 'Failed to update expert status. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimeSlot = (slot: any) => {
    return `${slot.start} - ${slot.end}`;
  };

  const getDayName = (day: string) => {
    const days: Record<string, string> = {
      monday: 'Monday',
      tuesday: 'Tuesday', 
      wednesday: 'Wednesday',
      thursday: 'Thursday',
      friday: 'Friday',
      saturday: 'Saturday',
      sunday: 'Sunday'
    };
    return days[day] || day;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Expert Application Review - {expert.name}
          </DialogTitle>
          <DialogDescription>
            Review all submitted information and documentation for expert verification.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="flex-1">
          <TabsList className="grid grid-cols-6 w-full">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="experience">Experience</TabsTrigger>
            <TabsTrigger value="availability">Availability</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="review">Review</TabsTrigger>
          </TabsList>

          <div className="mt-4 h-[60vh] overflow-hidden">
            {/* Basic Information Tab */}
            <TabsContent value="basic" className="h-full">
              <ScrollArea className="h-full pr-4">
                <div className="space-y-6">
                  {/* Personal Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Personal Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Full Name</label>
                        <p className="text-sm font-semibold">{expert.name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Email</label>
                        <p className="text-sm font-semibold">{expert.email}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Phone Number</label>
                        <p className="text-sm font-semibold">{expert.phoneNumber || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Specialization</label>
                        <p className="text-sm font-semibold">{expert.specialization}</p>
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-sm font-medium text-gray-500">Professional Bio</label>
                        <p className="text-sm mt-1 leading-relaxed">{expert.bio}</p>
                      </div>
                      {expert.headline && (
                        <div className="md:col-span-2">
                          <label className="text-sm font-medium text-gray-500">Professional Headline</label>
                          <p className="text-sm font-semibold">{expert.headline}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Location & Languages */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <MapPin className="h-5 w-5" />
                          Location
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {expert.location ? (
                          <div className="space-y-2">
                            <div>
                              <label className="text-sm font-medium text-gray-500">City</label>
                              <p className="text-sm">{expert.location.city || 'Not specified'}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-500">State</label>
                              <p className="text-sm">{expert.location.state || 'Not specified'}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-500">Country</label>
                              <p className="text-sm">{expert.location.country || 'Not specified'}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-500">Timezone</label>
                              <p className="text-sm">{expert.timezone || 'UTC'}</p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">No location information provided</p>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Globe className="h-5 w-5" />
                          Languages & Skills
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Languages</label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {expert.languages?.length ? expert.languages.map((lang, index) => (
                              <Badge key={index} variant="outline">{lang}</Badge>
                            )) : <span className="text-sm text-gray-500">None specified</span>}
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Skills</label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {expert.skills?.length ? expert.skills.map((skill, index) => (
                              <Badge key={index} variant="secondary">{skill}</Badge>
                            )) : <span className="text-sm text-gray-500">None specified</span>}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Pricing Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Pricing Model
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Pricing Model</label>
                        <Badge variant={expert.pricingModel === 'free' ? 'secondary' : 'default'} className="mt-1">
                          {expert.pricingModel.toUpperCase()}
                        </Badge>
                      </div>
                      {expert.hourlyRate && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Hourly Rate</label>
                          <p className="text-sm font-semibold">${expert.hourlyRate}/hour</p>
                        </div>
                      )}
                      {expert.pricingDetails && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Pricing Details</label>
                          <p className="text-sm">{expert.pricingDetails}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents" className="h-full">
              <ScrollArea className="h-full pr-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Verification Documents</h3>
                    <Badge variant="outline">
                      {expert.verificationDocuments?.length || 0} Documents
                    </Badge>
                  </div>
                  
                  {expert.verificationDocuments?.length ? (
                    expert.verificationDocuments.map((doc, index) => (
                      <DocumentViewer key={doc.id || index} document={doc} />
                    ))
                  ) : (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <FileText className="h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-gray-500">No documents uploaded</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Experience Tab */}
            <TabsContent value="experience" className="h-full">
              <ScrollArea className="h-full pr-4">
                <div className="space-y-6">
                  {/* Work Experience */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Briefcase className="h-5 w-5" />
                        Work Experience
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {expert.workExperience?.length ? (
                        <div className="space-y-4">
                          {expert.workExperience.map((exp, index) => (
                            <div key={exp.id || index} className="border-l-2 border-blue-200 pl-4 pb-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h4 className="font-semibold text-base">{exp.jobTitle}</h4>
                                  <p className="text-sm font-medium text-blue-600">{exp.company}</p>
                                  <p className="text-sm text-gray-500 mt-1">
                                    {format(new Date(exp.startDate), 'MMM yyyy')} - {
                                      exp.isCurrent ? 'Present' : format(new Date(exp.endDate), 'MMM yyyy')
                                    }
                                  </p>
                                  {exp.description && (
                                    <p className="text-sm mt-2 text-gray-700">{exp.description}</p>
                                  )}
                                  {exp.skills?.length && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {exp.skills.map((skill, skillIndex) => (
                                        <Badge key={skillIndex} variant="outline" className="text-xs">
                                          {skill}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                {exp.isCurrent && (
                                  <Badge variant="secondary" className="ml-2">Current</Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500">No work experience provided</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Education */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <GraduationCap className="h-5 w-5" />
                        Education
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {expert.education?.length ? (
                        <div className="space-y-4">
                          {expert.education.map((edu, index) => (
                            <div key={edu.id || index} className="flex items-start justify-between border-b border-gray-100 pb-3 last:border-0">
                              <div className="flex-1">
                                <h4 className="font-semibold">{edu.degree}</h4>
                                <p className="text-sm font-medium text-blue-600">{edu.institution}</p>
                                {edu.fieldOfStudy && (
                                  <p className="text-sm text-gray-600">{edu.fieldOfStudy}</p>
                                )}
                                {edu.grade && (
                                  <p className="text-sm text-gray-700 mt-1">Grade: {edu.grade}</p>
                                )}
                              </div>
                              <div className="text-right text-sm text-gray-500 ml-4">
                                {edu.startDate && edu.endDate && (
                                  <p>
                                    {format(new Date(edu.startDate), 'yyyy')} - {format(new Date(edu.endDate), 'yyyy')}
                                  </p>
                                )}
                                {edu.grade && (
                                  <p className="font-medium">Grade: {edu.grade}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500">No education information provided</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Certifications */}
                  {expert.certifications?.length && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Award className="h-5 w-5" />
                          Certifications
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-2">
                          {expert.certifications.map((cert, index) => (
                            <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                              <Award className="h-4 w-4 text-yellow-500" />
                              <span className="text-sm">{cert}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Availability Tab */}
            <TabsContent value="availability" className="h-full">
              <ScrollArea className="h-full pr-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Weekly Availability
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {expert.availability?.length ? (
                      <div className="space-y-4">
                        {expert.availability.map((dayAvail, index) => (
                          <div key={index} className="grid grid-cols-4 gap-4 items-center p-3 border rounded-lg">
                            <div className="font-medium">
                              {getDayName(dayAvail.day)}
                            </div>
                            <div className="col-span-3">
                              {dayAvail.timeSlots?.length ? (
                                <div className="flex flex-wrap gap-2">
                                  {dayAvail.timeSlots.map((slot, slotIndex) => (
                                    <Badge 
                                      key={slotIndex} 
                                      variant={slot.available ? 'default' : 'secondary'}
                                      className="text-xs"
                                    >
                                      {formatTimeSlot(slot)}
                                    </Badge>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-sm text-gray-500">No time slots defined</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No availability schedule provided</p>
                        <p className="text-sm text-gray-400 mt-2">
                          Expert will need to set up their availability before accepting bookings
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </ScrollArea>
            </TabsContent>

            {/* Session Preferences Tab */}
            <TabsContent value="preferences" className="h-full">
              <ScrollArea className="h-full pr-4">
                <div className="space-y-6">
                  {expert.sessionPreferences ? (
                    <>
                      {/* Privacy Settings */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            Privacy & Security Preferences
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Voice Masking</span>
                            <Badge variant={expert.sessionPreferences.voiceMasking ? 'default' : 'secondary'}>
                              {expert.sessionPreferences.voiceMasking ? 'Enabled' : 'Disabled'}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Allow Recording</span>
                            <Badge variant={expert.sessionPreferences.allowRecording ? 'default' : 'secondary'}>
                              {expert.sessionPreferences.allowRecording ? 'Allowed' : 'Not Allowed'}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Session Types */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Settings className="h-5 w-5" />
                            Supported Session Types
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid md:grid-cols-3 gap-4">
                            <div className="flex items-center gap-3 p-3 border rounded-lg">
                              <MessageCircle className={`h-5 w-5 ${expert.sessionPreferences.sessionTypes?.chat ? 'text-green-500' : 'text-gray-400'}`} />
                              <div>
                                <p className="font-medium text-sm">Text Chat</p>
                                <p className="text-xs text-gray-500">
                                  {expert.sessionPreferences.sessionTypes?.chat ? 'Available' : 'Not Available'}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3 p-3 border rounded-lg">
                              <Headphones className={`h-5 w-5 ${expert.sessionPreferences.sessionTypes?.voice ? 'text-green-500' : 'text-gray-400'}`} />
                              <div>
                                <p className="font-medium text-sm">Voice Call</p>
                                <p className="text-xs text-gray-500">
                                  {expert.sessionPreferences.sessionTypes?.voice ? 'Available' : 'Not Available'}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3 p-3 border rounded-lg">
                              <Video className={`h-5 w-5 ${expert.sessionPreferences.sessionTypes?.video ? 'text-green-500' : 'text-gray-400'}`} />
                              <div>
                                <p className="font-medium text-sm">Video Call</p>
                                <p className="text-xs text-gray-500">
                                  {expert.sessionPreferences.sessionTypes?.video ? 'Available' : 'Not Available'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Session Duration */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            Session Duration Settings
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-500">Minimum Duration</label>
                            <p className="text-lg font-semibold">{expert.sessionPreferences.minDuration} minutes</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Maximum Duration</label>
                            <p className="text-lg font-semibold">{expert.sessionPreferences.maxDuration} minutes</p>
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  ) : (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <Settings className="h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-gray-500">No session preferences configured</p>
                        <p className="text-sm text-gray-400 mt-2">
                          Expert will need to complete session preferences setup
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Review Tab */}
            <TabsContent value="review" className="h-full">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Application Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>Application Date:</strong> {format(new Date(expert.createdAt), 'PPP')}
                      </div>
                      <div>
                        <strong>Current Status:</strong> 
                        <Badge variant="outline" className="ml-2">
                          {expert.accountStatus.toUpperCase()}
                        </Badge>
                      </div>
                      <div>
                        <strong>Documents Submitted:</strong> {expert.verificationDocuments?.length || 0}
                      </div>
                      <div>
                        <strong>Experience Entries:</strong> {expert.workExperience?.length || 0}
                      </div>
                      <div>
                        <strong>Education Entries:</strong> {expert.education?.length || 0}
                      </div>
                      <div>
                        <strong>Availability Configured:</strong> 
                        <Badge variant={expert.availability?.length ? 'default' : 'secondary'} className="ml-2">
                          {expert.availability?.length ? 'Yes' : 'No'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Review Decision</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Action</label>
                      <Select value={reviewAction} onValueChange={(value) => setReviewAction(value as "" | "approve" | "reject")}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select action" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="approve">Approve Application</SelectItem>
                          <SelectItem value="reject">Reject Application</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Review Notes</label>
                      <Textarea
                        placeholder="Add notes about your decision..."
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        rows={4}
                      />
                    </div>

                    <div className="flex gap-4 pt-4">
                      <Button
                        onClick={handleSubmitReview}
                        disabled={isSubmitting || !reviewAction}
                        className="flex-1"
                        variant={reviewAction === 'approve' ? 'default' : reviewAction === 'reject' ? 'destructive' : 'outline'}
                      >
                        {isSubmitting ? (
                          <>
                            <Clock className="h-4 w-4 animate-spin mr-2" />
                            Processing...
                          </>
                        ) : (
                          <>
                            {reviewAction === 'approve' ? (
                              <CheckCircle className="h-4 w-4 mr-2" />
                            ) : reviewAction === 'reject' ? (
                              <XCircle className="h-4 w-4 mr-2" />
                            ) : null}
                            {reviewAction === 'approve' ? 'Approve Application' : 
                             reviewAction === 'reject' ? 'Reject Application' : 'Select Action'}
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
