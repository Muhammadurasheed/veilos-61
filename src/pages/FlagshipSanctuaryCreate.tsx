import React from 'react';
import Layout from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import InstantLiveAudioCreator from '@/components/flagship/InstantLiveAudioCreator';
import ScheduledLiveAudioCreatorEnhanced from '@/components/flagship/ScheduledLiveAudioCreatorEnhanced';
import SEOHead from '@/components/seo/SEOHead';

const FlagshipSanctuaryCreate: React.FC = () => {
  return (
    <Layout>
      <SEOHead
        title="Create Live Audio Sanctuary | Veilo"
        description="Start an instant live audio sanctuary or schedule one for later. Share a link and bring your community together."
        canonical="/flagship-sanctuary"
      />
      <div className="container py-8">
        <div className="mx-auto max-w-5xl">
          <Tabs defaultValue="instant" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="instant">Go Live Now</TabsTrigger>
              <TabsTrigger value="schedule">Schedule for Later</TabsTrigger>
            </TabsList>
            <TabsContent value="instant">
              <InstantLiveAudioCreator />
            </TabsContent>
            <TabsContent value="schedule">
              <ScheduledLiveAudioCreatorEnhanced />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default FlagshipSanctuaryCreate;
