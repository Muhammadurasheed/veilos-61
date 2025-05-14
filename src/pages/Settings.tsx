
import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { LanguageSelector } from '@/components/settings/LanguageSelector';
import { useUserContext } from '@/contexts/UserContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { UserApi } from '@/services/api';
import { Loader2, Camera, UserCircle, Bell, Moon, Globe, Shield, Key } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const Settings = () => {
  const { user, updateAvatar, createAnonymousAccount } = useUserContext();
  const [avatarUrl, setAvatarUrl] = useState<string>(user?.avatarUrl || '');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<boolean>(true);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [anonymousMode, setAnonymousMode] = useState<boolean>(user?.isAnonymous || false);
  const [profileVisibility, setProfileVisibility] = useState<boolean>(true);
  
  useEffect(() => {
    if (user?.avatarUrl) {
      setAvatarUrl(user.avatarUrl);
    }
    if (user?.isAnonymous !== undefined) {
      setAnonymousMode(user.isAnonymous);
    }
  }, [user]);
  
  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setAvatarUrl(base64String);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleSaveAvatar = async () => {
    if (avatarUrl && updateAvatar) {
      setIsLoading(true);
      try {
        await updateAvatar(avatarUrl);
        toast({
          title: 'Success',
          description: 'Your avatar has been updated.',
        });
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to update avatar. Please try again.',
        });
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  const handleCreateAnonymousAccount = async () => {
    if (createAnonymousAccount) {
      setIsLoading(true);
      try {
        await createAnonymousAccount();
        toast({
          title: 'Success',
          description: 'Anonymous account created successfully.',
        });
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to create anonymous account. Please try again.',
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto py-10">
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-center py-8">
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                You need to be logged in to access your settings.
              </p>
              <Button onClick={handleCreateAnonymousAccount} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Anonymous Account...
                  </>
                ) : (
                  'Create Anonymous Account'
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="container mx-auto py-10">
        <h1 className="text-3xl font-bold mb-8">Settings</h1>
        
        <div className="grid gap-8 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserCircle className="mr-2 h-5 w-5" />
                Profile Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex flex-col items-center space-y-4">
                  <Avatar className="h-32 w-32">
                    {avatarUrl ? (
                      <AvatarImage src={avatarUrl} alt={user.alias} />
                    ) : (
                      <AvatarImage 
                        src={`/avatars/avatar-${user.avatarIndex || 1}.svg`} 
                        alt={user.alias}
                      />
                    )}
                    <AvatarFallback>{user.alias?.charAt(0) || 'A'}</AvatarFallback>
                  </Avatar>
                  
                  <div className="flex items-center">
                    <label htmlFor="avatar-upload" className="cursor-pointer">
                      <div className="flex items-center space-x-2 rounded-md bg-secondary px-3 py-2 text-sm text-secondary-foreground">
                        <Camera className="h-4 w-4" />
                        <span>Change Avatar</span>
                      </div>
                      <input 
                        id="avatar-upload" 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleAvatarChange}
                      />
                    </label>
                  </div>
                  
                  {avatarUrl !== user.avatarUrl && (
                    <Button onClick={handleSaveAvatar} disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Avatar'
                      )}
                    </Button>
                  )}
                </div>
                
                <div className="flex-1 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input id="username" value={user.alias} readOnly className="bg-muted" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" value="Anonymous User" readOnly className="bg-muted" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Input id="role" value={user.role} readOnly className="bg-muted" />
                  </div>
                  
                  {user.isAnonymous && (
                    <div className="pt-4">
                      <Button variant="outline">Upgrade to Full Account</Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="mr-2 h-5 w-5" />
                  Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Notifications</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Receive alerts and updates</p>
                  </div>
                  <Switch 
                    checked={notifications} 
                    onCheckedChange={setNotifications} 
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Dark Mode</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Toggle dark theme</p>
                  </div>
                  <Switch 
                    checked={darkMode} 
                    onCheckedChange={setDarkMode} 
                  />
                </div>
                
                <Separator />
                
                <div>
                  <div className="flex items-center mb-2">
                    <Globe className="mr-2 h-5 w-5" />
                    <h3 className="font-medium">Language</h3>
                  </div>
                  <LanguageSelector />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="mr-2 h-5 w-5" />
                  Privacy & Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Profile Visibility</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Make your profile visible to others</p>
                  </div>
                  <Switch 
                    checked={profileVisibility} 
                    onCheckedChange={setProfileVisibility} 
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Anonymous Mode</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Hide your identity in chat sessions</p>
                  </div>
                  <Switch 
                    checked={anonymousMode} 
                    onCheckedChange={setAnonymousMode}
                    disabled 
                  />
                </div>
                
                <Separator />
                
                {!user.isAnonymous && (
                  <div className="pt-2">
                    <Button variant="outline" className="w-full mb-2">
                      <Key className="mr-2 h-4 w-4" />
                      Change Password
                    </Button>
                  </div>
                )}
                
                <Button variant="destructive" className="w-full">
                  Delete Account
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;
