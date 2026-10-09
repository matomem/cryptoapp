import { useEffect, useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Card } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { apiRequest } from "@/lib/api";

type Transaction = {
  id: string;
  type: "received" | "sent";
  amount: string;
  currency: string;
  createdAt: string;
  status: string;
};

const History = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiRequest<{ transactions: Transaction[] }>("/api/transactions")
      .then((data) => setTransactions(data.transactions ?? []))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Unable to load transactions."))
      .finally(() => setLoading(false));
  }, []);

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
            {loading ? (
              <p role="status">Loading transactions…</p>
            ) : error ? (
              <Card className="p-6"><p role="alert" className="text-red-700">{error}</p></Card>
            ) : transactions.length === 0 ? (
              <Card className="p-6"><p>No transactions are available for this account.</p></Card>
            ) : (
              <div className="space-y-4">
                {transactions.map((tx) => (
                  <Card key={tx.id} className="balance-card">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === "received" ? "bg-green-500" : "bg-primary"}`}>
                          {tx.type === "received" ? <ArrowDownLeft className="w-5 h-5 text-white" /> : <ArrowUpRight className="w-5 h-5 text-white" />}
                        </div>
                        <div>
                          <p className="font-medium">{tx.type === "received" ? "Received" : "Sent"} {tx.amount} {tx.currency}</p>
                          <p className="text-sm text-gray-600">{new Date(tx.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800">{tx.status}</span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default History;
