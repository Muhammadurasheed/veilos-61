
import { useState } from 'react';
import Layout from "@/components/layout/Layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from '@/contexts/ThemeContext';
import { useUserContext } from '@/contexts/UserContext';
import { Loader2, Save, Moon, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const Settings = () => {
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useUserContext();
  
  const [accountForm, setAccountForm] = useState({
    email: user?.email || '',
    password: '',
    confirmPassword: '',
  });
  
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    inAppNotifications: true,
    marketingEmails: false,
  });
  
  const [privacySettings, setPrivacySettings] = useState({
    showOnlineStatus: true,
    allowProfileViewing: true,
    allowAnonymousMessages: true,
    enableVoiceMasking: true,
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteAccountDialogOpen, setIsDeleteAccountDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  
  const handleAccountFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAccountForm(prev => ({ ...prev, [name]: value }));
  };
  
  const handleNotificationSettingChange = (setting: string) => {
    setNotificationSettings(prev => ({ 
      ...prev, 
      [setting]: !prev[setting as keyof typeof prev] 
    }));
  };
  
  const handlePrivacySettingChange = (setting: string) => {
    setPrivacySettings(prev => ({ 
      ...prev, 
      [setting]: !prev[setting as keyof typeof prev] 
    }));
  };
  
  const handleSaveSettings = async (type: 'account' | 'notifications' | 'privacy') => {
    setIsSaving(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: 'Settings Saved',
        description: `Your ${type} settings have been updated successfully.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      toast({
        title: 'Confirmation Failed',
        description: 'Please type DELETE to confirm account deletion.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: 'Account Deleted',
        description: 'Your account has been permanently deleted.',
      });
      
      setIsDeleteAccountDialogOpen(false);
      logout();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete your account. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <Layout>
      <div className="container py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Settings</h1>
          
          <Tabs defaultValue="account" className="w-full">
            <TabsList className="grid grid-cols-3 mb-8">
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="privacy">Privacy & Security</TabsTrigger>
            </TabsList>
            
            <TabsContent value="account">
              <Card>
                <CardHeader>
                  <CardTitle>Account Settings</CardTitle>
                  <CardDescription>
                    Manage your account information and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Profile Information</h3>
                    
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="display-name">Display Name</Label>
                        <Input 
                          id="display-name" 
                          value={user?.alias || ""} 
                          disabled={user?.isAnonymous}
                          readOnly={user?.isAnonymous}
                        />
                        {user?.isAnonymous && (
                          <p className="text-sm text-muted-foreground">
                            As an anonymous user, you cannot change your display name.
                            Use "Refresh Identity" on your profile page instead.
                          </p>
                        )}
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input 
                          id="email" 
                          name="email"
                          type="email" 
                          value={accountForm.email} 
                          onChange={handleAccountFormChange}
                          disabled={user?.isAnonymous}
                          readOnly={user?.isAnonymous}
                        />
                        {user?.isAnonymous && (
                          <p className="text-sm text-muted-foreground">
                            To add an email, you need to convert to a registered account.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Password</h3>
                    
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="current-password">Current Password</Label>
                        <Input 
                          id="current-password" 
                          type="password" 
                          disabled={user?.isAnonymous}
                          readOnly={user?.isAnonymous}
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <Input 
                          id="new-password"
                          name="password"
                          type="password"
                          value={accountForm.password}
                          onChange={handleAccountFormChange}
                          disabled={user?.isAnonymous}
                          readOnly={user?.isAnonymous}
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="confirm-password">Confirm New Password</Label>
                        <Input 
                          id="confirm-password"
                          name="confirmPassword"
                          type="password"
                          value={accountForm.confirmPassword}
                          onChange={handleAccountFormChange}
                          disabled={user?.isAnonymous}
                          readOnly={user?.isAnonymous}
                        />
                      </div>
                    </div>
                    
                    {user?.isAnonymous && (
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          Anonymous accounts don't have passwords. To set a password, 
                          convert to a registered account.
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Appearance</h3>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="dark-mode" className="text-base">Dark Mode</Label>
                        <p className="text-sm text-muted-foreground">
                          Switch between light and dark themes
                        </p>
                      </div>
                      <Switch 
                        id="dark-mode" 
                        checked={theme === 'dark'} 
                        onCheckedChange={() => toggleTheme()}
                      />
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-destructive">Danger Zone</h3>
                    
                    <div className="grid gap-2">
                      <p className="text-sm text-muted-foreground">
                        Permanently delete your account and all associated data.
                        This action cannot be undone.
                      </p>
                      <Button 
                        variant="destructive" 
                        onClick={() => setIsDeleteAccountDialogOpen(true)}
                      >
                        Delete Account
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex justify-end pt-4">
                    <Button 
                      className="bg-veilo-blue hover:bg-veilo-blue-dark"
                      onClick={() => handleSaveSettings('account')}
                      disabled={isSaving || user?.isAnonymous}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Settings</CardTitle>
                  <CardDescription>
                    Control how and when you receive notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Email Notifications</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="email-notifications" className="text-base">Email Notifications</Label>
                          <p className="text-sm text-muted-foreground">
                            Receive notifications via email
                          </p>
                        </div>
                        <Switch 
                          id="email-notifications" 
                          checked={notificationSettings.emailNotifications} 
                          onCheckedChange={() => handleNotificationSettingChange('emailNotifications')}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="marketing-emails" className="text-base">Marketing Emails</Label>
                          <p className="text-sm text-muted-foreground">
                            Receive updates about new features and services
                          </p>
                        </div>
                        <Switch 
                          id="marketing-emails" 
                          checked={notificationSettings.marketingEmails}
                          onCheckedChange={() => handleNotificationSettingChange('marketingEmails')}
                          disabled={!notificationSettings.emailNotifications}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">In-App Notifications</h3>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="in-app-notifications" className="text-base">In-App Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive notifications while using the app
                        </p>
                      </div>
                      <Switch 
                        id="in-app-notifications" 
                        checked={notificationSettings.inAppNotifications}
                        onCheckedChange={() => handleNotificationSettingChange('inAppNotifications')}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end pt-4">
                    <Button 
                      className="bg-veilo-blue hover:bg-veilo-blue-dark"
                      onClick={() => handleSaveSettings('notifications')}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
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
                    Control your privacy settings and security preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Privacy Settings</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="online-status" className="text-base">Show Online Status</Label>
                          <p className="text-sm text-muted-foreground">
                            Allow others to see when you're online
                          </p>
                        </div>
                        <Switch 
                          id="online-status" 
                          checked={privacySettings.showOnlineStatus}
                          onCheckedChange={() => handlePrivacySettingChange('showOnlineStatus')}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="profile-viewing" className="text-base">Profile Viewing</Label>
                          <p className="text-sm text-muted-foreground">
                            Allow others to view your profile
                          </p>
                        </div>
                        <Switch 
                          id="profile-viewing" 
                          checked={privacySettings.allowProfileViewing}
                          onCheckedChange={() => handlePrivacySettingChange('allowProfileViewing')}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="anonymous-messages" className="text-base">Anonymous Messages</Label>
                          <p className="text-sm text-muted-foreground">
                            Allow anonymous users to message you
                          </p>
                        </div>
                        <Switch 
                          id="anonymous-messages" 
                          checked={privacySettings.allowAnonymousMessages}
                          onCheckedChange={() => handlePrivacySettingChange('allowAnonymousMessages')}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Voice & Video Settings</h3>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="voice-masking" className="text-base">Voice Masking</Label>
                        <p className="text-sm text-muted-foreground">
                          Enable voice modulation for anonymity during calls
                        </p>
                      </div>
                      <Switch 
                        id="voice-masking" 
                        checked={privacySettings.enableVoiceMasking}
                        onCheckedChange={() => handlePrivacySettingChange('enableVoiceMasking')}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end pt-4">
                    <Button 
                      className="bg-veilo-blue hover:bg-veilo-blue-dark"
                      onClick={() => handleSaveSettings('privacy')}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      <Dialog open={isDeleteAccountDialogOpen} onOpenChange={setIsDeleteAccountDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Delete Account
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete your account
              and remove all your data from our servers.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="bg-destructive/10 dark:bg-destructive/20 p-4 rounded-md">
              <p className="text-sm text-destructive font-medium">
                To confirm, type "DELETE" in the field below:
              </p>
            </div>
            
            <Input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE to confirm"
            />
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteAccountDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteAccount} 
              disabled={deleteConfirmText !== 'DELETE' || isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Account'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Settings;
