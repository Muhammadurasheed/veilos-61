
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUserContext } from '@/contexts/UserContext';
import { useRealTimeNotifications } from '@/hooks/useRealTimeNotifications';
import { ExpertApi } from '@/services/api';
import { Calendar, User, MessageSquare, Video, Clock, Edit, Settings, CheckCircle, AlertCircle } from 'lucide-react';
import { ExpertMatcher } from '@/components/recommendations/ExpertMatcher';

const ExpertDashboard = () => {
  const { user } = useUserContext();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');
  const [expertStatus, setExpertStatus] = useState<string>('pending');
  const [expertData, setExpertData] = useState<any>(null);
  
  // Listen for real-time notifications
  const { notifications } = useRealTimeNotifications();

  // Load expert data and status
  useEffect(() => {
    const loadExpertData = async () => {
      if (user?.expertId) {
        try {
          setIsLoading(true);
          const response = await ExpertApi.getById(user.expertId);
          if (response.success && response.data) {
            setExpertData(response.data);
            setExpertStatus(response.data.accountStatus || 'pending');
          }
        } catch (error) {
          console.error('Failed to load expert data:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadExpertData();
  }, [user?.expertId]);

  // Listen for status updates via notifications
  useEffect(() => {
    if (notifications.length > 0) {
      const statusUpdate = notifications.find(n => 
        n.type === 'expert_status_update' && n.data?.expertId === user?.expertId
      );
      
      if (statusUpdate) {
        setExpertStatus(statusUpdate.data.status);
        // Refresh expert data
        if (user?.expertId) {
          ExpertApi.getById(user.expertId).then(response => {
            if (response.success && response.data) {
              setExpertData(response.data);
            }
          });
        }
      }
    }
  }, [notifications, user?.expertId]);

  // Stats would normally come from API
  const stats = {
    pendingSessions: 2,
    completedSessions: 8,
    upcomingSession: {
      date: '2025-05-15T14:00:00',
      userAlias: 'Anonymous User',
      sessionType: 'video'
    },
    averageRating: 4.8
  };

  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { icon: any; color: string; text: string; description: string }> = {
      pending: {
        icon: Clock,
        color: 'bg-amber-100 text-amber-800 border-amber-300',
        text: 'Pending Review',
        description: 'Your expert profile is currently under review. This usually takes 1-3 business days.'
      },
      approved: {
        icon: CheckCircle,
        color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        text: 'Approved',
        description: 'Your expert profile has been approved! You can now accept sessions and help users.'
      },
      rejected: {
        icon: AlertCircle,
        color: 'bg-red-100 text-red-800 border-red-300',
        text: 'Application Rejected',
        description: 'Your application needs additional information. Please contact support for details.'
      },
      suspended: {
        icon: AlertCircle,
        color: 'bg-gray-100 text-gray-800 border-gray-300',
        text: 'Account Suspended',
        description: 'Your account has been temporarily suspended. Please contact support for assistance.'
      }
    };

    return statusMap[status] || statusMap.pending;
  };

  const statusInfo = getStatusInfo(expertStatus);

  return (
    <Layout>
      <div className="container py-8 w-full max-w-full">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-veilo-blue-dark dark:text-veilo-blue-light">
              Expert Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Welcome back! Manage your sessions and expert profile.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              variant="outline"
              className="flex items-center border-gray-200 dark:border-gray-700"
              onClick={() => navigate('/profile')}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>
            <Button 
              className="flex items-center bg-veilo-blue hover:bg-veilo-blue-dark"
              onClick={() => navigate('/settings')}
            >
              <Settings className="mr-2 h-4 w-4" />
              Expert Settings
            </Button>
          </div>
        </div>

        {/* Status Card - Shows real-time verification status */}
        <Card className="mb-8 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
          <CardContent className="py-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${
                  expertStatus === 'approved' ? 'bg-emerald-100' : 
                  expertStatus === 'rejected' ? 'bg-red-100' : 
                  'bg-amber-100'
                }`}>
                  <statusInfo.icon className={`h-6 w-6 ${
                    expertStatus === 'approved' ? 'text-emerald-600' : 
                    expertStatus === 'rejected' ? 'text-red-600' : 
                    'text-amber-600'
                  }`} />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                    Account Status: {statusInfo.text}
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400">
                    {statusInfo.description}
                  </p>
                  {expertData?.lastUpdated && (
                    <p className="text-xs text-gray-400 mt-1">
                      Last updated: {new Date(expertData.lastUpdated).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
              <Badge variant="outline" className={statusInfo.color}>
                {statusInfo.text}
              </Badge>
            </div>
          </CardContent>
        </Card>
            
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm hover:shadow transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-veilo-blue mr-2" />
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{stats.pendingSessions}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm hover:shadow transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Completed Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <MessageSquare className="h-5 w-5 text-veilo-blue mr-2" />
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{stats.completedSessions}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm hover:shadow transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Average Rating</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className="flex text-amber-400 mr-2">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className={`w-4 h-4 ${i < Math.round(stats.averageRating) ? 'text-amber-400' : 'text-gray-300 dark:text-gray-600'}`} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                    </svg>
                  ))}
                </div>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{stats.averageRating}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm hover:shadow transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Response Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <MessageSquare className="h-5 w-5 text-veilo-blue mr-2" />
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">100%</p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Expert Matcher Section */}
        <div className="mb-8">
          <ExpertMatcher />
        </div>
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upcoming Sessions */}
          <Card className="lg:col-span-2 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl font-semibold text-gray-800 dark:text-gray-200">Upcoming Sessions</CardTitle>
              <CardDescription>Your scheduled sessions with users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg border-gray-200 dark:border-gray-700 overflow-hidden">
                {stats.pendingSessions > 0 ? (
                  <div className="bg-white dark:bg-gray-800">
                    <div className="py-4 px-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mr-4">
                          {stats.upcomingSession.sessionType === 'video' ? (
                            <Video className="h-5 w-5 text-veilo-blue" />
                          ) : (
                            <MessageSquare className="h-5 w-5 text-veilo-blue" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 dark:text-gray-200">Session with {stats.upcomingSession.userAlias}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(stats.upcomingSession.date).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => navigate('/sessions')}
                      >
                        Join
                      </Button>
                    </div>
                    <div className="py-4 px-6 flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mr-4">
                          <MessageSquare className="h-5 w-5 text-veilo-blue" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 dark:text-gray-200">Session with Anonymous User</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date('2025-05-16T10:30:00').toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <Button 
                        size="sm"
                        variant="outline"
                        className="border-gray-200 dark:border-gray-700"
                        onClick={() => navigate('/sessions')}
                      >
                        View
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 px-6 text-center">
                    <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
                      <Calendar className="h-6 w-6 text-gray-400" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400">No upcoming sessions scheduled.</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Sessions will appear here once users book with you.</p>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              <Button
                variant="outline"
                className="w-full border-gray-200 dark:border-gray-700"
                onClick={() => navigate('/sessions')}
              >
                View All Sessions
              </Button>
            </CardFooter>
          </Card>
          
          {/* Availability Quick Edit */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl font-semibold text-gray-800 dark:text-gray-200">Manage Availability</CardTitle>
              <CardDescription>Update when you are available</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-700 dark:text-gray-300">Current Schedule</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    onClick={() => setCurrentView('availabilityEdit')}
                  >
                    <Edit className="h-4 w-4 mr-1" /> Edit
                  </Button>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Monday:</span>
                    <span className="text-gray-500 dark:text-gray-400">8 AM - 12 PM, 5 PM - 9 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Wednesday:</span>
                    <span className="text-gray-500 dark:text-gray-400">12 PM - 5 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Friday:</span>
                    <span className="text-gray-500 dark:text-gray-400">8 AM - 12 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Timezone:</span>
                    <span className="text-gray-500 dark:text-gray-400">PST</span>
                  </div>
                </div>
              </div>
              
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="outline" 
                    className="h-auto py-2 border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex flex-col items-center">
                      <Calendar className="h-4 w-4 mb-1" />
                      <span className="text-xs">Set Away</span>
                    </div>
                  </Button>
                  <Button 
                    variant="outline"
                    className="h-auto py-2 border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex flex-col items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-1">
                        <path d="M8 2v4"></path><path d="M16 2v4"></path><rect width="18" height="18" x="3" y="4" rx="2"></rect><path d="M3 10h18"></path>
                      </svg>
                      <span className="text-xs">Block Days</span>
                    </div>
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              <Button 
                className="w-full bg-veilo-blue hover:bg-veilo-blue-dark"
                onClick={() => setCurrentView('availability')}
              >
                Edit Full Schedule
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default ExpertDashboard;
