import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Layout from '@/components/layout/Layout';
import { useHostRecovery } from '@/hooks/useHostRecovery';
import { Shield, Clock, Users, MessageSquare, Copy, Check, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const SanctuaryRecover = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [hostToken, setHostToken] = useState('');
  const [copiedToken, setCopiedToken] = useState(false);
  const { isLoading, sanctuaryInfo, mySanctuaries, verifyHostToken, getMySanctuaries } = useHostRecovery();

  // Get token from URL params if present
  useEffect(() => {
    const tokenFromUrl = searchParams.get('hostToken');
    if (tokenFromUrl) {
      setHostToken(tokenFromUrl);
      verifyHostToken(tokenFromUrl);
    }
  }, [searchParams, verifyHostToken]);

  const handleTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hostToken.trim()) {
      verifyHostToken(hostToken.trim());
    }
  };

  const handleViewSanctuary = (sanctuaryId: string) => {
    navigate(`/sanctuary/${sanctuaryId}/host?hostToken=${encodeURIComponent(hostToken)}`);
  };

  const copyTokenToClipboard = () => {
    navigator.clipboard.writeText(hostToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const loadMySanctuaries = () => {
    if (hostToken.trim()) {
      getMySanctuaries(hostToken.trim());
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-3 rounded-full bg-primary/10 text-primary">
                <Shield className="h-8 w-8" />
              </div>
            </div>
            <h1 className="text-3xl font-bold">Recover Your Sanctuary</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Enter your host token to regain access to your sanctuary spaces and anonymous inbox
            </p>
          </div>

          {/* Token Input Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Host Token Verification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleTokenSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="hostToken">Host Token</Label>
                  <div className="flex gap-2">
                    <Input
                      id="hostToken"
                      type="text"
                      placeholder="Enter your host token..."
                      value={hostToken}
                      onChange={(e) => setHostToken(e.target.value)}
                      className="font-mono"
                    />
                    {hostToken && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={copyTokenToClipboard}
                      >
                        {copiedToken ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    This is the secure token provided when you created your sanctuary
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={!hostToken.trim() || isLoading}>
                    {isLoading ? 'Verifying...' : 'Verify Token'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={loadMySanctuaries}
                    disabled={!hostToken.trim() || isLoading}
                  >
                    View All My Sanctuaries
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Recovered Sanctuary Info */}
          {sanctuaryInfo && (
            <Card className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20">
              <CardHeader>
                <CardTitle className="text-green-700 dark:text-green-300 flex items-center gap-2">
                  <Check className="h-5 w-5" />
                  Sanctuary Recovered Successfully
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h3 className="font-semibold flex items-center gap-2">
                      {sanctuaryInfo.emoji} {sanctuaryInfo.topic}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {sanctuaryInfo.description || 'No description provided'}
                    </p>
                    <Badge variant="secondary">
                      {sanctuaryInfo.mode === 'anon-inbox' ? 'Anonymous Inbox' : 
                       sanctuaryInfo.mode === 'live-audio' ? 'Live Audio' : 'Text Room'}
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <MessageSquare className="h-4 w-4" />
                      <span>{sanctuaryInfo.submissionsCount} submissions</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4" />
                      <span>{sanctuaryInfo.participantsCount} participants</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4" />
                      <span>Expires {formatDistanceToNow(new Date(sanctuaryInfo.expiresAt), { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>
                <Separator />
                <div className="flex gap-2">
                  <Button onClick={() => handleViewSanctuary(sanctuaryInfo.sanctuaryId)} className="flex items-center gap-2">
                    Enter Sanctuary
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* My Sanctuaries List */}
          {mySanctuaries && mySanctuaries.sanctuaries.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Your Active Sanctuaries ({mySanctuaries.count})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mySanctuaries.sanctuaries.map((sanctuary) => (
                    <div key={sanctuary.sanctuaryId} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <h3 className="font-semibold flex items-center gap-2">
                            {sanctuary.emoji} {sanctuary.topic}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {sanctuary.description || 'No description'}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              {sanctuary.submissionsCount}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {sanctuary.participantsCount}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Expires {formatDistanceToNow(new Date(sanctuary.expiresAt), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          onClick={() => handleViewSanctuary(sanctuary.sanctuaryId)}
                          className="flex items-center gap-1"
                        >
                          Enter
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Help Section */}
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-lg">Need Help?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">
                • Your host token was provided when you first created a sanctuary
              </p>
              <p className="text-sm text-muted-foreground">
                • Host tokens are valid for 48 hours after sanctuary creation
              </p>
              <p className="text-sm text-muted-foreground">
                • If you've lost your token, you'll need to create a new sanctuary
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default SanctuaryRecover;