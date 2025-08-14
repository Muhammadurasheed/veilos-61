
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useUserContext } from '@/contexts/UserContext';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import Layout from '@/components/layout/Layout';
import { AccountCreationFlow } from '@/components/ui/account-creation-flow';

const Index = () => {
  const { user, createAnonymousAccount, isLoading, creationState } = useUserContext();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showAccountCreation, setShowAccountCreation] = useState(false);
  
  // Create anonymous account handler
  const handleCreateAnonymousAccount = async () => {
    setShowAccountCreation(true);
  };

  // Handle account creation completion
  const handleAccountCreationComplete = () => {
    setShowAccountCreation(false);
    // Navigate to sanctuary space after account creation
    navigate('/sanctuary');
  };

  // Handle account creation cancellation
  const handleAccountCreationCancel = () => {
    setShowAccountCreation(false);
  };

  // Handle entering sanctuary space
  const handleEnterSanctuary = () => {
    if (!user) {
      // If no user, show account creation flow
      setShowAccountCreation(true);
    } else {
      // User exists, navigate directly to sanctuary
      navigate('/sanctuary');
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  return (
    <Layout>
      <div className="container px-4 py-12 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
          {/* Hero content - shifted to the right with proper spacing */}
          <motion.div 
            className="flex flex-col space-y-6 md:pr-12 lg:ml-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.h1 
              variants={itemVariants} 
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-gray-900 dark:text-white"
            >
              <span className="block bg-gradient-to-r from-veilo-blue to-veilo-purple bg-clip-text text-transparent">
                Safe Space for
              </span>
              <span className="block mt-1">
                Mental Wellness
              </span>
            </motion.h1>
            
            <motion.p 
              variants={itemVariants} 
              className="mt-6 text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl"
            >
              Veilo provides a completely anonymous platform to share, connect, and heal together. 
              Get support from verified experts or join community discussions without revealing your identity.
            </motion.p>
            
            <motion.div 
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4 mt-8"
            >
              <Button 
                size="lg" 
                onClick={handleCreateAnonymousAccount}
                className="bg-veilo-green hover:bg-veilo-green-dark text-white font-medium text-lg px-8 py-6"
                disabled={isLoading || creationState.step !== 'idle'}
              >
                {creationState.step !== 'idle' ? 'Creating Account...' : 'Create Anonymous Account'}
              </Button>
              
              <Button 
                asChild 
                variant="outline" 
                size="lg"
                className="border-veilo-blue text-veilo-blue hover:bg-veilo-blue hover:text-white font-medium text-lg px-8 py-6"
              >
                <Link to="/feed">
                  Browse Community
                </Link>
              </Button>
            </motion.div>
            
            <motion.div
              variants={itemVariants}
              className="mt-8"
            >
              <Button
                onClick={handleEnterSanctuary}
                variant="ghost"
                size="lg"
                className="group relative overflow-hidden rounded-full bg-gradient-to-r from-veilo-blue/10 to-veilo-purple/10 hover:from-veilo-blue/20 hover:to-veilo-purple/20 text-veilo-blue border border-veilo-blue/30 px-8 py-6 w-full sm:w-auto"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-veilo-blue/5 to-veilo-purple/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-30">
                  <span className="w-64 h-64 rounded-full bg-veilo-blue/10 animate-pulse"></span>
                </span>
                <span className="relative flex items-center justify-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                  <span className="text-lg font-medium">🕊️ Enter Sanctuary Space</span>
                </span>
              </Button>
            </motion.div>
            
            <motion.div
              variants={itemVariants}
              className="mt-8 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-100 dark:border-gray-700 flex items-center"
            >
              <div className="font-medium text-sm text-gray-600 dark:text-gray-300">
                Already have an account? 
                <Button variant="link" asChild className="text-veilo-blue ml-2">
                  <Link to="/profile">Sign in</Link>
                </Button>
              </div>
            </motion.div>
          </motion.div>
          
          {/* Hero image or illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ 
              duration: 0.5,
              delay: 0.4,
              type: "spring",
              stiffness: 100
            }}
            className="flex justify-center items-center order-first lg:order-last"
          >
            <div className="relative w-full max-w-lg aspect-square">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-veilo-blue-light to-veilo-purple opacity-20 blur-3xl"></div>
              <div className="relative shadow-xl rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 h-full">
                <div className="h-full flex flex-col justify-center items-center space-y-8 p-4">
                  <div className="h-32 w-32 relative">
                    <img 
                      src="/veilo-logo.png" 
                      alt="Veilo Logo" 
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute top-0 right-0 h-full w-full bg-gradient-to-br from-transparent to-white dark:to-gray-800 opacity-40"></div>
                  </div>
                  
                  <div className="space-y-4 text-center">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Mental Health Support</h2>
                    <p className="text-gray-600 dark:text-gray-300">Anonymous, Secure, Supportive</p>
                  </div>
                  
                  <div className="flex justify-center space-x-6">
                    <span className="flex flex-col items-center">
                      <span className="text-2xl font-bold text-veilo-blue">100%</span>
                      <span className="text-xs text-gray-500">Anonymous</span>
                    </span>
                    <span className="flex flex-col items-center">
                      <span className="text-2xl font-bold text-veilo-green">24/7</span>
                      <span className="text-xs text-gray-500">Support</span>
                    </span>
                    <span className="flex flex-col items-center">
                      <span className="text-2xl font-bold text-veilo-purple">Free</span>
                      <span className="text-xs text-gray-500">Access</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
        
        {/* Features section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="mt-24 text-center"
        >
          <h2 className="text-3xl font-bold mb-12">How Veilo Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
              <div className="h-12 w-12 bg-veilo-blue-light rounded-lg text-veilo-blue flex items-center justify-center mx-auto mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Anonymous Identity</h3>
              <p className="text-gray-600 dark:text-gray-300">Create an anonymous profile with just one click. No email, phone, or personal details required.</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
              <div className="h-12 w-12 bg-veilo-green-light rounded-lg text-veilo-green flex items-center justify-center mx-auto mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Community Support</h3>
              <p className="text-gray-600 dark:text-gray-300">Connect with others facing similar challenges in moderated group spaces.</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
              <div className="h-12 w-12 bg-veilo-purple-light rounded-lg text-veilo-purple flex items-center justify-center mx-auto mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Expert Guidance</h3>
              <p className="text-gray-600 dark:text-gray-300">Access verified mental health professionals for personalized advice and support.</p>
            </div>
          </div>
        </motion.div>
        
        {/* Call to action */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1 }}
          className="mt-24 text-center"
        >
          <div className="bg-gradient-to-r from-veilo-blue to-veilo-purple p-10 rounded-2xl shadow-xl">
            <h2 className="text-3xl font-bold text-white mb-4">Begin Your Healing Journey Today</h2>
            <p className="text-white/90 mb-8 max-w-2xl mx-auto">
              Join thousands who've found support, understanding, and growth in our anonymous community.
            </p>
            <Button 
              onClick={handleCreateAnonymousAccount} 
              size="lg" 
              variant="secondary"
              className="bg-white text-veilo-blue hover:bg-gray-100"
              disabled={creationState.step !== 'idle'}
            >
              {creationState.step !== 'idle' ? 'Creating Account...' : 'Get Started Now'}
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Account Creation Modal */}
      <Dialog open={showAccountCreation} onOpenChange={setShowAccountCreation}>
        <DialogContent className="max-w-md p-0 overflow-hidden bg-transparent border-none shadow-none">
          <AccountCreationFlow
            onComplete={handleAccountCreationComplete}
            onCancel={handleAccountCreationCancel}
            variant="modal"
          />
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Index;
