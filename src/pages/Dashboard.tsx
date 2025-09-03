import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Heart, Shield, Users, MessageCircle, Calendar, TrendingUp,
  Plus, ArrowRight, Clock, Star, Zap, Award, Mic
} from 'lucide-react';
import { useAuth } from '@/contexts/optimized/AuthContextRefactored';
import { Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';

const Dashboard = () => {
  const { user } = useAuth();
  const [weeklyProgress, setWeeklyProgress] = useState(75);

  // Mock data - replace with real API calls
  const recentActivities = [
    { id: 1, type: 'sanctuary', title: 'Anxiety Support Circle', time: '2 hours ago', participants: 12 },
    { id: 2, type: 'expert', title: 'Session with Dr. Sarah', time: '1 day ago', duration: '45 mins' },
    { id: 3, type: 'post', title: 'Shared wellness tip', time: '2 days ago', likes: 23 },
  ];

  const upcomingSessions = [
    { id: 1, title: 'Weekly Check-in', expert: 'Dr. Michael Chen', time: 'Today, 3:00 PM' },
    { id: 2, title: 'Group Therapy', expert: 'Sarah Johnson, LCSW', time: 'Tomorrow, 6:00 PM' },
  ];

  const wellnessStats = [
    { label: 'Sessions Completed', value: 24, icon: <MessageCircle className="h-5 w-5" />, change: '+3 this week' },
    { label: 'Sanctuaries Joined', value: 12, icon: <Users className="h-5 w-5" />, change: '+2 this week' },
    { label: 'Experts Followed', value: 5, icon: <Star className="h-5 w-5" />, change: '+1 this week' },
    { label: 'Wellness Score', value: 85, icon: <TrendingUp className="h-5 w-5" />, change: '+12% this month' },
  ];

  const quickActions = [
    { 
      title: 'Create Sanctuary', 
      description: 'Start a safe space for others',
      icon: <Shield className="h-6 w-6" />,
      action: '/sanctuary',
      color: 'from-blue-500 to-blue-600'
    },
    { 
      title: 'Live Audio Space', 
      description: 'Host voice-only live sessions',
      icon: <Mic className="h-6 w-6" />,
      action: '/flagship-sanctuary',
      color: 'from-green-500 to-green-600'
    },
    { 
      title: 'Find Expert', 
      description: 'Connect with professionals',
      icon: <MessageCircle className="h-6 w-6" />,
      action: '/beacons',
      color: 'from-green-500 to-green-600'
    },
    { 
      title: 'Join Community', 
      description: 'Explore support groups',
      icon: <Users className="h-6 w-6" />,
      action: '/feed',
      color: 'from-purple-500 to-purple-600'
    },
    { 
      title: 'Track Progress', 
      description: 'View your wellness journey',
      icon: <TrendingUp className="h-6 w-6" />,
      action: '/profile',
      color: 'from-orange-500 to-orange-600'
    }
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <div className="container mx-auto px-4 py-8">
          {/* Welcome Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                  Welcome back, {user?.alias}! 🕊️
                </h1>
                <p className="text-xl text-muted-foreground mt-2">
                  Your sanctuary dashboard - track your wellness journey
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className="bg-gradient-to-r from-primary to-accent text-primary-foreground">
                  Active Member
                </Badge>
                {user?.role === 'beacon' && (
                  <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                    Verified Expert
                  </Badge>
                )}
              </div>
            </div>
          </motion.div>

          {/* Wellness Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            {wellnessStats.map((stat, index) => (
              <Card key={stat.label} className="group hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-3xl font-bold text-primary">{stat.value}</p>
                      <p className="text-xs text-green-600 font-medium">{stat.change}</p>
                    </div>
                    <div className="p-3 rounded-full bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                      {stat.icon}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Weekly Progress */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      <span>Weekly Wellness Progress</span>
                    </CardTitle>
                    <CardDescription>
                      You're {weeklyProgress}% towards your weekly wellness goals
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Progress value={weeklyProgress} className="h-3" />
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>3 sessions completed</span>
                        <span>1 more to reach your goal</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Quick Actions */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>
                      Start your wellness activities with one click
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {quickActions.map((action, index) => (
                        <motion.div
                          key={action.title}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Button
                            asChild
                            variant="outline"
                            className="h-auto p-6 flex-col items-start space-y-2 w-full group hover:shadow-md transition-all"
                          >
                            <Link to={action.action}>
                              <div className={`p-3 rounded-xl bg-gradient-to-r ${action.color} text-white group-hover:scale-110 transition-transform`}>
                                {action.icon}
                              </div>
                              <div className="text-left">
                                <h3 className="font-semibold">{action.title}</h3>
                                <p className="text-sm text-muted-foreground">{action.description}</p>
                              </div>
                            </Link>
                          </Button>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Recent Activities */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activities</CardTitle>
                    <CardDescription>
                      Your latest wellness interactions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentActivities.map((activity) => (
                        <div key={activity.id} className="flex items-center space-x-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                          <div className="p-2 rounded-full bg-primary/10 text-primary">
                            {activity.type === 'sanctuary' && <Shield className="h-4 w-4" />}
                            {activity.type === 'expert' && <MessageCircle className="h-4 w-4" />}
                            {activity.type === 'post' && <Heart className="h-4 w-4" />}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium">{activity.title}</h4>
                            <p className="text-sm text-muted-foreground">{activity.time}</p>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {activity.participants && `${activity.participants} participants`}
                            {activity.duration && activity.duration}
                            {activity.likes && `${activity.likes} likes`}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              {/* Upcoming Sessions */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      <span>Upcoming Sessions</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {upcomingSessions.map((session) => (
                        <div key={session.id} className="p-4 rounded-lg border border-primary/20 bg-primary/5">
                          <h4 className="font-medium mb-1">{session.title}</h4>
                          <p className="text-sm text-muted-foreground mb-2">{session.expert}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-primary">{session.time}</span>
                            <Button size="sm" variant="ghost">
                              <Clock className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      <Button asChild variant="outline" className="w-full">
                        <Link to="/sessions">
                          View All Sessions
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Daily Inspiration */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Card className="bg-gradient-to-br from-accent/5 to-primary/5 border-accent/20">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Star className="h-5 w-5 text-accent" />
                      <span>Daily Inspiration</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <blockquote className="text-lg italic text-center mb-4">
                      "Mental health is not a destination, but a process. It's about how you drive, not where you're going."
                    </blockquote>
                    <p className="text-sm text-muted-foreground text-center">
                      — Noam Shpancer, Psychologist
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Achievement Badge */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <Card className="bg-gradient-to-br from-green-500/5 to-green-600/5 border-green-500/20">
                  <CardContent className="p-6 text-center">
                    <div className="inline-flex p-4 rounded-full bg-green-500/10 text-green-600 mb-4">
                      <Award className="h-8 w-8" />
                    </div>
                    <h3 className="font-semibold mb-2">Wellness Warrior</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      You've completed 24 wellness sessions this month!
                    </p>
                    <Badge className="bg-green-500 text-white">
                      New Achievement
                    </Badge>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;