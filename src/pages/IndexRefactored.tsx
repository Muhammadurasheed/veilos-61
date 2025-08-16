import { Routes, Route } from 'react-router-dom';
import { LoadingSpinner } from '@/components/ui/loading-states';
import { WelcomeScreen } from '@/components/onboarding/WelcomeScreen';
import { useUserContext } from '@/contexts/UserContext';
import { useAuth } from '@/contexts/optimized/AuthContextRefactored';
import { useAppState } from '@/contexts/AppStateContext';

// Import pages
import Index from '@/pages/Index';
import Feed from '@/pages/Feed';
import BeaconsList from '@/pages/BeaconsList';
import ExpertProfile from '@/pages/ExpertProfile';
import ExpertRegistration from '@/pages/ExpertRegistration';
import ExpertDashboard from '@/pages/ExpertDashboard';
import Chat from '@/pages/Chat';
import Profile from '@/pages/Profile';
import Settings from '@/pages/Settings';
import SessionHub from '@/pages/SessionHub';
import NotFound from '@/pages/NotFound';
import AdminPanel from '@/pages/AdminPanel';
import Sanctuary from '@/pages/Sanctuary';
import EnhancedSanctuary from '@/pages/EnhancedSanctuary';
import Phase4Test from '@/pages/Phase4Test';

const IndexRefactored = () => {
  const { user, isLoading: userLoading } = useUserContext();
  const { user: authUser, isLoading: authLoading, isAuthenticated } = useAuth();
  const { appState } = useAppState();
  
  // Use auth context if available, fallback to user context
  const currentUser = authUser || user;
  const isLoading = authLoading || userLoading;

  // Show loading state
  if (isLoading) {
    return <LoadingSpinner size="lg" text="Initializing your sanctuary..." />;
  }
  
  // Show onboarding if:
  // 1. No user exists and onboarding hasn't been completed, OR
  // 2. User exists but onboarding hasn't been marked complete and user is anonymous
  const shouldShowOnboarding = (!currentUser && !appState.hasCompletedOnboarding) || 
                               (currentUser?.isAnonymous && !appState.hasCompletedOnboarding);
  
  if (shouldShowOnboarding) {
    return <WelcomeScreen isOpen={true} onComplete={() => {}} />;
  }

  // Show main app routes
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/feed" element={<Feed />} />
      <Route path="/beacons" element={<BeaconsList />} />
      <Route path="/expert/:expertId" element={<ExpertProfile />} />
      <Route path="/chat/:sessionId?" element={<Chat />} />
      <Route path="/sessions" element={<SessionHub />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/register-expert" element={<ExpertRegistration />} />
      <Route path="/expert-dashboard" element={<ExpertDashboard />} />
      <Route path="/admin/*" element={<AdminPanel />} />
      <Route path="/sanctuary" element={<Sanctuary />} />
      <Route path="/sanctuary/:sessionId" element={<EnhancedSanctuary />} />
      <Route path="/phase4-test" element={<Phase4Test />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default IndexRefactored;