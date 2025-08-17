import React from 'react';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { SEOHead } from '@/components/seo/SEOHead';
import Layout from '@/components/layout/Layout';
import Phase4TestInterface from '@/components/sanctuary/Phase4TestInterface';

const Phase4Test: React.FC = () => {
  return (
    <ErrorBoundary>
      <SEOHead
        title="Phase 4 Test - Sanctuary Live Spaces | Veilo"
        description="Test interface for Phase 4 implementation: Live Audio Infrastructure, Breakout Rooms, Session Recording, and AI Moderation"
        keywords="phase 4, live audio, breakout rooms, session recording, ai moderation, sanctuary spaces"
      />
      
      <Layout>
        <Phase4TestInterface />
      </Layout>
    </ErrorBoundary>
  );
};

export default Phase4Test;