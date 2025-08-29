import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Expert } from '@/types';
import { useToast } from '@/hooks/use-toast';
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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import EnhancedExpertDocumentViewer from './EnhancedExpertDocumentViewer';

interface ExpertFilters {
  status: string;
  verificationLevel: string;
  specialization: string;
  search: string;
  dateFrom: Date | null;
  dateTo: Date | null;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

const EnhancedExpertManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedExperts, setSelectedExperts] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<'approve' | 'reject' | 'suspend' | 'reactivate' | ''>('');
  const [bulkNotes, setBulkNotes] = useState('');
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null);
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  const [filters, setFilters] = useState<ExpertFilters>({
    status: 'all_statuses',
    verificationLevel: 'all_levels',
    specialization: '',
    search: '',
    dateFrom: null,
    dateTo: null,
  });

  // Enhanced experts query with filtering and pagination
  const { data: expertsData, isLoading, isError, refetch } = useQuery({
    queryKey: ['enhancedExperts', currentPage, filters],
    queryFn: async () => {
      const params = {
        page: currentPage,
        limit: 10,
        ...(filters.status !== 'all_statuses' && { status: filters.status }),
        ...(filters.verificationLevel !== 'all_levels' && { verificationLevel: filters.verificationLevel }),
        ...(filters.specialization && { specialization: filters.specialization }),
        ...(filters.search && { search: filters.search }),
        ...(filters.dateFrom && { dateFrom: filters.dateFrom.toISOString() }),
        ...(filters.dateTo && { dateTo: filters.dateTo.toISOString() }),
      };

      const response = await AdminApi.getExpertsAdvanced(params);
      if (!response.success) throw new Error(response.error || 'Failed to fetch experts');
      return response.data;
    },
    staleTime: 30000, // Cache for 30 seconds
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
      queryClient.invalidateQueries({ queryKey: ['enhancedExperts'] });
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

  const handleViewDocuments = (expert: Expert) => {
    setSelectedExpert(expert);
    setShowDocumentViewer(true);
  };

  const clearFilters = () => {
    setFilters({
      status: 'all_statuses',
      verificationLevel: 'all_levels',
      specialization: '',
      search: '',
      dateFrom: null,
      dateTo: null,
    });
    setCurrentPage(1);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      approved: 'bg-green-100 text-green-800 border-green-300',
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

  return (
    <div className="space-y-6">
      {/* Header with real-time indicator */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Expert Management</h2>
          <p className="text-muted-foreground">
            Manage expert applications with advanced filtering and bulk actions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
            Live
          </Badge>
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Advanced Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Advanced Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <label className="text-sm font-medium">Status</label>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_statuses">All statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
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
              <label className="text-sm font-medium">Date Range</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateFrom ? format(filters.dateFrom, 'MMM dd') : 'Select dates'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={{
                      from: filters.dateFrom || undefined,
                      to: filters.dateTo || undefined,
                    }}
                    onSelect={(range) => {
                      setFilters(prev => ({
                        ...prev,
                        dateFrom: range?.from || null,
                        dateTo: range?.to || null,
                      }));
                    }}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <Button
              variant="outline"
              onClick={clearFilters}
              className="text-muted-foreground"
            >
              Clear Filters
            </Button>
            
            <div className="text-sm text-muted-foreground">
              {pagination.total} experts found
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions Bar */}
      {selectedExperts.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="py-3">
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
                    <SelectItem value="approve">Approve</SelectItem>
                    <SelectItem value="reject">Reject</SelectItem>
                    <SelectItem value="suspend">Suspend</SelectItem>
                    <SelectItem value="reactivate">Reactivate</SelectItem>
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
                  Apply Action
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Experts Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Experts ({pagination.total})</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
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
                    <TableHead className="w-16">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {experts.map((expert: Expert) => (
                    <TableRow key={expert.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedExperts.includes(expert.id)}
                          onCheckedChange={() => handleSelectExpert(expert.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full overflow-hidden">
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
                      <TableCell>{expert.specialization}</TableCell>
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
                            {expert.verificationDocuments?.length || 0} files
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {(expert as any).createdAt ? format(new Date((expert as any).createdAt), 'MMM dd, yyyy') : 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDocuments(expert)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} results
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
                  <span className="px-3 py-1 text-sm border rounded">
                    {pagination.page} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    disabled={!pagination.hasNext}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
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
              You are about to <strong>{bulkAction}</strong> {selectedExperts.length} expert{selectedExperts.length !== 1 ? 's' : ''}.
              This action cannot be undone.
            </p>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Add notes (optional)</label>
              <Textarea
                placeholder="Reason for this action..."
                value={bulkNotes}
                onChange={(e) => setBulkNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowBulkDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkAction}
              disabled={bulkActionMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {bulkActionMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirm Action
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enhanced Document Viewer */}
      <EnhancedExpertDocumentViewer
        expert={selectedExpert}
        isOpen={showDocumentViewer}
        onClose={() => setShowDocumentViewer(false)}
      />
    </div>
  );
};

export default EnhancedExpertManagement;