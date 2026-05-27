import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import PsicoIAWidget from "./PsicoIAWidget";

export default function DashboardLayout() {
  const { user } = useAuth();
  const initials = (user?.email ?? "U").slice(0, 2).toUpperCase();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-muted/30">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 bg-background border-b border-border flex items-center gap-3 px-4 sticky top-0 z-30">
            <SidebarTrigger />
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar cliente, sessão, pagamento..." className="pl-9 h-9 bg-muted/50 border-0" />
            </div>
            <div className="ml-auto flex items-center gap-3">
              <button className="relative w-9 h-9 rounded-lg hover:bg-muted flex items-center justify-center">
                <Bell className="w-4 h-4 text-muted-foreground" />
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-accent" />
              </button>
              <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                {initials}
              </div>
            </div>
          </header>
          <main className="flex-1 p-6 md:p-8 overflow-x-hidden">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
