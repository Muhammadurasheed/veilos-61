import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiRequest } from '@/services/api';
import { Expert } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useExpertFollow } from '@/hooks/useExpertFollow';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Star, 
  MapPin, 
  Clock, 
  Users, 
  MessageCircle, 
  Calendar,
  Award,
  Briefcase,
  GraduationCap,
  Globe,
  Phone,
  Mail,
  Heart,
  Share2,
  CheckCircle,
  Eye,
  TrendingUp,
  Zap,
  Shield,
  UserPlus,
  Video,
  Mic,
  MessageSquare
} from 'lucide-react';

interface ExpertProfileEnhancedProps {
  expertId?: string;
}

export function ExpertProfileEnhanced({ expertId: propExpertId }: ExpertProfileEnhancedProps) {
  const { expertId: paramExpertId } = useParams<{ expertId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const expertId = propExpertId || paramExpertId;
  const [expert, setExpert] = useState<Expert | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  const { isFollowing, isLoading: followLoading, toggleFollow } = useExpertFollow(
    expertId || '', 
    expert?.followers?.includes('current-user-id') || false
  );

  console.log('🔍 ExpertProfile mounted:', {
    expertId,
    paramExpertId,
    propExpertId,
    windowLocation: window.location.href
  });

  useEffect(() => {
    if (!expertId) {
      console.error('❌ No expert ID provided');
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Expert ID is required'
      });
      navigate('/beacons');
      return;
    }

    loadExpert();
    incrementProfileView();
  }, [expertId]);

  const loadExpert = async () => {
    try {
      console.log('🔄 Loading expert:', expertId);
      
      const response = await apiRequest('GET', `/api/experts/${expertId}`);
      console.log('📋 Expert API response:', response);

      if (response.success && response.data) {
        setExpert(response.data);
        console.log('✅ Expert loaded successfully:', response.data);
      } else {
        throw new Error(response.error || 'Expert not found');
      }
    } catch (error) {
      console.error('❌ Error loading expert:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load expert profile'
      });
      navigate('/beacons');
    } finally {
      setLoading(false);
    }
  };

  const incrementProfileView = async () => {
    try {
      await apiRequest('POST', `/api/experts/${expertId}/view`);
    } catch (error) {
      console.error('Failed to increment profile view:', error);
    }
  };

  const handleBookSession = () => {
    if (!expert) return;
    navigate(`/sessions/book/${expert.id}`);
  };

  const handleStartChat = () => {
    if (!expert) return;
    navigate(`/chat?expertId=${expert.id}`);
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.share({
        title: `${expert?.name} - Expert Profile`,
        text: expert?.bio,
        url
      });
    } catch (error) {
      // Fallback to clipboard
      navigator.clipboard.writeText(url);
      toast({
        title: 'Link Copied',
        description: 'Profile link copied to clipboard'
      });
    }
  };

  const renderRatingStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating 
                ? 'fill-yellow-400 text-yellow-400' 
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const renderVerificationBadge = (level: string) => {
    const config = {
      'blue': { color: 'bg-blue-100 text-blue-800 border-blue-300', icon: CheckCircle },
      'gold': { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: Award },
      'platinum': { color: 'bg-purple-100 text-purple-800 border-purple-300', icon: Shield },
      'none': { color: 'bg-gray-100 text-gray-600 border-gray-300', icon: Eye }
    };
    
    const { color, icon: Icon } = config[level as keyof typeof config] || config.none;
    
    return (
      <Badge variant="outline" className={color}>
        <Icon className="h-3 w-3 mr-1" />
        {level === 'none' ? 'Unverified' : `${level.toUpperCase()} Verified`}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading expert profile...</p>
        </div>
      </div>
    );
  }

  if (!expert) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Expert Not Found</h2>
          <p className="text-muted-foreground mb-4">The expert profile you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/beacons')}>
            Browse All Experts
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header Section */}
      <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-6xl mx-auto px-6 py-16">
          <div className="flex flex-col lg:flex-row items-start gap-8">
            {/* Avatar and Basic Info */}
            <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6">
              <div className="relative">
                <Avatar className="h-32 w-32 ring-4 ring-white/20 shadow-2xl">
                  <AvatarImage 
                    src={expert.avatarUrl} 
                    alt={expert.name}
                    className="object-cover"
                  />
                  <AvatarFallback className="text-4xl bg-gradient-to-br from-blue-500 to-purple-600">
                    {expert.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                {expert.isOnline && (
                  <div className="absolute -bottom-2 -right-2 h-8 w-8 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
                    <Zap className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
              
              <div className="text-center lg:text-left">
                <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-4">
                  <h1 className="text-4xl font-bold">{expert.name}</h1>
                  {renderVerificationBadge(expert.verificationLevel)}
                </div>
                
                {expert.headline && (
                  <p className="text-xl text-blue-100 mb-2">{expert.headline}</p>
                )}
                
                <p className="text-lg text-blue-50 mb-3">{expert.specialization}</p>
                
                <div className="flex flex-wrap justify-center lg:justify-start items-center gap-4 text-blue-100">
                  {expert.location?.city && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{expert.location.city}, {expert.location.country}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-1">
                    {renderRatingStars(expert.rating)}
                    <span className="ml-1 font-semibold">{expert.rating.toFixed(1)}</span>
                    <span className="text-blue-200">({expert.totalRatings} reviews)</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    <span>{expert.profileViews} profile views</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex-1 lg:flex lg:justify-end">
              <div className="grid grid-cols-2 lg:flex lg:flex-col gap-3 lg:w-64">
                <Button 
                  size="lg" 
                  className="bg-white text-blue-600 hover:bg-blue-50 font-semibold"
                  onClick={handleBookSession}
                >
                  <Calendar className="h-5 w-5 mr-2" />
                  Book Session
                </Button>
                
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-white/30 text-white hover:bg-white/10"
                  onClick={handleStartChat}
                >
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Start Chat
                </Button>
                
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-white/30 text-white hover:bg-white/10"
                  onClick={toggleFollow}
                  disabled={followLoading}
                >
                  {isFollowing ? (
                    <>
                      <Heart className="h-5 w-5 mr-2 fill-current" />
                      Following
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-5 w-5 mr-2" />
                      Follow
                    </>
                  )}
                </Button>
                
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-white/30 text-white hover:bg-white/10"
                  onClick={handleShare}
                >
                  <Share2 className="h-5 w-5 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-8 pt-8 border-t border-white/20">
            <div className="text-center">
              <div className="text-3xl font-bold">{expert.completedSessions}</div>
              <div className="text-blue-100">Sessions Completed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{expert.followersCount}</div>
              <div className="text-blue-100">Followers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{expert.yearsOfExperience || 0}+</div>
              <div className="text-blue-100">Years Experience</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{expert.responseTime?.split(' ')[2] || '1'}</div>
              <div className="text-blue-100">Hour Response</div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-5 w-full lg:w-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="experience">Experience</TabsTrigger>
            <TabsTrigger value="availability">Availability</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {/* About */}
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      About {expert.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                      {expert.bio}
                    </p>
                    
                    {expert.skills && expert.skills.length > 0 && (
                      <div className="mt-6">
                        <h4 className="font-semibold mb-3">Core Skills</h4>
                        <div className="flex flex-wrap gap-2">
                          {expert.skills.map((skill, index) => (
                            <Badge key={index} variant="secondary" className="px-3 py-1">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {expert.topicsHelped && expert.topicsHelped.length > 0 && (
                      <div className="mt-6">
                        <h4 className="font-semibold mb-3">Areas of Expertise</h4>
                        <div className="flex flex-wrap gap-2">
                          {expert.topicsHelped.map((topic, index) => (
                            <Badge key={index} variant="outline" className="px-3 py-1">
                              {topic}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Session Types */}
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-primary" />
                      Session Options
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      {expert.sessionPreferences?.sessionTypes?.chat && (
                        <div className="text-center p-4 border rounded-lg">
                          <MessageSquare className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                          <div className="font-medium">Text Chat</div>
                          <div className="text-sm text-gray-500">Instant messaging</div>
                        </div>
                      )}
                      
                      {expert.sessionPreferences?.sessionTypes?.voice && (
                        <div className="text-center p-4 border rounded-lg">
                          <Mic className="h-8 w-8 mx-auto mb-2 text-green-600" />
                          <div className="font-medium">Voice Call</div>
                          <div className="text-sm text-gray-500">Audio only</div>
                        </div>
                      )}
                      
                      {expert.sessionPreferences?.sessionTypes?.video && (
                        <div className="text-center p-4 border rounded-lg">
                          <Video className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                          <div className="font-medium">Video Call</div>
                          <div className="text-sm text-gray-500">Face to face</div>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <div className="text-sm text-gray-600">
                        <strong>Session Duration:</strong> {expert.sessionPreferences?.minDuration || 15} - {expert.sessionPreferences?.maxDuration || 60} minutes
                      </div>
                      {expert.sessionPreferences?.voiceMasking && (
                        <div className="text-sm text-gray-600 mt-1">
                          <Shield className="h-4 w-4 inline mr-1" />
                          Voice masking available for privacy
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Pricing */}
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-lg">Pricing</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      {expert.pricingModel === 'free' && (
                        <div>
                          <div className="text-3xl font-bold text-green-600">FREE</div>
                          <div className="text-sm text-gray-500">No charge for sessions</div>
                        </div>
                      )}
                      
                      {expert.pricingModel === 'donation' && (
                        <div>
                          <div className="text-3xl font-bold text-blue-600">Donation</div>
                          <div className="text-sm text-gray-500">Pay what you can</div>
                        </div>
                      )}
                      
                      {expert.pricingModel === 'fixed' && expert.hourlyRate && (
                        <div>
                          <div className="text-3xl font-bold text-purple-600">${expert.hourlyRate}</div>
                          <div className="text-sm text-gray-500">per hour</div>
                        </div>
                      )}
                      
                      {expert.pricingDetails && (
                        <p className="text-sm text-gray-600 mt-2">{expert.pricingDetails}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Response Time */}
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Response Time
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-green-600">
                        {expert.responseTime}
                      </div>
                      {expert.isOnline && (
                        <Badge variant="outline" className="mt-2 bg-green-50 text-green-700 border-green-300">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                          Online Now
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Languages */}
                {expert.languages && expert.languages.length > 0 && (
                  <Card className="shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Globe className="h-5 w-5" />
                        Languages
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {expert.languages.map((language, index) => (
                          <Badge key={index} variant="secondary">
                            {language}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Experience Tab */}
          <TabsContent value="experience" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Work Experience */}
              {expert.workExperience && expert.workExperience.length > 0 && (
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-primary" />
                      Work Experience
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {expert.workExperience.map((job) => (
                      <div key={job.id} className="border-l-2 border-primary pl-4">
                        <h4 className="font-semibold">{job.jobTitle}</h4>
                        <p className="text-primary font-medium">{job.company}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(job.startDate).getFullYear()} - {job.isCurrent ? 'Present' : new Date(job.endDate).getFullYear()}
                        </p>
                        {job.description && (
                          <p className="text-sm text-gray-600 mt-2">{job.description}</p>
                        )}
                        {job.skills && job.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {job.skills.map((skill, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Education */}
              {expert.education && expert.education.length > 0 && (
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-primary" />
                      Education
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {expert.education.map((edu) => (
                      <div key={edu.id} className="border-l-2 border-primary pl-4">
                        <h4 className="font-semibold">{edu.degree}</h4>
                        <p className="text-primary font-medium">{edu.institution}</p>
                        {edu.fieldOfStudy && (
                          <p className="text-sm text-gray-600">{edu.fieldOfStudy}</p>
                        )}
                        <p className="text-sm text-gray-500">
                          {edu.startDate && new Date(edu.startDate).getFullYear()} - {edu.endDate && new Date(edu.endDate).getFullYear()}
                        </p>
                        {edu.grade && (
                          <p className="text-sm text-gray-600">Grade: {edu.grade}</p>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Certifications & Achievements */}
            <div className="grid lg:grid-cols-2 gap-6">
              {expert.certifications && expert.certifications.length > 0 && (
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-primary" />
                      Certifications
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {expert.certifications.map((cert, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>{cert}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {expert.achievements && expert.achievements.length > 0 && (
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      Achievements
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {expert.achievements.map((achievement, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span>{achievement}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Availability Tab */}
          <TabsContent value="availability" className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Weekly Availability
                </CardTitle>
              </CardHeader>
              <CardContent>
                {expert.availability && expert.availability.length > 0 ? (
                  <div className="space-y-4">
                    {expert.availability.map((schedule) => (
                      <div key={schedule.day} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="font-medium capitalize">{schedule.day}</div>
                        <div className="flex gap-2">
                          {schedule.timeSlots && schedule.timeSlots.length > 0 ? (
                            schedule.timeSlots.map((slot, idx) => (
                              <Badge key={idx} variant={slot.available ? "default" : "secondary"}>
                                {slot.start} - {slot.end}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-gray-500">Not available</span>
                          )}
                        </div>
                      </div>
                    ))}
                    <div className="text-sm text-gray-600 mt-4">
                      <Clock className="h-4 w-4 inline mr-1" />
                      Timezone: {expert.location?.timezone || 'UTC'}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>Availability schedule not set</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Overall Rating</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-5xl font-bold text-primary mb-2">{expert.rating.toFixed(1)}</div>
                  {renderRatingStars(expert.rating)}
                  <p className="text-sm text-gray-600 mt-2">{expert.totalRatings} total ratings</p>
                </CardContent>
              </Card>

              <div className="lg:col-span-2">
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle>Recent Reviews</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {expert.testimonials && expert.testimonials.length > 0 ? (
                      <div className="space-y-4">
                        {expert.testimonials.map((testimonial) => (
                          <div key={testimonial.id} className="border-l-2 border-primary pl-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>{testimonial.user.alias[0]}</AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{testimonial.user.alias}</span>
                            </div>
                            <p className="text-gray-600">{testimonial.text}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Star className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                        <p>No reviews yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Contact Tab */}
          <TabsContent value="contact" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-primary" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-gray-500" />
                    <span>{expert.email}</span>
                  </div>
                  
                  {expert.phoneNumber && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-gray-500" />
                      <span>{expert.phoneNumber}</span>
                    </div>
                  )}

                  {expert.socialLinks && (
                    <>
                      {expert.socialLinks.linkedin && (
                        <div className="flex items-center gap-3">
                          <Globe className="h-5 w-5 text-gray-500" />
                          <a 
                            href={expert.socialLinks.linkedin} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            LinkedIn Profile
                          </a>
                        </div>
                      )}
                      
                      {expert.socialLinks.website && (
                        <div className="flex items-center gap-3">
                          <Globe className="h-5 w-5 text-gray-500" />
                          <a 
                            href={expert.socialLinks.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            Personal Website
                          </a>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    className="w-full justify-start" 
                    onClick={handleBookSession}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule a Session
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={handleStartChat}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                  
                  <Separator />
                  
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-red-600 hover:text-red-700"
                  >
                    <span>Report Profile</span>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}