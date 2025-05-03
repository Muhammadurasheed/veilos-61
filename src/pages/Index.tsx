
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { useUserContext } from "@/contexts/UserContext";

const Index = () => {
  const { user } = useUserContext();
  
  return (
    <Layout>
      {/* Hero Section */}
      <section className="py-16 md:py-24">
        <div className="container px-4 mx-auto">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-veilo-blue-dark">
              Speak freely. Get real answers. <span className="text-veilo-blue">Safely.</span>
            </h1>
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
              Veilo is a safe, anonymous space for people to drop their shame and seek healing through compassionate expert guidance.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/feed">
                <Button className="text-lg px-8 py-6 bg-veilo-blue hover:bg-veilo-blue-dark text-white">
                  Browse the Feed
                </Button>
              </Link>
              <Link to="/beacons">
                <Button variant="outline" className="text-lg px-8 py-6 border-veilo-blue text-veilo-blue-dark hover:bg-veilo-blue hover:text-white">
                  Find Support
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-16 bg-white bg-opacity-60">
        <div className="container px-4 mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-veilo-blue-dark">How Veilo Works</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-veilo-blue-light flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-10 h-10 text-veilo-blue-dark">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-veilo-blue-dark">Sacred Anonymity</h3>
              <p className="text-gray-600">
                Share your thoughts without revealing your identity. Our auto-generated aliases and abstract avatars protect your privacy.
              </p>
            </div>
            
            {/* Feature 2 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-veilo-green-light flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-10 h-10 text-veilo-green-dark">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-veilo-blue-dark">Verified Beacons</h3>
              <p className="text-gray-600">
                Connect with compassionate experts who have verified credentials and a proven record of helping others.
              </p>
            </div>
            
            {/* Feature 3 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-veilo-gold-light flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-10 h-10 text-veilo-gold-dark">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-veilo-blue-dark">Empathetic Community</h3>
              <p className="text-gray-600">
                Join a supportive community where shared experiences create understanding and healing without judgment.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="container px-4 mx-auto">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-veilo-blue-dark">
              Ready to Start Your Healing Journey?
            </h2>
            <p className="text-xl text-gray-600 mb-10">
              Join Veilo today and experience the freedom of expressing yourself in a safe, supportive environment.
            </p>
            {!user?.loggedIn ? (
              <Link to="/feed">
                <Button className="text-lg px-8 py-6 bg-veilo-blue hover:bg-veilo-blue-dark text-white">
                  Enter Anonymously
                </Button>
              </Link>
            ) : (
              <Link to="/feed">
                <Button className="text-lg px-8 py-6 bg-veilo-blue hover:bg-veilo-blue-dark text-white">
                  Go to Your Feed
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
