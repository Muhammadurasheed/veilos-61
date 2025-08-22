import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useExpertApplicationsRealtime } from '@/hooks/useExpertApplicationsRealtime';
import { formatDistanceToNow } from 'date-fns';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText, 
  Mail, 
  User,
  AlertCircle,
  Bell,
  BellOff
} from 'lucide-react';

const RealTimeExpertApplications = () => {
  const {
    applications,
    isConnected,
    unreadCount,
    approveApplication,
    rejectApplication,
    markAsRead,
    clearAllNotifications
  } = useExpertApplicationsRealtime();

  const [activeTab, setActiveTab] = useState('pending');

  const filteredApplications = applications.filter(app => {
    switch (activeTab) {
      case 'pending':
        return app.status === 'pending';
      case 'approved':
        return app.status === 'approved';
      case 'rejected':
        return app.status === 'rejected';
      default:
        return true;
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      case 'pending':
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Pending Review</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const handleApprove = async (expertId: string, applicationId: string) => {
    await approveApplication(expertId, applicationId);
    markAsRead(applicationId);
  };

  const handleReject = async (expertId: string, applicationId: string) => {
    await rejectApplication(expertId, applicationId, 'Application does not meet requirements');
    markAsRead(applicationId);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Real-Time Expert Applications
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount} new
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center space-x-2">
            <div className="flex items-center">
              {isConnected ? (
                <div className="flex items-center text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                  Live
                </div>
              ) : (
                <div className="flex items-center text-red-600">
                  <div className="w-2 h-2 bg-red-500 rounded-full mr-2" />
                  Disconnected
                </div>
              )}
            </div>
            {unreadCount > 0 && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={clearAllNotifications}
              >
                <BellOff className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All Applications</TabsTrigger>
            <TabsTrigger value="pending" className="relative">
              Pending
              {applications.filter(app => app.status === 'pending').length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {applications.filter(app => app.status === 'pending').length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            <ScrollArea className="h-[600px]">
              {filteredApplications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  No {activeTab === 'all' ? '' : activeTab} applications found
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredApplications.map((application) => (
                    <Card key={application.id} className={`${application.read === false ? 'border-blue-200 bg-blue-50/50' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4 flex-1">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={`https://api.dicebear.com/7.x/avatars/svg?seed=${application.name}`} />
                              <AvatarFallback>
                                <User className="h-6 w-6" />
                              </AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <h3 className="font-semibold text-lg">{application.name}</h3>
                                {getStatusBadge(application.status)}
                              {application.read === false && (
                                  <Badge variant="outline" className="text-xs">
                                    <Bell className="h-3 w-3 mr-1" />
                                    New
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="space-y-1 text-sm text-muted-foreground">
                                <div className="flex items-center">
                                  <Mail className="h-4 w-4 mr-2" />
                                  {application.email}
                                </div>
                                <div className="flex items-center">
                                  <FileText className="h-4 w-4 mr-2" />
                                  {application.specialization}
                                </div>
                                <div className="flex items-center">
                                  <Clock className="h-4 w-4 mr-2" />
                                  Submitted {formatDistanceToNow(new Date(application.submittedAt), { addSuffix: true })}
                                </div>
                                {application.documents && application.documents.length > 0 && (
                                  <div className="flex items-center">
                                    <FileText className="h-4 w-4 mr-2" />
                                    {application.documents.length} document(s) uploaded
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {application.status === 'pending' && (
                            <div className="flex space-x-2 ml-4">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 border-green-200 hover:bg-green-50"
                                onClick={() => handleApprove(application.expertId, application.id)}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 border-red-200 hover:bg-red-50"
                                onClick={() => handleReject(application.expertId, application.id)}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default RealTimeExpertApplications;