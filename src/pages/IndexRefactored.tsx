import { Routes, Route } from 'react-router-dom';
import { SmartRouter } from '@/components/routing/SmartRouter';
import { ErrorBoundary } from '@/components/ui/error-boundary';

// Import pages
import Index from '@/pages/Index';
import Feed from '@/pages/Feed';
import BeaconsList from '@/pages/BeaconsList';
import { ExpertProfileEnhanced } from '@/pages/ExpertProfileEnhanced';
import ExpertRegistration from '@/pages/ExpertRegistration';
import ExpertDashboard from '@/pages/ExpertDashboard';
import Chat from '@/pages/Chat';
import Profile from '@/pages/Profile';
import Settings from '@/pages/Settings';
import SessionHub from '@/pages/SessionHub';
import NotFound from '@/pages/NotFound';
import AdminPanel from '@/pages/AdminPanel';
import Sanctuary from '@/pages/Sanctuary';
import SanctuaryInbox from '@/pages/SanctuaryInbox';
import SanctuarySubmit from '@/pages/SanctuarySubmit';
import EnhancedSanctuary from '@/pages/EnhancedSanctuary';
import SmartSanctuaryRouter from '@/components/sanctuary/SmartSanctuaryRouter';
import Phase4Test from '@/pages/Phase4Test';
import MySanctuariesPage from '@/pages/MySanctuaries';
import BookSession from '@/pages/BookSession';

const IndexRefactored = () => {
  return (
    <ErrorBoundary>
      <SmartRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/beacons" element={<BeaconsList />} />
          <Route path="/beacons/:expertId" element={<ExpertProfileEnhanced />} />
          <Route path="/expert/:expertId" element={<ExpertProfileEnhanced />} />
          <Route path="/chat/:sessionId?" element={<Chat />} />
          <Route path="/sessions" element={<SessionHub />} />
          <Route path="/sessions/book/:expertId" element={<BookSession />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/register-expert" element={<ExpertRegistration />} />
          <Route path="/expert-dashboard" element={<ExpertDashboard />} />
          <Route path="/admin/*" element={<AdminPanel />} />
          <Route path="/sanctuary" element={<Sanctuary />} />
          <Route path="/sanctuary/inbox/:sessionId" element={<SanctuaryInbox />} />
          <Route path="/sanctuary/submit/:sessionId" element={<SanctuarySubmit />} />
          <Route path="/sanctuary/live/:sessionId" element={<EnhancedSanctuary />} />
          {/* Generic sanctuary route for backward compatibility - auto-detects session type */}
          <Route path="/sanctuary/:sessionId" element={<SmartSanctuaryRouter />} />
          <Route path="/my-sanctuaries" element={<MySanctuariesPage />} />
          <Route path="/phase4-test" element={<Phase4Test />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </SmartRouter>
    </ErrorBoundary>
  );
};

export default IndexRefactored;