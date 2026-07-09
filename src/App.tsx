import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Analytics } from "@vercel/analytics/react";
import Index from "./pages/Index.tsx";
import WalletsPage from "./pages/WalletsPage.tsx";
import TradingPage from "./pages/TradingPage.tsx";
import PaymentsPage from "./pages/PaymentsPage.tsx";
import AIInsightsPage from "./pages/AIInsightsPage.tsx";
import LogsPage from "./pages/LogsPage.tsx";
import SettingsPage from "./pages/SettingsPage.tsx";
import AuthPage from "./pages/AuthPage.tsx";
import LiveBlocksPage from "./pages/LiveBlocksPage.tsx";
import AddressTxPage from "./pages/AddressTxPage.tsx";
import MetaCopierPage from "./pages/MetaCopierPage.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const protect = (el: React.ReactNode) => <ProtectedRoute>{el}</ProtectedRoute>;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/" element={protect(<Index />)} />
            <Route path="/wallets" element={protect(<WalletsPage />)} />
            <Route path="/trading" element={protect(<TradingPage />)} />
            <Route path="/payments" element={protect(<PaymentsPage />)} />
            <Route path="/ai-insights" element={protect(<AIInsightsPage />)} />
            <Route path="/logs" element={protect(<LogsPage />)} />
            <Route path="/blocks" element={protect(<LiveBlocksPage />)} />
            <Route path="/address-lookup" element={protect(<AddressTxPage />)} />
            <Route path="/metacopier" element={protect(<MetaCopierPage />)} />
            <Route path="/settings" element={protect(<SettingsPage />)} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
      <Analytics />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
