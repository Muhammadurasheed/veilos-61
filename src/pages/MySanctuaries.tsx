import Layout from '@/components/layout/Layout';
import MySanctuariesEnhanced from '@/components/sanctuary/MySanctuariesEnhanced';
import { SEOHead } from '@/components/seo/SEOHead';

const MySanctuariesPage = () => {
  return (
    <Layout>
      <SEOHead
        title="My Sanctuaries - Flagship Sanctuary Management | Veilo"
        description="Advanced sanctuary management dashboard with real-time analytics, engagement tracking, and comprehensive host tools for anonymous feedback collection."
        keywords="sanctuary management, anonymous feedback, real-time analytics, sanctuary dashboard, engagement tracking"
      />
      <MySanctuariesEnhanced />
    </Layout>
  );
};

export default MySanctuariesPage;