import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Routes, Route } from 'react-router-dom';
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
        <BrowserRouter>
          <ThemeProvider>
            <AuthProvider>
              <UserProvider>
                <AppStateProvider>
                  <VeiloDataProvider>
                    <Toaster />
                    <Routes>
                      <Route path="/*" element={<Index />} />
                    </Routes>
                  </VeiloDataProvider>
                </AppStateProvider>
              </UserProvider>
            </AuthProvider>
          </ThemeProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;