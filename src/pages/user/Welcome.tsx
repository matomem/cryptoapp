import { useEffect, useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Card } from "@/components/ui/card";
import { apiRequest } from "@/lib/api";

type WalletSummary = {
  bitcoinBalance: string | null;
  zarBalance: string | null;
  provider: string | null;
};

const Welcome = () => {
  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiRequest<WalletSummary>("/api/wallet/summary")
      .then(setWallet)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Wallet data is unavailable."))
      .finally(() => setLoading(false));
  }, []);

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
            {error && <Card className="p-4 mb-6"><p role="alert" className="text-red-700">{error}</p></Card>}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="balance-card p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#F7931A] rounded-full flex items-center justify-center text-white font-bold">₿</div>
                  <div>
                    <p className="text-sm text-gray-600">Bitcoin Balance</p>
                    <p className="text-2xl font-bold">{loading ? "Loading…" : wallet?.bitcoinBalance == null ? "Not connected" : `${wallet.bitcoinBalance} BTC`}</p>
                  </div>
                </div>
              </Card>
              <Card className="balance-card p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center border border-gray-200 font-semibold">ZAR</div>
                  <div>
                    <p className="text-sm text-gray-600">ZAR Balance</p>
                    <p className="text-2xl font-bold">{loading ? "Loading…" : wallet?.zarBalance == null ? "Not connected" : `R ${wallet.zarBalance}`}</p>
                  </div>
                </div>
              </Card>
            </div>
            {wallet?.provider && <p className="mt-4 text-sm text-gray-500">Balance provider: {wallet.provider}</p>}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Welcome;
