import { useRealTimeNotifications } from '@/hooks/useRealTimeNotifications';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, FileText, User, Mail, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const SimpleExpertApplications = () => {
  const { notifications, unreadCount } = useRealTimeNotifications();

  const expertApplications = notifications.filter(n => n.type === 'expert_application');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileText className="h-5 w-5 mr-2" />
          Expert Applications
          {unreadCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              {unreadCount} new
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          {expertApplications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2" />
              No expert applications yet
            </div>
          ) : (
            <div className="space-y-3">
              {expertApplications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`p-3 rounded-lg border ${!notification.read ? 'border-blue-200 bg-blue-50/50' : 'border-gray-200'}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-blue-100 rounded-full">
                        <User className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{notification.message}</p>
                        <div className="flex items-center text-xs text-muted-foreground mt-1">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                        </div>
                        {notification.data && (
                          <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                            <div className="flex items-center">
                              <Mail className="h-3 w-3 mr-1" />
                              {notification.data.email}
                            </div>
                            <div className="flex items-center">
                              <FileText className="h-3 w-3 mr-1" />
                              {notification.data.specialization}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    {!notification.read && (
                      <Badge variant="outline" className="text-xs">
                        <Bell className="h-3 w-3 mr-1" />
                        New
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default SimpleExpertApplications;