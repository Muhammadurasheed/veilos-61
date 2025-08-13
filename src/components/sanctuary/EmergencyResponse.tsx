import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  AlertTriangle, 
  Phone, 
  Shield, 
  MessageSquare, 
  Clock, 
  MapPin,
  Heart,
  Brain,
  Users,
  FileText,
  Camera,
  Mic
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface EmergencyContact {
  id: string;
  name: string;
  role: string;
  phone: string;
  available: boolean;
  responseTime: string;
}

interface EmergencyResponseProps {
  sessionId: string;
  participantId?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  isActive: boolean;
  onClose: () => void;
  onEscalate: (level: string) => void;
}

interface CrisisStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  required: boolean;
}

const EmergencyResponse = ({ sessionId, participantId, severity, isActive, onClose, onEscalate }: EmergencyResponseProps) => {
  const { toast } = useToast();
  const [emergencyContacts] = useState<EmergencyContact[]>([
    {
      id: '1',
      name: 'Dr. Sarah Ahmed',
      role: 'Crisis Counselor',
      phone: '+1-555-CRISIS',
      available: true,
      responseTime: '< 2 minutes'
    },
    {
      id: '2',
      name: 'Emergency Hotline',
      role: '24/7 Crisis Support',
      phone: '988 (Suicide & Crisis)',
      available: true,
      responseTime: 'Immediate'
    },
    {
      id: '3',
      name: 'Local Emergency',
      role: 'Emergency Services',
      phone: '911',
      available: true,
      responseTime: '5-10 minutes'
    }
  ]);

  const [crisisSteps, setCrisisSteps] = useState<CrisisStep[]>([
    {
      id: '1',
      title: 'Ensure Immediate Safety',
      description: 'Check if participant is in immediate danger',
      completed: false,
      required: true
    },
    {
      id: '2',
      title: 'Establish Private Communication',
      description: 'Move to private channel with participant',
      completed: false,
      required: true
    },
    {
      id: '3',
      title: 'Contact Crisis Professional',
      description: 'Connect with trained crisis counselor',
      completed: false,
      required: true
    },
    {
      id: '4',
      title: 'Document Incident',
      description: 'Record details for follow-up care',
      completed: false,
      required: false
    }
  ]);

  const [showContactDialog, setShowContactDialog] = useState(false);
  const [selectedContact, setSelectedContact] = useState<EmergencyContact | null>(null);
  const [incidentNotes, setIncidentNotes] = useState('');
  const [isDocumenting, setIsDocumenting] = useState(false);

  const handleStepComplete = useCallback((stepId: string) => {
    setCrisisSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, completed: true } : step
    ));
    
    toast({
      title: "Step completed",
      description: "Crisis response step marked as complete",
    });
  }, [toast]);

  const handleContactProfessional = useCallback(async (contact: EmergencyContact) => {
    setSelectedContact(contact);
    setShowContactDialog(true);
    
    // Log the contact attempt
    try {
      await fetch(`/api/live-sanctuary/${sessionId}/emergency/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          contactId: contact.id,
          participantId,
          severity,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Failed to log emergency contact:', error);
    }
  }, [sessionId, participantId, severity]);

  const handleDocumentIncident = useCallback(async () => {
    if (!incidentNotes.trim()) {
      toast({
        title: "Documentation required",
        description: "Please add incident notes before submitting",
        variant: "destructive"
      });
      return;
    }

    setIsDocumenting(true);
    try {
      const response = await fetch(`/api/live-sanctuary/${sessionId}/emergency/document`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          participantId,
          severity,
          notes: incidentNotes,
          stepsCompleted: crisisSteps.filter(s => s.completed).map(s => s.id),
          timestamp: new Date().toISOString()
        })
      });

      const result = await response.json();
      
      if (result.success) {
        handleStepComplete('4');
        toast({
          title: "Incident documented",
          description: "Emergency response has been recorded for follow-up",
        });
        setIncidentNotes('');
      }
    } catch (error) {
      toast({
        title: "Documentation failed",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsDocumenting(false);
    }
  }, [sessionId, participantId, severity, incidentNotes, crisisSteps, toast, handleStepComplete]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  if (!isActive) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className={`p-6 rounded-t-lg ${getSeverityColor(severity)}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-8 w-8" />
              <div>
                <h1 className="text-2xl font-bold">Emergency Response Protocol</h1>
                <p className="text-sm opacity-90">
                  Crisis detected - Immediate intervention required
                </p>
              </div>
            </div>
            <Badge variant="destructive" className="text-lg px-4 py-2">
              {severity.toUpperCase()}
            </Badge>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Crisis Response Steps */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Response Protocol
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {crisisSteps.map((step, index) => (
                  <div key={step.id} className="flex items-start space-x-3">
                    <div className={`
                      flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium
                      ${step.completed 
                        ? 'bg-green-500 text-white border-green-500' 
                        : 'bg-white text-gray-500 border-gray-300'
                      }
                    `}>
                      {step.completed ? '✓' : index + 1}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className={`font-medium ${step.completed ? 'text-green-700' : 'text-gray-800'}`}>
                          {step.title}
                          {step.required && <span className="text-red-500 ml-1">*</span>}
                        </h3>
                        {!step.completed && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStepComplete(step.id)}
                          >
                            Complete
                          </Button>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contacts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Phone className="h-5 w-5 mr-2" />
                Emergency Contacts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {emergencyContacts.map((contact) => (
                  <div key={contact.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-800">{contact.name}</h3>
                        <p className="text-sm text-gray-600">{contact.role}</p>
                        <p className="text-sm text-blue-600 font-medium">{contact.phone}</p>
                      </div>
                      
                      <div className="text-right">
                        <Badge variant={contact.available ? "default" : "secondary"} className="mb-2">
                          {contact.available ? 'Available' : 'Busy'}
                        </Badge>
                        <p className="text-xs text-gray-500">{contact.responseTime}</p>
                        <Button
                          size="sm"
                          onClick={() => handleContactProfessional(contact)}
                          className="mt-2"
                          disabled={!contact.available}
                        >
                          Contact
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Incident Documentation */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Incident Documentation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea
                  value={incidentNotes}
                  onChange={(e) => setIncidentNotes(e.target.value)}
                  placeholder="Document the incident details, participant state, actions taken, and any relevant information for follow-up care..."
                  rows={4}
                  className="w-full"
                />
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>Time: {new Date().toLocaleString()}</span>
                    <span>•</span>
                    <span>Session: {sessionId}</span>
                    {participantId && (
                      <>
                        <span>•</span>
                        <span>Participant: {participantId}</span>
                      </>
                    )}
                  </div>
                  
                  <Button
                    onClick={handleDocumentIncident}
                    disabled={isDocumenting || !incidentNotes.trim()}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isDocumenting ? 'Documenting...' : 'Document Incident'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-gray-50 rounded-b-lg flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => onEscalate('high')}
              className="text-orange-600 border-orange-300"
            >
              Escalate to High Priority
            </Button>
            <Button
              variant="outline"
              onClick={() => onEscalate('critical')}
              className="text-red-600 border-red-300"
            >
              Escalate to Critical
            </Button>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={onClose}>
              Close Protocol
            </Button>
            <Button 
              onClick={onClose}
              className="bg-green-600 hover:bg-green-700"
              disabled={crisisSteps.filter(s => s.required).some(s => !s.completed)}
            >
              Mark Resolved
            </Button>
          </div>
        </div>
      </div>

      {/* Contact Confirmation Dialog */}
      <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Phone className="h-5 w-5 mr-2 text-green-600" />
              Contacting {selectedContact?.name}
            </DialogTitle>
            <DialogDescription>
              Connecting you with professional crisis support
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-medium text-green-800 mb-2">
                {selectedContact?.role}
              </h3>
              <p className="text-sm text-green-700 mb-3">
                Response time: {selectedContact?.responseTime}
              </p>
              <p className="text-lg font-bold text-green-800">
                📞 {selectedContact?.phone}
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowContactDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                setShowContactDialog(false);
                handleStepComplete('3');
                toast({
                  title: "Professional contacted",
                  description: `Connected with ${selectedContact?.name}`,
                });
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              Confirm Contact Made
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default EmergencyResponse;