
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Card } from "@/components/ui/card";

const Welcome = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-b from-white to-gray-100">
        <DashboardSidebar />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <SidebarTrigger />
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="balance-card">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#F7931A] rounded-full flex items-center justify-center">
                    <img
                      src="https://cryptologos.cc/logos/bitcoin-btc-logo.png"
                      alt="Bitcoin"
                      className="w-8 h-8"
                    />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Bitcoin Balance</p>
                    <p className="text-2xl font-bold">0.0000 BTC</p>
                  </div>
                </div>
              </Card>

              <Card className="balance-card">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center border border-gray-200">
                    <img
                      src="https://flagcdn.com/za.svg"
                      alt="South African Flag"
                      className="w-8 h-8 rounded"
                    />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">ZAR Balance</p>
                    <p className="text-2xl font-bold">R 0.00</p>
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

export default Welcome;
