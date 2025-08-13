import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export function useApi<T = any>() {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });
  const { toast } = useToast();

  const execute = useCallback(
    async (
      apiCall: () => Promise<ApiResponse<T>>,
      options?: {
        showSuccessToast?: boolean;
        showErrorToast?: boolean;
        successMessage?: string;
        errorMessage?: string;
      }
    ) => {
      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const response = await apiCall();

        if (response.success && response.data !== undefined) {
          setState({
            data: response.data,
            loading: false,
            error: null,
          });

          if (options?.showSuccessToast && options?.successMessage) {
            toast({
              title: 'Success',
              description: options.successMessage,
            });
          }

          return response.data;
        } else {
          const errorMessage = response.error || 'An unexpected error occurred';
          setState({
            data: null,
            loading: false,
            error: errorMessage,
          });

          if (options?.showErrorToast !== false) {
            toast({
              title: 'Error',
              description: options?.errorMessage || errorMessage,
              variant: 'destructive',
            });
          }

          return null;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Network error';
        setState({
          data: null,
          loading: false,
          error: errorMessage,
        });

        if (options?.showErrorToast !== false) {
          toast({
            title: 'Error',
            description: options?.errorMessage || errorMessage,
            variant: 'destructive',
          });
        }

        return null;
      }
    },
    [toast]
  );

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}

// Specialized hook for paginated API calls
export function usePaginatedApi<T = any>() {
  const [state, setState] = useState<{
    data: T[];
    loading: boolean;
    error: string | null;
    hasMore: boolean;
    page: number;
  }>({
    data: [],
    loading: false,
    error: null,
    hasMore: true,
    page: 1,
  });

  const loadMore = useCallback(
    async (
      apiCall: (page: number) => Promise<ApiResponse<{ items: T[]; hasMore: boolean }>>,
      reset = false
    ) => {
      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const response = await apiCall(reset ? 1 : state.page);

        if (response.success && response.data) {
          setState(prev => ({
            data: reset ? response.data!.items : [...prev.data, ...response.data!.items],
            loading: false,
            error: null,
            hasMore: response.data!.hasMore,
            page: reset ? 2 : prev.page + 1,
          }));

          return response.data;
        } else {
          const errorMessage = response.error || 'An unexpected error occurred';
          setState(prev => ({
            ...prev,
            loading: false,
            error: errorMessage,
          }));

          return null;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Network error';
        setState(prev => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));

        return null;
      }
    },
    [state.page]
  );

  const reset = useCallback(() => {
    setState({
      data: [],
      loading: false,
      error: null,
      hasMore: true,
      page: 1,
    });
  }, []);

  return {
    ...state,
    loadMore,
    reset,
    refresh: (apiCall: (page: number) => Promise<ApiResponse<{ items: T[]; hasMore: boolean }>>) => 
      loadMore(apiCall, true),
  };
}