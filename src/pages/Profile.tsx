
import React, { useState, useEffect } from 'react';
import { SanctuaryDashboard } from '@/components/sanctuary/SanctuaryDashboard';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/contexts/optimized/AuthContextRefactored";
import { motion } from "framer-motion";
import { RefreshCw, Shield, CalendarDays, MessageSquare, Loader2, Upload, User, Camera, Home } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const Profile = () => {
  const { user, logout, isLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [rotating, setRotating] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  
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
                <Button onClick={() => navigate('/')} className="bg-veilo-blue hover:bg-veilo-blue-dark text-white">
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
      // Mock refresh identity functionality
      toast({
        title: "Identity would be refreshed",
        description: "This feature will be implemented with backend integration.",
      });
      setRotating(false);
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
  
  const handleAvatarChange = async () => {
    if (!avatarUrl) {
      toast({
        title: "Avatar URL Required",
        description: "Please enter a valid URL for your avatar.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsUploading(true);
      // Mock avatar update functionality
      toast({
        title: "Avatar would be updated",
        description: "This feature will be implemented with backend integration.",
      });
      setIsUploadDialogOpen(false);
      setAvatarUrl("");
    } catch (error) {
      console.error('Avatar update error:', error);
    } finally {
      setIsUploading(false);
    }
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
                <div className="relative group">
                  <Avatar className={`h-32 w-32 border-4 border-white dark:border-gray-900 shadow-md ${rotating ? 'animate-spin' : ''}`}>
                    {user.avatarUrl ? (
                      <AvatarImage src={user.avatarUrl} alt={user.alias} />
                    ) : (
                      <AvatarImage src={`/avatars/avatar-${user.avatarIndex}.svg`} alt={user.alias} />
                    )}
                    <AvatarFallback className="text-2xl bg-veilo-blue-light text-veilo-blue-dark">
                      {user.alias.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <Button 
                    size="icon"
                    variant="secondary"
                    className="absolute bottom-0 right-0 rounded-full shadow-md opacity-75 hover:opacity-100"
                    onClick={() => setIsUploadDialogOpen(true)}
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
              
              <motion.div className="mt-16" variants={itemVariants}>
                <CardTitle className="text-2xl text-veilo-blue-dark dark:text-veilo-blue-light font-bold">
                  {user.alias}
                </CardTitle>
                <p className="text-gray-500 mt-1">
                  {user.isAnonymous ? 'Anonymous User' : user.role === 'beacon' ? 'Expert' : 'Registered User'}
                </p>
              </motion.div>
            </CardHeader>
            
            <CardContent className="space-y-6 mt-6">
              {/* Tabs for different sections */}
              <motion.div variants={itemVariants}>
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="overview" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Overview
                    </TabsTrigger>
                    <TabsTrigger value="sanctuaries" className="flex items-center gap-2">
                      <Home className="h-4 w-4" />
                      Sanctuaries
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Settings
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-6 mt-6">
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
                  </TabsContent>

                  <TabsContent value="sanctuaries" className="mt-6">
                    <SanctuaryDashboard />
                  </TabsContent>

                  <TabsContent value="settings" className="space-y-6 mt-6">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="flex flex-col w-full max-w-xs space-y-4">
                        {user.isAnonymous && (
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
                        )}
                        
                        <Button 
                          onClick={handleLogout}
                          variant="destructive"
                          className="shadow-sm"
                        >
                          End {user.isAnonymous ? 'Anonymous' : ''} Session
                        </Button>
                      </div>
                    </div>
                    
                    {user.isAnonymous && (
                      <div className="bg-veilo-blue-light bg-opacity-30 rounded-xl p-5 text-sm shadow-inner">
                        <h3 className="font-medium mb-2 text-veilo-blue-dark dark:text-veilo-blue">Identity Protection</h3>
                        <p className="text-gray-700 dark:text-gray-300">
                          Refreshing your identity will give you a new alias and avatar. This helps maintain your anonymity while using Veilo. 
                          Your previous posts and comments will remain, but won't be connected to your new identity.
                        </p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
      
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Avatar</DialogTitle>
            <DialogDescription>
              Enter the URL of your new avatar image.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <Avatar className="h-20 w-20">
                  {avatarUrl ? (
                    <AvatarImage src={avatarUrl} alt="New avatar preview" />
                  ) : user?.avatarUrl ? (
                    <AvatarImage src={user.avatarUrl} alt={user.alias} />
                  ) : (
                    <AvatarImage src={`/avatars/avatar-${user?.avatarIndex || 1}.svg`} alt={user?.alias} />
                  )}
                  <AvatarFallback>
                    <User className="h-10 w-10" />
                  </AvatarFallback>
                </Avatar>
              </div>
              
              <div className="flex-1 space-y-2">
                <Label htmlFor="avatar-url">Image URL</Label>
                <Input
                  id="avatar-url"
                  placeholder="https://example.com/avatar.jpg"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsUploadDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAvatarChange} 
              disabled={isUploading}
              className="bg-veilo-blue hover:bg-veilo-blue-dark"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Profile;
