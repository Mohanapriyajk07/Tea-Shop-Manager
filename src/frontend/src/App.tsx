import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import {
  History as HistoryIcon,
  LayoutDashboard,
  LogOut,
  PlusCircle,
} from "lucide-react";
import { useState } from "react";
import { AddEntry } from "./components/AddEntry";
import { AuthScreen } from "./components/AuthScreen";
import { Dashboard } from "./components/Dashboard";
import { History } from "./components/History";
import { useShopInfo } from "./hooks/useQueries";

type Screen = "dashboard" | "add_entry" | "history";

const AUTH_KEY = "teashop_auth";

interface StoredAuth {
  mobileNumber: string;
  shopName: string;
}

export default function App() {
  const [auth, setAuth] = useState<StoredAuth | null>(() => {
    try {
      const stored = localStorage.getItem(AUTH_KEY);
      return stored ? (JSON.parse(stored) as StoredAuth) : null;
    } catch {
      return null;
    }
  });
  const [screen, setScreen] = useState<Screen>("dashboard");

  const { data: shopInfo } = useShopInfo();

  const shopName = shopInfo?.name || auth?.shopName || "My Tea Shop";

  const handleAuthSuccess = (mobileNumber: string, initialShopName: string) => {
    const stored: StoredAuth = { mobileNumber, shopName: initialShopName };
    localStorage.setItem(AUTH_KEY, JSON.stringify(stored));
    setAuth(stored);
    setScreen("dashboard");
  };

  const handleLogout = () => {
    localStorage.removeItem(AUTH_KEY);
    setAuth(null);
    setScreen("dashboard");
  };

  if (!auth) {
    return (
      <>
        <AuthScreen onAuthSuccess={handleAuthSuccess} />
        <Toaster position="top-center" />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl min-h-screen flex flex-col relative">
        {/* Header */}
        <header className="tea-gradient text-primary-foreground px-6 pt-4 pb-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🍵</span>
              <div>
                <h1 className="font-display font-bold text-lg leading-tight">
                  {shopName}
                </h1>
                <p className="text-[12px] text-primary-foreground/70">
                  {auth.mobileNumber}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-primary-foreground hover:bg-primary-foreground/20 h-9 w-9"
              data-ocid="nav.button"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto px-6 pt-6">
          {screen === "dashboard" && <Dashboard shopName={shopName} />}
          {screen === "add_entry" && <AddEntry />}
          {screen === "history" && <History />}
        </main>

        {/* Bottom Navigation */}
        <nav className="sticky bottom-0 bg-card border-t border-border px-4 pb-2 shadow-[0_-2px_12px_rgba(0,0,0,0.08)]">
          <div className="flex items-stretch max-w-xl mx-auto">
            <button
              type="button"
              onClick={() => setScreen("dashboard")}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-[12px] font-medium transition-colors ${
                screen === "dashboard"
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              data-ocid="nav.tab"
            >
              <LayoutDashboard
                className={`h-5 w-5 ${
                  screen === "dashboard"
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              />
              Dashboard
            </button>

            <button
              type="button"
              onClick={() => setScreen("add_entry")}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-[12px] font-medium transition-colors ${
                screen === "add_entry"
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              data-ocid="nav.tab"
            >
              <PlusCircle
                className={`h-5 w-5 ${
                  screen === "add_entry"
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              />
              Add Entry
            </button>

            <button
              type="button"
              onClick={() => setScreen("history")}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-[12px] font-medium transition-colors ${
                screen === "history"
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              data-ocid="nav.tab"
            >
              <HistoryIcon
                className={`h-5 w-5 ${
                  screen === "history"
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              />
              History
            </button>
          </div>
        </nav>
      </div>

      <Toaster position="top-center" />
    </div>
  );
}
