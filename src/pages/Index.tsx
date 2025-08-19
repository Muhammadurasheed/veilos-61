import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WelcomeScreen } from '@/components/onboarding/WelcomeScreen';
import { Heart, Shield, Users, MessageCircle, Video, BookOpen, ArrowRight, Sparkles, Star, CheckCircle } from 'lucide-react';
import { useUserContext } from '@/contexts/UserContext';
import { Link } from 'react-router-dom';

const Index = () => {
  const { user } = useUserContext();
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    // Only show welcome for new users, not on login
    const hasShownWelcome = localStorage.getItem('veilo_welcome_shown');
    if (!user && !hasShownWelcome) {
      setShowWelcome(true);
    }
  }, [user]);

  const handleWelcomeComplete = () => {
    localStorage.setItem('veilo_welcome_shown', 'true');
    setShowWelcome(false);
  };

  const features = [
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Anonymous & Secure",
      description: "Complete privacy protection with encrypted conversations",
      gradient: "from-blue-500 to-blue-600"
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Live Sanctuary Sessions",
      description: "Join group discussions in real-time supportive environments",
      gradient: "from-green-500 to-green-600"
    },
    {
      icon: <MessageCircle className="h-8 w-8" />,
      title: "Expert Consultations",
      description: "Connect with verified mental health professionals",
      gradient: "from-purple-500 to-purple-600"
    },
    {
      icon: <Heart className="h-8 w-8" />,
      title: "AI-Moderated Safety",
      description: "Advanced content moderation ensures respectful interactions",
      gradient: "from-red-500 to-red-600"
    }
  ];

  const stats = [
    { label: "Active Users", value: "10K+", icon: <Users className="h-5 w-5" /> },
    { label: "Verified Experts", value: "500+", icon: <Star className="h-5 w-5" /> },
    { label: "Safe Sessions", value: "50K+", icon: <Shield className="h-5 w-5" /> },
    { label: "Success Rate", value: "95%", icon: <CheckCircle className="h-5 w-5" /> }
  ];

  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <div className="container mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-8"
          >
            <div className="space-y-4">
              <Badge className="px-4 py-2 bg-gradient-to-r from-primary to-primary/80">
                Welcome back, {user.alias}! 🕊️
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Your Sanctuary Awaits
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Continue your mental wellness journey in a safe, supportive environment
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button asChild size="lg" className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-veilo-lg hover:shadow-veilo-xl transition-all animate-pulse-glow">
                <Link to="/sanctuary">
                  Enter Sanctuary
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-primary/30 hover:bg-primary/5">
                <Link to="/beacons">
                  Find Expert
                  <MessageCircle className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </motion.div>

          {/* Quick Access Cards */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-full bg-blue-500/10 text-blue-500 group-hover:scale-110 transition-transform">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Live Sessions</h3>
                    <p className="text-sm text-muted-foreground">3 active now</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-full bg-green-500/10 text-green-500 group-hover:scale-110 transition-transform">
                    <MessageCircle className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Expert Chat</h3>
                    <p className="text-sm text-muted-foreground">12 available</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-full bg-purple-500/10 text-purple-500 group-hover:scale-110 transition-transform">
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Resources</h3>
                    <p className="text-sm text-muted-foreground">Wellness guides</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-full bg-red-500/10 text-red-500 group-hover:scale-110 transition-transform">
                    <Heart className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Wellness</h3>
                    <p className="text-sm text-muted-foreground">Track progress</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <>
      <WelcomeScreen 
        isOpen={showWelcome}
        onComplete={handleWelcomeComplete}
      />

      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <div className="container mx-auto px-4 py-20">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-8 mb-20"
          >
            <div className="space-y-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-4 py-2 rounded-full"
              >
                <Sparkles className="h-4 w-4" />
                <span className="text-sm font-medium">Anonymous Mental Health Platform</span>
              </motion.div>

              <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-transparent">
                Your Safe Space
                <br />
                <span className="text-primary">Awaits</span>
              </h1>

              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Connect anonymously with mental health experts and supportive communities. 
                Your privacy is protected, your voice is heard, your healing matters.
              </p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Button 
                size="lg" 
                onClick={() => setShowWelcome(true)}
                className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-veilo-lg hover:shadow-veilo-xl px-8 py-6 text-lg transition-all animate-pulse-glow"
              >
                <Heart className="mr-2 h-5 w-5" />
                Enter Sanctuary
              </Button>
              <Button asChild variant="outline" size="lg" className="px-8 py-6 text-lg border-primary/30 hover:bg-primary/5">
                <Link to="/feed">
                  Explore Community
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </motion.div>
          </motion.div>

          {/* Stats Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                className="text-center"
              >
                <div className="flex justify-center mb-2 text-primary">
                  {stat.icon}
                </div>
                <div className="text-3xl font-bold text-primary mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* Features Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20"
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 + index * 0.1 }}
              >
                <Card className="h-full group hover:shadow-veilo-xl transition-all duration-300 border border-primary/20 bg-gradient-to-br from-card to-primary/5">
                  <CardContent className="p-8">
                    <div className="inline-flex p-4 rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground mb-6 group-hover:scale-110 transition-transform shadow-veilo-md">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="text-center"
          >
            <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
              <CardContent className="p-12">
                <h2 className="text-3xl font-bold mb-6">Ready to Begin Your Journey?</h2>
                <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                  Join thousands who have found support, healing, and community in complete anonymity.
                </p>
                <Button 
                  size="lg" 
                  onClick={() => setShowWelcome(true)}
                  className="bg-gradient-to-r from-primary to-accent hover:shadow-xl px-12 py-6 text-lg"
                >
                  <Sparkles className="mr-2 h-5 w-5" />
                  Start Your Healing Today
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default Index;