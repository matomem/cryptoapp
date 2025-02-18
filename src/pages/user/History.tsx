
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Card } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownLeft } from "lucide-react";

const History = () => {
  const transactions = [
    { type: 'received', amount: '0.0023', currency: 'BTC', date: '2024-02-20', status: 'completed' },
    { type: 'sent', amount: '0.0015', currency: 'BTC', date: '2024-02-19', status: 'completed' },
  ];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-b from-white to-gray-100">
        <DashboardSidebar />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold">Transaction History</h1>
              <SidebarTrigger />
            </div>
            
            <div className="space-y-4">
              {transactions.map((tx, index) => (
                <Card key={index} className="balance-card">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        tx.type === 'received' ? 'bg-green-500' : 'bg-primary'
                      }`}>
                        {tx.type === 'received' ? (
                          <ArrowDownLeft className="w-5 h-5 text-white" />
                        ) : (
                          <ArrowUpRight className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">
                          {tx.type === 'received' ? 'Received' : 'Sent'} {tx.amount} {tx.currency}
                        </p>
                        <p className="text-sm text-gray-600">{tx.date}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      tx.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {tx.status}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default History;
