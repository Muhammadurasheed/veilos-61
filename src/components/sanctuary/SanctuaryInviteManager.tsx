import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import {
  Link,
  Copy,
  Share2,
  Users,
  Clock,
  Trash2,
  Plus,
  ExternalLink,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Invitation {
  id: string;
  inviteCode: string;
  invitationUrl: string;
  maxUses: number | null;
  usedCount: number;
  expiresAt: string;
  createdAt: string;
  restrictions: {
    requiresApproval: boolean;
    allowAnonymous: boolean;
    maxParticipantsViaInvite: number | null;
  };
}

interface SanctuaryInviteManagerProps {
  sessionId: string;
  sessionTopic: string;
  isHost: boolean;
  onClose?: () => void;
}

export const SanctuaryInviteManager: React.FC<SanctuaryInviteManagerProps> = ({
  sessionId,
  sessionTopic,
  isHost,
  onClose
}) => {
  const { toast } = useToast();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newInvite, setNewInvite] = useState({
    maxUses: '',
    expirationHours: '24',
    requiresApproval: false
  });

  useEffect(() => {
    if (isHost) {
      fetchInvitations();
    }
  }, [sessionId, isHost]);

  const fetchInvitations = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('veilo-auth-token');
      const response = await fetch(`/api/sanctuary-invitations/sessions/${sessionId}/invitations`, {
        headers: {
          'x-auth-token': token || '',
        }
      });

      const data = await response.json();
      if (data.success) {
        setInvitations(data.data.invitations);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Failed to fetch invitations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load invitations',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const createInvitation = async () => {
    setCreating(true);
    try {
      const token = localStorage.getItem('veilo-auth-token');
      const response = await fetch(`/api/sanctuary-invitations/sessions/${sessionId}/invitations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token || '',
        },
        body: JSON.stringify({
          maxUses: newInvite.maxUses ? parseInt(newInvite.maxUses) : null,
          expirationHours: parseInt(newInvite.expirationHours),
          requiresApproval: newInvite.requiresApproval
        })
      });

      const data = await response.json();
      if (data.success) {
        const newInvitation = data.data.invitation;
        setInvitations(prev => [newInvitation, ...prev]);
        setShowCreateForm(false);
        setNewInvite({
          maxUses: '',
          expirationHours: '24',
          requiresApproval: false
        });
        
        toast({
          title: 'Invitation Created',
          description: 'Invitation link has been generated successfully',
        });

        // Auto-copy the first invitation URL
        copyToClipboard(newInvitation.invitationUrl);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Failed to create invitation:', error);
      toast({
        title: 'Error',
        description: 'Failed to create invitation',
        variant: 'destructive'
      });
    } finally {
      setCreating(false);
    }
  };

  const deactivateInvitation = async (inviteCode: string) => {
    try {
      const token = localStorage.getItem('veilo-auth-token');
      const response = await fetch(`/api/sanctuary-invitations/invitations/${inviteCode}`, {
        method: 'DELETE',
        headers: {
          'x-auth-token': token || '',
        }
      });

      const data = await response.json();
      if (data.success) {
        setInvitations(prev => prev.filter(inv => inv.inviteCode !== inviteCode));
        toast({
          title: 'Invitation Deactivated',
          description: 'The invitation link has been disabled',
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Failed to deactivate invitation:', error);
      toast({
        title: 'Error',
        description: 'Failed to deactivate invitation',
        variant: 'destructive'
      });
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: 'Copied',
        description: 'Invitation link copied to clipboard',
      });
    } catch (error) {
      console.error('Failed to copy:', error);
      toast({
        title: 'Error',
        description: 'Failed to copy link',
        variant: 'destructive'
      });
    }
  };

  const shareInvitation = async (invitation: Invitation) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join "${sessionTopic}" Sanctuary`,
          text: `You're invited to join a live audio sanctuary session: "${sessionTopic}"`,
          url: invitation.invitationUrl
        });
      } catch (error) {
        console.error('Failed to share:', error);
        copyToClipboard(invitation.invitationUrl);
      }
    } else {
      copyToClipboard(invitation.invitationUrl);
    }
  };

  const formatExpirationTime = (expiresAt: string) => {
    const expiry = new Date(expiresAt);
    const now = new Date();
    const diff = expiry.getTime() - now.getTime();
    
    if (diff < 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    }
    return `${minutes}m remaining`;
  };

  if (!isHost) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Sanctuary Invitations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Only the sanctuary host can manage invitations.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Link className="h-5 w-5" />
              Sanctuary Invitations
            </CardTitle>
            <CardDescription>
              Share invitation links to let others join your sanctuary
            </CardDescription>
          </div>
          {!showCreateForm && (
            <Button
              onClick={() => setShowCreateForm(true)}
              size="sm"
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Invite
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Create Invitation Form */}
        {showCreateForm && (
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-lg">Create New Invitation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxUses">Max Uses</Label>
                  <Input
                    id="maxUses"
                    type="number"
                    placeholder="Unlimited"
                    value={newInvite.maxUses}
                    onChange={(e) => setNewInvite(prev => ({ ...prev, maxUses: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty for unlimited uses
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="expirationHours">Expires In (Hours)</Label>
                  <Input
                    id="expirationHours"
                    type="number"
                    value={newInvite.expirationHours}
                    onChange={(e) => setNewInvite(prev => ({ ...prev, expirationHours: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={createInvitation}
                  disabled={creating}
                  className="flex-1"
                >
                  {creating ? 'Creating...' : 'Create Invitation'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Existing Invitations */}
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading invitations...
          </div>
        ) : invitations.length > 0 ? (
          <div className="space-y-3">
            {invitations.map((invitation) => {
              const isExpired = new Date(invitation.expiresAt) < new Date();
              const isUsageLimitReached = invitation.maxUses && invitation.usedCount >= invitation.maxUses;
              
              return (
                <Card key={invitation.id} className={cn(
                  'transition-colors',
                  (isExpired || isUsageLimitReached) && 'opacity-60 border-muted'
                )}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={isExpired || isUsageLimitReached ? 'secondary' : 'default'}
                          className="text-xs"
                        >
                          {isExpired ? 'Expired' : isUsageLimitReached ? 'Limit Reached' : 'Active'}
                        </Badge>
                        <span className="text-sm font-mono text-muted-foreground">
                          #{invitation.inviteCode}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(invitation.invitationUrl)}
                          className="h-8 w-8 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => shareInvitation(invitation)}
                          className="h-8 w-8 p-0"
                        >
                          <Share2 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(invitation.invitationUrl, '_blank')}
                          className="h-8 w-8 p-0"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deactivateInvitation(invitation.inviteCode)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {invitation.usedCount} / {invitation.maxUses || '∞'} uses
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className={cn(
                          isExpired && 'text-destructive'
                        )}>
                          {formatExpirationTime(invitation.expiresAt)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 p-2 bg-muted rounded text-xs font-mono break-all">
                      {invitation.invitationUrl}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Link className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              No invitations created yet
            </p>
            <Button
              onClick={() => setShowCreateForm(true)}
              variant="outline"
            >
              Create Your First Invitation
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
