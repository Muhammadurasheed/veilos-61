
import { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUserContext } from '@/contexts/UserContext';
import { useTheme } from '@/contexts/ThemeContext';

const SettingsPage = () => {
  const { user } = useUserContext();
  const { theme } = useTheme();
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    chat: true,
    sessionUpdates: true
  });
  const [privacy, setPrivacy] = useState({
    autoRotateIdentity: true,
    showOnlineStatus: true,
    allowDirectMessages: true
  });
  
  // These would be connected to actual API calls in a real app
  const handleNotificationChange = (key: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };
  
  const handlePrivacyChange = (key: keyof typeof privacy) => {
    setPrivacy(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <Layout>
      <div className="container max-w-4xl py-6">
        <h1 className="text-3xl font-bold mb-6 text-veilo-blue-dark dark:text-veilo-blue-light">Settings</h1>
        
        <Tabs defaultValue="account" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="privacy">Privacy & Security</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
          </TabsList>
          
          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>
                  Manage your account information and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username / Alias</Label>
                  <Input 
                    id="username" 
                    value={user?.alias || ''} 
                    placeholder="Your anonymous alias"
                  />
                  <p className="text-sm text-gray-500">
                    This is your public identity. It automatically rotates weekly unless you set a custom one.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="avatar">Avatar</Label>
                  <div className="flex flex-wrap gap-3 mt-2">
                    {[1, 2, 3, 4, 5, 6, 7].map((index) => (
                      <div 
                        key={index}
                        className={`w-12 h-12 rounded-full overflow-hidden cursor-pointer border-2 ${
                          user?.avatarIndex === index 
                            ? 'border-veilo-blue' 
                            : 'border-transparent'
                        }`}
                      >
                        <img 
                          src={`/avatars/avatar-${index}.svg`} 
                          alt={`Avatar ${index}`} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select defaultValue="en">
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                      <SelectItem value="ar">Arabic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="pt-4">
                  <Button className="bg-veilo-blue hover:bg-veilo-blue-dark text-white">
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Choose how and when you want to be notified
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-gray-500">Receive updates via email</p>
                  </div>
                  <Switch 
                    checked={notifications.email} 
                    onCheckedChange={() => handleNotificationChange('email')}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Push Notifications</p>
                    <p className="text-sm text-gray-500">Receive alerts on your device</p>
                  </div>
                  <Switch 
                    checked={notifications.push} 
                    onCheckedChange={() => handleNotificationChange('push')}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Chat Messages</p>
                    <p className="text-sm text-gray-500">Get notified about new messages</p>
                  </div>
                  <Switch 
                    checked={notifications.chat} 
                    onCheckedChange={() => handleNotificationChange('chat')}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Session Updates</p>
                    <p className="text-sm text-gray-500">Updates about your scheduled sessions</p>
                  </div>
                  <Switch 
                    checked={notifications.sessionUpdates} 
                    onCheckedChange={() => handleNotificationChange('sessionUpdates')}
                  />
                </div>
                
                <div className="pt-4">
                  <Button className="bg-veilo-blue hover:bg-veilo-blue-dark text-white">
                    Save Preferences
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="privacy">
            <Card>
              <CardHeader>
                <CardTitle>Privacy & Security</CardTitle>
                <CardDescription>
                  Manage how your information is handled
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Auto-rotate Identity</p>
                    <p className="text-sm text-gray-500">Change your alias automatically every week</p>
                  </div>
                  <Switch 
                    checked={privacy.autoRotateIdentity} 
                    onCheckedChange={() => handlePrivacyChange('autoRotateIdentity')}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Show Online Status</p>
                    <p className="text-sm text-gray-500">Allow others to see when you're online</p>
                  </div>
                  <Switch 
                    checked={privacy.showOnlineStatus} 
                    onCheckedChange={() => handlePrivacyChange('showOnlineStatus')}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Allow Direct Messages</p>
                    <p className="text-sm text-gray-500">Receive messages from users you haven't connected with</p>
                  </div>
                  <Switch 
                    checked={privacy.allowDirectMessages} 
                    onCheckedChange={() => handlePrivacyChange('allowDirectMessages')}
                  />
                </div>
                
                <div className="pt-6">
                  <h3 className="text-lg font-medium mb-2">Data & Deletion</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Veilo prioritizes your privacy. You can export or delete your data at any time.
                  </p>
                  <div className="space-x-3">
                    <Button variant="outline">Export My Data</Button>
                    <Button variant="destructive">Delete Account</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>
                  Customize how Veilo looks for you
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>Theme</Label>
                  <div className="grid grid-cols-3 gap-3">
                    <div className={`border rounded-lg p-3 cursor-pointer ${
                      theme === 'light' ? 'border-veilo-blue bg-veilo-blue-light/20' : 'border-gray-200'
                    }`}>
                      <div className="h-20 bg-white border rounded-md mb-2 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-veilo-blue"></div>
                      </div>
                      <p className="text-center text-sm font-medium">Light</p>
                    </div>
                    
                    <div className={`border rounded-lg p-3 cursor-pointer ${
                      theme === 'dark' ? 'border-veilo-blue bg-veilo-blue-light/20' : 'border-gray-200'
                    }`}>
                      <div className="h-20 bg-gray-900 border border-gray-700 rounded-md mb-2 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-veilo-blue"></div>
                      </div>
                      <p className="text-center text-sm font-medium">Dark</p>
                    </div>
                    
                    <div className="border rounded-lg p-3 cursor-pointer border-gray-200">
                      <div className="h-20 bg-gradient-to-b from-white to-gray-900 border rounded-md mb-2 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-veilo-blue"></div>
                      </div>
                      <p className="text-center text-sm font-medium">System</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default SettingsPage;
