import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GraduationCap, Award, BookOpen, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type Course = { id: string; title: string; description: string; hours: number | null; level: string; price: number | null };

const SpecializationsSection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["public-courses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("courses" as any).select("*").eq("status", "aprovado").order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Course[];
    },
  });

  // Reflects which of these courses the logged-in user already registered
  // interest in, so the button shows the right state on page load too.
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

  const register = useMutation({
    mutationFn: async (courseId: string) => {
      const { error } = await supabase.from("course_interest" as any).insert({ course_id: courseId });
      // 23505 = unique_violation: already registered -- not a real error.
      if (error && (error as any).code !== "23505") throw error;
      return { alreadyRegistered: (error as any)?.code === "23505" };
    },
    onSuccess: (res, courseId) => {
      qc.setQueryData<string[]>(["my-course-interest", user?.id], (prev = []) => (prev.includes(courseId) ? prev : [...prev, courseId]));
      toast.success(res.alreadyRegistered ? "Você já estava na lista de espera deste curso." : "Você entrou na lista de espera! Avisaremos quando o curso estiver disponível.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleClick = (course: Course) => {
    if (!user) return navigate(`/auth?curso=${encodeURIComponent(course.id)}`);
    if (interested.has(course.id)) return;
    register.mutate(course.id);
  };

  return (
    <section className="bg-muted py-20 px-[5%]">
      <div className="max-w-[1200px] mx-auto">
        <div className="mb-14 text-center">
          <div className="inline-flex items-center gap-1.5 text-primary text-[13px] font-bold uppercase tracking-wider mb-3">
            <span className="inline-block w-5 h-0.5 bg-primary rounded" />
            Especializações
          </div>
          <h2 className="text-3xl md:text-[38px] font-extrabold text-foreground leading-tight mb-3.5">
            Aprenda com os <span className="text-primary">melhores profissionais</span>
          </h2>
          <p className="text-[17px] text-muted-foreground leading-relaxed max-w-[560px] mx-auto">
            Cursos e especializações propostos por profissionais da plataforma, revisados antes de publicação.
          </p>
        </div>

        {/* Certificate highlight */}
        <div className="bg-card rounded-xl border border-border p-8 mb-10 flex flex-col md:flex-row items-center gap-8 shadow-brand">
          <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center shrink-0">
            <Award className="w-10 h-10 text-primary-foreground" />
          </div>
          <div className="text-center md:text-left flex-1">
            <h3 className="text-xl font-extrabold text-foreground mb-2">Certificado de Conclusão com Verificação</h3>
            <p className="text-muted-foreground leading-relaxed">
              Ao concluir um curso, você recebe um certificado de conclusão da plataforma com um código para verificar sua autenticidade online.
            </p>
          </div>
          <div className="flex gap-6 shrink-0">
            {[
              { icon: GraduationCap, label: `${courses.length} ${courses.length === 1 ? "curso" : "cursos"}` },
              { icon: BookOpen, label: "Certificados" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="text-center">
                <Icon className="w-6 h-6 text-primary mx-auto mb-1" />
                <div className="text-[11px] font-semibold text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Course grid */}
        {!isLoading && courses.length === 0 && (
          <div className="bg-card rounded-xl border border-border p-10 text-center text-muted-foreground">
            Em breve: novos cursos sendo preparados.
          </div>
        )}
        {courses.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((c) => {
              const isInterested = interested.has(c.id);
              const isPending = register.isPending && register.variables === c.id;
              return (
                <div key={c.id} className="bg-card rounded-xl border border-border p-6 hover:-translate-y-1 hover:shadow-brand-lg hover:border-primary transition-all">
                  <div className="w-12 h-12 rounded-[14px] bg-primary/10 flex items-center justify-center mb-4">
                    <GraduationCap className="w-6 h-6 text-primary-dark" />
                  </div>
                  <h4 className="text-base font-bold text-foreground mb-1.5">{c.title}</h4>
                  <p className="text-[13px] text-muted-foreground mb-4 line-clamp-3">{c.description}</p>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground mb-4 flex-wrap">
                    {c.hours != null && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {c.hours}h</span>}
                    <span className="px-2 py-0.5 rounded-full bg-primary-light text-primary-dark font-semibold">{c.level}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-muted-foreground">Gratuito por enquanto</span>
                    <button
                      type="button"
                      disabled={isInterested || isPending}
                      onClick={() => handleClick(c)}
                      className={`px-4 py-2 rounded-lg text-[13px] font-bold transition-all shrink-0 ${isInterested ? "bg-muted text-muted-foreground cursor-default" : "gradient-primary text-primary-foreground hover:-translate-y-0.5"}`}
                    >
                      {isInterested ? "Já na lista de espera" : isPending ? "Enviando..." : "Entrar na lista de espera"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default SpecializationsSection;
