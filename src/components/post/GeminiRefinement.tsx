
import React, { useState } from 'react';
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

  const handleRefine = async () => {
    setIsLoading(true);
    
    try {
      const response = await GeminiApi.refinePost(originalContent);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to refine content');
      }
      
      // Check if there's a violation
      if (response.data.violation) {
        setViolation({
          reason: response.data.reason || 'This content may violate Veilo\'s community guidelines.'
        });
        setIsLoading(false);
        return;
      }
      
      setRefinedContent(response.data.refinedText);
    } catch (error) {
      console.error('Content refinement error:', error);
      toast({
        variant: 'destructive',
        title: 'Refinement failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
      });
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
    <Card className="w-full max-w-2xl mx-auto">
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
        ) : (
          <>
            {!refinedContent ? (
              <>
                <div className="text-sm text-gray-500 mb-2">
                  Gemini AI can help improve your writing by enhancing clarity, tone, and engagement without changing the core meaning.
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                  <p className="whitespace-pre-wrap">{originalContent}</p>
                </div>
                <Button
                  className="w-full"
                  onClick={handleRefine}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Refining...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Refine with Gemini
                    </>
                  )}
                </Button>
              </>
            ) : (
              <div className="space-y-4">
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
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                    <p className="whitespace-pre-wrap">{refinedContent}</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        
        {refinedContent && !violation && (
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleRevert} disabled={editingRefined}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Revert to Original
            </Button>
            <Button onClick={handleAcceptRefinement}>
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
