import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Expert } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useUserContext } from '@/contexts/UserContext';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { AdminApi } from '@/services/api';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Search,
  Filter,
  Download,
  FileText,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  User,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Loader2,
  RefreshCw,
  Bell,
  Zap,
  TrendingUp,
  Users,
  Activity
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useRealTimeNotifications } from '@/hooks/useRealTimeNotifications';
import { ExpertApplicationDetails } from './ExpertApplicationDetails';

interface ExpertFilters {
  status: string;
  verificationLevel: string;
  search: string;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

const FlagshipExpertManagement = () => {
  const { user, setUser } = useUserContext();
  const { isAuthenticated, isLoading: authLoading, user: adminUser } = useAdminAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedExperts, setSelectedExperts] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<'approve' | 'reject' | 'suspend' | 'reactivate' | ''>('');
  const [bulkNotes, setBulkNotes] = useState('');
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('pending');
  
  const [filters, setFilters] = useState<ExpertFilters>({
    status: 'pending',
    verificationLevel: 'all_levels',
    search: '',
  });
  const [selectedExpertForReview, setSelectedExpertForReview] = useState<Expert | null>(null);
  const [showExpertDetails, setShowExpertDetails] = useState(false);

  // Ensure admin user is set in UserContext for socket connection
  useEffect(() => {
    if (isAuthenticated && adminUser && (!user || user.role !== 'admin')) {
      console.log('🔑 Setting admin user in UserContext for socket connection:', adminUser);
      setUser({
        ...adminUser,
        loggedIn: true
      });
    }
  }, [isAuthenticated, adminUser, user, setUser]);

  // Real-time notifications and socket connection with debugging
  const { notifications, unreadCount } = useRealTimeNotifications();
  
  console.log('🎯 FlagshipExpertManagement - notifications state:', {
    notificationCount: notifications.length,
    unreadCount,
    latestNotification: notifications[0]
  });

