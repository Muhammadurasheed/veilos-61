
import { useState } from 'react';
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
});

type ExpertFormValues = z.infer<typeof expertFormSchema>;

const ExpertRegistration = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState<string[]>([]);
  const [step, setStep] = useState<'details' | 'documents' | 'verification'>('details');
  const [expertId, setExpertId] = useState<string | null>(null);

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
    },
  });

  const onSubmit = async (values: ExpertFormValues) => {
    setIsSubmitting(true);

    try {
      const expertData: ApiExpertRegisterRequest = {
        name: values.name,
        email: values.email,
        specialization: values.specialization,
        bio: values.bio,
        pricingModel: values.pricingModel,
        pricingDetails: values.pricingDetails,
        phoneNumber: values.phoneNumber,
      };

      const response = await ExpertApi.registerExpert(expertData);
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to register. Please try again.');
      }

      toast({
        title: 'Registration submitted!',
        description: 'Please continue with document verification.',
      });

      setExpertId(response.data.id);
      setStep('documents');
    } catch (error) {
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
      // Use a temporary ID for demo mode if no real expert ID exists yet
      console.log('Using temporary ID for demo uploads');
    }
    
    try {
      // Create FormData object
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', type);
      
      console.log(`Uploading ${type} document:`, file.name);
      
      // Make the API call
      const uploadUrl = `https://veilo-backend.onrender.com/api/experts/${expertId || 'temp-id'}/document`;
      
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          // Don't set Content-Type for FormData requests
          ...(localStorage.getItem('veilo-token') ? { 'x-auth-token': localStorage.getItem('veilo-token')! } : {})
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload document');
      }
      
      const responseData = await response.json();
      
      if (!responseData.success) {
        throw new Error(responseData.error || 'Upload failed on server');
      }
      
      // Add to list of uploaded documents
      setUploadedDocuments(prev => [...prev, file.name]);
      
      toast({
        title: 'Document uploaded',
        description: 'Your verification document has been uploaded successfully.',
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
      });
      throw error; // Re-throw to be caught by the FileUpload component
    }
  };

  const completeRegistration = () => {
    toast({
      title: 'Registration complete!',
      description: 'Your application is pending review. We will notify you once it\'s approved.',
    });
    navigate('/');
  };

  return (
    <Layout>
      <div className="container py-10 w-full max-w-full">
        <h1 className="text-3xl font-bold mb-8 text-center text-veilo-blue-dark">
          Become a Beacon
        </h1>
        <p className="text-center max-w-2xl mx-auto mb-10 text-gray-600">
          Join our community of trusted experts and help others through their challenging times. 
          Your expertise and empathy can make a profound difference.
        </p>

        <div className="flex justify-center mb-10">
          <div className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step === 'details' ? 'bg-veilo-blue text-white' : 'bg-veilo-blue-light text-veilo-blue-dark'}`}>
              1
            </div>
            <div className={`h-1 w-20 ${step !== 'details' ? 'bg-veilo-blue' : 'bg-veilo-blue-light'}`}></div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step === 'documents' ? 'bg-veilo-blue text-white' : 'bg-veilo-blue-light text-veilo-blue-dark'}`}>
              2
            </div>
            <div className={`h-1 w-20 ${step === 'verification' ? 'bg-veilo-blue' : 'bg-veilo-blue-light'}`}></div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step === 'verification' ? 'bg-veilo-blue text-white' : 'bg-veilo-blue-light text-veilo-blue-dark'}`}>
              3
            </div>
          </div>
        </div>

        <Card className="max-w-3xl mx-auto glass">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-center">
              {step === 'details' && 'Expert Details'}
              {step === 'documents' && 'Verification Documents'}
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
                    {isSubmitting ? 'Submitting...' : 'Continue to Document Upload'}
                  </Button>
                </form>
              </Form>
            )}

            {step === 'documents' && (
              <div className="space-y-6">
                <p className="text-gray-600 mb-4">
                  Please upload your credentials and identification documents. We need these to verify your expertise and ensure the safety of our platform.
                </p>
                
                <div className="grid gap-6">
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
                    onClick={() => setStep('verification')}
                    disabled={uploadedDocuments.length === 0}
                  >
                    Continue
                  </Button>
                </div>
              </div>
            )}

            {step === 'verification' && (
              <div className="space-y-6">
                <div className="bg-veilo-blue-light p-4 rounded-md">
                  <h4 className="font-semibold text-veilo-blue-dark mb-2">Verification Process</h4>
                  <ol className="list-decimal list-inside space-y-2 text-gray-700">
                    <li>Our admin team will review your application within 1-3 business days</li>
                    <li>We may contact you for additional information or clarification</li>
                    <li>Once approved, you'll receive an email with access to your expert dashboard</li>
                    <li>Your profile will be assigned a verification badge based on our review</li>
                  </ol>
                </div>
                
                <div className="bg-veilo-green-light p-4 rounded-md">
                  <h4 className="font-semibold text-veilo-green-dark mb-2">What Happens Next?</h4>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li>Your profile will be created with "Pending" status</li>
                    <li>You'll be notified via email when your account is approved</li>
                    <li>Once approved, you can start receiving session requests from users</li>
                  </ul>
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
                    onClick={completeRegistration}
                  >
                    Complete Registration
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
    </Layout>
  );
};

export default ExpertRegistration;
