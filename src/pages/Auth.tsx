import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EnhancedAuthFlow } from '@/components/auth/EnhancedAuthFlow';
import { useAuth } from '@/contexts/optimized/AuthContextRefactored';
import { Heart, ArrowLeft } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';

const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'register'>(
    (searchParams.get('mode') as 'login' | 'register') || 'login'
  );

  useEffect(() => {
    if (isAuthenticated && user) {
      // Check for return URL in search params
      const returnTo = searchParams.get('returnTo');
      if (returnTo) {
        console.log('🔄 Auth success: Redirecting to return URL:', returnTo);
        window.location.href = decodeURIComponent(returnTo);
      } else {
        navigate('/dashboard');
      }
    }
  }, [isAuthenticated, user, navigate, searchParams]);

  const handleAuthSuccess = () => {
    // Check for return URL
    const returnTo = searchParams.get('returnTo');
    if (returnTo) {
      console.log('🔄 Auth success handler: Redirecting to return URL:', returnTo);
      window.location.href = decodeURIComponent(returnTo);
    } else {
      navigate('/dashboard');
    }
  };

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <nav className="sticky top-0 z-50 w-full backdrop-blur-md bg-background/80 border-b border-border/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-lg">
                <Heart className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Veilo
              </span>
            </Link>
            <Button asChild variant="ghost">
              <Link to="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl font-bold mb-4">
              {authMode === 'login' ? 'Welcome Back' : 'Join Veilo'}
            </h1>
            <p className="text-muted-foreground">
              {authMode === 'login' 
                ? 'Sign in to access your mental health sanctuary' 
                : 'Create your secure, anonymous account'
              }
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border border-primary/20 shadow-xl">
              <CardContent className="p-8">
                <EnhancedAuthFlow 
                  mode={authMode}
                  onModeChange={setAuthMode}
                  onSuccess={handleAuthSuccess}
                />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center mt-6"
          >
            <p className="text-sm text-muted-foreground">
              By continuing, you agree to our{' '}
              <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link>
              {' '}and{' '}
              <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Auth;