  // Enhanced experts query with real-time updates
  const { data: expertsData, isLoading, isError, refetch } = useQuery({
    queryKey: ['flagshipExperts', currentPage, filters, activeTab],
    queryFn: async () => {
      const params = {
        page: currentPage,
        limit: 10,
        status: activeTab !== 'all' ? activeTab : undefined,
        ...(filters.verificationLevel !== 'all_levels' && { verificationLevel: filters.verificationLevel }),
        ...(filters.search && { search: filters.search }),
      };

      const response = await AdminApi.getExpertsAdvanced(params);
      if (!response.success) throw new Error(response.error || 'Failed to fetch experts');
      return response.data;
    },
    staleTime: 10000, // Cache for 10 seconds for real-time feel
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  // Auto-refresh when notifications are received
  useEffect(() => {
    if (notifications.length > 0) {
      const latestNotification = notifications[0];
      if (latestNotification.type === 'expert_application') {
        console.log('New expert application received, refreshing data...');
        refetch();
      }
    }
  }, [notifications, refetch]);

  // Platform overview query
  const { data: platformData } = useQuery({
    queryKey: ['platformOverview'],
    queryFn: async () => {
      const response = await AdminApi.getPlatformOverview({ timeframe: '7d' });
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
    refetchInterval: 60000, // Refresh every minute
  });

  // Bulk action mutation
  const bulkActionMutation = useMutation({
    mutationFn: async (params: { expertIds: string[]; action: 'approve' | 'reject' | 'suspend' | 'reactivate'; notes?: string }) => {
      const response = await AdminApi.bulkExpertAction(params);
      if (!response.success) throw new Error(response.error || 'Bulk action failed');
      return response;
    },
    onSuccess: (data) => {
      toast({
        title: 'Bulk Action Complete',
        description: `${data.data.modifiedCount} experts updated successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ['flagshipExperts'] });
      queryClient.invalidateQueries({ queryKey: ['platformOverview'] });
      setSelectedExperts([]);
      setShowBulkDialog(false);
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Action Failed',
        description: error.message,
      });
    },
  });

  const experts = expertsData?.experts || [];
  const pagination: PaginationData = expertsData?.pagination || {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  };
  const statistics = expertsData?.statistics || {};

  const handleSelectExpert = (expertId: string) => {
    setSelectedExperts(prev => 
      prev.includes(expertId) 
        ? prev.filter(id => id !== expertId)
        : [...prev, expertId]
    );
  };

  const handleSelectAll = () => {
    const allIds = experts.map((expert: Expert) => expert.id);
    setSelectedExperts(selectedExperts.length === experts.length ? [] : allIds);
  };

  const handleBulkAction = () => {
    if (selectedExperts.length === 0 || !bulkAction) return;
    
    bulkActionMutation.mutate({
      expertIds: selectedExperts,
      action: bulkAction,
      notes: bulkNotes || undefined,
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: 'bg-amber-100 text-amber-800 border-amber-300',
      approved: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      rejected: 'bg-red-100 text-red-800 border-red-300',
      suspended: 'bg-gray-100 text-gray-800 border-gray-300',
    };
    
    return (
      <Badge variant="outline" className={variants[status] || variants.pending}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getVerificationBadge = (level: string) => {
    const variants: Record<string, string> = {
      blue: 'bg-blue-100 text-blue-800 border-blue-300',
      gold: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      platinum: 'bg-purple-100 text-purple-800 border-purple-300',
    };
    
    return (
      <Badge variant="outline" className={variants[level] || variants.blue}>
        {level.charAt(0).toUpperCase() + level.slice(1)}
      </Badge>
    );
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setCurrentPage(1);
    setFilters(prev => ({ ...prev, status: value }));
  };

  const handleViewExpert = (expert: Expert) => {
    setSelectedExpertForReview(expert);
    setShowExpertDetails(true);
  };

  const handleExpertStatusUpdate = () => {
    // Refresh the data when an expert's status is updated
    refetch();
    queryClient.invalidateQueries({ queryKey: ['flagshipExperts'] });
    queryClient.invalidateQueries({ queryKey: ['platformOverview'] });
  };

  // Auto-refresh interval effect
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 15000); // Refresh every 15 seconds

    return () => clearInterval(interval);
  }, [refetch]);

  return (
    <div className="space-y-6">
      {/* Flagship Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-xl p-6 text-white">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Expert Management Center</h1>
              <p className="text-blue-100 text-lg">
                Real-time expert application processing & verification dashboard
              </p>
            </div>
            <div className="flex items-center gap-4">
              {/* Real-time indicator */}
              <div className="flex items-center gap-2 bg-white/20 rounded-lg px-3 py-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-sm font-medium">Live</span>
              </div>
              
              {/* Notifications */}
              <Button
                variant="ghost"
                size="icon"
                className="relative bg-white/10 hover:bg-white/20 text-white"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Button>
              
              <Button
                variant="ghost"
                onClick={() => refetch()}
                disabled={isLoading}
                className="bg-white/10 hover:bg-white/20 text-white"
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                Refresh
              </Button>
            </div>
          </div>
          
          {/* Platform Stats */}
          {platformData && (
            <div className="grid grid-cols-4 gap-4 mt-6">
              <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  <span className="text-sm opacity-90">Total Experts</span>
                </div>
                <div className="text-2xl font-bold mt-1">{platformData.experts?.totalExperts || 0}</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  <span className="text-sm opacity-90">Pending</span>
                </div>
                <div className="text-2xl font-bold mt-1 text-amber-200">{platformData.experts?.pendingApplications || 0}</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  <span className="text-sm opacity-90">Approved</span>
                </div>
                <div className="text-2xl font-bold mt-1 text-green-200">{platformData.experts?.approvedExperts || 0}</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  <span className="text-sm opacity-90">This Week</span>
                </div>
                <div className="text-2xl font-bold mt-1">{platformData.applicationTrend?.reduce((acc: number, day: any) => acc + day.count, 0) || 0}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Smart Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Name, email, or specialization..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Verification Level</label>
              <Select
                value={filters.verificationLevel}
                onValueChange={(value) => setFilters(prev => ({ ...prev, verificationLevel: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_levels">All levels</SelectItem>
                  <SelectItem value="blue">Blue</SelectItem>
                  <SelectItem value="gold">Gold</SelectItem>
                  <SelectItem value="platinum">Platinum</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Quick Actions</label>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  <Activity className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Tabs */}
      <Card>
        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="grid grid-cols-5 w-full mb-6">
              <TabsTrigger value="pending" className="relative">
                Pending
                {statistics.pendingApplications > 0 && (
                  <Badge className="ml-2 bg-amber-500 text-white text-xs h-5 w-5 rounded-full p-0 flex items-center justify-center">
                    {statistics.pendingApplications}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
              <TabsTrigger value="suspended">Suspended</TabsTrigger>
              <TabsTrigger value="all">All ({pagination.total})</TabsTrigger>
            </TabsList>

            {/* Bulk Actions Bar */}
            {selectedExperts.length > 0 && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium">
                      {selectedExperts.length} expert{selectedExperts.length !== 1 ? 's' : ''} selected
                    </span>
                    <Select value={bulkAction} onValueChange={(value: 'approve' | 'reject' | 'suspend' | 'reactivate') => setBulkAction(value)}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Choose action" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="approve">✅ Approve</SelectItem>
                        <SelectItem value="reject">❌ Reject</SelectItem>
                        <SelectItem value="suspend">⏸️ Suspend</SelectItem>
                        <SelectItem value="reactivate">🔄 Reactivate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setSelectedExperts([])}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => setShowBulkDialog(true)}
                      disabled={!bulkAction}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Apply Action
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <TabsContent value={activeTab} className="space-y-4">
              {isLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedExperts.length === experts.length && experts.length > 0}
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead>Expert</TableHead>
                        <TableHead>Specialization</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Verification</TableHead>
                        <TableHead>Documents</TableHead>
                        <TableHead>Applied</TableHead>
                        <TableHead>Processing Time</TableHead>
                        <TableHead className="w-16">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {experts.map((expert: any) => (
                        <TableRow key={expert.id} className="hover:bg-gray-50">
                          <TableCell>
                            <Checkbox
                              checked={selectedExperts.includes(expert.id)}
                              onCheckedChange={() => handleSelectExpert(expert.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full overflow-hidden bg-gray-100">
                                <img
                                  src={expert.avatarUrl || '/avatars/avatar-1.svg'}
                                  alt={expert.name}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                              <div>
                                <div className="font-medium">{expert.name}</div>
                                <div className="text-sm text-muted-foreground">{expert.email}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">{expert.specialization}</span>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(expert.accountStatus || 'pending')}
                          </TableCell>
                          <TableCell>
                            {getVerificationBadge(expert.verificationLevel || 'blue')}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                {expert.documentCount || 0} files
                                {expert.pendingDocuments > 0 && (
                                  <Badge variant="outline" className="ml-2 text-xs">
                                    {expert.pendingDocuments} pending
                                  </Badge>
                                )}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-muted-foreground">
                              {expert.createdAt ? format(new Date(expert.createdAt), 'MMM dd, yyyy') : 'N/A'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {expert.daysSinceApplication 
                                ? `${Math.floor(expert.daysSinceApplication)} days`
                                : 'N/A'
                              }
                            </div>
                          </TableCell>
                           <TableCell>
                             <div className="flex items-center gap-1">
                               <Button 
                                 variant="ghost" 
                                 size="sm"
                                 onClick={() => handleViewExpert(expert)}
                               >
                                 <Eye className="h-4 w-4" />
                               </Button>
                               <Button variant="ghost" size="sm">
                                 <MoreHorizontal className="h-4 w-4" />
                               </Button>
                             </div>
                           </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between py-4">
                      <div className="text-sm text-muted-foreground">
                        Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} experts
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={!pagination.hasPrev}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </Button>
                        <span className="text-sm font-medium">
                          Page {pagination.page} of {pagination.totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                          disabled={!pagination.hasNext}
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Bulk Action Confirmation Dialog */}
      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Bulk Action</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              Are you sure you want to <strong>{bulkAction}</strong> {selectedExperts.length} expert{selectedExperts.length !== 1 ? 's' : ''}?
            </p>
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes (optional)</label>
              <Textarea
                placeholder="Add notes about this action..."
                value={bulkNotes}
                onChange={(e) => setBulkNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleBulkAction}
              disabled={bulkActionMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {bulkActionMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                `Confirm ${bulkAction}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Expert Application Details Dialog */}
      <ExpertApplicationDetails
        expert={selectedExpertForReview}
        open={showExpertDetails}
        onOpenChange={setShowExpertDetails}
        onStatusUpdate={handleExpertStatusUpdate}
      />
    </div>
  );
};

export default FlagshipExpertManagement;