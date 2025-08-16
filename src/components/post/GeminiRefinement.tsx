
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { Loader2, Sparkles, RotateCcw, Check } from 'lucide-react';
import { GeminiApi } from '@/services/api';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface GeminiRefinementProps {
  originalContent: string;
  onAcceptRefinement: (refinedContent: string) => void;
  onCancel: () => void;
}

const GeminiRefinement: React.FC<GeminiRefinementProps> = ({
  originalContent,
  onAcceptRefinement,
  onCancel
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [refinedContent, setRefinedContent] = useState('');
  const [violation, setViolation] = useState<{reason: string} | null>(null);
  const [editingRefined, setEditingRefined] = useState(false);

  useEffect(() => {
    // Auto-start refinement when component mounts
    handleRefine();
  }, []);

  const handleRefine = async () => {
    setIsLoading(true);
    setViolation(null);
    
    try {
      const response = await GeminiApi.refinePost(originalContent, 'supportive');
      
      if (response.success && response.data && (response.data as any).refinedText) {
        setRefinedContent((response.data as any).refinedText);
        toast({
          title: "Content refined",
          description: "Gemini has polished your post.",
          variant: "default",
        });
      } else if (!response.success && (response.data as any)?.violation) {
        const reason = (response.data as any).reason || 'Content violates community guidelines.';
        setViolation({ reason });
        toast({
          variant: 'destructive',
          title: 'Content needs review',
          description: reason,
        });
      } else {
        // Set original content as fallback when refinement fails
        setRefinedContent(originalContent);
        toast({
          title: "Using original content",
          description: "Content refinement is temporarily unavailable. Your post will use your original text.",
          variant: "default",
        });
      }
    } catch (error: any) {
      console.error('Content refinement error:', error);
      
      // Handle rate limiting gracefully
      if (error.response?.status === 429) {
        toast({
          variant: 'default',
          title: 'Refinement temporarily unavailable',
          description: 'Too many requests. You can post your content as-is or try again later.',
        });
      } else {
        // Set original content as fallback for all error cases
        setRefinedContent(originalContent);
        toast({
          title: 'Using original content',
          description: 'Content refinement failed. Your post will use your original text.',
          variant: 'default',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptRefinement = () => {
    onAcceptRefinement(refinedContent);
  };

  const handleRevert = () => {
    setRefinedContent(originalContent);
    setEditingRefined(true);
  };

  const handleEditRefined = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setRefinedContent(e.target.value);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto animate-scale-in">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Sparkles className="h-5 w-5 mr-2 text-purple-500" />
          Refine With Gemini AI
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {violation ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Content Violation Detected</AlertTitle>
            <AlertDescription>
              {violation.reason}
            </AlertDescription>
          </Alert>
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center p-8 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
            <p className="text-sm text-gray-500">Gemini is refining your post...</p>
            <div className="text-xs text-gray-400 max-w-md text-center">
              We're enhancing clarity, fixing grammar, and improving the tone while preserving your original meaning.
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-1">Original Content:</h3>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                  <p className="whitespace-pre-wrap text-sm">{originalContent}</p>
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-medium">Refined Content:</h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setEditingRefined(!editingRefined)}
                    className="text-xs"
                  >
                    {editingRefined ? 'Preview' : 'Edit'}
                  </Button>
                </div>
                
                {editingRefined ? (
                  <Textarea 
                    value={refinedContent} 
                    onChange={handleEditRefined}
                    className="min-h-[120px]"
                  />
                ) : (
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-md border border-purple-100 dark:border-purple-800/30">
                    <p className="whitespace-pre-wrap text-sm">{refinedContent}</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        
        {refinedContent && !violation && !isLoading && (
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleRevert} disabled={editingRefined}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Revert to Original
            </Button>
            <Button 
              onClick={handleAcceptRefinement}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Check className="mr-2 h-4 w-4" />
              Use Refined Content
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default GeminiRefinement;
