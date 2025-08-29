import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, addDays, addHours } from 'date-fns';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { useUserContext } from '@/contexts/UserContext';
import { apiRequest } from '@/services/api';
import { cn } from '@/lib/utils';
import { CalendarIcon, Clock, Star, Users, Video, Phone, MessageSquare, Loader2 } from 'lucide-react';

const bookingSchema = z.object({
  scheduledDateTime: z.date({
    required_error: 'Please select a date and time.',
  }),
  duration: z.string().min(1, 'Please select session duration'),
  sessionType: z.string().min(1, 'Please select session type'),
  topic: z.string().min(1, 'Please enter a session topic'),
  description: z.string().optional(),
  urgency: z.string().optional(),
});

import { Expert } from '@/types';

type BookingFormValues = z.infer<typeof bookingSchema>;

const BookSession = () => {
  const { expertId } = useParams();
  const { user } = useUserContext();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  console.log('🎯 BookSession component mounted with expertId:', expertId);
  console.log('🎯 Current location:', window.location.pathname);
  
  const [expert, setExpert] = useState<Expert | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      duration: '60',
      sessionType: 'chat',
      urgency: 'normal',
    },
  });

  // Fetch expert details
  useEffect(() => {
    console.log('🔄 BookSession useEffect triggered with expertId:', expertId);
    
    const fetchExpert = async () => {
      if (!expertId) {
        console.log('❌ No expertId provided in BookSession');
        setLoading(false);
        return;
      }
      
      console.log(`🔍 BookSession: Fetching expert details for ID: ${expertId}`);
      
      try {
        const response = await apiRequest('GET', `/api/experts/${expertId}`);
        console.log('📡 Expert fetch response:', { 
          success: response.success, 
          hasData: !!response.data,
          expertName: response.data?.name 
        });
        
        if (response.success && response.data) {
          setExpert(response.data);
          console.log('✅ BookSession: Expert loaded successfully:', response.data.name);
        } else {
          console.log('❌ BookSession: Expert not found or invalid response');
          toast({
            title: "Expert not found",
            description: `The expert with ID ${expertId} could not be found. Please try again or contact support.`,
            variant: "destructive",
          });
          console.log('🔄 BookSession: Navigating to /beacons due to expert not found');
          navigate('/beacons');
        }
      } catch (error) {
        console.error('❌ Error fetching expert:', error);
        toast({
          title: "Connection Error",
          description: "Failed to load expert details. Please check your internet connection and try again.",
          variant: "destructive",
        });
        navigate('/beacons');
      } finally {
        setLoading(false);
      }
    };

    fetchExpert();
  }, [expertId, toast, navigate]);

  const generateTimeSlots = (selectedDate: Date) => {
    const slots = [];
    const now = new Date();
    
    // Generate slots from 8 AM to 8 PM
    for (let hour = 8; hour <= 20; hour++) {
      const slotTime = new Date(selectedDate);
      slotTime.setHours(hour, 0, 0, 0);
      
      // Only show future slots
      if (slotTime > now) {
        slots.push({
          time: slotTime,
          label: format(slotTime, 'h:mm a'),
          available: true // In real app, check expert availability
        });
      }
    }
    
    return slots;
  };

  const onSubmit = async (values: BookingFormValues) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to book a session.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const response = await apiRequest('POST', '/api/bookings/create', {
        expertId: expertId,
        sessionType: values.sessionType,
        scheduledDateTime: values.scheduledDateTime.toISOString(),
        duration: parseInt(values.duration),
        topic: values.topic,
        description: values.description,
        urgency: values.urgency || 'normal'
      });

      if (response.success) {
        toast({
          title: "Session Booked Successfully!",
          description: "Your consultation has been scheduled. You'll receive a confirmation shortly.",
        });

        // Redirect to chat if session is confirmed
        if (response.data.chatSessionId) {
          navigate(`/chat/${response.data.chatSessionId}`);
        } else {
          navigate('/my-sessions');
        }
      } else {
        throw new Error(response.error || 'Booking failed');
      }
    } catch (error: any) {
      console.error('Booking error:', error);
      toast({
        title: "Booking Failed",
        description: error.message || "Failed to book session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-20">
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!expert) {
    return (
      <Layout>
        <div className="container py-20">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Expert Not Found</h1>
            <Button onClick={() => navigate('/')}>Return Home</Button>
          </div>
        </div>
      </Layout>
    );
  }

  const timeSlots = selectedDate ? generateTimeSlots(selectedDate) : [];

  return (
    <Layout>
      <div className="container py-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Expert Info */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={expert.avatarUrl} alt={expert.name} />
                    <AvatarFallback>{expert.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold">{expert.name}</h2>
                    <p className="text-muted-foreground">{expert.specialization}</p>
                    <div className="flex items-center mt-2 space-x-4">
                      {expert.rating && (
                        <div className="flex items-center">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                          <span className="text-sm font-medium">{expert.rating}</span>
                          <span className="text-sm text-muted-foreground ml-1">
                            ({expert.totalRatings} reviews)
                          </span>
                        </div>
                      )}
                      {expert.responseTime && (
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          <span className="text-sm text-muted-foreground">{expert.responseTime}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">About</h3>
                    <p className="text-sm text-muted-foreground">{expert.bio}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Pricing</h3>
                    <Badge variant="outline">
                      {expert.pricingModel === 'free' ? 'Free Consultation' :
                       expert.pricingModel === 'donation' ? 'Pay What You Can' :
                       `$${expert.hourlyRate || 0} per session`}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Booking Form */}
            <Card>
              <CardHeader>
                <CardTitle>Book a Session</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Session Type */}
                    <FormField
                      control={form.control}
                      name="sessionType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Session Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select session type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="chat">
                                <div className="flex items-center">
                                  <MessageSquare className="h-4 w-4 mr-2" />
                                  Text Chat
                                </div>
                              </SelectItem>
                              <SelectItem value="voice">
                                <div className="flex items-center">
                                  <Phone className="h-4 w-4 mr-2" />
                                  Voice Call
                                </div>
                              </SelectItem>
                              <SelectItem value="video">
                                <div className="flex items-center">
                                  <Video className="h-4 w-4 mr-2" />
                                  Video Call
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Duration */}
                    <FormField
                      control={form.control}
                      name="duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select duration" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="30">30 minutes</SelectItem>
                              <SelectItem value="60">1 hour</SelectItem>
                              <SelectItem value="90">1.5 hours</SelectItem>
                              <SelectItem value="120">2 hours</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Date Selection */}
                    <FormField
                      control={form.control}
                      name="scheduledDateTime"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Date & Time</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP 'at' p")
                                  ) : (
                                    <span>Pick a date and time</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <div className="flex">
                                <Calendar
                                  mode="single"
                                  selected={selectedDate}
                                  onSelect={setSelectedDate}
                                  disabled={(date) =>
                                    date < new Date() || date < new Date("1900-01-01")
                                  }
                                  initialFocus
                                  className="pointer-events-auto"
                                />
                                {selectedDate && (
                                  <div className="border-l p-4">
                                    <h4 className="font-medium mb-3">Available Times</h4>
                                    <div className="space-y-2 max-h-64 overflow-y-auto">
                                      {timeSlots.map((slot) => (
                                        <Button
                                          key={slot.label}
                                          variant={field.value && format(field.value, 'h:mm a') === slot.label ? "default" : "outline"}
                                          size="sm"
                                          className="w-full justify-start"
                                          onClick={() => field.onChange(slot.time)}
                                          disabled={!slot.available}
                                        >
                                          <Clock className="h-4 w-4 mr-2" />
                                          {slot.label}
                                        </Button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Topic */}
                    <FormField
                      control={form.control}
                      name="topic"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Session Topic</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., Anxiety management, Relationship advice..." 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Description */}
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Additional Details (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Provide any additional context or specific questions you'd like to discuss..."
                              className="resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Urgency */}
                    <FormField
                      control={form.control}
                      name="urgency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Priority Level</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select priority" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="low">Low - Routine consultation</SelectItem>
                              <SelectItem value="normal">Normal - Standard session</SelectItem>
                              <SelectItem value="high">High - Important matter</SelectItem>
                              <SelectItem value="urgent">Urgent - Need immediate help</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Booking Session...
                        </>
                      ) : (
                        'Book Session'
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default BookSession;