import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Loader2, Users, MessageSquare, Heart } from 'lucide-react';

// Global loading spinner
export const LoadingSpinner = ({ size = 'md', text }: { size?: 'sm' | 'md' | 'lg'; text?: string }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8'
  };

  return (
    <div className="flex flex-col items-center justify-center gap-2 py-8">
      <Loader2 className={`${sizeClasses[size]} animate-spin text-primary`} />
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
    </div>
  );
};

// Post card skeleton
export const PostCardSkeleton = () => (
  <Card className="w-full">
    <CardHeader className="pb-3">
      <div className="flex items-center space-x-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-3/5" />
        
        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Heart className="w-4 h-4 text-muted-foreground" />
              <Skeleton className="h-4 w-6" />
            </div>
            <div className="flex items-center gap-1">
              <MessageSquare className="w-4 h-4 text-muted-foreground" />
              <Skeleton className="h-4 w-6" />
            </div>
          </div>
          <Skeleton className="h-8 w-16" />
        </div>
      </div>
    </CardContent>
  </Card>
);

// Expert card skeleton
export const ExpertCardSkeleton = () => (
  <Card className="w-full">
    <CardHeader>
      <div className="flex items-center space-x-3">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-6 w-16" />
      </div>
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="flex flex-wrap gap-1 pt-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-14" />
        </div>
        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center gap-1">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-8" />
          </div>
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
    </CardContent>
  </Card>
);

// Chat message skeleton
export const ChatMessageSkeleton = ({ isUser = false }: { isUser?: boolean }) => (
  <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
    <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
    <div className={`space-y-2 max-w-xs ${isUser ? 'items-end' : ''}`}>
      <Skeleton className="h-4 w-16" />
      <div className={`space-y-1 ${isUser ? 'items-end flex flex-col' : ''}`}>
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
  </div>
);

// Session list skeleton
export const SessionListSkeleton = () => (
  <div className="space-y-4">
    {Array.from({ length: 3 }).map((_, i) => (
      <Card key={i}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <div className="space-y-2 text-right">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-6 w-16" />
            </div>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

// Analytics dashboard skeleton
export const AnalyticsSkeleton = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-16" />
              </div>
              <Skeleton className="h-8 w-8" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
    
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    </div>
  </div>
);

// Feed loading state
export const FeedLoadingState = () => (
  <div className="space-y-6">
    {Array.from({ length: 3 }).map((_, i) => (
      <PostCardSkeleton key={i} />
    ))}
  </div>
);

// Sanctuary participants skeleton
export const SanctuaryParticipantsSkeleton = () => (
  <div className="space-y-3">
    <div className="flex items-center gap-2 mb-4">
      <Users className="w-4 h-4 text-muted-foreground" />
      <Skeleton className="h-4 w-24" />
    </div>
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-2 w-2 rounded-full" />
      </div>
    ))}
  </div>
);