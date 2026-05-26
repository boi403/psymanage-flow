import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut, User as UserIcon } from "lucide-react";
import { toast } from "sonner";

interface Profile {
  full_name: string | null;
  crp: string | null;
  specialty: string | null;
  phone: string | null;
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("full_name, crp, specialty, phone").eq("id", user.id).maybeSingle()
      .then(({ data }) => setProfile(data));
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    toast.success("Você saiu da conta.");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <nav className="sticky top-0 z-50 bg-background border-b border-border h-[70px] flex items-center justify-between px-[5%]">
        <div className="flex items-center gap-2.5">
          <div className="w-[38px] h-[38px] rounded-[10px] gradient-primary flex items-center justify-center text-primary-foreground font-extrabold text-base">PM</div>
          <span className="text-lg font-bold">Psico<span className="text-primary">Manager</span></span>
        </div>
        <Button variant="ghost" size="sm" onClick={handleSignOut}>
          <LogOut className="w-4 h-4 mr-2" /> Sair
        </Button>
      </nav>

      <main className="max-w-6xl mx-auto px-[5%] py-10">
        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center text-primary-foreground">
              <UserIcon className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Olá, {profile?.full_name || "Psicólogo(a)"} 👋</h1>
              <p className="text-muted-foreground text-sm">{user?.email}</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mt-8">
            <InfoCard label="CRP" value={profile?.crp} />
            <InfoCard label="Especialidade" value={profile?.specialty} />
            <InfoCard label="Telefone" value={profile?.phone} />
            <InfoCard label="E-mail" value={user?.email} />
          </div>

          <div className="mt-10 p-6 bg-primary-light rounded-xl">
            <h2 className="font-bold text-foreground mb-2">🎉 Sua conta está pronta!</h2>
            <p className="text-sm text-muted-foreground">
              Em breve você terá acesso à agenda, pacientes, financeiro, prontuários e muito mais.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

const InfoCard = ({ label, value }: { label: string; value?: string | null }) => (
  <div className="border border-border rounded-lg p-4">
    <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">{label}</p>
    <p className="text-foreground font-medium mt-1">{value || "—"}</p>
  </div>
);

export default Dashboard;
