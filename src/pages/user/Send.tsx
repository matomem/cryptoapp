import { useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowUpRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api";

const Send = () => {
  const navigate = useNavigate();
  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("BTC");
  const [submitting, setSubmitting] = useState(false);

  const handleSend = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsedAmount = Number(amount);
    if (!address.trim() || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      toast.error("Enter a valid recipient address and amount.");
      return;
    }

    const confirmed = window.confirm(
      `You are requesting a transfer of ${parsedAmount} ${currency} to ${address.trim()}. Continue only if you have verified the recipient and network.`,
    );
    if (!confirmed) return;

    setSubmitting(true);
    try {
      const result = await apiRequest<{ message?: string }>("/api/transfers", {
        method: "POST",
        body: JSON.stringify({ recipientAddress: address.trim(), amount: String(parsedAmount), currency }),
      });
      toast.success(result.message || "Transfer request accepted by the service.");
      setAddress("");
      setAmount("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Transfer was not submitted.");
    } finally {
      setSubmitting(false);
    }
  };

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
              <form onSubmit={handleSend} className="p-6 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                    <ArrowUpRight className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Send Funds</h2>
                    <p className="text-sm text-gray-600">Submit a transfer through the configured wallet provider</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="currency" className="text-sm font-medium block">Asset</label>
                  <select id="currency" value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="BTC">Bitcoin (BTC)</option>
                    <option value="ZAR">South African Rand (ZAR)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="recipient" className="text-sm font-medium block">Recipient Address / Destination</label>
                  <Input id="recipient" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Enter verified destination" autoComplete="off" required />
                </div>
                <div className="space-y-2">
                  <label htmlFor="amount" className="text-sm font-medium block">Amount</label>
                  <Input id="amount" type="number" min="0.00000001" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" required />
                </div>
                <p className="text-sm text-amber-800">Transfers require a configured backend and an authorized provider account. Never share API secrets in this page.</p>
                <Button type="submit" disabled={submitting} className="w-full bg-primary hover:bg-primary/90">
                  {submitting ? "Submitting…" : "Request Transfer"}
                </Button>
                <Button type="button" variant="outline" className="w-full" onClick={() => navigate("/user/send-receive")}>Cancel</Button>
              </form>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Send;
