import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Expert } from '@/types';
import { AdminApi, ExpertApi } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  Loader2,
  CheckCircle,
  XCircle,
  Shield,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';

const ExpertVerification = () => {
  const { toast } = useToast();
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null);
  const [verificationLevel, setVerificationLevel] = useState<'blue' | 'gold' | 'platinum'>('blue');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Real API query for pending experts
  const { 
    data: pendingExperts, 
    isLoading, 
    isError, 
    refetch 
  } = useQuery({
    queryKey: ['pendingExperts'],
    queryFn: () => AdminApi.getPendingExperts().then(res => res.data || []),
  });

  const handleExpertReview = (expert: Expert) => {
    setSelectedExpert(expert);
    setVerificationLevel('blue');
    setIsDialogOpen(true);
  };

  const handleApproval = async (action: 'approved' | 'rejected') => {
    if (!selectedExpert) return;
    
    setIsSubmitting(true);
    
    try {
      // Call the real API to verify the expert
      const response = await AdminApi.verifyExpert(selectedExpert.id, {
        verificationLevel: action === 'approved' ? verificationLevel : 'blue',
        status: action,
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to update expert status');
      }
      
      // Refetch the data to get updated list
      refetch();
      
      toast({
        title: `Expert ${action === 'approved' ? 'approved' : 'rejected'}`,
        description: `${selectedExpert.name} has been ${action === 'approved' ? 'approved' : 'rejected'}.`,
        variant: action === 'approved' ? 'default' : 'destructive',
      });
      
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Action failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderVerificationBadge = (level: Expert['verificationLevel']) => {
    switch (level) {
      case 'blue':
        return (
          <Badge variant="outline" className="bg-veilo-blue-light text-veilo-blue-dark">
            <Shield className="h-3 w-3 mr-1" /> Blue
          </Badge>
        );
      case 'gold':
        return (
          <Badge variant="outline" className="bg-veilo-gold-light text-veilo-gold-dark">
            <ShieldCheck className="h-3 w-3 mr-1" /> Gold
          </Badge>
        );
      case 'platinum':
        return (
          <Badge variant="outline" className="bg-purple-100 text-purple-800">
            <ShieldAlert className="h-3 w-3 mr-1" /> Platinum
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="pending">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">Pending Verification</TabsTrigger>
          <TabsTrigger value="approved">Approved Experts</TabsTrigger>
          <TabsTrigger value="rejected">Rejected Applications</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending" className="mt-6">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-veilo-blue" />
            </div>
          ) : pendingExperts?.filter(e => e.accountStatus === 'pending').length === 0 ? (
            <Card className="bg-gray-50">
              <CardContent className="flex flex-col items-center justify-center py-10">
                <p className="text-gray-500">No pending expert applications</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {pendingExperts
                ?.filter(expert => expert.accountStatus === 'pending')
                .map((expert) => (
                  <Card key={expert.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between">
                        <div>
                          <CardTitle>{expert.name}</CardTitle>
                          <CardDescription>{expert.specialization}</CardDescription>
                        </div>
                        <div className="h-12 w-12 rounded-full overflow-hidden">
                          <img 
                            src={expert.avatarUrl} 
                            alt={expert.name} 
                            className="h-full w-full object-cover"
                          />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Bio</h4>
                          <p className="text-sm">{expert.bio.substring(0, 150)}...</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Pricing Model</h4>
                          <p className="text-sm capitalize">{expert.pricingModel} {expert.pricingDetails ? `(${expert.pricingDetails})` : ''}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Topics</h4>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {expert.topicsHelped.map((topic) => (
                              <Badge key={topic} variant="outline" className="bg-veilo-blue-light text-veilo-blue-dark">
                                {topic}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2 pt-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-destructive border-destructive hover:bg-destructive/10"
                        onClick={() => handleExpertReview(expert)}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                      <Button 
                        size="sm"
                        className="bg-veilo-blue hover:bg-veilo-blue-dark"
                        onClick={() => handleExpertReview(expert)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Review & Approve
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="approved" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            {pendingExperts
              ?.filter(expert => expert.accountStatus === 'approved')
              .map((expert) => (
                <Card key={expert.id}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between">
                      <div>
                        <CardTitle>{expert.name}</CardTitle>
                        <CardDescription>{expert.specialization}</CardDescription>
                      </div>
                      <div className="h-12 w-12 rounded-full overflow-hidden">
                        <img 
                          src={expert.avatarUrl} 
                          alt={expert.name} 
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Bio</h4>
                        <p className="text-sm">{expert.bio.substring(0, 150)}...</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Verification Level</h4>
                        <div className="mt-1">
                          {renderVerificationBadge(expert.verificationLevel)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
          {pendingExperts?.filter(e => e.accountStatus === 'approved').length === 0 && (
            <Card className="bg-gray-50">
              <CardContent className="flex flex-col items-center justify-center py-10">
                <p className="text-gray-500">No approved experts yet</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="rejected" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            {pendingExperts
              ?.filter(expert => expert.accountStatus === 'rejected')
              .map((expert) => (
                <Card key={expert.id}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between">
                      <div>
                        <CardTitle>{expert.name}</CardTitle>
                        <CardDescription>{expert.specialization}</CardDescription>
                      </div>
                      <div className="h-12 w-12 rounded-full overflow-hidden">
                        <img 
                          src={expert.avatarUrl} 
                          alt={expert.name} 
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Bio</h4>
                        <p className="text-sm">{expert.bio.substring(0, 150)}...</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
          {pendingExperts?.filter(e => e.accountStatus === 'rejected').length === 0 && (
            <Card className="bg-gray-50">
              <CardContent className="flex flex-col items-center justify-center py-10">
                <p className="text-gray-500">No rejected applications</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Expert Review Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Expert Review: {selectedExpert?.name}</DialogTitle>
            <DialogDescription>
              Review the expert's profile and assign a verification level before approving.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div>
              <h4 className="font-medium mb-1">Verification Level</h4>
              <RadioGroup
                value={verificationLevel}
                onValueChange={(value: any) => setVerificationLevel(value)}
                className="flex flex-col space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="blue" id="blue" />
                  <Label htmlFor="blue" className="cursor-pointer flex items-center">
                    <Shield className="h-4 w-4 text-veilo-blue-dark mr-1" />
                    <span className="font-medium">Blue</span>
                    <span className="text-sm text-gray-500 ml-2">
                      (ID Verified)
                    </span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="gold" id="gold" />
                  <Label htmlFor="gold" className="cursor-pointer flex items-center">
                    <ShieldCheck className="h-4 w-4 text-veilo-gold-dark mr-1" />
                    <span className="font-medium">Gold</span>
                    <span className="text-sm text-gray-500 ml-2">
                      (Credentials Verified)
                    </span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="platinum" id="platinum" />
                  <Label htmlFor="platinum" className="cursor-pointer flex items-center">
                    <ShieldAlert className="h-4 w-4 text-purple-700 mr-1" />
                    <span className="font-medium">Platinum</span>
                    <span className="text-sm text-gray-500 ml-2">
                      (Platform Certified)
                    </span>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
          
          <DialogFooter className="flex space-x-2 justify-end">
            <Button
              variant="outline"
              className="border-destructive text-destructive hover:bg-destructive/10"
              onClick={() => handleApproval('rejected')}
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <XCircle className="h-4 w-4 mr-1" />}
              Reject Application
            </Button>
            <Button
              className="bg-veilo-blue hover:bg-veilo-blue-dark"
              onClick={() => handleApproval('approved')}
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle className="h-4 w-4 mr-1" />}
              Approve Expert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExpertVerification;
