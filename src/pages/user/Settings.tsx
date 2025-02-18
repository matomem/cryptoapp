
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bell, Lock, User, Globe } from "lucide-react";

const Settings = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-b from-white to-gray-100">
        <DashboardSidebar />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold">Settings</h1>
              <SidebarTrigger />
            </div>
            
            <div className="space-y-6">
              <Card className="balance-card">
                <div className="flex items-center gap-4 mb-4">
                  <User className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-bold">Profile Settings</h2>
                </div>
                <div className="space-y-4">
                  <Input placeholder="Full Name" />
                  <Input placeholder="Email" type="email" />
                  <Button className="w-full bg-primary hover:bg-primary/90">
                    Update Profile
                  </Button>
                </div>
              </Card>

              <Card className="balance-card">
                <div className="flex items-center gap-4 mb-4">
                  <Lock className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-bold">Security</h2>
                </div>
                <div className="space-y-4">
                  <Input placeholder="Current Password" type="password" />
                  <Input placeholder="New Password" type="password" />
                  <Input placeholder="Confirm New Password" type="password" />
                  <Button className="w-full bg-primary hover:bg-primary/90">
                    Change Password
                  </Button>
                </div>
              </Card>

              <Card className="balance-card">
                <div className="flex items-center gap-4 mb-4">
                  <Bell className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-bold">Notifications</h2>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Email Notifications</span>
                    <Button variant="outline">Configure</Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Security Alerts</span>
                    <Button variant="outline">Configure</Button>
                  </div>
                </div>
              </Card>

              <Card className="balance-card">
                <div className="flex items-center gap-4 mb-4">
                  <Globe className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-bold">Preferences</h2>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Language</span>
                    <Button variant="outline">English</Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Currency</span>
                    <Button variant="outline">ZAR</Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Settings;
