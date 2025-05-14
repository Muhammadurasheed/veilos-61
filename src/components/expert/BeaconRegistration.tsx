import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { FileUpload } from '@/components/expert/FileUpload';
import { Calendar, Check, ChevronRight, Shield, Upload, MessageSquare, Video, Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ExpertApi, UserApi } from '@/services/api';
import { useUserContext } from '@/contexts/UserContext';
import { ApiExpertRegisterRequest } from '@/types';

const expertFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  specialization: z.string().min(3, { message: 'Please specify your area of expertise.' }),
  bio: z.string().min(50, { message: 'Please provide a detailed bio (at least 50 characters).' }),
  pricingModel: z.enum(['free', 'donation', 'fixed']),
  pricingDetails: z.string().optional(),
  phoneNumber: z.string().optional(),
  voiceMasking: z.boolean().default(false),
  timezone: z.string().min(1, { message: 'Please select your timezone.' }),
});

type ExpertFormValues = z.infer<typeof expertFormSchema>;

const BeaconRegistration = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [documents, setDocuments] = useState<File[]>([]);
  const [step, setStep] = useState<'details' | 'documents' | 'availability' | 'preferences' | 'verification'>('details');
  const [expertId, setExpertId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const { user, setUser } = useUserContext();
  const [availabilitySchedule, setAvailabilitySchedule] = useState<Record<string, string[]>>({
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: [],
  });

  const form = useForm<ExpertFormValues>({
    resolver: zodResolver(expertFormSchema),
    defaultValues: {
      name: user?.alias || '', 
      email: '', 
      specialization: '',
      bio: '',
      pricingModel: 'free',
      pricingDetails: '',
      phoneNumber: '',
      voiceMasking: true,
      timezone: 'UTC',
    },
  });

  // Load user data when component mounts
  useEffect(() => {
    if (user) {
      // Use alias for the name field
      form.setValue('name', user.alias || '');
      // Use user ID for the email field with a domain
      form.setValue('email', user.id ? `${user.id}@veilo.app` : '');
    }
  }, [user, form]);

  const onSubmit = async (values: ExpertFormValues) => {
    setIsSubmitting(true);
    console.log('Submitting expert registration with values:', values);

    try {
      // Step 1: Register the expert account (creates new user)
      const registerResponse = await UserApi.registerExpertAccount(values);
      console.log('Expert account registration response:', registerResponse);
      
      if (!registerResponse.success || !registerResponse.data) {
        throw new Error(registerResponse.error || 'Failed to register expert account');
      }
      
      // Save the user ID and token
      const { userId, token, user: userData } = registerResponse.data;
      setUserId(userId);
      
      // Set the token in localStorage
      localStorage.setItem('veilo-token', token);
      
      // Update the user context
      if (userData) {
        setUser({
          ...userData,
          loggedIn: true,
          isAnonymous: false
        });
      }
      
      toast({
        title: 'Account created!',
        description: 'Please continue with document verification.',
      });
      
      // Move to next step
      setStep('documents');
    } catch (error) {
      console.error('Expert registration error:', error);
      toast({
        variant: 'destructive',
        title: 'Registration failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleCompleteRegistration = async () => {
    if (!userId) {
      toast({
        variant: 'destructive',
        title: 'Registration error',
        description: 'User ID is missing. Please try again.',
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Step 2: Now register the expert profile using the user ID
      const expertData: ApiExpertRegisterRequest = {
        name: form.getValues('name'),
        email: form.getValues('email'),
        specialization: form.getValues('specialization'),
        bio: form.getValues('bio'),
        pricingModel: form.getValues('pricingModel'),
        pricingDetails: form.getValues('pricingDetails') || '',
        phoneNumber: form.getValues('phoneNumber') || '',
      };
      
      console.log('Sending expert data to API:', expertData);
      const expertResponse = await ExpertApi.registerExpert(expertData);
      console.log('Expert registration response:', expertResponse);
      
      if (expertResponse.success && expertResponse.data) {
        toast({
          title: 'Registration complete!',
          description: 'Your application is pending review. We will notify you once it\'s approved.',
        });
        
        // Navigate to expert dashboard
        navigate('/expert-dashboard');
      } else {
        throw new Error(expertResponse.error || 'Failed to register as an expert');
      }
    } catch (error) {
      console.error('Expert profile registration error:', error);
      toast({
        variant: 'destructive',
        title: 'Registration failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Improved file upload handler with better error handling
  const handleFileUpload = async (file: File, type: string) => {
    if (!userId) {
      toast({
        variant: 'destructive',
        title: 'Upload error',
        description: 'User ID is missing. Please complete step 1 first.',
      });
      return Promise.reject(new Error('User ID missing'));
    }
    
    setIsSubmitting(true);
    try {
      console.log(`Uploading ${type} document:`, file.name);
      
      // Track the document locally for UI display
      setDocuments(prev => [...prev, file]);
      
      // If we have an expert ID, actually upload the document
      if (expertId) {
        const uploadResponse = await ExpertApi.uploadVerificationDocument(
          expertId, 
          file, 
          type, 
          (progress) => console.log(`Upload progress: ${progress}%`)
        );
        
        if (!uploadResponse.success) {
          throw new Error(uploadResponse.error || 'File upload failed');
        }
        
        console.log('Document successfully uploaded:', uploadResponse.data);
      } else {
        console.log('Expert ID not available yet, document will be uploaded later');
      }
      
      toast({
        title: 'Document added',
        description: 'Your verification document has been added to your profile.',
      });
      
      return Promise.resolve();
    } catch (error) {
      console.error('Document upload error:', error);
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
      });
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetAvailability = (day: string, timeSlot: string) => {
    setAvailabilitySchedule(prev => {
      const currentDaySlots = prev[day] || [];
      
      // Toggle the time slot
      if (currentDaySlots.includes(timeSlot)) {
        return {
          ...prev,
          [day]: currentDaySlots.filter(slot => slot !== timeSlot)
        };
      } else {
        return {
          ...prev,
          [day]: [...currentDaySlots, timeSlot]
        };
      }
    });
  };

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-8 text-center text-veilo-blue-dark dark:text-veilo-blue-light">
        Become a Beacon
      </h1>
      <p className="text-center max-w-2xl mx-auto mb-10 text-gray-600 dark:text-gray-300">
        Join our community of trusted experts and help others through their challenging times. 
        Your expertise and empathy can make a profound difference.
      </p>

      <div className="flex justify-center mb-10">
        <div className="flex items-center">
          {['details', 'documents', 'availability', 'preferences', 'verification'].map((stepName, index) => (
            <div key={stepName} className="flex items-center">
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  step === stepName 
                    ? 'bg-veilo-blue text-white' 
                    : step === 'verification' && stepName !== 'verification'
                      ? 'bg-veilo-blue text-white'
                      : ['documents', 'availability', 'preferences', 'verification'].indexOf(step as string) >= 
                        ['documents', 'availability', 'preferences', 'verification'].indexOf(stepName as 'documents' | 'availability' | 'preferences' | 'verification')
                        ? 'bg-veilo-blue-light text-veilo-blue-dark'
                        : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                {index + 1}
              </div>
              {index < 4 && (
                <div 
                  className={`h-1 w-12 ${
                    ['documents', 'availability', 'preferences', 'verification'].indexOf(step as string) > index
                      ? 'bg-veilo-blue' 
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                ></div>
              )}
            </div>
          ))}
        </div>
      </div>

      <Card className="max-w-3xl mx-auto glass shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-center">
            {step === 'details' && 'Expert Details'}
            {step === 'documents' && 'Verification Documents'}
            {step === 'availability' && 'Set Your Availability'}
            {step === 'preferences' && 'Session Preferences'}
            {step === 'verification' && 'Verification Process'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {step === 'details' && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Dr. Jane Smith" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="your.email@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="+1234567890" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="specialization"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Area of Expertise</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Relationship Counselor, Faith Guide, Mental Health Professional" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Professional Bio</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Share your professional background, approach, and how you help others..."
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="pricingModel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pricing Model</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a pricing model" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="free">Free (Volunteer)</SelectItem>
                          <SelectItem value="donation">Donation-based</SelectItem>
                          <SelectItem value="fixed">Fixed Rate</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="pricingDetails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pricing Details (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., $50 per session, or donation suggestion" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full bg-veilo-blue hover:bg-veilo-blue-dark"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    'Create Account & Continue'
                  )}
                </Button>
              </form>
            </Form>
          )}

          {step === 'documents' && (
            <div className="space-y-6">
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Please upload your credentials and identification documents. We need these to verify your expertise and ensure the safety of our platform.
              </p>
              
              <div className="grid gap-6">
                <FileUpload 
                  label="Profile Photo" 
                  description="Upload a professional headshot (JPG, PNG)" 
                  acceptedFileTypes=".jpg,.jpeg,.png"
                  onUpload={(file) => handleFileUpload(file, 'photo')}
                />
                
                <FileUpload 
                  label="Professional License/Certification" 
                  description="Upload your professional license or certification (PDF, JPG, PNG)" 
                  acceptedFileTypes=".pdf,.jpg,.jpeg,.png"
                  onUpload={(file) => handleFileUpload(file, 'credential')}
                />
                
                <FileUpload 
                  label="Government-Issued ID" 
                  description="Upload a government-issued ID for identity verification" 
                  acceptedFileTypes=".jpg,.jpeg,.png,.pdf"
                  onUpload={(file) => handleFileUpload(file, 'id')}
                />
                
                <FileUpload 
                  label="Additional Supporting Document (Optional)" 
                  description="Any additional documents that support your expertise" 
                  acceptedFileTypes=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onUpload={(file) => handleFileUpload(file, 'other')}
                />
              </div>
              
              <div className="flex justify-between mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => setStep('details')}
                >
                  Back
                </Button>
                <Button 
                  className="bg-veilo-blue hover:bg-veilo-blue-dark"
                  onClick={() => setStep('availability')}
                  disabled={documents.length === 0}
                >
                  Continue to Set Availability
                </Button>
              </div>
            </div>
          )}
          
          {step === 'availability' && (
            <div className="space-y-6">
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Please set your availability for sessions. This helps users know when they can book time with you.
              </p>
              
              <FormField
                control={form.control}
                name="timezone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Timezone</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your timezone" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="UTC">UTC (Coordinated Universal Time)</SelectItem>
                        <SelectItem value="EST">EST (Eastern Standard Time)</SelectItem>
                        <SelectItem value="CST">CST (Central Standard Time)</SelectItem>
                        <SelectItem value="MST">MST (Mountain Standard Time)</SelectItem>
                        <SelectItem value="PST">PST (Pacific Standard Time)</SelectItem>
                        <SelectItem value="GMT">GMT (Greenwich Mean Time)</SelectItem>
                        <SelectItem value="CET">CET (Central European Time)</SelectItem>
                        <SelectItem value="IST">IST (Indian Standard Time)</SelectItem>
                        <SelectItem value="JST">JST (Japan Standard Time)</SelectItem>
                        <SelectItem value="AEST">AEST (Australian Eastern Standard Time)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="mt-6">
                <h3 className="font-medium mb-4">Weekly Availability</h3>
                
                <div className="border rounded-lg overflow-hidden overflow-x-auto">
                  <table className="min-w-full divide-y">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Day</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Morning</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Afternoon</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Evening</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {Object.keys(availabilitySchedule).map((day) => (
                        <tr key={day}>
                          <td className="px-4 py-3 text-sm capitalize">{day}</td>
                          <td className="px-4 py-3">
                            <Button 
                              size="sm" 
                              variant={availabilitySchedule[day].includes('morning') ? "default" : "outline"}
                              className={availabilitySchedule[day].includes('morning') ? "bg-veilo-blue" : ""}
                              onClick={() => handleSetAvailability(day, 'morning')}
                            >
                              {availabilitySchedule[day].includes('morning') && <Check className="mr-1 h-4 w-4" />}
                              8 AM - 12 PM
                            </Button>
                          </td>
                          <td className="px-4 py-3">
                            <Button 
                              size="sm" 
                              variant={availabilitySchedule[day].includes('afternoon') ? "default" : "outline"}
                              className={availabilitySchedule[day].includes('afternoon') ? "bg-veilo-blue" : ""}
                              onClick={() => handleSetAvailability(day, 'afternoon')}
                            >
                              {availabilitySchedule[day].includes('afternoon') && <Check className="mr-1 h-4 w-4" />}
                              12 PM - 5 PM
                            </Button>
                          </td>
                          <td className="px-4 py-3">
                            <Button 
                              size="sm" 
                              variant={availabilitySchedule[day].includes('evening') ? "default" : "outline"}
                              className={availabilitySchedule[day].includes('evening') ? "bg-veilo-blue" : ""}
                              onClick={() => handleSetAvailability(day, 'evening')}
                            >
                              {availabilitySchedule[day].includes('evening') && <Check className="mr-1 h-4 w-4" />}
                              5 PM - 9 PM
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div className="flex justify-between mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => setStep('documents')}
                >
                  Back
                </Button>
                <Button 
                  className="bg-veilo-blue hover:bg-veilo-blue-dark"
                  onClick={() => setStep('preferences')}
                >
                  Continue to Session Preferences
                </Button>
              </div>
            </div>
          )}

          {step === 'preferences' && (
            <div className="space-y-6">
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Configure your session preferences to customize how you interact with users on our platform.
              </p>
              
              <div className="space-y-6">
                <div className="flex flex-col space-y-4">
                  <h3 className="font-medium">Privacy Settings</h3>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base" htmlFor="voice-masking">
                        Voice Masking
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Change your voice during audio/video calls for enhanced privacy.
                      </p>
                    </div>
                    <FormField
                      control={form.control}
                      name="voiceMasking"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center gap-2">
                          <FormControl>
                            <Switch
                              id="voice-masking"
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base" htmlFor="session-recording">
                        Allow Session Recording
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Allow users to request recording sessions for later review.
                      </p>
                    </div>
                    <Switch id="session-recording" />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-medium">Session Types</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="border rounded-lg p-4 text-center flex flex-col items-center">
                      <MessageSquare className="h-8 w-8 mb-2 text-veilo-blue" />
                      <h4 className="font-medium">Chat</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Text-based sessions</p>
                      <Switch className="mt-2" defaultChecked />
                    </div>
                    <div className="border rounded-lg p-4 text-center flex flex-col items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-2 text-veilo-blue"><path d="M23 7l-9-4-10 4L12 3z"></path><path d="M12 14v9"></path><path d="M20 16.2v-4"></path><path d="M4 12.2v4"></path><path d="M12 14 4 9l8-5 8 5-8 5z"></path></svg>
                      <h4 className="font-medium">Voice</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Audio-only calls</p>
                      <Switch className="mt-2" defaultChecked />
                    </div>
                    <div className="border rounded-lg p-4 text-center flex flex-col items-center">
                      <Video className="h-8 w-8 mb-2 text-veilo-blue" />
                      <h4 className="font-medium">Video</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Face-to-face video calls</p>
                      <Switch className="mt-2" defaultChecked />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-medium">Session Duration</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-base" htmlFor="min-duration">
                        Minimum Duration
                      </Label>
                      <Select defaultValue="15">
                        <SelectTrigger id="min-duration">
                          <SelectValue placeholder="Select minimum duration" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15 minutes</SelectItem>
                          <SelectItem value="30">30 minutes</SelectItem>
                          <SelectItem value="45">45 minutes</SelectItem>
                          <SelectItem value="60">60 minutes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-base" htmlFor="max-duration">
                        Maximum Duration
                      </Label>
                      <Select defaultValue="60">
                        <SelectTrigger id="max-duration">
                          <SelectValue placeholder="Select maximum duration" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30">30 minutes</SelectItem>
                          <SelectItem value="60">60 minutes</SelectItem>
                          <SelectItem value="90">90 minutes</SelectItem>
                          <SelectItem value="120">120 minutes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => setStep('availability')}
                >
                  Back
                </Button>
                <Button 
                  className="bg-veilo-blue hover:bg-veilo-blue-dark"
                  onClick={() => setStep('verification')}
                >
                  Continue to Final Step
                </Button>
              </div>
            </div>
          )}

          {step === 'verification' && (
            <div className="space-y-6">
              <div className="bg-veilo-blue-light dark:bg-veilo-blue-dark/30 p-4 rounded-md">
                <h4 className="font-semibold text-veilo-blue-dark dark:text-veilo-blue-light mb-2">Verification Process</h4>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
                  <li>Our admin team will review your application within 1-3 business days</li>
                  <li>We may contact you for additional information or clarification</li>
                  <li>Once approved, you'll receive an email with access to your expert dashboard</li>
                  <li>Your profile will be assigned a verification badge based on our review</li>
                </ol>
              </div>
              
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-md">
                <h4 className="font-semibold text-green-700 dark:text-green-300 mb-2">What Happens Next?</h4>
                <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                  <li>Your profile will be created with "Pending" status</li>
                  <li>You'll be notified via email when your account is approved</li>
                  <li>Once approved, you can start receiving session requests from users</li>
                </ul>
              </div>
              
              <div className="flex flex-col items-center justify-center space-y-4 px-6 py-8 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="w-16 h-16 rounded-full bg-veilo-blue-light dark:bg-veilo-blue-dark/30 flex items-center justify-center">
                  <Shield className="h-8 w-8 text-veilo-blue" />
                </div>
                <h3 className="text-xl font-bold text-center">Ready to become a Beacon?</h3>
                <p className="text-center text-gray-600 dark:text-gray-300">
                  By submitting your application, you agree to our code of conduct and terms of service.
                </p>
                <Button 
                  className="mt-2 bg-veilo-blue hover:bg-veilo-blue-dark"
                  onClick={handleCompleteRegistration}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Complete Registration'
                  )}
                </Button>
              </div>
              
              <div className="flex justify-between mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => setStep('preferences')}
                >
                  Back
                </Button>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center pb-6 text-sm text-gray-500 italic">
          We value your privacy. Your personal information will be protected according to our Privacy Policy.
        </CardFooter>
      </Card>
    </div>
  );
};

export default BeaconRegistration;
