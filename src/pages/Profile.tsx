
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";
import Layout from "@/components/layout/Layout";
import { useUserContext } from "@/contexts/UserContext";

const Profile = () => {
  const { user, refreshIdentity, logout } = useUserContext();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [rotating, setRotating] = useState(false);
  
  // If there's no logged in user, redirect to home
  if (!user?.loggedIn) {
    navigate('/');
    return null;
  }
  
  const handleRefreshIdentity = () => {
    setRotating(true);
    
    setTimeout(() => {
      refreshIdentity();
      
      setRotating(false);
      
      toast({
        description: "Your identity has been refreshed. You now have a new alias and avatar.",
        variant: "default",
      });
    }, 800);
  };
  
  const handleLogout = () => {
    logout();
    navigate('/');
    
    toast({
      description: "You have been logged out and your anonymous session has ended.",
      variant: "default",
    });
  };
  
  const avatarClasses = rotating 
    ? "h-32 w-32 transition-transform duration-700 transform rotate-360" 
    : "h-32 w-32 transition-transform duration-300";
  
  return (
    <Layout>
      <div className="container py-16">
        <div className="max-w-lg mx-auto">
          <Card className="glass">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-veilo-blue-dark">Your Anonymous Profile</CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-8">
              <div className="flex flex-col items-center">
                <Avatar className={avatarClasses + " mb-4 border-4 border-veilo-blue-light"}>
                  <AvatarImage src={`/avatars/avatar-${user.avatarIndex}.svg`} alt={user.alias} />
                  <AvatarFallback className="text-xl bg-veilo-blue-light text-veilo-blue-dark">
                    {user.alias.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <h2 className="text-xl font-semibold mb-1 text-veilo-blue-dark">{user.alias}</h2>
                <p className="text-sm text-gray-500 mb-4">Anonymous User</p>
                
                <div className="flex flex-col w-full max-w-xs space-y-4">
                  <Button 
                    onClick={handleRefreshIdentity}
                    variant="outline"
                    className="border-veilo-blue text-veilo-blue hover:bg-veilo-blue hover:text-white"
                    disabled={rotating}
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className={`h-5 w-5 mr-2 ${rotating ? 'animate-spin' : ''}`} 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh Identity
                  </Button>
                  
                  <Button 
                    onClick={handleLogout}
                    variant="destructive"
                  >
                    End Anonymous Session
                  </Button>
                </div>
              </div>
              
              <div className="bg-veilo-blue-light bg-opacity-30 rounded-lg p-4 text-sm">
                <h3 className="font-medium mb-2 text-veilo-blue-dark">Identity Protection</h3>
                <p className="text-gray-700">
                  Refreshing your identity will give you a new alias and avatar. This helps maintain your anonymity while using Veilo. 
                  Your previous posts and comments will remain, but won't be connected to your new identity.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
