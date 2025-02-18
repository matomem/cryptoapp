
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const SendReceive = () => {
  const navigate = useNavigate();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-b from-white to-gray-100">
        <DashboardSidebar />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold">Send & Receive</h1>
              <SidebarTrigger />
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="balance-card">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                      <ArrowUpRight className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">Send Crypto</h2>
                      <p className="text-sm text-gray-600">Transfer to another wallet</p>
                    </div>
                  </div>
                  <Button 
                    className="w-full bg-primary hover:bg-primary/90"
                    onClick={() => navigate('/user/send')}
                  >
                    Send
                  </Button>
                </div>
              </Card>

              <Card className="balance-card">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                      <ArrowDownLeft className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">Receive Crypto</h2>
                      <p className="text-sm text-gray-600">Get your wallet address</p>
                    </div>
                  </div>
                  <Button 
                    className="w-full bg-green-500 hover:bg-green-600"
                    onClick={() => navigate('/user/receive')}
                  >
                    Receive
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default SendReceive;
