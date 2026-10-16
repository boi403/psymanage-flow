import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Clock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type Course = { id: string; instructor_id: string; title: string; description: string; hours: number | null; level: string; price: number | null; status: string; created_at: string };
const LEVELS = ["Básico", "Intermediário", "Avançado"];
const empty = { title: "", description: "", hours: "", level: "Básico" };
const STATUS_STYLE: Record<string, string> = {
  pendente: "bg-amber-100 text-amber-800",
  aprovado: "bg-emerald-100 text-emerald-800",
  rejeitado: "bg-red-100 text-red-800",
};

export default function Cursos() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [params, setParams] = useSearchParams();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const cursoParam = params.get("curso");
  const handledDeepLink = useRef(false);

  const { data: courses = [] } = useQuery({
    queryKey: ["public-courses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("courses" as any).select("*").eq("status", "aprovado").order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Course[];
    },
  });

  const { data: myInterestIds = [] } = useQuery({
    queryKey: ["my-course-interest", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("course_interest" as any).select("course_id").eq("user_id", user!.id);
      if (error) throw error;
      return (data ?? []).map((r: any) => r.course_id as string);
    },
  });
  const interested = useMemo(() => new Set(myInterestIds), [myInterestIds]);

  const { data: myCourses = [] } = useQuery({
    queryKey: ["my-courses", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("courses" as any).select("*").eq("instructor_id", user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Course[];
    },
  });

  const register = useMutation({
    mutationFn: async (courseId: string) => {
      const { error } = await supabase.from("course_interest" as any).insert({ course_id: courseId });
      if (error && (error as any).code !== "23505") throw error;
      return { alreadyRegistered: (error as any)?.code === "23505" };
    },
    onSuccess: (res, courseId) => {
      qc.setQueryData<string[]>(["my-course-interest", user?.id], (prev = []) => (prev.includes(courseId) ? prev : [...prev, courseId]));
      toast.success(res.alreadyRegistered ? "Você já estava na lista de espera deste curso." : "Você entrou na lista de espera! Avisaremos quando o curso estiver disponível.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const propose = useMutation({
    mutationFn: async () => {
      if (!form.title.trim()) throw new Error("Título é obrigatório");
      const payload = { title: form.title, description: form.description, hours: form.hours ? Number(form.hours) : null, level: form.level };
      const { error } = await supabase.from("courses" as any).insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-courses", user?.id] });
      setOpen(false);
      setForm(empty);
      toast.success("Curso proposto! Ele ficará pendente de revisão e só aparecerá publicamente após a aprovação de um administrador.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Deep link from the landing page / Auth.tsx: ?curso=<id> means the user
  // picked this course before logging in. Register interest once, then
  // clear the param so a refresh doesn't re-trigger it.
  useEffect(() => {
    if (!cursoParam || !user || handledDeepLink.current) return;
    handledDeepLink.current = true;
    (async () => {
      const { error } = await supabase.from("course_interest" as any).insert({ course_id: cursoParam });
      if (error && (error as any).code !== "23505") {
        toast.error("Não foi possível registrar seu interesse neste curso.");
      } else {
        qc.setQueryData<string[]>(["my-course-interest", user.id], (prev = []) => (prev.includes(cursoParam) ? prev : [...prev, cursoParam]));
        toast.success((error as any)?.code === "23505" ? "Você já estava na lista de espera deste curso." : "Você entrou na lista de espera! Avisaremos quando o curso estiver disponível.");
      }
      setParams({}, { replace: true });
    })();
  }, [cursoParam, user, qc, setParams]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cursos</h1>
          <p className="text-muted-foreground text-sm mt-1">Explore especializações ou proponha a sua.</p>
        </div>
        <Button onClick={() => setOpen(true)} className="gradient-primary text-primary-foreground"><Plus className="w-4 h-4 mr-2" /> Propor um curso</Button>
      </div>

      <div className="bg-card border border-border rounded-2xl">
        <h2 className="font-bold p-4 border-b border-border text-foreground">Meus cursos propostos</h2>
        {myCourses.length === 0 && <p className="p-6 text-center text-muted-foreground text-sm">Você ainda não propôs nenhum curso.</p>}
        {myCourses.map((c) => (
          <div key={c.id} className="flex items-center justify-between gap-3 p-4 border-b border-border last:border-0 flex-wrap">
            <div>
              <p className="font-semibold text-foreground">{c.title}</p>
              <p className="text-xs text-muted-foreground">{c.level}{c.hours != null && ` · ${c.hours}h`}</p>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${STATUS_STYLE[c.status] ?? "bg-muted text-muted-foreground"}`}>{c.status}</span>
          </div>
        ))}
      </div>

      <div>
        <h2 className="font-bold text-foreground mb-3">Cursos disponíveis</h2>
        {courses.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border p-10 text-center text-muted-foreground">Em breve: novos cursos sendo preparados.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((c) => {
              const isInterested = interested.has(c.id);
              const isPending = register.isPending && register.variables === c.id;
              return (
                <div key={c.id} className="bg-card border border-border rounded-2xl p-5">
                  <h3 className="font-bold text-foreground mb-1.5">{c.title}</h3>
                  <p className="text-[13px] text-muted-foreground mb-3 line-clamp-3">{c.description}</p>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground mb-4 flex-wrap">
                    {c.hours != null && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {c.hours}h</span>}
                    <span className="px-2 py-0.5 rounded-full bg-primary-light text-primary-dark font-semibold">{c.level}</span>
                  </div>
                  <Button
                    size="sm"
                    disabled={isInterested || isPending}
                    onClick={() => register.mutate(c.id)}
                    className={isInterested ? "w-full bg-muted text-muted-foreground" : "w-full gradient-primary text-primary-foreground"}
                  >
                    {isInterested ? "Já na lista de espera" : isPending ? "Enviando..." : "Entrar na lista de espera"}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Propor um curso</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Título *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>Descrição</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Carga horária (h)</Label><Input type="number" min={0} value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} /></div>
              <div>
                <Label>Nível</Label>
                <Select value={form.level} onValueChange={(v) => setForm({ ...form, level: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">O curso ficará pendente até a revisão de um administrador e só aparecerá publicamente após a aprovação.</p>
          </div>
          <DialogFooter>
            <Button disabled={!form.title.trim() || propose.isPending} onClick={() => propose.mutate()} className="gradient-primary text-primary-foreground">Enviar para revisão</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
