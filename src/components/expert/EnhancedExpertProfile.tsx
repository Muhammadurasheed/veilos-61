import { useState } from 'react';
import { Expert } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  User,
  Star,
  Award,
  BookOpen,
  Briefcase,
  Heart,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  CheckCircle,
  Users,
  TrendingUp,
  Target
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

interface EnhancedExpertProfileProps {
  expert: Expert;
  onBookSession?: () => void;
  onSendMessage?: () => void;
}

const EnhancedExpertProfile = ({ expert, onBookSession, onSendMessage }: EnhancedExpertProfileProps) => {
  const [activeTab, setActiveTab] = useState('overview');

  const getVerificationIcon = (level: string) => {
    switch (level) {
      case 'platinum':
        return <ShieldAlert className="h-5 w-5 text-purple-600" />;
      case 'gold':
        return <ShieldCheck className="h-5 w-5 text-yellow-600" />;
      case 'blue':
        return <Shield className="h-5 w-5 text-blue-600" />;
      default:
        return <Shield className="h-5 w-5 text-gray-400" />;
    }
  };

  const getVerificationBadge = (level: string) => {
    const configs = {
      platinum: { className: 'bg-purple-100 text-purple-800 border-purple-300', label: 'Platinum Certified' },
      gold: { className: 'bg-yellow-100 text-yellow-800 border-yellow-300', label: 'Gold Verified' },
      blue: { className: 'bg-blue-100 text-blue-800 border-blue-300', label: 'Blue Verified' },
    };
    
    const config = configs[level as keyof typeof configs] || configs.blue;
    return (
      <Badge variant="outline" className={config.className}>
        {getVerificationIcon(level)}
        <span className="ml-2">{config.label}</span>
      </Badge>
    );
  };

  const MotionCard = motion(Card);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Section */}
      <MotionCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar and Basic Info */}
            <div className="flex-shrink-0">
              <div className="relative">
                <img
                  src={expert.avatarUrl || '/avatars/avatar-1.svg'}
                  alt={expert.name}
                  className="w-32 h-32 rounded-full object-cover border-4 border-primary/20"
                />
                {expert.verified && (
                  <CheckCircle className="absolute -bottom-2 -right-2 h-8 w-8 text-green-600 bg-white rounded-full p-1" />
                )}
              </div>
            </div>

            {/* Main Info */}
            <div className="flex-grow">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold mb-2">{expert.name}</h1>
                  <p className="text-xl text-muted-foreground mb-3">{expert.specialization}</p>
                  
                  {/* Verification and Rating */}
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    {getVerificationBadge(expert.verificationLevel)}
                    <div className="flex items-center">
                      <Star className="h-5 w-5 text-yellow-500 fill-current mr-1" />
                      <span className="font-semibold">{expert.rating.toFixed(1)}</span>
                      <span className="text-muted-foreground ml-1">({expert.testimonials?.length || 0} reviews)</span>
                    </div>
                    {expert.resumeData?.yearsOfExperience && (
                      <Badge variant="outline">
                        <Clock className="h-4 w-4 mr-1" />
                        {expert.resumeData.yearsOfExperience} years experience
                      </Badge>
                    )}
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <Users className="h-5 w-5 mx-auto mb-1 text-primary" />
                      <p className="text-sm font-medium">150+</p>
                      <p className="text-xs text-muted-foreground">Sessions</p>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <TrendingUp className="h-5 w-5 mx-auto mb-1 text-primary" />
                      <p className="text-sm font-medium">98%</p>
                      <p className="text-xs text-muted-foreground">Success Rate</p>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <Target className="h-5 w-5 mx-auto mb-1 text-primary" />
                      <p className="text-sm font-medium">24h</p>
                      <p className="text-xs text-muted-foreground">Avg Response</p>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <Heart className="h-5 w-5 mx-auto mb-1 text-primary" />
                      <p className="text-sm font-medium">{expert.topicsHelped?.length || 0}</p>
                      <p className="text-xs text-muted-foreground">Specialties</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2">
                  <Button onClick={onBookSession} size="lg" className="min-w-[140px]">
                    <Calendar className="h-4 w-4 mr-2" />
                    Book Session
                  </Button>
                  <Button variant="outline" onClick={onSendMessage} size="lg">
                    <Mail className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </MotionCard>

      {/* Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="experience">Experience</TabsTrigger>
          <TabsTrigger value="education">Education</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Professional Summary */}
            <MotionCard
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  About
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {expert.profileEnhancements?.professionalSummary || expert.bio}
                </p>
              </CardContent>
            </MotionCard>

            {/* Specializations */}
            <MotionCard
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  Specializations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {expert.topicsHelped?.map((topic, index) => (
                    <Badge key={index} variant="secondary" className="px-3 py-1">
                      {topic}
                    </Badge>
                  ))}
                  {expert.profileEnhancements?.specialtyTags?.map((tag, index) => (
                    <Badge key={index} variant="outline" className="px-3 py-1">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </MotionCard>

            {/* Skills & Expertise */}
            {expert.resumeData?.skills && (
              <MotionCard
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="md:col-span-2"
              >
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Award className="h-5 w-5 mr-2" />
                    Skills & Expertise
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(expert.resumeData.skills).map(([category, skills]) => {
                      if (!skills || skills.length === 0) return null;
                      return (
                        <div key={category}>
                          <h4 className="font-medium text-sm text-muted-foreground mb-2 uppercase">
                            {category === 'clinical' ? 'Clinical Skills' : 
                             category === 'soft' ? 'Interpersonal Skills' : 
                             category.charAt(0).toUpperCase() + category.slice(1)}
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {skills.map((skill, index) => (
                              <Badge key={index} variant="outline" className="text-sm">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </MotionCard>
            )}
          </div>
        </TabsContent>

        <TabsContent value="experience" className="space-y-6">
          {/* Professional Timeline */}
          {expert.profileEnhancements?.timeline && (
            <MotionCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Briefcase className="h-5 w-5 mr-2" />
                  Professional Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {expert.profileEnhancements.timeline
                    .filter(item => item.type === 'experience')
                    .map((item, index) => (
                      <div key={index} className="flex gap-4 pb-4 border-b last:border-b-0">
                        <div className="w-20 text-sm text-muted-foreground font-medium">
                          {item.year}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold">{item.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </MotionCard>
          )}

          {/* Key Achievements */}
          {expert.profileEnhancements?.achievements && (
            <MotionCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="h-5 w-5 mr-2" />
                  Key Achievements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {expert.profileEnhancements.achievements.map((achievement, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" />
                      <span className="text-sm">{achievement}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </MotionCard>
          )}
        </TabsContent>

        <TabsContent value="education" className="space-y-6">
          {/* Education & Certifications */}
          <div className="grid gap-6 md:grid-cols-2">
            <MotionCard
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="h-5 w-5 mr-2" />
                  Education
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {expert.resumeData?.education?.map((edu, index) => (
                    <div key={index} className="border-l-4 border-primary/20 pl-4">
                      <h4 className="font-semibold">{edu.degree}</h4>
                      <p className="text-sm text-muted-foreground">{edu.institution}</p>
                      {edu.field && <p className="text-sm text-muted-foreground">{edu.field}</p>}
                      {edu.year && <p className="text-xs text-muted-foreground mt-1">{edu.year}</p>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </MotionCard>

            <MotionCard
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="h-5 w-5 mr-2" />
                  Certifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {expert.resumeData?.certifications?.map((cert, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 rounded-lg border">
                      <Award className="h-5 w-5 text-yellow-600" />
                      <div>
                        <p className="font-medium">{cert.name}</p>
                        {cert.year && <p className="text-xs text-muted-foreground">{cert.year}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </MotionCard>
          </div>
        </TabsContent>

        <TabsContent value="reviews" className="space-y-6">
          {/* Reviews and Testimonials */}
          <MotionCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <CardHeader>
              <CardTitle className="flex items-center">
                <Star className="h-5 w-5 mr-2" />
                Client Reviews
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {expert.testimonials?.map((testimonial, index) => (
                  <div key={index} className="p-4 rounded-lg border bg-muted/50">
                    <p className="text-sm mb-2 italic">"{testimonial.text}"</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                        <span className="text-white font-semibold text-xs">
                          {testimonial.user.alias.charAt(0)}
                        </span>
                      </div>
                      <span>{testimonial.user.alias}</span>
                    </div>
                  </div>
                ))}
                {(!expert.testimonials || expert.testimonials.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Star className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No reviews yet. Be the first to share your experience!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </MotionCard>
        </TabsContent>
      </Tabs>

      {/* Contact Information */}
      <MotionCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <CardHeader>
          <CardTitle>Pricing & Contact</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Session Pricing</h4>
              <p className="text-2xl font-bold text-primary mb-1">
                {expert.pricingModel === 'free' ? 'Free' :
                 expert.pricingModel === 'donation' ? 'Donation-based' :
                 expert.pricingDetails || 'Contact for pricing'}
              </p>
              <p className="text-sm text-muted-foreground">
                {expert.pricingModel === 'free' ? 'Complimentary sessions available' :
                 expert.pricingModel === 'donation' ? 'Pay what you can afford' :
                 'Per 60-minute session'}
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Availability</h4>
              <Badge variant="outline" className="mb-2">
                <Clock className="h-4 w-4 mr-1" />
                Available this week
              </Badge>
              <p className="text-sm text-muted-foreground">
                Typically responds within 24 hours
              </p>
            </div>
          </div>
        </CardContent>
      </MotionCard>
    </div>
  );
};

export default EnhancedExpertProfile;