import { Users, Search, Filter, UserPlus } from "lucide-react";

const patients = [
  { initials: "AC", name: "Ana Clara Mendes", sessions: 32, status: "Ativo", approach: "TCC", bg: "bg-primary" },
  { initials: "RS", name: "Roberto Silva", sessions: 18, status: "Ativo", approach: "Psicanálise", bg: "bg-indigo-500" },
  { initials: "FL", name: "Fernanda Lima", sessions: 24, status: "Ativo", approach: "Humanista", bg: "bg-rose-500" },
  { initials: "MT", name: "Marcos Torres", sessions: 12, status: "Em pausa", approach: "TCC", bg: "bg-amber-500" },
  { initials: "CP", name: "Carla Pereira", sessions: 45, status: "Ativo", approach: "Gestalt", bg: "bg-emerald-500" },
];

const PatientsSection = () => (
  <section className="py-20 px-[5%]">
    <div className="max-w-[1200px] mx-auto">
      <div className="mb-14 text-center">
        <div className="inline-flex items-center gap-1.5 text-primary text-[13px] font-bold uppercase tracking-wider mb-3">
          <span className="inline-block w-5 h-0.5 bg-primary rounded" />
          Área de Pacientes
        </div>
        <h2 className="text-3xl md:text-[38px] font-extrabold text-foreground leading-tight mb-3.5">
          Gerencie seus pacientes <span className="text-primary">com facilidade</span>
        </h2>
        <p className="text-[17px] text-muted-foreground leading-relaxed max-w-[560px] mx-auto">
          Cadastro completo, histórico de sessões, documentos e evolução terapêutica em um único lugar organizado.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient list mockup */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border shadow-brand overflow-hidden">
          <div className="gradient-primary px-5 py-3 flex items-center justify-between">
            <span className="text-primary-foreground font-semibold text-sm flex items-center gap-2">
              <Users className="w-4 h-4" /> Meus Pacientes
            </span>
            <div className="flex gap-2">
              <div className="bg-primary-foreground/20 rounded-md px-2.5 py-1 flex items-center gap-1.5 text-primary-foreground text-[11px]">
                <Search className="w-3 h-3" /> Buscar...
              </div>
              <div className="bg-primary-foreground/20 rounded-md px-2 py-1 text-primary-foreground">
                <Filter className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
          <div className="divide-y divide-border">
            {patients.map(p => (
              <div key={p.name} className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/50 transition-colors cursor-pointer">
                <div className={`w-9 h-9 rounded-full ${p.bg} flex items-center justify-center text-primary-foreground font-bold text-xs shrink-0`}>
                  {p.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-foreground">{p.name}</div>
                  <div className="text-[11px] text-muted-foreground">{p.sessions} sessões · {p.approach}</div>
                </div>
                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold ${p.status === "Ativo" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Side cards */}
        <div className="space-y-4">
          <div className="bg-card rounded-xl border border-border p-5 shadow-brand">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-primary-dark" />
              </div>
              <div>
                <div className="text-2xl font-extrabold text-foreground">47</div>
                <div className="text-[11px] text-muted-foreground">Pacientes ativos</div>
              </div>
            </div>
            <div className="space-y-2">
              {[
                { label: "Novos este mês", value: "+3" },
                { label: "Em pausa", value: "5" },
                { label: "Alta terapêutica", value: "12" },
              ].map(s => (
                <div key={s.label} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{s.label}</span>
                  <span className="font-bold text-foreground">{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-5 shadow-brand">
            <div className="text-sm font-bold text-foreground mb-3">Distribuição por Abordagem</div>
            {[
              { label: "TCC", pct: 45, color: "bg-primary" },
              { label: "Psicanálise", pct: 25, color: "bg-indigo-500" },
              { label: "Humanista", pct: 18, color: "bg-rose-400" },
              { label: "Gestalt", pct: 12, color: "bg-amber-400" },
            ].map(r => (
              <div key={r.label} className="mb-2">
                <div className="flex justify-between text-[11px] text-muted-foreground mb-0.5">
                  <span>{r.label}</span><span>{r.pct}%</span>
                </div>
                <div className="h-1.5 bg-border rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${r.color}`} style={{ width: `${r.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default PatientsSection;
