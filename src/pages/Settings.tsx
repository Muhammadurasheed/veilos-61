
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
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import {
  Bell,
  User,
  Shield,
  Languages,
  Trash2,
  Save,
  CheckCircle,
  AlertCircle,
  SunMoon
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const SettingsPage = () => {
  const { user } = useUserContext();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
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
    
    toast({
      title: "Preference updated",
      description: `${key} notifications ${!notifications[key] ? 'enabled' : 'disabled'}.`,
    });
  };
  
  const handlePrivacyChange = (key: keyof typeof privacy) => {
    setPrivacy(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    
    toast({
      title: "Privacy setting updated",
      description: `${key} has been ${!privacy[key] ? 'enabled' : 'disabled'}.`,
    });
  };

  const handleSaveChanges = () => {
    toast({
      title: "Settings saved",
      description: "Your preferences have been updated successfully.",
    });
  };

  const handleDeleteAccount = () => {
    setIsDeleteDialogOpen(false);
    toast({
      title: "Account deleted",
      description: "Your account has been permanently deleted.",
      variant: "destructive",
    });
  };

  // Animation variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: "spring", stiffness: 100 }
    }
  };

  return (
    <Layout>
      <div className="container max-w-4xl py-8">
        <motion.h1 
          className="text-3xl font-bold mb-6 text-veilo-blue-dark dark:text-veilo-blue-light"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          Settings
        </motion.h1>
        
        <Tabs defaultValue="account" className="w-full">
          <TabsList className="mb-6 bg-white dark:bg-gray-900 p-1 rounded-xl">
            <TabsTrigger value="account" className="data-[state=active]:bg-veilo-blue data-[state=active]:text-white">
              <User className="h-4 w-4 mr-2" />
              Account
            </TabsTrigger>
            <TabsTrigger value="notifications" className="data-[state=active]:bg-veilo-blue data-[state=active]:text-white">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="privacy" className="data-[state=active]:bg-veilo-blue data-[state=active]:text-white">
              <Shield className="h-4 w-4 mr-2" />
              Privacy
            </TabsTrigger>
            <TabsTrigger value="appearance" className="data-[state=active]:bg-veilo-blue data-[state=active]:text-white">
              <SunMoon className="h-4 w-4 mr-2" />
              Appearance
            </TabsTrigger>
          </TabsList>
          
          <motion.div
            initial="hidden"
            animate="visible"
            transition={{ staggerChildren: 0.1 }}
          >
            <TabsContent value="account">
              <motion.div variants={fadeInUp}>
                <Card className="shadow-md border border-gray-100 dark:border-gray-800">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <User className="h-5 w-5 mr-2 text-veilo-blue" />
                      Account Settings
                    </CardTitle>
                    <CardDescription>
                      Manage your account information and preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username / Alias</Label>
                      <Input 
                        id="username" 
                        value={user?.alias || ''} 
                        placeholder="Your anonymous alias"
                        className="border-gray-200 focus:border-veilo-blue focus:ring-veilo-blue"
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
                                ? 'border-veilo-blue shadow-md scale-110' 
                                : 'border-transparent hover:border-gray-200 hover:scale-105'
                            } transition-all`}
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
                      <Label htmlFor="language" className="flex items-center">
                        <Languages className="h-4 w-4 mr-2" />
                        Language
                      </Label>
                      <Select defaultValue="en">
                        <SelectTrigger className="border-gray-200 focus:border-veilo-blue focus:ring-veilo-blue">
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
                    
                    <Alert className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
                      <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                      <AlertTitle className="text-yellow-800 dark:text-yellow-300">Beta feature</AlertTitle>
                      <AlertDescription className="text-yellow-700 dark:text-yellow-400">
                        Some settings are still in beta and may not be fully functional.
                      </AlertDescription>
                    </Alert>
                    
                    <div className="pt-4">
                      <Button 
                        className="bg-veilo-blue hover:bg-veilo-blue-dark text-white"
                        onClick={handleSaveChanges}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
            
            <TabsContent value="notifications">
              <motion.div variants={fadeInUp}>
                <Card className="shadow-md border border-gray-100 dark:border-gray-800">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Bell className="h-5 w-5 mr-2 text-veilo-blue" />
                      Notification Preferences
                    </CardTitle>
                    <CardDescription>
                      Choose how and when you want to be notified
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                      <div>
                        <p className="font-medium">Email Notifications</p>
                        <p className="text-sm text-gray-500">Receive updates via email</p>
                      </div>
                      <Switch 
                        checked={notifications.email} 
                        onCheckedChange={() => handleNotificationChange('email')}
                        className="data-[state=checked]:bg-veilo-blue"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                      <div>
                        <p className="font-medium">Push Notifications</p>
                        <p className="text-sm text-gray-500">Receive alerts on your device</p>
                      </div>
                      <Switch 
                        checked={notifications.push} 
                        onCheckedChange={() => handleNotificationChange('push')}
                        className="data-[state=checked]:bg-veilo-blue"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                      <div>
                        <p className="font-medium">Chat Messages</p>
                        <p className="text-sm text-gray-500">Get notified about new messages</p>
                      </div>
                      <Switch 
                        checked={notifications.chat} 
                        onCheckedChange={() => handleNotificationChange('chat')}
                        className="data-[state=checked]:bg-veilo-blue"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                      <div>
                        <p className="font-medium">Session Updates</p>
                        <p className="text-sm text-gray-500">Updates about your scheduled sessions</p>
                      </div>
                      <Switch 
                        checked={notifications.sessionUpdates} 
                        onCheckedChange={() => handleNotificationChange('sessionUpdates')}
                        className="data-[state=checked]:bg-veilo-blue"
                      />
                    </div>
                    
                    <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <AlertTitle className="text-green-800 dark:text-green-300">Email validated</AlertTitle>
                      <AlertDescription className="text-green-700 dark:text-green-400">
                        Your email has been validated and can receive notifications.
                      </AlertDescription>
                    </Alert>
                    
                    <div className="pt-4">
                      <Button 
                        className="bg-veilo-blue hover:bg-veilo-blue-dark text-white"
                        onClick={handleSaveChanges}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save Preferences
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
            
            <TabsContent value="privacy">
              <motion.div variants={fadeInUp}>
                <Card className="shadow-md border border-gray-100 dark:border-gray-800">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Shield className="h-5 w-5 mr-2 text-veilo-blue" />
                      Privacy & Security
                    </CardTitle>
                    <CardDescription>
                      Manage how your information is handled
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                      <div>
                        <p className="font-medium">Auto-rotate Identity</p>
                        <p className="text-sm text-gray-500">Change your alias automatically every week</p>
                      </div>
                      <Switch 
                        checked={privacy.autoRotateIdentity} 
                        onCheckedChange={() => handlePrivacyChange('autoRotateIdentity')}
                        className="data-[state=checked]:bg-veilo-blue"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                      <div>
                        <p className="font-medium">Show Online Status</p>
                        <p className="text-sm text-gray-500">Allow others to see when you're online</p>
                      </div>
                      <Switch 
                        checked={privacy.showOnlineStatus} 
                        onCheckedChange={() => handlePrivacyChange('showOnlineStatus')}
                        className="data-[state=checked]:bg-veilo-blue"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                      <div>
                        <p className="font-medium">Allow Direct Messages</p>
                        <p className="text-sm text-gray-500">Receive messages from users you haven't connected with</p>
                      </div>
                      <Switch 
                        checked={privacy.allowDirectMessages} 
                        onCheckedChange={() => handlePrivacyChange('allowDirectMessages')}
                        className="data-[state=checked]:bg-veilo-blue"
                      />
                    </div>
                    
                    <div className="pt-6">
                      <h3 className="text-lg font-medium mb-4">Data & Deletion</h3>
                      <Alert className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 mb-4">
                        <AlertDescription className="text-gray-700 dark:text-gray-300">
                          Veilo prioritizes your privacy. You can export or delete your data at any time.
                          Deleted accounts cannot be recovered.
                        </AlertDescription>
                      </Alert>
                      <div className="flex flex-wrap gap-3">
                        <Button variant="outline" className="border-veilo-blue text-veilo-blue">
                          Export My Data
                        </Button>
                        
                        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                          <DialogTrigger asChild>
                            <Button variant="destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Account
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                              <DialogTitle className="text-red-500">Delete Account?</DialogTitle>
                              <DialogDescription>
                                This action cannot be undone. Your account and all associated data will be permanently deleted.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                              <p className="text-sm text-gray-500">
                                Please type "DELETE" to confirm:
                              </p>
                              <Input 
                                className="mt-2 border-gray-200" 
                                placeholder="Type DELETE to confirm" 
                              />
                            </div>
                            <DialogFooter>
                              <Button 
                                variant="outline" 
                                onClick={() => setIsDeleteDialogOpen(false)}
                              >
                                Cancel
                              </Button>
                              <Button 
                                variant="destructive"
                                onClick={handleDeleteAccount}
                              >
                                Delete Permanently
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
            
            <TabsContent value="appearance">
              <motion.div variants={fadeInUp}>
                <Card className="shadow-md border border-gray-100 dark:border-gray-800">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <SunMoon className="h-5 w-5 mr-2 text-veilo-blue" />
                      Appearance
                    </CardTitle>
                    <CardDescription>
                      Customize how Veilo looks for you
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-3">
                      <Label>Theme</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div 
                          className={`border rounded-xl p-4 cursor-pointer transition-all ${
                            theme === 'light' ? 'border-veilo-blue bg-veilo-blue-light/20 shadow' : 'border-gray-200'
                          } hover:shadow-md`}
                          onClick={() => setTheme('light')}
                        >
                          <div className="h-24 bg-white border rounded-lg mb-3 flex items-center justify-center">
                            <div className="w-10 h-10 rounded-full bg-veilo-blue"></div>
                          </div>
                          <p className="text-center text-sm font-medium">Light Mode</p>
                        </div>
                        
                        <div 
                          className={`border rounded-xl p-4 cursor-pointer transition-all ${
                            theme === 'dark' ? 'border-veilo-blue bg-veilo-blue-light/20 shadow' : 'border-gray-200'
                          } hover:shadow-md`}
                          onClick={() => setTheme('dark')}
                        >
                          <div className="h-24 bg-gray-900 border border-gray-700 rounded-lg mb-3 flex items-center justify-center">
                            <div className="w-10 h-10 rounded-full bg-veilo-blue"></div>
                          </div>
                          <p className="text-center text-sm font-medium">Dark Mode</p>
                        </div>
                        
                        <div 
                          className={`border rounded-xl p-4 cursor-pointer transition-all ${
                            theme === 'system' ? 'border-veilo-blue bg-veilo-blue-light/20 shadow' : 'border-gray-200'
                          } hover:shadow-md`}
                          onClick={() => setTheme('system')}
                        >
                          <div className="h-24 bg-gradient-to-b from-white to-gray-900 border rounded-lg mb-3 flex items-center justify-center">
                            <div className="w-10 h-10 rounded-full bg-veilo-blue"></div>
                          </div>
                          <p className="text-center text-sm font-medium">System Default</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          </motion.div>
        </Tabs>
      </div>
    </Layout>
  );
};

export default SettingsPage;
