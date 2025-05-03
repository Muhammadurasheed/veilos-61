
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

const AdminDashboard = () => {
  // In a real application, this would come from an API
  const dashboardData = {
    totalExperts: 56,
    pendingExperts: 3,
    totalPosts: 427,
    flaggedPosts: 3,
    activeUsers: 215,
    sessionsToday: 18,
    totalSessions: 892,
    topTopics: [
      { name: 'Relationships', count: 82 },
      { name: 'MentalHealth', count: 68 },
      { name: 'Faith', count: 54 },
      { name: 'Family', count: 47 },
      { name: 'Career', count: 32 },
    ],
    alertedContent: [
      { type: 'self_harm', count: 2 },
      { type: 'abuse', count: 1 },
      { type: 'hate_speech', count: 0 },
    ],
  };

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Experts</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 text-veilo-blue"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.totalExperts}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardData.pendingExperts} pending approval
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 text-veilo-green"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              +18% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 text-veilo-purple"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.totalPosts}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardData.flaggedPosts} flagged for review
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Sessions Completed</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 text-veilo-gold-dark"
            >
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
              <path d="M3 9h18" />
              <path d="M9 21V9" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.totalSessions}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardData.sessionsToday} today
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Platform Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[215px] flex items-center justify-center">
              <p className="text-sm text-muted-foreground">Activity chart visualization would go here</p>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Top Topics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.topTopics.map((topic) => (
                <div key={topic.name} className="flex items-center">
                  <div className="w-[180px] flex items-center">
                    <Badge variant="outline" className="mr-2">
                      #{topic.name}
                    </Badge>
                  </div>
                  <div className="w-full flex items-center gap-4">
                    <Progress
                      value={(topic.count / dashboardData.topTopics[0].count) * 100}
                      className="h-2"
                    />
                    <span className="text-sm font-medium">{topic.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Content Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.alertedContent.map((alert) => (
                <div key={alert.type} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-2 ${alert.count > 0 ? 'bg-red-500' : 'bg-gray-300'}`} />
                    <span className="capitalize">{alert.type.replace('_', ' ')}</span>
                  </div>
                  <Badge
                    variant={alert.count > 0 ? 'destructive' : 'outline'}
                  >
                    {alert.count}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Expert Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Mental Health</span>
                <span className="text-sm font-medium">38%</span>
              </div>
              <Progress value={38} className="h-2" />
              
              <div className="flex items-center justify-between mt-4">
                <span className="text-sm">Faith Counseling</span>
                <span className="text-sm font-medium">24%</span>
              </div>
              <Progress value={24} className="h-2" />
              
              <div className="flex items-center justify-between mt-4">
                <span className="text-sm">Relationships</span>
                <span className="text-sm font-medium">22%</span>
              </div>
              <Progress value={22} className="h-2" />
              
              <div className="flex items-center justify-between mt-4">
                <span className="text-sm">Career</span>
                <span className="text-sm font-medium">10%</span>
              </div>
              <Progress value={10} className="h-2" />
              
              <div className="flex items-center justify-between mt-4">
                <span className="text-sm">Other</span>
                <span className="text-sm font-medium">6%</span>
              </div>
              <Progress value={6} className="h-2" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="w-2 h-2 rounded-full bg-veilo-blue mt-1.5 mr-2" />
                <div>
                  <p className="text-sm">New expert application submitted</p>
                  <p className="text-xs text-gray-500">2 minutes ago</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="w-2 h-2 rounded-full bg-veilo-green mt-1.5 mr-2" />
                <div>
                  <p className="text-sm">Dr. Sarah Johnson approved as expert</p>
                  <p className="text-xs text-gray-500">45 minutes ago</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 mr-2" />
                <div>
                  <p className="text-sm">Content flagged for self-harm</p>
                  <p className="text-xs text-gray-500">1 hour ago</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="w-2 h-2 rounded-full bg-veilo-blue mt-1.5 mr-2" />
                <div>
                  <p className="text-sm">New session scheduled</p>
                  <p className="text-xs text-gray-500">3 hours ago</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="w-2 h-2 rounded-full bg-veilo-gold mt-1.5 mr-2" />
                <div>
                  <p className="text-sm">Platform maintenance complete</p>
                  <p className="text-xs text-gray-500">5 hours ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
