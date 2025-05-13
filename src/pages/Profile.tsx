
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/layout/Layout";
import { useUserContext } from "@/contexts/UserContext";
import { motion } from "framer-motion";
import { RefreshCw, Shield, CalendarDays, MessageSquare, Loader2 } from "lucide-react";

const Profile = () => {
  const { user, refreshIdentity, logout, isLoading } = useUserContext();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [rotating, setRotating] = useState(false);
  
  // Show loading state while user context is initializing
  if (isLoading) {
    return (
      <Layout>
        <div className="container h-[70vh] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 text-veilo-blue animate-spin" />
            <p className="text-lg text-gray-600 dark:text-gray-400">Loading your profile...</p>
          </div>
        </div>
      </Layout>
    );
  }
  
  // If there's no logged in user, show sign-in prompt
  if (!user) {
    return (
      <Layout>
        <div className="container py-16">
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-veilo-blue-dark">Sign In Required</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <p>You need to sign in or create an anonymous account to view your profile.</p>
              <div className="flex flex-col gap-3 mt-6">
                <Button onClick={() => refreshIdentity()} className="bg-veilo-blue hover:bg-veilo-blue-dark text-white">
                  Create Anonymous Account
                </Button>
                <Button variant="outline" onClick={() => navigate('/')}>
                  Return to Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }
  
  const handleRefreshIdentity = () => {
    setRotating(true);
    
    setTimeout(() => {
      refreshIdentity();
      
      setRotating(false);
      
      toast({
        title: "Identity Refreshed",
        description: "Your identity has been refreshed. You now have a new alias and avatar.",
      });
    }, 800);
  };
  
  const handleLogout = () => {
    logout();
    navigate('/');
    
    toast({
      title: "Session Ended",
      description: "You have been logged out and your anonymous session has ended.",
    });
  };
  
  // Animation variants for profile elements
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
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
  
  // Mock user stats (for demonstration)
  const userStats = {
    sessionsJoined: 8,
    postsCreated: 12,
    daysSinceJoined: 15
  };
  
  return (
    <Layout>
      <div className="container py-16">
        <motion.div 
          className="max-w-4xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <Card className="glass overflow-hidden shadow-lg border border-gray-100 dark:border-gray-800">
            <motion.div variants={itemVariants}>
              <div className="h-32 bg-gradient-to-r from-veilo-blue to-veilo-purple" />
            </motion.div>
            
            <CardHeader className="text-center relative pb-0">
              <motion.div 
                className="absolute -top-16 inset-x-0 flex justify-center"
                variants={itemVariants}
              >
                <Avatar className={`h-32 w-32 border-4 border-white dark:border-gray-900 shadow-md ${rotating ? 'animate-spin' : ''}`}>
                  <AvatarImage src={`/avatars/avatar-${user.avatarIndex}.svg`} alt={user.alias} />
                  <AvatarFallback className="text-2xl bg-veilo-blue-light text-veilo-blue-dark">
                    {user.alias.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </motion.div>
              
              <motion.div className="mt-16" variants={itemVariants}>
                <CardTitle className="text-2xl text-veilo-blue-dark dark:text-veilo-blue-light font-bold">
                  {user.alias}
                </CardTitle>
                <p className="text-gray-500 mt-1">Anonymous User</p>
              </motion.div>
            </CardHeader>
            
            <CardContent className="space-y-8 mt-6">
              <motion.div variants={itemVariants}>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
                    <div className="flex flex-col items-center">
                      <MessageSquare className="h-6 w-6 text-veilo-purple mb-2" />
                      <span className="text-xl font-bold text-gray-800 dark:text-gray-200">{userStats.postsCreated}</span>
                      <span className="text-xs text-gray-500">Posts</span>
                    </div>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
                    <div className="flex flex-col items-center">
                      <Shield className="h-6 w-6 text-veilo-blue mb-2" />
                      <span className="text-xl font-bold text-gray-800 dark:text-gray-200">{userStats.sessionsJoined}</span>
                      <span className="text-xs text-gray-500">Sessions</span>
                    </div>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
                    <div className="flex flex-col items-center">
                      <CalendarDays className="h-6 w-6 text-veilo-green mb-2" />
                      <span className="text-xl font-bold text-gray-800 dark:text-gray-200">{userStats.daysSinceJoined}</span>
                      <span className="text-xs text-gray-500">Days</span>
                    </div>
                  </div>
                </div>
              </motion.div>
                
              <motion.div 
                className="flex flex-col items-center space-y-4"
                variants={itemVariants}
              >
                <div className="flex flex-col w-full max-w-xs space-y-4">
                  <Button 
                    onClick={handleRefreshIdentity}
                    variant="outline"
                    className="border-veilo-blue text-veilo-blue hover:bg-veilo-blue hover:text-white transition-colors"
                    disabled={rotating}
                  >
                    <RefreshCw 
                      className={`h-5 w-5 mr-2 ${rotating ? 'animate-spin' : ''}`} 
                    />
                    Refresh Identity
                  </Button>
                  
                  <Button 
                    onClick={handleLogout}
                    variant="destructive"
                    className="shadow-sm"
                  >
                    End Anonymous Session
                  </Button>
                </div>
              </motion.div>
              
              <motion.div variants={itemVariants}>
                <div className="bg-veilo-blue-light bg-opacity-30 rounded-xl p-5 text-sm shadow-inner">
                  <h3 className="font-medium mb-2 text-veilo-blue-dark dark:text-veilo-blue">Identity Protection</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    Refreshing your identity will give you a new alias and avatar. This helps maintain your anonymity while using Veilo. 
                    Your previous posts and comments will remain, but won't be connected to your new identity.
                  </p>
                </div>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
};

export default Profile;
