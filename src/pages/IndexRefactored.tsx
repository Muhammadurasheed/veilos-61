import { Routes, Route } from 'react-router-dom';
import { SmartRouter } from '@/components/routing/SmartRouter';

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
  return (
    <SmartRouter>
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
    </SmartRouter>
  );
};

export default IndexRefactored;