import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import Layout from '@/components/layout/Layout';
import { MessageCircle, Send, Clock, Eye, Heart, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SanctuaryApi } from '@/services/api';
import { SEOHead } from '@/components/seo/SEOHead';

interface SanctuarySession {
  id: string;
  topic: string;
  description?: string;
  emoji?: string;
  expiresAt: string;
  participantCount: number;
}

const SanctuarySubmit = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { toast } = useToast();
  const [session, setSession] = useState<SanctuarySession | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [alias, setAlias] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchSession = async () => {
    if (!sessionId) return;
    
    try {
      setLoading(true);
      const response = await SanctuaryApi.getSession(sessionId);
      
      if (response.success && response.data) {
        setSession(response.data);
      } else {
        setError(response.error || 'Session not found');
      }
    } catch (err) {
      console.error('Fetch session error:', err);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      toast({
        variant: 'destructive',
        title: 'Message required',
        description: 'Please enter your message.',
      });
      return;
    }

    try {
      setSubmitting(true);
      const response = await SanctuaryApi.submitMessage(
        sessionId,
        alias.trim() || `Anonymous ${Date.now()}`,
        message.trim()
      );
      
      if (response.success) {
        setSubmitted(true);
        toast({
          title: "Message sent!",
          description: "Your anonymous message has been delivered.",
        });
      } else {
        throw new Error(response.error || 'Failed to send message');
      }
    } catch (err: any) {
      console.error('Submit error:', err);
      toast({
        variant: 'destructive',
        title: 'Failed to send',
        description: err.message || 'Something went wrong. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, [sessionId]);

  if (loading) {
    return (
      <Layout>
        <div className="container py-10">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-pulse text-center">
              <div className="w-12 h-12 bg-primary/20 rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading sanctuary...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !session) {
    return (
      <Layout>
        <div className="container py-10">
          <div className="text-center min-h-[400px] flex flex-col items-center justify-center">
            <MessageCircle className="w-16 h-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">Sanctuary not found</h2>
            <p className="text-muted-foreground mb-6">{error || 'This sanctuary session may have expired or been removed.'}</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (submitted) {
    return (
      <Layout>
        <div className="container py-10">
          <div className="text-center min-h-[400px] flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Message delivered!</h2>
            <p className="text-muted-foreground mb-6">
              Your anonymous message has been sent successfully.
            </p>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center">
                <Eye className="w-4 h-4 mr-1" />
                Private & Anonymous
              </div>
              <div className="flex items-center">
                <Heart className="w-4 h-4 mr-1" />
                Safe Space
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEOHead
        title={`Send Anonymous Message - ${session?.topic || 'Sanctuary'} | Veilo`}
        description="Share your thoughts safely and anonymously in this judgment-free sanctuary space"
        keywords="anonymous message, safe space, mental health support, judgment-free"
      />
      <div className="container py-6 max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Badge variant="outline" className="text-sm">
              <MessageCircle className="w-3 h-3 mr-1" />
              Anonymous Sanctuary
            </Badge>
          </div>
          <h1 className="text-3xl font-bold mb-2">Send Anonymous Message</h1>
          <p className="text-muted-foreground">
            Share your thoughts safely and anonymously
          </p>
        </div>

        {/* Session Info */}
        <Card className="mb-6">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {session.emoji && (
                  <span className="text-2xl">{session.emoji}</span>
                )}
                <div>
                  <CardTitle className="text-lg">{session.topic}</CardTitle>
                  {session.description && (
                    <p className="text-sm text-muted-foreground mt-1">{session.description}</p>
                  )}
                </div>
              </div>
              <Badge variant="secondary" className="text-xs">
                <Clock className="w-3 h-3 mr-1" />
                Expires {new Date(session.expiresAt).toLocaleDateString()}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Message Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageCircle className="w-5 h-5 mr-2" />
              Your Message
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Your identity will remain completely anonymous. Only your message will be visible.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="alias" className="block text-sm font-medium mb-1">
                  Anonymous Alias (Optional)
                </label>
                <Input
                  id="alias"
                  type="text"
                  placeholder="e.g., A Friend, Someone Who Cares..."
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                  maxLength={30}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Leave blank for a random anonymous name
                </p>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium mb-1">
                  Your Message *
                </label>
                <Textarea
                  id="message"
                  placeholder="Share your thoughts, feelings, or message here..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  maxLength={2000}
                  rows={6}
                  className="w-full resize-none"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {message.length}/2000 characters
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <Heart className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-800 dark:text-blue-200">Safe & Anonymous</p>
                    <p className="text-blue-700 dark:text-blue-300 mt-1">
                      This is a judgment-free space. Your message will be delivered anonymously and treated with care and respect.
                    </p>
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={submitting || !message.trim()}
                className="w-full"
              >
                {submitting ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Sending...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Send className="w-4 h-4 mr-2" />
                    Send Anonymous Message
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Powered by Veilo • Your privacy and safety are our priority
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default SanctuarySubmit;