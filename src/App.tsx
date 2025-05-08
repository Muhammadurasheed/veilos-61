
import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { UserProvider } from "./contexts/UserContext";
import { VeiloDataProvider } from "./contexts/VeiloDataContext";
import { ThemeProvider } from "./contexts/ThemeContext";

import Index from "./pages/Index";
import Feed from "./pages/Feed";
import BeaconsList from "./pages/BeaconsList";
import ExpertProfile from "./pages/ExpertProfile";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import ExpertRegistration from "./pages/ExpertRegistration";
import AdminPanel from "./pages/AdminPanel";
import SessionHub from "./pages/SessionHub";
import SettingsPage from "./pages/Settings";
import ChatPage from "./pages/Chat";

const App = () => {
  // Create a client instance inside the component to fix the Hooks error
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <UserProvider>
            <VeiloDataProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/feed" element={<Feed />} />
                  <Route path="/beacons" element={<BeaconsList />} />
                  <Route path="/beacons/:expertId" element={<ExpertProfile />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/register-expert" element={<ExpertRegistration />} />
                  <Route path="/admin/*" element={<AdminPanel />} />
                  <Route path="/sessions" element={<SessionHub />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/chat" element={<ChatPage />} />
                  <Route path="/chat/:sessionId" element={<ChatPage />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </VeiloDataProvider>
          </UserProvider>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
