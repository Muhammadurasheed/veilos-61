import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, Send, Clock, CheckCircle, XCircle } from 'lucide-react';
import { AppealApi } from '@/services/recommendationApi';
import type { ApiResponse } from '@/services/api';

interface ContentAppealProps {
  postId: string;
  postContent: string;
  flagReason: string;
  onSubmit?: () => void;
}

interface Appeal {
  id: string;
  postId: string;
  appealReason: string;
  status: 'pending' | 'approved' | 'denied';
  timestamp: string;
  reviewDate?: string;
  reviewNotes?: string;
}

export const ContentAppeal = ({ postId, postContent, flagReason, onSubmit }: ContentAppealProps) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [appealReason, setAppealReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [appeals, setAppeals] = useState<Appeal[]>([]);

  const submitAppeal = async () => {
    if (!appealReason.trim()) {
      toast({
        variant: 'destructive',
        title: 'Appeal reason required',
        description: 'Please provide a reason for your appeal.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Mock API call - replace with actual API call
      const mockResponse: ApiResponse<Appeal> = {
        success: true,
        data: {
          id: `appeal-${Date.now()}`,
          postId,
          appealReason,
          status: 'pending',
          timestamp: new Date().toISOString(),
        }
      };

      if (mockResponse.success) {
        toast({
          title: 'Appeal submitted',
          description: 'Your appeal has been submitted for review. You will be notified of the decision.',
        });
        setAppeals(prev => [mockResponse.data!, ...prev]);
        setAppealReason('');
        setIsOpen(false);
        onSubmit?.();
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to submit appeal',
        description: 'There was an error submitting your appeal. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = (status: Appeal['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-amber-500" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'denied':
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: Appeal['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-100 text-amber-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'denied':
        return 'bg-red-100 text-red-800';
    }
  };

  return (
    <>
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="flex items-center text-amber-800">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Content Under Review
          </CardTitle>
          <CardDescription className="text-amber-700">
            This content has been flagged for: <strong>{flagReason.replace('_', ' ')}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-white p-3 rounded-md mb-4 border border-amber-200">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{postContent}</p>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsOpen(true)}
              className="border-amber-500 text-amber-700 hover:bg-amber-100"
            >
              Appeal This Decision
            </Button>
          </div>

          {appeals.length > 0 && (
            <div className="mt-4 space-y-2">
              <h4 className="font-medium text-amber-800">Your Appeals</h4>
              {appeals.map((appeal) => (
                <div key={appeal.id} className="flex items-center justify-between p-2 bg-white rounded border border-amber-200">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(appeal.status)}
                    <span className="text-sm">Appeal submitted</span>
                  </div>
                  <Badge className={getStatusColor(appeal.status)}>
                    {appeal.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Appeal Content Decision</DialogTitle>
            <DialogDescription>
              Please explain why you believe this content was incorrectly flagged.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded-md">
              <p className="text-sm font-medium mb-1">Flagged Content:</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{postContent}</p>
            </div>

            <div className="bg-red-50 p-3 rounded-md">
              <p className="text-sm font-medium mb-1 text-red-800">Flag Reason:</p>
              <p className="text-sm text-red-700">{flagReason.replace('_', ' ')}</p>
            </div>

            <div>
              <label className="text-sm font-medium">Appeal Reason</label>
              <Textarea
                value={appealReason}
                onChange={(e) => setAppealReason(e.target.value)}
                placeholder="Explain why you believe this content should not have been flagged..."
                className="mt-1"
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={submitAppeal}
              disabled={isSubmitting || !appealReason.trim()}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {isSubmitting ? (
                <Clock className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Submit Appeal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};