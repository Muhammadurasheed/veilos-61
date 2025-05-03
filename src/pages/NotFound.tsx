
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Layout from "@/components/layout/Layout";

const NotFound = () => {
  return (
    <Layout>
      <div className="container py-16 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-lg">
          <h1 className="text-4xl font-bold mb-4 text-veilo-blue-dark">Page Not Found</h1>
          <p className="text-xl text-gray-600 mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <Link to="/">
            <Button className="bg-veilo-blue hover:bg-veilo-blue-dark text-white">
              Return Home
            </Button>
          </Link>
        </div>
      </div>
    </Layout>
  );
};

export default NotFound;
