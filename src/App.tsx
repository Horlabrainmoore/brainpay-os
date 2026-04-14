import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import WalletsPage from "./pages/WalletsPage.tsx";
import TradingPage from "./pages/TradingPage.tsx";
import PaymentsPage from "./pages/PaymentsPage.tsx";
import AIInsightsPage from "./pages/AIInsightsPage.tsx";
import LogsPage from "./pages/LogsPage.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/wallets" element={<WalletsPage />} />
          <Route path="/trading" element={<TradingPage />} />
          <Route path="/payments" element={<PaymentsPage />} />
          <Route path="/ai-insights" element={<AIInsightsPage />} />
          <Route path="/logs" element={<LogsPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
