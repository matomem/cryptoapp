import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowDownLeft, Copy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

const Receive = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  // A real address must be supplied by a connected wallet/backend.
  // Do not display or copy an empty or invented address.
  const walletAddress = "";

  const copyToClipboard = async () => {
    if (!walletAddress) {
      toast({
        title: "Wallet not connected",
        description: "A receiving address is not configured yet.",
        variant: "destructive",
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(walletAddress);
      toast({
        title: "Address copied",
        description: "Your wallet address has been copied to the clipboard.",
      });
    } catch {
      toast({
        title: "Unable to copy address",
        description: "Your browser did not allow clipboard access.",
        variant: "destructive",
      });
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
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                    <ArrowDownLeft className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Your Wallet Address</h2>
                    <p className="text-sm text-gray-600">Share this address to receive funds</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg break-all relative">
                    {walletAddress ? (
                      <p className="text-sm font-mono">{walletAddress}</p>
                    ) : (
                      <p className="text-sm text-amber-800">
                        No receiving address is configured. Connect a wallet service before receiving funds.
                      </p>
                    )}
                  </div>

                  <div className="pt-4">
                    <Button
                      onClick={copyToClipboard}
                      disabled={!walletAddress}
                      className="w-full bg-green-500 hover:bg-green-600 mb-2"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Address
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => navigate("/user/send-receive")}
                    >
                      Back
                    </Button>
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
