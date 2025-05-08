
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Layout from '@/components/layout/Layout';
import { useUserContext } from '@/contexts/UserContext';
import { Shield, MessageSquare, Heart } from 'lucide-react';

const Index = () => {
  const { user } = useUserContext();
  const navigate = useNavigate();

  return (
    <Layout>
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-veilo-blue-light/20 to-veilo-purple-light/20 py-20">
        <div className="container px-4 mx-auto">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-10 md:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold mb-6 text-veilo-blue-dark">
                A Safe Space for <span className="text-veilo-purple">Anonymous</span> Emotional Support
              </h1>
              <p className="text-lg mb-8 text-gray-600">
                Veilo connects you with verified support specialists in a completely anonymous environment. 
                Share your feelings, get expert advice, and heal without judgment or exposure.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button 
                  className="bg-veilo-blue hover:bg-veilo-blue-dark text-white px-6"
                  onClick={() => navigate('/feed')}
                >
                  Join the Community
                </Button>
                <Button 
                  variant="outline"
                  className="border-veilo-purple text-veilo-purple hover:bg-veilo-purple hover:text-white"
                  onClick={() => navigate('/beacons')}
                >
                  Find Support Beacons
                </Button>
              </div>
            </div>
            <div className="md:w-1/2 md:pl-10">
              <div className="relative">
                <div className="absolute -left-6 -top-6 w-64 h-64 bg-veilo-blue/10 rounded-full filter blur-xl"></div>
                <div className="absolute -right-6 -bottom-6 w-64 h-64 bg-veilo-purple/10 rounded-full filter blur-xl"></div>
                <Card className="bg-white/80 backdrop-blur-sm p-6 relative z-10">
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="h-10 w-10 rounded-full bg-veilo-blue-light/30 flex items-center justify-center">
                        <span className="text-veilo-blue-dark font-bold">A</span>
                      </div>
                      <div className="bg-gray-100 rounded-lg p-3 flex-1">
                        <p className="text-gray-700">
                          I've been feeling so disconnected lately. It's like there's this wall between me and everyone else.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 ml-12">
                      <div className="h-10 w-10 rounded-full bg-veilo-purple-light/30 flex items-center justify-center">
                        <span className="text-veilo-purple-dark font-bold">B</span>
                      </div>
                      <div className="bg-gray-100 rounded-lg p-3 flex-1">
                        <p className="text-gray-700">
                          I understand that feeling. I've found that small moments of connection help break through that wall.
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <div className="flex space-x-3">
                        <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center">
                          <Shield className="h-3 w-3 text-blue-600" />
                        </div>
                        <span className="text-sm text-blue-600 font-medium">Verified Expert</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container px-4 mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">How Veilo Works</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6 hover:shadow-md transition-shadow">
              <div className="h-12 w-12 rounded-full bg-veilo-blue-light/30 mb-4 flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-veilo-blue" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Anonymous Expression</h3>
              <p className="text-gray-600">
                Share your thoughts and feelings in our safe community without revealing your identity.
              </p>
            </Card>
            
            <Card className="p-6 hover:shadow-md transition-shadow">
              <div className="h-12 w-12 rounded-full bg-veilo-purple-light/30 mb-4 flex items-center justify-center">
                <Shield className="h-6 w-6 text-veilo-purple" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Verified Support Beacons</h3>
              <p className="text-gray-600">
                Connect with professionally verified experts who specialize in emotional support and guidance.
              </p>
            </Card>
            
            <Card className="p-6 hover:shadow-md transition-shadow">
              <div className="h-12 w-12 rounded-full bg-green-100 mb-4 flex items-center justify-center">
                <Heart className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Healing Together</h3>
              <p className="text-gray-600">
                Find comfort in community responses or book private sessions with experts for deeper support.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-veilo-blue to-veilo-purple text-white">
        <div className="container px-4 mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Begin Your Healing Journey?</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join our anonymous community where you can safely express yourself and connect with others who understand.
          </p>
          <Button 
            size="lg"
            className="bg-white text-veilo-blue hover:bg-gray-100"
            onClick={() => navigate(user?.loggedIn ? '/feed' : '/register')}
          >
            {user?.loggedIn ? 'View Community Feed' : 'Create Anonymous Account'}
          </Button>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
