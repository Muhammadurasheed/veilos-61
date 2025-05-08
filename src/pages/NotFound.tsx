
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Layout from '@/components/layout/Layout';

const NotFound = () => {
  return (
    <Layout>
      <div className="container flex flex-col items-center justify-center min-h-[70vh] py-16 text-center">
        <h1 className="text-8xl font-bold text-veilo-blue mb-6">404</h1>
        <h2 className="text-3xl font-semibold mb-4 text-gray-800">Page not found</h2>
        <p className="text-xl text-gray-600 max-w-md mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        
        <Link to="/">
          <Button size="lg">
            Return to Home
          </Button>
        </Link>
      </div>
    </Layout>
  );
};

export default NotFound;
