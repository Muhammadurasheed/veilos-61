import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, X, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResumeUploadProps {
  onUploadComplete: (fileInfo: { name: string; url: string; type: string }) => void;
  className?: string;
}

export function ResumeUpload({ onUploadComplete, className }: ResumeUploadProps) {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; url: string; type: string } | null>(null);
  const { toast } = useToast();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select a file smaller than 10MB.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const uploadInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 95) {
            clearInterval(uploadInterval);
            return 95;
          }
          return prev + Math.random() * 15;
        });
      }, 200);

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'resume');

      // TODO: Replace with actual API call
      const response = await fetch('/api/upload/resume', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      clearInterval(uploadInterval);
      setUploadProgress(100);

      if (response.ok) {
        const result = await response.json();
        const fileInfo = {
          name: file.name,
          url: result.url || URL.createObjectURL(file),
          type: file.type,
        };
        
        setUploadedFile(fileInfo);
        onUploadComplete(fileInfo);
        
        toast({
          title: 'Resume uploaded successfully',
          description: 'Your resume has been uploaded and processed.',
        });
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: 'There was an error uploading your resume. Please try again.',
        variant: 'destructive',
      });
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  }, [onUploadComplete, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
    disabled: isUploading || !!uploadedFile,
  });

  const removeFile = () => {
    setUploadedFile(null);
    setUploadProgress(0);
  };

  if (uploadedFile) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Resume/CV
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium text-sm">{uploadedFile.name}</p>
                <p className="text-xs text-muted-foreground">Uploaded successfully</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={removeFile}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Resume/CV Upload
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
            isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25",
            (isUploading || uploadedFile) && "opacity-50 cursor-not-allowed"
          )}
        >
          <input {...getInputProps()} />
          
          {isUploading ? (
            <div className="space-y-4">
              <Upload className="h-8 w-8 mx-auto text-muted-foreground animate-pulse" />
              <div className="space-y-2">
                <p className="text-sm font-medium">Uploading resume...</p>
                <Progress value={uploadProgress} className="w-full" />
                <p className="text-xs text-muted-foreground">{Math.round(uploadProgress)}% complete</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  {isDragActive ? "Drop your resume here" : "Upload your resume/CV"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Drag and drop or click to select • PDF, DOC, DOCX • Max 10MB
                </p>
              </div>
              <Button variant="outline" size="sm" type="button">
                Choose File
              </Button>
            </div>
          )}
        </div>

        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium">Accepted formats:</h4>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">PDF</Badge>
            <Badge variant="secondary">DOC</Badge>
            <Badge variant="secondary">DOCX</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}