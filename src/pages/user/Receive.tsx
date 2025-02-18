
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
  const walletAddress = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(walletAddress);
    toast({
      title: "Address Copied",
      description: "Wallet address has been copied to clipboard",
    });
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
                    <p className="text-sm font-mono">{walletAddress}</p>
                  </div>

                  <div className="pt-4">
                    <Button 
                      onClick={copyToClipboard}
                      className="w-full bg-green-500 hover:bg-green-600 mb-2"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Address
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => navigate('/user/send-receive')}
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
