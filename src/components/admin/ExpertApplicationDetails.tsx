import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  Eye
} from 'lucide-react';
import { EnhancedAdminApi } from '@/services/adminApi';

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
      // In a real app, this would open a secure document viewer
      window.open(document.fileUrl, '_blank');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to open document',
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
      photo: User,
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
    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          {getDocumentIcon(document.type)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-900 truncate">
            {document.fileName}
          </p>
          <p className="text-xs text-gray-500">
            {document.type.replace('_', ' ').toUpperCase()} • {new Date(document.uploadedAt).toLocaleDateString()}
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
            onClick={() => window.open(document.fileUrl, '_blank')}
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
        description: error instanceof Error ? error.message : 'Failed to submit review',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, any> = {
      pending: Clock,
      approved: CheckCircle,
      rejected: XCircle,
      suspended: XCircle,
    };
    const Icon = icons[status] || Clock;
    const colors: Record<string, string> = {
      pending: 'text-amber-500',
      approved: 'text-emerald-500',
      rejected: 'text-red-500',
      suspended: 'text-gray-500',
    };
    return <Icon className={`h-5 w-5 ${colors[status]}`} />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Expert Application Review
          </DialogTitle>
          <DialogDescription>
            Review and approve or reject this expert application
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Expert Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <img 
                    src={expert.avatarUrl || '/experts/default.jpg'} 
                    alt={expert.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  {expert.name}
                </span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(expert.accountStatus)}
                  <Badge variant="outline" className={
                    expert.accountStatus === 'pending' ? 'bg-amber-100 text-amber-800' :
                    expert.accountStatus === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                    expert.accountStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }>
                    {expert.accountStatus.toUpperCase()}
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{expert.email}</span>
                  </div>
                  {expert.phoneNumber && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{expert.phoneNumber}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">Applied: {new Date(expert.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Specialization</label>
                    <p className="text-sm text-gray-600">{expert.specialization}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Pricing Model</label>
                    <p className="text-sm text-gray-600 capitalize">{expert.pricingModel}</p>
                  </div>
                </div>
              </div>
              
              {expert.bio && (
                <div className="mt-4">
                  <label className="text-sm font-medium text-gray-700">Bio</label>
                  <p className="text-sm text-gray-600 mt-1 p-3 bg-gray-50 rounded-lg">
                    {expert.bio}
                  </p>
                </div>
              )}

              {expert.topicsHelped?.length > 0 && (
                <div className="mt-4">
                  <label className="text-sm font-medium text-gray-700">Topics of Expertise</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {expert.topicsHelped.map((topic, index) => (
                      <Badge key={index} variant="secondary">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Verification Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Verification Documents ({expert.verificationDocuments?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {expert.verificationDocuments && expert.verificationDocuments.length > 0 ? (
                <div className="space-y-3">
                  {expert.verificationDocuments.map((doc) => (
                    <DocumentViewer key={doc.id} document={doc} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>No documents uploaded</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Admin Notes History */}
          {expert.adminNotes && expert.adminNotes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Admin Notes History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {expert.adminNotes.map((note) => (
                    <div key={note.id} className="border-l-2 border-gray-200 pl-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {note.category?.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(note.date).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{note.note}</p>
                      {note.action && (
                        <Badge variant="outline" className="mt-1 text-xs">
                          {note.action}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Review Actions */}
          {expert.accountStatus === 'pending' && (
            <Card>
              <CardHeader>
                <CardTitle>Review Decision</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Decision
                  </label>
                  <Select value={reviewAction} onValueChange={(value: 'approve' | 'reject') => setReviewAction(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select action" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="approve">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-emerald-500" />
                          Approve Application
                        </div>
                      </SelectItem>
                      <SelectItem value="reject">
                        <div className="flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-red-500" />
                          Reject Application
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Notes (Optional)
                  </label>
                  <Textarea
                    placeholder="Add review notes..."
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmitReview}
                    disabled={isSubmitting || !reviewAction}
                    className={
                      reviewAction === 'approve' 
                        ? 'bg-emerald-600 hover:bg-emerald-700' 
                        : reviewAction === 'reject'
                        ? 'bg-red-600 hover:bg-red-700'
                        : ''
                    }
                  >
                    {isSubmitting ? 'Processing...' : `${reviewAction === 'approve' ? 'Approve' : 'Reject'} Application`}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}