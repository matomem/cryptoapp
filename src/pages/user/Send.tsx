
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowUpRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Send = () => {
  const navigate = useNavigate();
  
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-b from-white to-gray-100">
        <DashboardSidebar />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold">Send Crypto</h1>
              <SidebarTrigger />
            </div>
            
            <Card className="max-w-md mx-auto">
              <div className="p-6 space-y-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                    <ArrowUpRight className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Send Funds</h2>
                    <p className="text-sm text-gray-600">Transfer to another wallet</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Recipient Address</label>
                    <Input placeholder="Enter wallet address" />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Amount</label>
                    <Input type="number" placeholder="0.00" />
                  </div>

                  <div className="pt-4">
                    <Button className="w-full bg-primary hover:bg-primary/90">
                      Send Now
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full mt-2"
                      onClick={() => navigate('/user/send-receive')}
                    >
                      Cancel
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

export default Send;
