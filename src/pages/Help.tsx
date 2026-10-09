import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/api";

type Health = { ok: boolean; database: string; lunoConfigured: boolean };

const Help = () => {
  const [health, setHealth] = useState<Health | null>(null);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(true);

  const checkHealth = () => {
    setChecking(true);
    setError("");
    apiRequest<Health>("/api/health")
      .then(setHealth)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Could not reach the application server."))
      .finally(() => setChecking(false));
  };

  useEffect(() => { checkHealth(); }, []);

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Help & Service Status</h1>
          <p className="mt-2 text-gray-600">Check whether the live backend and required integrations are configured.</p>
        </div>
        <Card className="space-y-4 p-6">
          <h2 className="text-xl font-semibold">Live service checks</h2>
          {checking ? <p role="status">Checking backend and database…</p> : error ? <p role="alert" className="text-red-700">{error}</p> : (
            <dl className="space-y-3">
              <div className="flex items-center justify-between gap-4"><dt>Application API</dt><dd className={health?.ok ? "text-green-700 font-medium" : "text-red-700"}>{health?.ok ? "Connected" : "Unavailable"}</dd></div>
              <div className="flex items-center justify-between gap-4"><dt>Neon database</dt><dd className={health?.database === "connected" ? "text-green-700 font-medium" : "text-red-700"}>{health?.database === "connected" ? "Connected" : "Unavailable"}</dd></div>
              <div className="flex items-center justify-between gap-4"><dt>Luno API credentials</dt><dd className={health?.lunoConfigured ? "text-green-700 font-medium" : "text-amber-700"}>{health?.lunoConfigured ? "Configured" : "Not configured"}</dd></div>
            </dl>
          )}
          <Button onClick={checkHealth} disabled={checking} className="w-full">{checking ? "Checking…" : "Check again"}</Button>
        </Card>
        <Card className="space-y-3 p-6">
          <h2 className="text-xl font-semibold">Setup and troubleshooting</h2>
          <p className="text-gray-700">If a service is unavailable, check the server logs and verify the environment variables on the backend host. Live balances and transfers require valid Luno credentials with the appropriate permissions.</p>
          <p className="text-gray-700">For installation, Neon schema setup, and deployment instructions, read <code>DEPLOYMENT.md</code> in the GitHub repository.</p>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline"><a href="https://github.com/matomem/cryptoapp/blob/main/DEPLOYMENT.md" target="_blank" rel="noreferrer">Deployment guide</a></Button>
            <Button asChild><Link to="/user/welcome">Return to wallet</Link></Button>
          </div>
        </Card>
      </div>
    </main>
  );
};

export default Help;
