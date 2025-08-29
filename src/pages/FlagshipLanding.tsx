import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { 
  Heart, Shield, Users, MessageCircle, Video, BookOpen, ArrowRight, 
  Sparkles, Star, CheckCircle, Globe, Zap, Award, TrendingUp,
  Play, UserCheck, Lock, Headphones
} from 'lucide-react';
import { useAuth } from '@/contexts/optimized/AuthContextRefactored';
import { Link } from 'react-router-dom';

const FlagshipLanding = () => {
  const { user, isAuthenticated } = useAuth();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (isAuthenticated && user) {
      window.location.href = '/dashboard';
    }
  }, [isAuthenticated, user]);

  const features = [
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Bank-Grade Security",
      description: "End-to-end encryption with zero-knowledge architecture. Your identity remains completely anonymous.",
      gradient: "from-blue-500 to-blue-600",
      stats: "256-bit encryption"
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Live Sanctuary Sessions",
      description: "Join curated group discussions with real-time AI moderation and crisis intervention.",
      gradient: "from-green-500 to-green-600",
      stats: "500+ daily sessions"
    },
    {
      icon: <UserCheck className="h-8 w-8" />,
      title: "Verified Expert Network",
      description: "Connect with licensed therapists, counselors, and mental health professionals worldwide.",
      gradient: "from-purple-500 to-purple-600",
      stats: "1000+ verified experts"
    },
    {
      icon: <Headphones className="h-8 w-8" />,
      title: "AI-Powered Moderation",
      description: "Advanced emotional intelligence ensures every conversation remains safe and supportive.",
      gradient: "from-red-500 to-red-600",
      stats: "99.7% safety rate"
    }
  ];

  const enterpriseFeatures = [
    { icon: <Globe className="h-6 w-6" />, title: "Global Accessibility", desc: "Available in 25+ languages" },
    { icon: <Zap className="h-6 w-6" />, title: "Real-time Sync", desc: "Instant messaging & audio" },
    { icon: <Award className="h-6 w-6" />, title: "Professional Grade", desc: "HIPAA compliant infrastructure" },
    { icon: <TrendingUp className="h-6 w-6" />, title: "Success Analytics", desc: "Track your wellness journey" }
  ];

  const stats = [
    { label: "Active Communities", value: "50K+", icon: <Users className="h-5 w-5" /> },
    { label: "Verified Experts", value: "1K+", icon: <Star className="h-5 w-5" /> },
    { label: "Safe Sessions Daily", value: "10K+", icon: <Shield className="h-5 w-5" /> },
    { label: "Success Rate", value: "97%", icon: <CheckCircle className="h-5 w-5" /> }
  ];

  const testimonials = [
    {
      name: "Sarah K.",
      role: "Student",
      content: "Veilo gave me the courage to speak about my anxiety without fear of judgment. The anonymous support changed everything.",
      avatar: "/avatars/avatar-2.svg"
    },
    {
      name: "Dr. Michael R.", 
      role: "Licensed Therapist",
      content: "As a mental health professional, I'm impressed by Veilo's commitment to privacy and the quality of their moderation system.",
      avatar: "/avatars/avatar-5.svg"
    },
    {
      name: "Alex M.",
      role: "Software Engineer", 
      content: "The live sanctuary sessions became my lifeline during burnout. Having access to both peers and professionals was incredible.",
      avatar: "/avatars/avatar-3.svg"
    }
  ];

  if (isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  return (
    <>

      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        {/* Navigation Header */}
        <nav className="sticky top-0 z-50 w-full backdrop-blur-md bg-background/80 border-b border-border/50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-lg">
                  <Heart className="h-6 w-6 text-primary-foreground" />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Veilo
                </span>
                <Badge className="bg-primary/10 text-primary border-primary/20">Enterprise Ready</Badge>
              </div>
              <div className="flex items-center space-x-3">
                <Button asChild variant="ghost" className="font-medium">
                  <Link to="/auth?mode=login">Sign In</Link>
                </Button>
                <Button asChild className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg font-medium px-6">
                  <Link to="/auth?mode=register">Get Started Free</Link>
                </Button>
              </div>
            </div>
          </div>
        </nav>

        <div className="container mx-auto px-4">
          {/* Hero Section */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20 space-y-8"
          >
            <div className="space-y-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-6 py-3 rounded-full border border-primary/20"
              >
                <Sparkles className="h-4 w-4" />
                <span className="font-medium">Trusted by 50K+ mental health advocates</span>
              </motion.div>

              <h1 className="text-6xl md:text-8xl font-bold">
                <span className="bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-transparent">
                  Your Mental Health
                </span>
                <br />
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Sanctuary
                </span>
              </h1>

              <p className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
                Connect with verified mental health professionals and supportive communities 
                in complete anonymity. Enterprise-grade security meets human compassion.
              </p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Button asChild size="lg" className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-xl px-12 py-6 text-lg font-semibold">
                <Link to="/auth?mode=register">
                  <Play className="mr-3 h-6 w-6" />
                  Start Your Journey
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="px-12 py-6 text-lg border-primary/30 hover:bg-primary/5 font-semibold">
                <Link to="/auth?mode=login">
                  <Video className="mr-3 h-6 w-6" />
                  Watch Demo
                </Link>
              </Button>
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex items-center justify-center space-x-8 text-sm text-muted-foreground pt-8"
            >
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4" />
                <span>HIPAA Compliant</span>
              </div>
              <div className="flex items-center space-x-2">
                <Lock className="h-4 w-4" />
                <span>256-bit Encryption</span>
              </div>
              <div className="flex items-center space-x-2">
                <Award className="h-4 w-4" />
                <span>SOC 2 Certified</span>
              </div>
            </motion.div>
          </motion.section>

          {/* Stats Section */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="py-16"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  className="text-center"
                >
                  <div className="flex justify-center mb-3 text-primary">
                    {stat.icon}
                  </div>
                  <div className="text-4xl font-bold text-primary mb-2">{stat.value}</div>
                  <div className="text-muted-foreground">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Features Section */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="py-20"
          >
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Enterprise-Grade Mental Health Platform
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Built for scale, designed for compassion. Every feature crafted to ensure your safety and privacy.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 + index * 0.1 }}
                >
                  <Card className="h-full group hover:shadow-2xl transition-all duration-500 border border-primary/20 bg-gradient-to-br from-card to-primary/5 overflow-hidden relative">
                    <CardContent className="p-8">
                      <div className="flex items-start space-x-6">
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                          <div className="text-primary">
                            {feature.icon}
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-2xl font-bold">{feature.title}</h3>
                            <Badge variant="secondary" className="text-xs">
                              {feature.stats}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground leading-relaxed text-lg">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Enterprise features grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {enterpriseFeatures.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.1 + index * 0.1 }}
                  className="text-center p-6 rounded-xl bg-gradient-to-br from-muted/50 to-primary/5 border border-primary/10"
                >
                  <div className="inline-flex p-3 rounded-full bg-primary/10 text-primary mb-4">
                    {feature.icon}
                  </div>
                  <h4 className="font-semibold mb-2">{feature.title}</h4>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Testimonials */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="py-20"
          >
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Trusted by Mental Health Advocates
              </h2>
              <p className="text-xl text-muted-foreground">
                Real stories from our community of healing and support.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={testimonial.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.3 + index * 0.1 }}
                >
                  <Card className="h-full bg-gradient-to-br from-card to-primary/5 border border-primary/20">
                    <CardContent className="p-8">
                      <p className="text-lg mb-6 leading-relaxed italic">
                        "{testimonial.content}"
                      </p>
                      <div className="flex items-center space-x-4">
                        <img 
                          src={testimonial.avatar} 
                          alt={testimonial.name}
                          className="w-12 h-12 rounded-full"
                        />
                        <div>
                          <div className="font-semibold">{testimonial.name}</div>
                          <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* CTA Section */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4 }}
            className="py-20"
          >
            <Card className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border-primary/20 overflow-hidden relative">
              <CardContent className="p-16 text-center">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5 opacity-50"></div>
                <div className="relative z-10">
                  <h2 className="text-4xl md:text-5xl font-bold mb-6">
                    Ready to Transform Mental Healthcare?
                  </h2>
                  <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
                    Join the next generation of anonymous mental health support. 
                    Your journey to wellness starts with complete privacy and professional care.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <Button asChild size="lg" className="bg-gradient-to-r from-primary to-accent hover:shadow-2xl px-12 py-6 text-lg font-semibold">
                      <Link to="/auth?mode=register">
                        <Sparkles className="mr-3 h-6 w-6" />
                        Start Free Today
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="px-12 py-6 text-lg border-primary/30 hover:bg-primary/5 font-semibold">
                      <Link to="/auth?mode=login">
                        <MessageCircle className="mr-3 h-6 w-6" />
                        Talk to Expert
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.section>
        </div>

        {/* Footer */}
        <footer className="border-t border-border/50 bg-muted/20 mt-20">
          <div className="container mx-auto px-4 py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                    <Heart className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <span className="text-xl font-bold">Veilo</span>
                </div>
                <p className="text-muted-foreground">
                  Making mental healthcare accessible, anonymous, and effective for everyone.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Platform</h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div>Live Sanctuaries</div>
                  <div>Expert Network</div>
                  <div>AI Moderation</div>
                  <div>Privacy Center</div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Support</h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div>Help Center</div>
                  <div>Crisis Resources</div>
                  <div>Community Guidelines</div>
                  <div>Safety Features</div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Company</h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div>About Us</div>
                  <div>Privacy Policy</div>
                  <div>Terms of Service</div>
                  <div>Contact</div>
                </div>
              </div>
            </div>
            <div className="border-t border-border/50 mt-8 pt-8 text-center text-sm text-muted-foreground">
              <p>&copy; 2024 Veilo. All rights reserved. Your mental health journey, completely private.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default FlagshipLanding;