
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AdminApi } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Shield, Loader2 } from 'lucide-react';

const adminLoginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

type AdminLoginValues = z.infer<typeof adminLoginSchema>;

interface AdminLoginProps {
  onLoginSuccess: () => void;
}

const AdminLogin = ({ onLoginSuccess }: AdminLoginProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<AdminLoginValues>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: AdminLoginValues) => {
    setIsLoading(true);

    try {
      // For demo purposes, let's use a hardcoded admin login
      // In production, this should use the actual API
      if (values.email === 'admin@veilo.app' && values.password === 'admin123') {
        // Simulate successful login
        setTimeout(() => {
          toast({
            title: 'Login successful',
            description: 'Welcome to the admin panel.',
          });
          onLoginSuccess();
          setIsLoading(false);
        }, 1000);
        return;
      }

      // Actual API integration (commented out for demo)
      /*
      const response = await AdminApi.adminLogin(values.email, values.password);
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Invalid credentials');
      }

      // Store admin token
      localStorage.setItem('adminToken', response.data.token);
      onLoginSuccess();
      */

      throw new Error('Invalid credentials');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Login failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
      });
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container py-20">
        <div className="max-w-md mx-auto">
          <Card className="glass">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-veilo-purple-light rounded-full flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-veilo-purple-dark" />
              </div>
              <CardTitle className="text-2xl font-bold text-veilo-purple-dark">
                Admin Login
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="admin@veilo.app" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-veilo-purple hover:bg-veilo-purple-dark"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Logging in...
                      </>
                    ) : (
                      'Login to Admin Panel'
                    )}
                  </Button>
                  
                  <div className="text-center text-sm text-gray-500 mt-4">
                    <p>For demo: admin@veilo.app / admin123</p>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default AdminLogin;
