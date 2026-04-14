import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export function DashboardLayout({ children, title, subtitle }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b border-border px-4 shrink-0 glass">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <div>
                <h2 className="text-sm font-semibold text-foreground">{title}</h2>
                {subtitle && <p className="text-[11px] text-muted-foreground">{subtitle}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary text-xs font-mono">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse-glow" />
                <span className="text-muted-foreground">System</span>
                <span className="text-primary">Online</span>
              </div>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary" />
              </Button>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
