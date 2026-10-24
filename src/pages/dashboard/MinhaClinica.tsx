import { Edit, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { brl, dateBR } from "@/lib/format";

export default function MinhaClinica() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [pwOpen, setPwOpen] = useState(false);
  const [pwForm, setPwForm] = useState({ password: "", confirm: "" });
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: "", phone: "", crp: "", specialty: "", city: "" });

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => setProfile(data));
  }, [user]);

  const openEdit = () => {
    setEditForm({
      full_name: profile?.full_name ?? "",
      phone: profile?.phone ?? "",
      crp: profile?.crp ?? "",
      specialty: profile?.specialty ?? "",
      city: profile?.city ?? "",
    });
    setEditOpen(true);
  };

  const saveProfile = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("profiles").update(editForm).eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      setProfile((p: any) => ({ ...p, ...editForm }));
      setEditOpen(false);
      toast.success("Perfil atualizado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const { data: subscription } = useQuery({
    queryKey: ["minha-clinica-subscription", user?.id],
    enabled: !!user,
    queryFn: async () =>
      (await supabase.from("subscriptions").select("*").order("created_at", { ascending: false }).limit(1).maybeSingle()).data,
  });

  const changePassword = useMutation({
    mutationFn: async () => {
      if (pwForm.password.length < 6) throw new Error("A senha precisa ter pelo menos 6 caracteres");
      if (pwForm.password !== pwForm.confirm) throw new Error("As senhas não coincidem");
      const { error } = await supabase.auth.updateUser({ password: pwForm.password });
      if (error) throw error;
    },
    onSuccess: () => { setPwOpen(false); setPwForm({ password: "", confirm: "" }); toast.success("Senha alterada com sucesso"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const initials = (profile?.full_name ?? user?.email ?? "U").split(" ").map((x: string) => x[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Minha clínica</h1>
        <p className="text-muted-foreground text-sm mt-1">Dados profissionais e da clínica</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="font-bold text-foreground mb-5">👤 Perfil do profissional</h3>
          <div className="flex items-start gap-4 mb-5">
            <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-xl font-bold">
              {initials}
            </div>
            <div className="flex-1">
              <p className="text-xs uppercase text-muted-foreground font-semibold">Nome Completo</p>
              <p className="font-bold text-foreground">{profile?.full_name || "—"}</p>
              <p className="text-xs uppercase text-muted-foreground font-semibold mt-3">Telefone</p>
              <p className="font-medium text-foreground">{profile?.phone || "—"}</p>
              <p className="text-xs uppercase text-muted-foreground font-semibold mt-3">CRP</p>
              <p className="font-medium text-foreground">{profile?.crp || "—"}</p>
              <p className="text-xs uppercase text-muted-foreground font-semibold mt-3">Especialidade</p>
              <p className="font-medium text-foreground">{profile?.specialty || "—"}</p>
            </div>
          </div>
          <Button onClick={openEdit} className="w-full gradient-primary text-primary-foreground"><Edit className="w-4 h-4 mr-2" /> Editar</Button>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="font-bold text-foreground mb-5">🏢 Dados da clínica</h3>
          <p className="text-xs text-primary bg-primary-light p-3 rounded-lg mb-4">
            As informações inseridas aqui são utilizadas para a emissão de notas fiscais.
          </p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              ["Tipo de Pessoa", "Pessoa Física"],
              ["Cidade", profile?.city || "—"],
            ].map(([l, v]) => (
              <div key={l}>
                <p className="text-xs uppercase text-muted-foreground font-semibold">{l}</p>
                <p className="font-medium text-foreground">{v}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            CNPJ e endereço comercial completo ainda não são suportados — essas colunas não existem no banco de dados atual.
            Avise se precisar emitir notas fiscais como Pessoa Jurídica para eu criar a migration correspondente.
          </p>
          <Button onClick={openEdit} className="w-full mt-5 gradient-primary text-primary-foreground"><Edit className="w-4 h-4 mr-2" /> Editar cidade</Button>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="font-bold text-foreground mb-5">🔒 Conta</h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs uppercase text-muted-foreground font-semibold">E-mail</p>
              <p className="font-medium text-foreground">{user?.email}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground font-semibold">Conta ativa desde</p>
              <p className="font-medium text-foreground">{user?.created_at ? new Date(user.created_at).toLocaleDateString("pt-BR") : "—"}</p>
            </div>
          </div>
          <Button variant="outline" className="w-full mt-5" onClick={() => setPwOpen(true)}><Lock className="w-4 h-4 mr-2" /> Alterar senha</Button>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="font-bold text-foreground mb-5">💎 Meu plano</h3>
          <div className="gradient-primary rounded-xl p-5 text-primary-foreground mb-4">
            <p className="text-xs uppercase font-bold opacity-80">Plano atual</p>
            <p className="text-2xl font-bold mt-1">{subscription?.plan ?? "Nenhum plano"}</p>
            <p className="text-sm opacity-90 mt-1">
              {subscription
                ? subscription.status === "trial" && subscription.trial_ends_at
                  ? `Período de teste até ${dateBR(subscription.trial_ends_at)}`
                  : `${brl(subscription.price)}/mês · status ${subscription.status}`
                : "Escolha um plano para começar"}
            </p>
          </div>
          <Button asChild className="w-full gradient-primary text-primary-foreground">
            <Link to="/dashboard/planos">{subscription ? "Gerenciar plano" : "Assinar PsicoManager agora"}</Link>
          </Button>
        </div>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar perfil</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome completo</Label><Input value={editForm.full_name} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} /></div>
            <div><Label>Telefone</Label><Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} /></div>
            <div><Label>CRP</Label><Input value={editForm.crp} onChange={(e) => setEditForm({ ...editForm, crp: e.target.value })} /></div>
            <div><Label>Especialidade</Label><Input value={editForm.specialty} onChange={(e) => setEditForm({ ...editForm, specialty: e.target.value })} /></div>
            <div><Label>Cidade</Label><Input value={editForm.city} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button disabled={saveProfile.isPending} onClick={() => saveProfile.mutate()} className="gradient-primary text-primary-foreground">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={pwOpen} onOpenChange={setPwOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Alterar senha</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nova senha</Label><Input type="password" value={pwForm.password} onChange={(e) => setPwForm({ ...pwForm, password: e.target.value })} /></div>
            <div><Label>Confirmar nova senha</Label><Input type="password" value={pwForm.confirm} onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button disabled={!pwForm.password || !pwForm.confirm || changePassword.isPending} onClick={() => changePassword.mutate()} className="gradient-primary text-primary-foreground">Salvar nova senha</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
