import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/components/ui/use-toast';
import { Shield } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SanctuaryApi } from '@/services/api';
import { ApiSanctuaryCreateRequest } from '@/types'; // Add this import for the type

// Define form schema
const formSchema = z.object({
  topic: z.string().min(5, { message: "Topic must be at least 5 characters." }).max(100),
  description: z.string().max(500).optional(),
  emoji: z.string().max(2).optional(),
  expireHours: z.number().min(1).max(24).default(1)
});

type SanctuaryFormValues = z.infer<typeof formSchema>;

const emojiOptions = ["💭", "❤️", "😊", "😢", "😡", "😨", "🤔", "🙏", "✨", "🌈"];

const CreateSanctuary: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [topicEthical, setTopicEthical] = useState<boolean | null>(null);
  const [validatingTopic, setValidatingTopic] = useState(false);

  // Initialize form
  const form = useForm<SanctuaryFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: "",
      description: "",
      emoji: "💭",
      expireHours: 1
    },
  });

  // Simulated ethical check - in production, this would call the Gemini API
  const checkTopicEthical = async (topic: string): Promise<boolean> => {
    setValidatingTopic(true);
    
    // Simple validation logic - in production, replace with actual API call
    const bannedTerms = ['illegal', 'drugs', 'suicide', 'self-harm', 'violence', 'weapon'];
    const containsBannedTerm = bannedTerms.some(term => 
      topic.toLowerCase().includes(term)
    );
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setValidatingTopic(false);
    return !containsBannedTerm;
  };

  const onTopicBlur = async () => {
    const topic = form.getValues('topic');
    if (topic.length >= 5) {
      const isEthical = await checkTopicEthical(topic);
      setTopicEthical(isEthical);
      
      if (!isEthical) {
        toast({
          title: "Topic flagged",
          description: "Please choose a topic aligned with Veilo's supportive community guidelines.",
          variant: "destructive"
        });
      }
    }
  };

  const onSubmit = async (values: SanctuaryFormValues) => {
    try {
      setIsSubmitting(true);
      
      // Final ethical check
      const isEthical = await checkTopicEthical(values.topic);
      if (!isEthical) {
        toast({
          title: "Cannot create sanctuary",
          description: "The topic doesn't meet our community guidelines.",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }
      
      // Create sanctuary session with the required topic
      // Make sure topic is always defined (which it should be based on form validation)
      const sanctuaryData: ApiSanctuaryCreateRequest = {
        topic: values.topic, // Ensuring topic is always passed
        description: values.description,
        emoji: values.emoji,
        expireHours: values.expireHours
      };
      
      const response = await SanctuaryApi.createSession(sanctuaryData);
      
      if (response.success && response.data) {
        // Store host token in localStorage if this is an anonymous host
        if (response.data.hostToken) {
          localStorage.setItem(`sanctuary-host-${response.data.id}`, response.data.hostToken);
        }
        
        toast({
          title: "Sanctuary space created!",
          description: "Your anonymous support space is now ready to share."
        });
        
        // Navigate to the new session with correct route
        navigate(`/sanctuary/${response.data.id}`);
      } else {
        throw new Error(response.error || "Failed to create sanctuary session");
      }
    } catch (error: any) {
      toast({
        title: "Error creating sanctuary",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-veilo-purple" />
          Create Sanctuary Space
        </CardTitle>
        <CardDescription>
          Create an anonymous, temporary space for emotional support around a specific topic.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="topic"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Topic</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        placeholder="What would you like to discuss?" 
                        {...field} 
                        onBlur={onTopicBlur}
                        className={
                          topicEthical === true ? "border-green-500" : 
                          topicEthical === false ? "border-red-500" : ""
                        }
                      />
                      {validatingTopic && (
                        <div className="absolute right-3 top-2.5">
                          <div className="h-5 w-5 rounded-full border-2 border-t-veilo-blue animate-spin"></div>
                        </div>
                      )}
                      {topicEthical === true && (
                        <div className="absolute right-3 top-2.5 text-green-500">✓</div>
                      )}
                    </div>
                  </FormControl>
                  <FormDescription>
                    Choose a supportive topic for discussion.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Add more context to help others understand the space" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="emoji"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mood Emoji (Optional)</FormLabel>
                  <div className="flex flex-wrap gap-2">
                    {emojiOptions.map(emoji => (
                      <Button
                        key={emoji}
                        type="button"
                        variant={field.value === emoji ? "default" : "outline"}
                        className={`h-10 w-10 p-0 text-lg ${field.value === emoji ? "bg-veilo-purple text-white" : ""}`}
                        onClick={() => form.setValue('emoji', emoji)}
                      >
                        {emoji}
                      </Button>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="expireHours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Session Duration: {field.value} hour{field.value !== 1 ? 's' : ''}</FormLabel>
                  <FormControl>
                    <Slider
                      min={1}
                      max={24}
                      step={1}
                      value={[field.value]}
                      onValueChange={(values) => field.onChange(values[0])}
                      className="py-4"
                    />
                  </FormControl>
                  <FormDescription>
                    Sessions automatically expire after the selected duration.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
        <Button 
          onClick={form.handleSubmit(onSubmit)}
          disabled={isSubmitting || topicEthical === false}
          variant="veilo-secondary"
        >
          {isSubmitting ? "Creating..." : "Create Sanctuary Space"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CreateSanctuary;
