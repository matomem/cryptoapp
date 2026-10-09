import { useEffect, useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bell, Lock, User, Globe } from "lucide-react";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api";

type Profile = { fullName: string; email: string; language: string; currency: string; emailNotifications: boolean; securityAlerts: boolean };

const Settings = () => {
  const [profile, setProfile] = useState<Profile>({
    fullName: "", email: "", language: "en", currency: "ZAR",
    emailNotifications: true, securityAlerts: true,
  });
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiRequest<Profile>("/api/settings")
      .then((data) => setProfile((old) => ({ ...old, ...data })))
      .catch((error: unknown) => toast.error(error instanceof Error ? error.message : "Unable to load settings."))
      .finally(() => setLoading(false));
  }, []);

  const updateProfile = async () => {
    setSaving(true);
    try {
      const saved = await apiRequest<Profile>("/api/settings/profile", {
        method: "PUT",
        body: JSON.stringify({ fullName: profile.fullName.trim(), email: profile.email.trim().toLowerCase() }),
      });
      setProfile((old) => ({ ...old, ...saved }));
      toast.success("Profile updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (newPassword.length < 12 || newPassword !== confirmPassword) {
      toast.error("Use a password of at least 12 characters and make sure both new passwords match.");
      return;
    }
    setSaving(true);
    try {
      await apiRequest("/api/settings/password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password changed.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to change password.");
    } finally {
      setSaving(false);
    }
  };

  const savePreference = async (changes: Partial<Profile>) => {
    const next = { ...profile, ...changes };
    setProfile(next);
    try {
      const saved = await apiRequest<Profile>("/api/settings/preferences", {
        method: "PUT",
        body: JSON.stringify(changes),
      });
      setProfile((old) => ({ ...old, ...saved }));
      toast.success("Preference saved.");
    } catch (error) {
      setProfile(profile);
      toast.error(error instanceof Error ? error.message : "Unable to save preference.");
    }
  };

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
            {loading && <p role="status" className="mb-4">Loading account settings…</p>}
            <div className="space-y-6">
              <Card className="balance-card p-6">
                <div className="flex items-center gap-4 mb-4"><User className="w-5 h-5 text-primary" /><h2 className="text-xl font-bold">Profile Settings</h2></div>
                <div className="space-y-4">
                  <Input aria-label="Full Name" placeholder="Full Name" value={profile.fullName} onChange={(e) => setProfile({ ...profile, fullName: e.target.value })} />
                  <Input aria-label="Email" placeholder="Email" type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
                  <Button disabled={saving || loading} onClick={updateProfile} className="w-full bg-primary hover:bg-primary/90">{saving ? "Saving…" : "Update Profile"}</Button>
                </div>
              </Card>

              <Card className="balance-card p-6">
                <div className="flex items-center gap-4 mb-4"><Lock className="w-5 h-5 text-primary" /><h2 className="text-xl font-bold">Security</h2></div>
                <div className="space-y-4">
                  <Input aria-label="Current Password" placeholder="Current Password" type="password" autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                  <Input aria-label="New Password" placeholder="New Password (12 characters minimum)" type="password" autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                  <Input aria-label="Confirm New Password" placeholder="Confirm New Password" type="password" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                  <Button disabled={saving || !currentPassword || !newPassword || !confirmPassword} onClick={changePassword} className="w-full bg-primary hover:bg-primary/90">Change Password</Button>
                </div>
              </Card>

              <Card className="balance-card p-6">
                <div className="flex items-center gap-4 mb-4"><Bell className="w-5 h-5 text-primary" /><h2 className="text-xl font-bold">Notifications</h2></div>
                <div className="space-y-4">
                  <label className="flex items-center justify-between gap-4"><span>Email Notifications</span><input type="checkbox" checked={profile.emailNotifications} onChange={(e) => void savePreference({ emailNotifications: e.target.checked })} /></label>
                  <label className="flex items-center justify-between gap-4"><span>Security Alerts</span><input type="checkbox" checked={profile.securityAlerts} onChange={(e) => void savePreference({ securityAlerts: e.target.checked })} /></label>
                </div>
              </Card>

              <Card className="balance-card p-6">
                <div className="flex items-center gap-4 mb-4"><Globe className="w-5 h-5 text-primary" /><h2 className="text-xl font-bold">Preferences</h2></div>
                <div className="space-y-4">
                  <label className="flex items-center justify-between gap-4"><span>Language</span><select aria-label="Language" className="rounded-md border bg-background p-2" value={profile.language} onChange={(e) => void savePreference({ language: e.target.value })}><option value="en">English</option></select></label>
                  <label className="flex items-center justify-between gap-4"><span>Display Currency</span><select aria-label="Display Currency" className="rounded-md border bg-background p-2" value={profile.currency} onChange={(e) => void savePreference({ currency: e.target.value })}><option value="ZAR">ZAR</option><option value="BTC">BTC</option></select></label>
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
