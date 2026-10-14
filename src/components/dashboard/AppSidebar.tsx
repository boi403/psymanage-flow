import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, Calendar, Wallet, BarChart3, Megaphone, Settings, Building2, LogOut, CreditCard, ShieldCheck } from "lucide-react";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useNavigate } from "react-router-dom";

const items = [
  { title: "Painel", url: "/dashboard", icon: LayoutDashboard, end: true },
  { title: "Clientes", url: "/dashboard/clientes", icon: Users },
  { title: "Agenda", url: "/dashboard/agenda", icon: Calendar },
  { title: "Financeiro", url: "/dashboard/financeiro", icon: Wallet },
  { title: "Relatórios", url: "/dashboard/relatorios", icon: BarChart3 },
  { title: "Marketing", url: "/dashboard/marketing", icon: Megaphone },
  { title: "Configuração", url: "/dashboard/configuracao", icon: Settings },
  { title: "Minha clínica", url: "/dashboard/clinica", icon: Building2 },
  { title: "Meu plano", url: "/dashboard/planos", icon: CreditCard },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();
  const { signOut } = useAuth();
  const { isAdmin } = useIsAdmin();
  const navigate = useNavigate();
  const menuItems = isAdmin ? [...items, { title: "Administração", url: "/dashboard/admin", icon: ShieldCheck }] : items;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2.5 px-2 py-2">
          <div className="w-9 h-9 rounded-[10px] gradient-primary flex items-center justify-center text-primary-foreground font-extrabold text-sm shrink-0">PM</div>
          {!collapsed && (
            <span className="text-base font-bold text-sidebar-foreground">
              Psico<span className="text-primary">Manager</span>
            </span>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const active = item.end ? pathname === item.url : pathname.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                      <NavLink to={item.url} end={item.end} className="flex items-center gap-3">
                        <item.icon className="h-4 w-4 shrink-0" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={async () => { await signOut(); navigate("/"); }} tooltip="Sair">
              <LogOut className="h-4 w-4" />
              <span>Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
