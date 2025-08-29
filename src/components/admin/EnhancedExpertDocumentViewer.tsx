import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Expert } from '@/types';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  FileText,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Briefcase,
  GraduationCap,
  Award,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';

interface Props {
  expert: Expert | null;
  isOpen: boolean;
  onClose: () => void;
}

interface ParsedResume {
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    location: string;
  };
  experience: Array<{
    title: string;
    company: string;
    duration: string;
    description: string;
  }>;
  education: Array<{
    degree: string;
    institution: string;
    year: string;
  }>;
  skills: string[];
  certifications: string[];
  summary: string;
}

const EnhancedExpertDocumentViewer = ({ expert, isOpen, onClose }: Props) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [verificationStatus, setVerificationStatus] = useState<'approved' | 'rejected' | 'pending'>('pending');

  // Parse resume/CV if available
  const { data: parsedResume, isLoading: isParsingResume } = useQuery({
    queryKey: ['parsedResume', expert?.id],
    queryFn: async () => {
      if (!expert?.verificationDocuments) return null;
      
      const resumeDoc = expert.verificationDocuments.find(
        (doc): doc is any => ['resume', 'cv'].includes(doc.type as string)
      );
      
      if (!resumeDoc) return null;

      const response = await fetch(`/api/admin/experts/${expert.id}/parse-resume`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) return null;
      const data = await response.json();
      return data.data;
    },
    enabled: !!expert?.id && isOpen,
  });

  // Document verification mutation
  const verifyDocumentMutation = useMutation({
    mutationFn: async (params: { documentId: string; status: string; notes: string }) => {
      const response = await fetch(`/api/admin/experts/${expert?.id}/documents/${params.documentId}/verify`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          status: params.status,
          notes: params.notes,
        }),
      });

      if (!response.ok) throw new Error('Document verification failed');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Document Verified',
        description: 'Document verification status updated successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['enhancedExperts'] });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Verification Failed',
        description: error.message,
      });
    },
  });

  // Expert verification mutation
  const verifyExpertMutation = useMutation({
    mutationFn: async (params: { status: string; level: string; notes: string }) => {
      const response = await fetch(`/api/admin/experts/${expert?.id}/verify`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          verificationLevel: params.level,
          status: params.status,
          feedback: params.notes,
        }),
      });

      if (!response.ok) throw new Error('Expert verification failed');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Expert Verified',
        description: 'Expert verification completed successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['enhancedExperts'] });
      onClose();
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Verification Failed',
        description: error.message,
      });
    },
  });

  const handleVerifyDocument = (documentId: string) => {
    verifyDocumentMutation.mutate({
      documentId,
      status: verificationStatus,
      notes: verificationNotes,
    });
  };

  const handleVerifyExpert = (status: 'approved' | 'rejected', level: string) => {
    verifyExpertMutation.mutate({
      status,
      level,
      notes: verificationNotes,
    });
  };

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'resume':
      case 'cv':
        return <Briefcase className="h-4 w-4" />;
      case 'certificate':
      case 'certification':
        return <Award className="h-4 w-4" />;
      case 'credential':
        return <GraduationCap className="h-4 w-4" />;
      case 'id':
        return <User className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (!expert) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Expert Document Review - {expert.name}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="documents" className="flex-1">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="documents">Documents ({expert.verificationDocuments?.length || 0})</TabsTrigger>
            <TabsTrigger value="resume">Parsed Resume</TabsTrigger>
            <TabsTrigger value="verification">Verification</TabsTrigger>
          </TabsList>

          <div className="mt-4 h-[60vh] overflow-hidden">
            <TabsContent value="documents" className="h-full">
              <ScrollArea className="h-full pr-4">
                <div className="space-y-4">
                  {expert.verificationDocuments?.map((doc, index) => (
                    <Card key={doc.id || index} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardHeader 
                        className="pb-3"
                        onClick={() => setSelectedDocument(doc)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {getDocumentIcon(doc.type)}
                            <div>
                              <CardTitle className="text-base">{doc.fileName}</CardTitle>
                              <div className="text-sm text-muted-foreground">
                                {doc.type.replace('_', ' ').toUpperCase()} • 
                                Uploaded {format(new Date(doc.uploadedAt), 'MMM dd, yyyy')}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={getStatusColor(doc.status)}>
                              {doc.status.toUpperCase()}
                            </Badge>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      
                      {selectedDocument?.id === doc.id && (
                        <CardContent className="border-t">
                          <div className="space-y-4 pt-4">
                            <div className="flex items-center gap-4">
                              <Select
                                value={verificationStatus}
                                onValueChange={(value: any) => setVerificationStatus(value)}
                              >
                                <SelectTrigger className="w-40">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="approved">Approve</SelectItem>
                                  <SelectItem value="rejected">Reject</SelectItem>
                                  <SelectItem value="pending">Pending</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button
                                onClick={() => handleVerifyDocument(doc.id)}
                                disabled={verifyDocumentMutation.isPending}
                                size="sm"
                              >
                                {verifyDocumentMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                )}
                                Update Status
                              </Button>
                            </div>
                            
                            <Textarea
                              placeholder="Add verification notes..."
                              value={verificationNotes}
                              onChange={(e) => setVerificationNotes(e.target.value)}
                              rows={3}
                            />
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="resume" className="h-full">
              <ScrollArea className="h-full pr-4">
                {isParsingResume ? (
                  <div className="flex justify-center items-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="ml-2">Parsing resume...</span>
                  </div>
                ) : parsedResume ? (
                  <div className="space-y-6">
                    {/* Personal Information */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <User className="h-5 w-5" />
                          Personal Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div><strong>Name:</strong> {parsedResume.personalInfo.name}</div>
                        <div><strong>Email:</strong> {parsedResume.personalInfo.email}</div>
                        <div><strong>Phone:</strong> {parsedResume.personalInfo.phone}</div>
                        <div><strong>Location:</strong> {parsedResume.personalInfo.location}</div>
                      </CardContent>
                    </Card>

                    {/* Professional Summary */}
                    {parsedResume.summary && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Professional Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm leading-relaxed">{parsedResume.summary}</p>
                        </CardContent>
                      </Card>
                    )}

                    {/* Experience */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Briefcase className="h-5 w-5" />
                          Experience
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {parsedResume.experience.map((exp, index) => (
                          <div key={index} className="border-l-2 border-blue-200 pl-4">
                            <h4 className="font-semibold">{exp.title}</h4>
                            <div className="text-sm text-muted-foreground">{exp.company} • {exp.duration}</div>
                            <p className="text-sm mt-1">{exp.description}</p>
                          </div>
                        ))}
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
                      <CardContent className="space-y-2">
                        {parsedResume.education.map((edu, index) => (
                          <div key={index} className="flex justify-between">
                            <div>
                              <div className="font-medium">{edu.degree}</div>
                              <div className="text-sm text-muted-foreground">{edu.institution}</div>
                            </div>
                            <div className="text-sm text-muted-foreground">{edu.year}</div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>

                    {/* Skills & Certifications */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>Skills</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2">
                            {parsedResume.skills.map((skill, index) => (
                              <Badge key={index} variant="outline">{skill}</Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Award className="h-5 w-5" />
                            Certifications
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-1">
                            {parsedResume.certifications.map((cert, index) => (
                              <div key={index} className="text-sm">{cert}</div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10 text-muted-foreground">
                    No resume/CV document found or parsing failed
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="verification" className="h-full">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Expert Verification Decision</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Verification Notes</label>
                      <Textarea
                        placeholder="Add notes about the verification decision..."
                        value={verificationNotes}
                        onChange={(e) => setVerificationNotes(e.target.value)}
                        rows={4}
                      />
                    </div>

                    <div className="flex gap-4 pt-4">
                      <Button
                        onClick={() => handleVerifyExpert('approved', 'blue')}
                        disabled={verifyExpertMutation.isPending}
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                      >
                        {verifyExpertMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-2" />
                        )}
                        Approve - Blue Badge
                      </Button>
                      
                      <Button
                        onClick={() => handleVerifyExpert('approved', 'gold')}
                        disabled={verifyExpertMutation.isPending}
                        className="flex-1 bg-yellow-600 hover:bg-yellow-700"
                      >
                        {verifyExpertMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-2" />
                        )}
                        Approve - Gold Badge
                      </Button>
                      
                      <Button
                        onClick={() => handleVerifyExpert('approved', 'platinum')}
                        disabled={verifyExpertMutation.isPending}
                        className="flex-1 bg-purple-600 hover:bg-purple-700"
                      >
                        {verifyExpertMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-2" />
                        )}
                        Approve - Platinum Badge
                      </Button>
                    </div>

                    <Button
                      onClick={() => handleVerifyExpert('rejected', 'none')}
                      disabled={verifyExpertMutation.isPending}
                      variant="destructive"
                      className="w-full"
                    >
                      {verifyExpertMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <XCircle className="h-4 w-4 mr-2" />
                      )}
                      Reject Application
                    </Button>
                  </CardContent>
                </Card>

                {/* Expert Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>Application Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>Specialization:</strong> {expert.specialization}
                      </div>
                      <div>
                        <strong>Pricing Model:</strong> {expert.pricingModel}
                      </div>
                      <div>
                        <strong>Documents Submitted:</strong> {expert.verificationDocuments?.length || 0}
                      </div>
                      <div>
                        <strong>Application Date:</strong> {format(new Date(expert.createdAt), 'MMM dd, yyyy')}
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <strong>Bio:</strong>
                      <p className="text-sm text-muted-foreground mt-1">{expert.bio}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedExpertDocumentViewer;