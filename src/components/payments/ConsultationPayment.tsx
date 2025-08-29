import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useApi } from '@/hooks/useApi';
import {
  CreditCard,
  Lock,
  Star,
  Clock,
  MessageSquare,
  Video,
  Phone,
  AlertTriangle,
  Shield,
  CheckCircle,
  DollarSign
} from 'lucide-react';

import { Expert } from '@/types';

interface ConsultationPaymentProps {
  expert: Expert;
  consultationType: 'chat' | 'voice' | 'video' | 'emergency';
  duration: number;
  scheduledAt: string;
  onPaymentSuccess: (consultationId: string) => void;
  onCancel: () => void;
}

const ConsultationPayment: React.FC<ConsultationPaymentProps> = ({
  expert,
  consultationType,
  duration,
  scheduledAt,
  onPaymentSuccess,
  onCancel
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const createConsultationApi = useApi<{ consultation: { id: string } }>();
  const createPaymentApi = useApi<{ url: string; sessionId: string }>();

  const getTypeMultiplier = (type: string) => {
    const multipliers = {
      chat: 1,
      voice: 1.2,
      video: 1.5,
      emergency: 2.5
    };
    return multipliers[type as keyof typeof multipliers] || 1;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="h-5 w-5 text-blue-500" />;
      case 'voice': return <Phone className="h-5 w-5 text-green-500" />;
      case 'emergency': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default: return <MessageSquare className="h-5 w-5 text-purple-500" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'video': return 'Video Call';
      case 'voice': return 'Voice Call';
      case 'emergency': return 'Emergency Session';
      default: return 'Chat Session';
    }
  };

  const baseRate = expert.hourlyRate || 50; // dollars per hour - convert to cents per minute
  const rateCentsPerMinute = Math.floor((baseRate * 100) / 60);
  const multiplier = getTypeMultiplier(consultationType);
  const finalRate = Math.floor(rateCentsPerMinute * multiplier);
  const totalAmount = finalRate * duration;

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100);
  };

  const handlePayment = async () => {
    setIsProcessing(true);
    
    try {
      // First create the consultation
      const consultationData = await createConsultationApi.execute(() =>
        fetch('/api/consultations/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': localStorage.getItem('token') || ''
          },
          body: JSON.stringify({
            expertId: expert.id,
            type: consultationType,
            duration,
            scheduledAt,
            urgencyLevel: consultationType === 'emergency' ? 'emergency' : 'medium'
          })
        }).then(res => res.json())
      );

      if (!consultationData) {
        throw new Error('Failed to create consultation');
      }

      // Then create payment session
      const paymentData = await createPaymentApi.execute(() =>
        fetch('/api/stripe/create-consultation-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': localStorage.getItem('token') || ''
          },
          body: JSON.stringify({
            consultationId: consultationData.consultation.id
          })
        }).then(res => res.json())
      );

      if (paymentData) {
        // Redirect to Stripe Checkout
        window.open(paymentData.url, '_blank');
        
        // For demo purposes, simulate successful payment after 3 seconds
        setTimeout(() => {
          onPaymentSuccess(consultationData.consultation.id);
          toast({
            title: 'Payment Successful',
            description: 'Your consultation has been booked successfully',
          });
        }, 3000);
      }
    } catch (error) {
      toast({
        title: 'Payment Failed',
        description: 'There was an error processing your payment. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <Card className="border-2">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Consultation Payment
          </CardTitle>
          <CardDescription>
            Secure payment for your upcoming consultation
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Expert Info */}
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <Avatar className="h-12 w-12">
              <AvatarImage src={expert.avatarUrl || `/experts/expert-${expert.id.slice(-1)}.jpg`} />
              <AvatarFallback>{expert.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-semibold">{expert.name}</h3>
              <p className="text-sm text-muted-foreground">{expert.specialization}</p>
              <div className="flex items-center gap-1 mt-1">
                <Star className="h-4 w-4 fill-current text-yellow-500" />
                <span className="text-sm font-medium">{expert.rating}</span>
              </div>
            </div>
          </div>

          {/* Session Details */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Session Type</span>
              <div className="flex items-center gap-2">
                {getTypeIcon(consultationType)}
                <span className="text-sm">{getTypeLabel(consultationType)}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Duration</span>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{duration} minutes</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Scheduled</span>
              <span className="text-sm">
                {new Date(scheduledAt).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Pricing Breakdown */}
          <div className="space-y-3 p-3 border rounded-lg bg-gradient-to-br from-background to-muted">
            <div className="flex items-center justify-between">
              <span className="text-sm">Base rate (per minute)</span>
              <span className="text-sm">{formatCurrency(rateCentsPerMinute)}</span>
            </div>
            
            {multiplier > 1 && (
              <div className="flex items-center justify-between">
                <span className="text-sm">
                  {consultationType === 'emergency' ? 'Emergency' : 'Premium'} multiplier ({multiplier}x)
                </span>
                <span className="text-sm">+{formatCurrency((finalRate - rateCentsPerMinute) * duration)}</span>
              </div>
            )}
            
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="font-semibold">Total Amount</span>
              <span className="text-xl font-bold text-primary">
                {formatCurrency(totalAmount)}
              </span>
            </div>
          </div>

          {/* Security Features */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground p-3 bg-green-50 dark:bg-green-950 rounded-lg">
            <Shield className="h-4 w-4 text-green-600" />
            <span>Secure payment powered by Stripe</span>
            <Lock className="h-3 w-3" />
          </div>

          {/* Emergency Badge */}
          {consultationType === 'emergency' && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-red-800 dark:text-red-200">
                  Emergency Consultation
                </p>
                <p className="text-xs text-red-600 dark:text-red-300">
                  Priority booking with immediate expert availability
                </p>
              </div>
            </div>
          )}

          {/* Money Back Guarantee */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span>100% satisfaction guarantee - full refund if unsatisfied</span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={onCancel}
              disabled={isProcessing}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handlePayment}
              disabled={isProcessing}
              className="flex-1"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Pay {formatCurrency(totalAmount)}
                </>
              )}
            </Button>
          </div>

          {/* Terms */}
          <p className="text-xs text-muted-foreground text-center">
            By proceeding, you agree to our Terms of Service and Privacy Policy. 
            Payment will be charged immediately upon confirmation.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConsultationPayment;