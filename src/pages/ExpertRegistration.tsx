
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import Layout from '@/components/layout/Layout';
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
import { ExpertApi } from '@/services/api';
import { ApiExpertRegisterRequest } from '@/types';
import { FileUpload } from '@/components/expert/FileUpload';
import { Calendar, Check, ChevronRight, Shield, User, MessageSquare, Video } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import axios from 'axios';

const expertFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  specialization: z.string().min(3, { message: 'Please specify your area of expertise.' }),
  bio: z.string().min(50, { message: 'Please provide a detailed bio (at least 50 characters).' }),
  pricingModel: z.enum(['free', 'donation', 'fixed'], { 
    required_error: 'Please select a pricing model.' 
  }),
  pricingDetails: z.string().optional(),
  phoneNumber: z.string().optional(),
  timezone: z.string().default('UTC'),
  voiceMasking: z.boolean().default(true),
});

type ExpertFormValues = z.infer<typeof expertFormSchema>;

const ExpertRegistration = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState<{[key: string]: boolean}>({
    photo: false,
    credential: false,
    id: false,
    other: false
  });
  const [step, setStep] = useState<'details' | 'documents' | 'availability' | 'preferences' | 'verification'>('details');
  const [expertId, setExpertId] = useState<string | null>(null);
  const [apiBaseUrl, setApiBaseUrl] = useState(() => {
    return import.meta.env.VITE_API_BASE_URL || 'https://veilo-backend.onrender.com/api';
  });
  const [availabilitySchedule, setAvailabilitySchedule] = useState<Record<string, string[]>>({
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: [],
  });

  // Initialize baseUrl for API calls
  useEffect(() => {
    console.log('API base URL set to:', apiBaseUrl);
  }, [apiBaseUrl]);

  const form = useForm<ExpertFormValues>({
    resolver: zodResolver(expertFormSchema),
    defaultValues: {
      name: '',
      email: '',
      specialization: '',
      bio: '',
      pricingModel: 'free',
      pricingDetails: '',
      phoneNumber: '',
      timezone: 'UTC',
      voiceMasking: true,
    },
  });

  const onSubmit = async (values: ExpertFormValues) => {
    setIsSubmitting(true);

    try {
      console.log('Submitting expert registration:', values);
      
      // Step 1: Create user account first using expert registration API
      const response = await ExpertApi.register({
        name: values.name,
        email: values.email,
        specialization: values.specialization,
        bio: values.bio,
        pricingModel: values.pricingModel,
        pricingDetails: values.pricingDetails,
        phoneNumber: values.phoneNumber,
        timezone: values.timezone,
        voiceMasking: values.voiceMasking
      });
      
      console.log('Registration response:', response);
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to register. Please try again.');
      }
      
      // Import tokenManager for consistent token handling
      const { tokenManager } = await import('@/services/tokenManager');
      
      // Save the token and user ID using tokenManager
      if (response.data.token) {
        tokenManager.setToken(response.data.token);
      }
      
      // Set the expert ID
      setExpertId(response.data.expertId || response.data.userId);

      toast({
        title: 'Registration submitted!',
        description: 'Please continue with document verification.',
      });

      // Now we have a token, move to the next step
      setStep('documents');
      
      console.log('Expert registered successfully with ID:', response.data.expertId || response.data.userId);
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        variant: 'destructive',
        title: 'Registration failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = async (file: File, type: string) => {
    if (!expertId) {
      toast({
        variant: 'destructive',
        title: 'Upload error',
        description: 'Expert ID is not available. Please try again or refresh the page.',
      });
      return;
    }
    
    try {
      console.log(`Uploading ${type} document:`, file.name);
      
      // Create FormData object
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', type);
      
      // Import tokenManager for consistent token handling  
      const { tokenManager } = await import('@/services/tokenManager');
      const token = tokenManager.getToken();
      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }
      
      console.log(`Uploading document via ExpertApi`);
      console.log('Form data:', Array.from(formData.entries()));
      
      // Use ExpertApi for consistent API handling
      const response = await ExpertApi.uploadVerificationDocument(expertId, file, type);
      
      console.log('Upload response:', response);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to upload document');
      }
      
      // Mark this document type as uploaded
      setUploadedDocuments(prev => ({
        ...prev,
        [type]: true
      }));
      
      toast({
        title: 'Document uploaded successfully',
        description: `Your ${type} document has been uploaded.`,
      });
      
      return response.data;
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred during upload.',
      });
      throw error; // Re-throw for the FileUpload component to handle
    }
  };

  // Check if required documents are uploaded
  const canProceedToVerification = () => {
    // Require at least credential and ID to proceed
    return uploadedDocuments.credential && uploadedDocuments.id;
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

  const completeRegistration = () => {
    toast({
      title: 'Registration complete!',
      description: 'Your application is pending review. We will notify you once it\'s approved.',
    });
    navigate('/expert-dashboard');
  };

  return (
    <Layout>
      <div className="container py-10 w-full max-w-full">
        <h1 className="text-3xl font-bold mb-8 text-center text-veilo-blue-dark dark:text-veilo-blue-light">
          Become a Beacon
        </h1>
        <p className="text-center max-w-2xl mx-auto mb-10 text-gray-600 dark:text-gray-300">
          Join our community of trusted experts and help others through their challenging times. 
          Your expertise and empathy can make a profound difference.
        </p>

        {/* Progress indicator */}
        <div className="flex justify-center mb-10">
          <div className="flex items-center space-x-2">
            {['details', 'documents', 'availability', 'preferences', 'verification'].map((stepName, index) => (
              <div key={stepName} className="flex items-center">
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-200 ${
                    step === stepName 
                      ? 'bg-veilo-blue text-white' 
                      : index < ['details', 'documents', 'availability', 'preferences', 'verification'].indexOf(step)
                        ? 'bg-veilo-blue text-white'
                        : 'bg-veilo-blue-light text-veilo-blue-dark dark:bg-veilo-blue-dark/30 dark:text-veilo-blue-light'
                  }`}
                >
                  {index + 1}
                </div>
                {index < 4 && (
                  <div 
                    className={`h-1 w-12 ${
                      index < ['details', 'documents', 'availability', 'preferences', 'verification'].indexOf(step)
                        ? 'bg-veilo-blue' 
                        : 'bg-veilo-blue-light dark:bg-veilo-blue-dark/30'
                    }`}
                  ></div>
                )}
              </div>
            ))}
          </div>
        </div>

        <Card className="max-w-3xl mx-auto shadow-md border border-gray-200 dark:border-gray-700 transition-all duration-300">
          <CardHeader className="border-b border-gray-100 dark:border-gray-800">
            <CardTitle className="text-2xl font-semibold text-center text-veilo-blue-dark dark:text-veilo-blue-light">
              {step === 'details' && 'Expert Details'}
              {step === 'documents' && 'Verification Documents'}
              {step === 'availability' && 'Set Your Availability'}
              {step === 'preferences' && 'Session Preferences'}
              {step === 'verification' && 'Verification Process'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {step === 'details' && (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 dark:text-gray-300">Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Dr. Jane Smith" className="bg-white dark:bg-gray-800" {...field} />
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
                          <FormLabel className="text-gray-700 dark:text-gray-300">Email</FormLabel>
                          <FormControl>
                            <Input placeholder="your.email@example.com" className="bg-white dark:bg-gray-800" {...field} />
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
                          <FormLabel className="text-gray-700 dark:text-gray-300">Phone Number (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="+1234567890" className="bg-white dark:bg-gray-800" {...field} />
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
                        <FormLabel className="text-gray-700 dark:text-gray-300">Area of Expertise</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., Relationship Counselor, Faith Guide, Mental Health Professional" 
                            className="bg-white dark:bg-gray-800"
                            {...field} 
                          />
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
                        <FormLabel className="text-gray-700 dark:text-gray-300">Professional Bio</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Share your professional background, approach, and how you help others..."
                            className="min-h-[120px] bg-white dark:bg-gray-800"
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
                        <FormLabel className="text-gray-700 dark:text-gray-300">Pricing Model</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-white dark:bg-gray-800">
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
                        <FormLabel className="text-gray-700 dark:text-gray-300">Pricing Details (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., $50 per session, or donation suggestion" 
                            className="bg-white dark:bg-gray-800"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-veilo-blue hover:bg-veilo-blue-dark transition-colors"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Submitting...
                      </div>
                    ) : (
                      <span className="flex items-center">
                        Continue to Document Upload
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </span>
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
                    label="Professional License/Certification" 
                    description="Upload your professional license or certification (PDF, JPG, PNG)" 
                    acceptedFileTypes=".pdf,.jpg,.jpeg,.png"
                    onUpload={(file) => handleFileUpload(file, 'credential')}
                    required={true}
                  />
                  
                  <FileUpload 
                    label="Government-Issued ID" 
                    description="Upload a government-issued ID for identity verification" 
                    acceptedFileTypes=".jpg,.jpeg,.png,.pdf"
                    onUpload={(file) => handleFileUpload(file, 'id')}
                    required={true}
                  />
                  
                  <FileUpload 
                    label="Profile Photo" 
                    description="Upload a professional headshot (JPG, PNG)" 
                    acceptedFileTypes=".jpg,.jpeg,.png"
                    onUpload={(file) => handleFileUpload(file, 'photo')}
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
                    className="border-gray-200 dark:border-gray-700"
                  >
                    Back
                  </Button>
                  <Button 
                    className="bg-veilo-blue hover:bg-veilo-blue-dark transition-colors"
                    onClick={() => setStep('availability')}
                    disabled={!canProceedToVerification()}
                  >
                    {!canProceedToVerification() ? (
                      <span>Please upload required documents</span>
                    ) : (
                      <span className="flex items-center">
                        Continue to Set Availability
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </span>
                    )}
                  </Button>
                </div>
                
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                  <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300">Upload Instructions:</h4>
                  <ul className="text-sm text-blue-700 dark:text-blue-400 list-disc list-inside mt-1 space-y-1">
                    <li>Maximum file size: 5MB per document</li>
                    <li>Accepted formats: PDF, JPG, PNG</li>
                    <li>Required documents: Professional license/certification and government ID</li>
                    <li>Please ensure all documents are clear and legible</li>
                  </ul>
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
                      <FormLabel className="text-gray-700 dark:text-gray-300">Your Timezone</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-white dark:bg-gray-800">
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
                  <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-4">Weekly Availability</h3>
                  
                  <div className="border rounded-lg overflow-hidden border-gray-200 dark:border-gray-700">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Day</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Morning</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Afternoon</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Evening</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                        {Object.keys(availabilitySchedule).map((day) => (
                          <tr key={day} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            <td className="px-4 py-3 text-sm capitalize text-gray-700 dark:text-gray-300">{day}</td>
                            <td className="px-4 py-3">
                              <Button 
                                size="sm" 
                                variant={availabilitySchedule[day].includes('morning') ? "default" : "outline"}
                                className={availabilitySchedule[day].includes('morning') ? "bg-veilo-blue" : "border-gray-200 dark:border-gray-600"}
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
                                className={availabilitySchedule[day].includes('afternoon') ? "bg-veilo-blue" : "border-gray-200 dark:border-gray-600"}
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
                                className={availabilitySchedule[day].includes('evening') ? "bg-veilo-blue" : "border-gray-200 dark:border-gray-600"}
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
                    className="border-gray-200 dark:border-gray-700"
                  >
                    Back
                  </Button>
                  <Button 
                    className="bg-veilo-blue hover:bg-veilo-blue-dark transition-colors"
                    onClick={() => setStep('preferences')}
                  >
                    <span className="flex items-center">
                      Continue to Session Preferences
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </span>
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
                    <h3 className="font-medium text-gray-700 dark:text-gray-300">Privacy Settings</h3>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                      <div>
                        <Label className="text-base text-gray-700 dark:text-gray-300" htmlFor="voice-masking">
                          Voice Masking
                        </Label>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
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
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                      <div>
                        <Label className="text-base text-gray-700 dark:text-gray-300" htmlFor="session-recording">
                          Allow Session Recording
                        </Label>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Allow users to request recording sessions for later review.
                        </p>
                      </div>
                      <Switch id="session-recording" />
                    </div>
                  </div>
                  
                  <div className="space-y-4 pt-2">
                    <h3 className="font-medium text-gray-700 dark:text-gray-300">Session Types</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="border rounded-lg p-4 text-center flex flex-col items-center bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm hover:shadow transition-shadow">
                        <MessageSquare className="h-8 w-8 mb-2 text-veilo-blue" />
                        <h4 className="font-medium text-gray-700 dark:text-gray-300">Chat</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Text-based sessions</p>
                        <Switch defaultChecked />
                      </div>
                      <div className="border rounded-lg p-4 text-center flex flex-col items-center bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm hover:shadow transition-shadow">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-2 text-veilo-blue"><path d="M12 14v9"></path><path d="M20 16.2v-4"></path><path d="M4 12.2v4"></path><path d="M12 14 4 9l8-5 8 5-8 5z"></path></svg>
                        <h4 className="font-medium text-gray-700 dark:text-gray-300">Voice</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Audio-only calls</p>
                        <Switch defaultChecked />
                      </div>
                      <div className="border rounded-lg p-4 text-center flex flex-col items-center bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm hover:shadow transition-shadow">
                        <Video className="h-8 w-8 mb-2 text-veilo-blue" />
                        <h4 className="font-medium text-gray-700 dark:text-gray-300">Video</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Face-to-face video calls</p>
                        <Switch defaultChecked />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4 pt-2">
                    <h3 className="font-medium text-gray-700 dark:text-gray-300">Session Duration</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <Label className="text-gray-700 dark:text-gray-300" htmlFor="min-duration">
                          Minimum Duration
                        </Label>
                        <Select defaultValue="15">
                          <SelectTrigger id="min-duration" className="bg-white dark:bg-gray-800 mt-2">
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
                      <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <Label className="text-gray-700 dark:text-gray-300" htmlFor="max-duration">
                          Maximum Duration
                        </Label>
                        <Select defaultValue="60">
                          <SelectTrigger id="max-duration" className="bg-white dark:bg-gray-800 mt-2">
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
                    className="border-gray-200 dark:border-gray-700"
                  >
                    Back
                  </Button>
                  <Button 
                    className="bg-veilo-blue hover:bg-veilo-blue-dark transition-colors"
                    onClick={() => setStep('verification')}
                  >
                    <span className="flex items-center">
                      Continue to Final Step
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </span>
                  </Button>
                </div>
              </div>
            )}

            {step === 'verification' && (
              <div className="space-y-6">
                <div className="bg-veilo-blue-light dark:bg-veilo-blue-dark/30 p-4 rounded-md border border-veilo-blue-light/50 dark:border-veilo-blue-dark">
                  <h4 className="font-semibold text-veilo-blue-dark dark:text-veilo-blue-light mb-2">Verification Process</h4>
                  <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
                    <li>Our admin team will review your application within 1-3 business days</li>
                    <li>We may contact you for additional information or clarification</li>
                    <li>Once approved, you'll receive an email with access to your expert dashboard</li>
                    <li>Your profile will be assigned a verification badge based on our review</li>
                  </ol>
                </div>
                
                <div className="bg-veilo-green-light dark:bg-veilo-green-dark/30 p-4 rounded-md border border-veilo-green-light/50 dark:border-veilo-green-dark">
                  <h4 className="font-semibold text-veilo-green-dark dark:text-veilo-green-light mb-2">What Happens Next?</h4>
                  <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                    <li>Your profile will be created with "Pending" status</li>
                    <li>You'll be notified via email when your account is approved</li>
                    <li>Once approved, you can start receiving session requests from users</li>
                  </ul>
                </div>
                
                <div className="flex flex-col items-center justify-center space-y-4 px-6 py-8 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="w-16 h-16 rounded-full bg-veilo-blue-light dark:bg-veilo-blue-dark/30 flex items-center justify-center">
                    <Shield className="h-8 w-8 text-veilo-blue" />
                  </div>
                  <h3 className="text-xl font-bold text-center text-gray-800 dark:text-gray-200">Ready to become a Beacon?</h3>
                  <p className="text-center text-gray-600 dark:text-gray-300">
                    By submitting your application, you agree to our code of conduct and terms of service.
                  </p>
                  <Button 
                    className="mt-2 bg-veilo-blue hover:bg-veilo-blue-dark transition-colors"
                    onClick={completeRegistration}
                  >
                    <span className="flex items-center">
                      Complete Registration
                      <Check className="ml-1 h-4 w-4" />
                    </span>
                  </Button>
                </div>
                
                <div className="flex justify-between mt-6">
                  <Button 
                    variant="outline" 
                    onClick={() => setStep('preferences')}
                    className="border-gray-200 dark:border-gray-700"
                  >
                    Back
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-center pb-6 text-sm text-gray-500 dark:text-gray-400 italic border-t border-gray-100 dark:border-gray-800 pt-4 mt-4">
            We value your privacy. Your personal information will be protected according to our Privacy Policy.
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
};

export default ExpertRegistration;
