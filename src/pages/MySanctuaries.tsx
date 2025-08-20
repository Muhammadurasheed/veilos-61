import Layout from '@/components/layout/Layout';
import MySanctuaries from '@/components/sanctuary/MySanctuaries';
import { SEOHead } from '@/components/seo/SEOHead';

const MySanctuariesPage = () => {
  return (
    <Layout>
      <SEOHead
        title="My Sanctuaries - Manage Your Anonymous Spaces | Veilo"
        description="Access and manage all your created sanctuary spaces. View messages, share links, and track your anonymous feedback collections."
        keywords="my sanctuaries, sanctuary management, anonymous feedback, sanctuary dashboard"
      />
      <MySanctuaries />
    </Layout>
  );
};

export default MySanctuariesPage;