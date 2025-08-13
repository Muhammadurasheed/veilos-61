import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Upload, FileText, CheckCircle, Clock, X } from 'lucide-react';
import { ExpertApi } from '@/services/api';

interface Document {
  id: string;
  type: string;
  name: string;
  status: 'pending' | 'approved' | 'rejected';
  uploadedAt: string;
  fileUrl?: string;
}

interface ExpertVerificationUploadProps {
  expertId: string;
  onDocumentUploaded?: (document: Document) => void;
}

const DOCUMENT_TYPES = [
  { id: 'license', label: 'Professional License', required: true },
  { id: 'degree', label: 'Educational Degree', required: true },
  { id: 'certification', label: 'Additional Certifications', required: false },
  { id: 'insurance', label: 'Malpractice Insurance', required: false },
];

export function ExpertVerificationUpload({ expertId, onDocumentUploaded }: ExpertVerificationUploadProps) {
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [documents, setDocuments] = useState<Document[]>([]);

  const handleFileUpload = async (file: File, documentType: string) => {
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Maximum file size is 10MB',
        variant: 'destructive',
      });
      return;
    }

    setUploading(documentType);
    setUploadProgress(0);

    try {
      const response = await ExpertApi.uploadVerificationDocument(
        expertId,
        file,
        documentType,
        (progress) => setUploadProgress(progress)
      );

      if (response.success && response.data) {
        const newDocument: Document = {
          id: `doc-${Date.now()}`,
          type: documentType,
          name: file.name,
          status: 'pending',
          uploadedAt: new Date().toISOString(),
          fileUrl: response.data.fileUrl,
        };

        setDocuments(prev => [...prev, newDocument]);
        onDocumentUploaded?.(newDocument);

        toast({
          title: 'Document uploaded',
          description: 'Your document has been uploaded and is pending review.',
        });
      } else {
        toast({
          title: 'Upload failed',
          description: response.error || 'Failed to upload document',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: 'An error occurred while uploading the document',
        variant: 'destructive',
      });
    } finally {
      setUploading(null);
      setUploadProgress(0);
    }
  };

  const getStatusIcon = (status: Document['status']) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'rejected':
        return <X className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: Document['status']) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Document Verification</CardTitle>
          <CardDescription>
            Upload your professional documents for verification. Required documents must be submitted before your profile can be approved.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {DOCUMENT_TYPES.map((docType) => {
            const existingDoc = documents.find(doc => doc.type === docType.id);
            const isUploading = uploading === docType.id;

            return (
              <div key={docType.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span className="font-medium">{docType.label}</span>
                    {docType.required && (
                      <Badge variant="secondary" className="text-xs">
                        Required
                      </Badge>
                    )}
                  </div>
                  {existingDoc && (
                    <div className="flex items-center gap-2">
                      {getStatusIcon(existingDoc.status)}
                      <Badge variant="outline" className={getStatusColor(existingDoc.status)}>
                        {existingDoc.status}
                      </Badge>
                    </div>
                  )}
                </div>

                {existingDoc ? (
                  <div className="text-sm text-muted-foreground">
                    Uploaded: {existingDoc.name}
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      id={`file-${docType.id}`}
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleFileUpload(file, docType.id);
                        }
                      }}
                      disabled={isUploading}
                    />
                    <label htmlFor={`file-${docType.id}`}>
                      <Button
                        variant="outline"
                        className="w-full cursor-pointer"
                        disabled={isUploading}
                        asChild
                      >
                        <span>
                          <Upload className="h-4 w-4 mr-2" />
                          {isUploading ? 'Uploading...' : 'Choose File'}
                        </span>
                      </Button>
                    </label>
                  </div>
                )}

                {isUploading && (
                  <div className="mt-2">
                    <Progress value={uploadProgress} className="w-full" />
                    <p className="text-xs text-muted-foreground mt-1">
                      Uploading... {uploadProgress}%
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm font-medium">{doc.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(doc.status)}
                    <Badge variant="outline" className={getStatusColor(doc.status)}>
                      {doc.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}