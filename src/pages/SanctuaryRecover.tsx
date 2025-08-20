import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Layout from '@/components/layout/Layout';
import { Shield, Mail, Key, Home, ArrowLeft } from 'lucide-react';

interface SanctuarySession {
  id: string;
  topic: string;
  description?: string;
  emoji?: string;
  mode: string;
  createdAt: string;
  expiresAt: string;
  submissionCount: number;
  participantCount: number;
  lastActivity: string;
  timeRemaining: number;
}

const SanctuaryRecover: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [hostToken, setHostToken] = useState('');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sanctuary, setSanctuary] = useState<SanctuarySession | null>(null);

  useEffect(() => {
    // Check if we already have a host token in localStorage
    if (sessionId) {
      const storedToken = localStorage.getItem(`sanctuary-host-${sessionId}`);
      if (storedToken) {
        // Automatically attempt recovery with stored token
        attemptTokenRecovery(storedToken);
      }
    }
  }, [sessionId]);

  const attemptTokenRecovery = async (token: string) => {
    try {
      setLoading(true);
      const apiUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/api/host-recovery/recover-by-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hostToken: token,
          sanctuaryId: sessionId
        }),
      });

      const data = await response.json();
      
      if (data.success && data.sanctuary) {
        // Store the token again and redirect to inbox
        localStorage.setItem(`sanctuary-host-${sessionId}`, token);
        navigate(`/sanctuary/inbox/${sessionId}`);
        
        toast({
          title: "Sanctuary recovered!",
          description: "Redirecting to your inbox...",
        });
      } else {
        throw new Error(data.error || 'Token recovery failed');
      }
    } catch (error) {
      console.error('Token recovery error:', error);
      // Don't show error toast for automatic recovery attempts
    } finally {
      setLoading(false);
    }
  };

  const handleTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hostToken.trim()) {
      toast({
        title: "Host token required",
        description: "Please enter your sanctuary host token.",
        variant: "destructive"
      });
      return;
    }

    await attemptTokenRecovery(hostToken.trim());
  };

  const handleEmailRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!recoveryEmail.trim()) {
      toast({
        title: "Email required",
        description: "Please enter your recovery email.",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      const apiUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/api/host-recovery/recover-by-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: recoveryEmail.trim(),
          sanctuaryId: sessionId
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Recovery email sent!",
          description: "Check your email for recovery instructions.",
        });
      } else {
        throw new Error(data.error || 'Email recovery failed');
      }
    } catch (error: any) {
      toast({
        title: "Recovery failed",
        description: error.message || "Unable to send recovery email",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container py-16">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-veilo-purple" />
                Recover Sanctuary Access
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Enter your host token or email to regain access to your sanctuary inbox.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Host Token Recovery */}
              <form onSubmit={handleTokenSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="hostToken" className="flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    Host Token
                  </Label>
                  <Input
                    id="hostToken"
                    type="text"
                    placeholder="Enter your sanctuary host token"
                    value={hostToken}
                    onChange={(e) => setHostToken(e.target.value)}
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground">
                    The token provided when you created the sanctuary
                  </p>
                </div>
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? 'Recovering...' : 'Recover with Token'}
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              {/* Email Recovery */}
              <form onSubmit={handleEmailRecovery} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="recoveryEmail" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Recovery Email
                  </Label>
                  <Input
                    id="recoveryEmail"
                    type="email"
                    placeholder="Enter your recovery email"
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground">
                    The email you provided when creating the sanctuary
                  </p>
                </div>
                <Button 
                  type="submit" 
                  variant="outline"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? 'Sending...' : 'Send Recovery Email'}
                </Button>
              </form>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Home
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => navigate('/sanctuary')}
                    className="flex items-center gap-2"
                  >
                    <Home className="h-4 w-4" />
                    Create New
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default SanctuaryRecover;