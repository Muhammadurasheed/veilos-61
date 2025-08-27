import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from '@/components/ui/toaster';
import Index from '@/pages/IndexRefactored';

import { UserProvider } from '@/contexts/UserContext';
import { AuthProvider } from '@/contexts/optimized/AuthContextRefactored';
import { AppStateProvider } from '@/contexts/AppStateContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { VeiloDataProvider } from '@/contexts/VeiloDataContext';

import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <UserProvider>
              <AppStateProvider>
                <VeiloDataProvider>
                  <Toaster />
                  <Index />
                </VeiloDataProvider>
              </AppStateProvider>
            </UserProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;