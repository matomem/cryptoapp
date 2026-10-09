import { useEffect, useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowDownLeft, Copy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { apiRequest } from "@/lib/api";

const Receive = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [walletAddress, setWalletAddress] = useState("");
  const [currency, setCurrency] = useState("BTC");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiRequest<{ address: string; currency?: string }>("/api/wallet/address?currency=BTC")
      .then((data) => {
        setWalletAddress(data.address || "");
        setCurrency(data.currency || "BTC");
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Unable to load a receiving address."))
      .finally(() => setLoading(false));
  }, []);

  const copyToClipboard = async () => {
    if (!walletAddress) {
      toast({ title: "Wallet not connected", description: "A real receiving address is not available.", variant: "destructive" });
      return;
    }
    try {
      await navigator.clipboard.writeText(walletAddress);
      toast({ title: "Address copied", description: "Your wallet address has been copied to the clipboard." });
    } catch {
      toast({ title: "Unable to copy address", description: "Your browser did not allow clipboard access.", variant: "destructive" });
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-b from-white to-gray-100">
        <DashboardSidebar />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold">Receive Crypto</h1>
              <SidebarTrigger />
            </div>
            <Card className="max-w-md mx-auto">
              <div className="p-6 space-y-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center"><ArrowDownLeft className="w-6 h-6 text-white" /></div>
                  <div>
                    <h2 className="text-xl font-bold">Your Wallet Address</h2>
                    <p className="text-sm text-gray-600">Share this address to receive funds</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg break-all">
                    {loading ? <p className="text-sm">Loading receiving address…</p> : walletAddress ? <><p className="text-xs text-gray-500 mb-2">{currency} deposit address</p><p className="text-sm font-mono">{walletAddress}</p></> : <p role="alert" className="text-sm text-amber-800">{error || "A receiving address is not configured."}</p>}
                  </div>
                  <div className="pt-4">
                    <Button onClick={copyToClipboard} disabled={loading || !walletAddress} className="w-full bg-green-500 hover:bg-green-600 mb-2">
                      <Copy className="w-4 h-4 mr-2" />Copy Address
                    </Button>
                    <Button variant="outline" className="w-full" onClick={() => navigate("/user/send-receive")}>Back</Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Receive;
