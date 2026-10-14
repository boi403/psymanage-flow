import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import GoogleCalendarReturn from "@/pages/GoogleCalendarReturn";
import ProtectedRoute from "@/components/ProtectedRoute";
import ErrorBoundary from "@/components/ErrorBoundary";
import Index from "./pages/Index.tsx";
import Auth from "./pages/Auth.tsx";
import NotFound from "./pages/NotFound.tsx";
import DashboardLayout from "./components/dashboard/DashboardLayout";
import Painel from "./pages/dashboard/Painel";
import Clientes from "./pages/dashboard/Clientes";
import Agenda from "./pages/dashboard/Agenda";
import Financeiro from "./pages/dashboard/Financeiro";
import Relatorios from "./pages/dashboard/Relatorios";
import Marketing from "./pages/dashboard/Marketing";
import Configuracao from "./pages/dashboard/Configuracao";
import MinhaClinica from "./pages/dashboard/MinhaClinica";
import Agendar from "./pages/Agendar";
import Privacidade from "./pages/Privacidade";
import SalaVirtual from "./pages/dashboard/SalaVirtual";
import Planos from "./pages/dashboard/Planos";
import Admin from "./pages/dashboard/Admin";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/agendar/:userId" element={<Agendar />} />
              <Route path="/privacidade" element={<Privacidade />} />
              <Route path="/oauth/google-calendar/return/:state" element={<ProtectedRoute><GoogleCalendarReturn /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                <Route index element={<Painel />} />
                <Route path="clientes" element={<Clientes />} />
                <Route path="agenda" element={<Agenda />} />
                <Route path="sala/:id" element={<SalaVirtual />} />
                <Route path="financeiro" element={<Financeiro />} />
                <Route path="relatorios" element={<Relatorios />} />
                <Route path="marketing" element={<Marketing />} />
                <Route path="configuracao" element={<Configuracao />} />
                <Route path="clinica" element={<MinhaClinica />} />
                <Route path="planos" element={<Planos />} />
                <Route path="admin" element={<Admin />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ErrorBoundary>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
