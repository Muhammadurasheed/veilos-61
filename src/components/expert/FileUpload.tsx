
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Paperclip, Upload, X, Check, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface FileUploadProps {
  label: string;
  description: string;
  acceptedFileTypes: string;
  onUpload: (file: File) => Promise<void> | void;
}

export const FileUpload = ({
  label,
  description,
  acceptedFileTypes,
  onUpload,
}: FileUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploaded, setIsUploaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [filename, setFilename] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      // Clean up any file references when component unmounts
      if (file) {
        URL.revokeObjectURL(URL.createObjectURL(file));
      }
    };
  }, [file]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    if (!selectedFile) return;
    
    // Reset states
    setError(null);
    setIsUploaded(false);
    setFilename(selectedFile.name);
    
    // Validate file type
    const fileType = selectedFile.type;
    const acceptedTypes = acceptedFileTypes.split(',').map(type => 
      type.trim().startsWith('.') ? type.trim().substring(1) : type.trim()
    );
    
    const isValidType = acceptedTypes.some(type => {
      if (type.includes('/*')) {
        // Handle wildcard mime types like 'image/*'
        const mainType = type.split('/')[0];
        return fileType.startsWith(`${mainType}/`);
      } else if (type.startsWith('.')) {
        // Handle file extensions like '.pdf'
        return selectedFile.name.toLowerCase().endsWith(type);
      } else {
        // Handle specific mime types
        return fileType === type;
      }
    });
    
    if (!isValidType) {
      setError(`Please upload a valid file type (${acceptedFileTypes})`);
      e.target.value = '';
      setFile(null);
      return;
    }
    
    // Check file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10MB limit');
      e.target.value = '';
      setFile(null);
      return;
    }
    
    setFile(selectedFile);
    
    // Auto-upload the file once it's selected and validated
    uploadFile(selectedFile);
  };

  const uploadFile = async (selectedFile: File) => {
    if (!selectedFile) return;
    
    setIsUploading(true);
    setError(null);
    
    try {
      await onUpload(selectedFile);
      setIsUploaded(true);
      toast({
        title: "File uploaded successfully",
        description: `${selectedFile.name} has been uploaded.`,
      });
    } catch (error) {
      console.error('Upload error:', error);
      setError(error instanceof Error ? error.message : 'Error uploading file');
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error instanceof Error ? error.message : 'Error uploading file',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setFilename(null);
    setIsUploaded(false);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <Label htmlFor={`file-${label}`}>{label}</Label>
      
      <div className="border border-gray-200 rounded-lg p-4 bg-white bg-opacity-50">
        {!file ? (
          <>
            <div className="flex flex-col items-center justify-center py-4">
              <Paperclip className="h-8 w-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 mb-2">{description}</p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Select File
                </Button>
                <span className="text-xs text-gray-500">Max size: 10MB</span>
              </div>
            </div>
            <Input
              id={`file-${label}`}
              type="file"
              ref={fileInputRef}
              accept={acceptedFileTypes}
              onChange={handleFileChange}
              className="hidden"
            />
          </>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-veilo-blue-light p-2 rounded-md">
                <Paperclip className="h-5 w-5 text-veilo-blue" />
              </div>
              <div>
                <p className="text-sm font-medium">{filename || file.name}</p>
                <p className="text-xs text-gray-500">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {!isUploaded ? (
                <>
                  {isUploading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-xs">Uploading...</span>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={clearFile}
                      className="text-gray-500"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </>
              ) : (
                <div className="flex items-center text-green-600">
                  <Check className="h-5 w-5 mr-1" />
                  <span className="text-sm">Uploaded</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {error && (
        <p className="text-destructive text-sm">{error}</p>
      )}
    </div>
  );
};
