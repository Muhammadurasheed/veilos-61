
import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import LanguageSelector from '@/components/settings/LanguageSelector';
import { useUserContext } from '@/contexts/UserContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';

const Settings = () => {
  const { user, updateAvatar } = useUserContext();
  const [avatarUrl, setAvatarUrl] = useState<string>(user?.avatarUrl || '');
  const [notifications, setNotifications] = useState<boolean>(true);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  
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
      try {
        await updateAvatar(avatarUrl);
        toast({
          title: 'Avatar updated',
          description: 'Your profile avatar has been updated successfully.',
        });
      } catch (error) {
        toast({
          title: 'Failed to update avatar',
          description: 'There was an error updating your avatar. Please try again.',
          variant: 'destructive',
        });
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
              <CardDescription>Please login to view and update your settings.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="container mx-auto py-10">
        <h1 className="text-3xl font-bold mb-8">Settings</h1>
        
        <div className="grid gap-6 md:grid-cols-2">
          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>Manage your profile information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
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
                <div>
                  <h3 className="font-medium">{user.alias}</h3>
                  <p className="text-sm text-gray-500">
                    {user.isAnonymous ? 'Anonymous User' : 'Registered User'}
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" value={user.alias} readOnly />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="avatar">Change Avatar</Label>
                <Input id="avatar" type="file" accept="image/*" onChange={handleAvatarChange} />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveAvatar}>Save Changes</Button>
            </CardFooter>
          </Card>
          
          {/* Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>Customize your experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Notifications</h3>
                  <p className="text-sm text-gray-500">Receive alerts and updates</p>
                </div>
                <Switch 
                  checked={notifications} 
                  onCheckedChange={setNotifications} 
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Dark Mode</h3>
                  <p className="text-sm text-gray-500">Toggle dark theme</p>
                </div>
                <Switch 
                  checked={darkMode} 
                  onCheckedChange={setDarkMode} 
                />
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Language</h3>
                <LanguageSelector />
              </div>
            </CardContent>
          </Card>
          
          {/* Privacy Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Privacy</CardTitle>
              <CardDescription>Manage your privacy settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Profile Visibility</h3>
                  <p className="text-sm text-gray-500">Make your profile visible to others</p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Anonymous Mode</h3>
                  <p className="text-sm text-gray-500">Hide your identity in chat sessions</p>
                </div>
                <Switch defaultChecked={user.isAnonymous || false} />
              </div>
            </CardContent>
          </Card>
          
          {/* Account Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
              <CardDescription>Manage your account settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!user.isAnonymous && (
                <Button variant="outline" className="w-full">Change Password</Button>
              )}
              
              {user.isAnonymous && (
                <Button variant="outline" className="w-full">Upgrade to Full Account</Button>
              )}
              
              <Button variant="destructive" className="w-full">Delete Account</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;
