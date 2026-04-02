import { useState } from "react";
import { Calendar, FileText, DollarSign, Video, BarChart3, Landmark } from "lucide-react";

const tabs = [
  { id: "agenda", label: "Agenda Online", icon: Calendar },
  { id: "prontuario", label: "Prontuário", icon: FileText },
  { id: "financeiro", label: "Financeiro", icon: DollarSign },
  { id: "sala", label: "Sala Virtual", icon: Video },
  { id: "relatorios", label: "Relatórios", icon: BarChart3 },
  { id: "psicobank", label: "PsicoBank", icon: Landmark },
];

const features: Record<string, { title: string; desc: string; items: { title: string; desc: string }[] }> = {
  agenda: {
    title: "Agenda Online Inteligente",
    desc: "Diga adeus às planilhas e papel. Organize todos os seus atendimentos com facilidade e receba confirmações automáticas dos pacientes.",
    items: [
      { title: "Autoagendamento pelo paciente", desc: "Pacientes agendam diretamente pelo link público, 24h por dia." },
      { title: "Lembretes automáticos por WhatsApp e e-mail", desc: "Reduza faltas em até 80% com notificações automáticas." },
      { title: "Bloqueio de horários e recorrência", desc: "Configure sessões recorrentes e bloqueie folgas facilmente." },
      { title: "Integração com Google Calendar", desc: "Sincronize com sua agenda pessoal." },
      { title: "Visão diária, semanal e mensal", desc: "Visualize sua agenda da forma que preferir." },
    ],
  },
  prontuario: {
    title: "Prontuário Eletrônico Completo",
    desc: "Em conformidade com o CFP e LGPD. Centralize todo o histórico do paciente de forma organizada e segura.",
    items: [
      { title: "Anotações em linha do tempo", desc: "Acompanhe a evolução do paciente sessão por sessão." },
      { title: "Formulários de anamnese customizáveis", desc: "Adapte fichas à sua abordagem terapêutica." },
      { title: "Anotações por áudio com transcrição", desc: "Grave notas e o sistema transcreve automaticamente." },
      { title: "Laudos, relatórios e pareceres", desc: "Gere documentos conforme resolução do CFP." },
      { title: "Diário de Emoções do paciente", desc: "Pacientes registram estado emocional direto no prontuário." },
    ],
  },
  financeiro: {
    title: "Controle Financeiro Integrado",
    desc: "Gerencie receitas, despesas e inadimplências diretamente na plataforma.",
    items: [
      { title: "Cobrança automática por PIX, boleto e cartão", desc: "Cobra automaticamente após cada sessão." },
      { title: "Controle de inadimplência", desc: "Visualize pendências e envie cobranças com um clique." },
      { title: "Emissão de recibos", desc: "Gere e envie recibos automaticamente." },
      { title: "Relatórios financeiros detalhados", desc: "Acompanhe receita, despesa e lucro por período." },
      { title: "Integração bancária", desc: "Conecte sua conta e reconcilie pagamentos." },
    ],
  },
  sala: {
    title: "Sala Virtual Integrada",
    desc: "Atenda online com segurança e praticidade, sem instalar nenhum software.",
    items: [
      { title: "Videochamada criptografada", desc: "Atendimento online seguro conforme LGPD." },
      { title: "Compartilhamento de tela", desc: "Apresente materiais e exercícios durante a sessão." },
      { title: "Chat integrado", desc: "Troque mensagens com o paciente durante o atendimento." },
      { title: "Gravação de sessão", desc: "Grave com consentimento para revisão posterior." },
      { title: "Link personalizado", desc: "Cada profissional tem sua sala virtual exclusiva." },
    ],
  },
  relatorios: {
    title: "Relatórios e Analytics",
    desc: "Dashboards e relatórios completos para tomar decisões baseadas em dados reais do seu consultório.",
    items: [
      { title: "Dashboard de indicadores", desc: "Visualize KPIs como taxa de ocupação, receita e retenção." },
      { title: "Relatório de sessões por período", desc: "Filtre por data, profissional, tipo e status." },
      { title: "Análise de inadimplência", desc: "Identifique padrões e reduza perdas financeiras." },
      { title: "Relatório de evolução do paciente", desc: "Gere relatórios de progresso para compartilhar." },
      { title: "Exportação em PDF e Excel", desc: "Exporte todos os relatórios nos formatos que preferir." },
    ],
  },
  psicobank: {
    title: "PsicoBank – Conta Digital",
    desc: "Conta digital integrada para receber seus pagamentos sem burocracia.",
    items: [
      { title: "Receba por PIX instantaneamente", desc: "Chave PIX integrada para recebimentos imediatos." },
      { title: "Extrato em tempo real", desc: "Acompanhe todas as movimentações na plataforma." },
      { title: "Transferências facilitadas", desc: "Transfira para qualquer banco sem custo." },
      { title: "Split de pagamento para clínicas", desc: "Divida automaticamente entre profissionais." },
      { title: "Sem mensalidade", desc: "Conta gratuita para usuários do PsicoManager." },
    ],
  },
};

const FeaturesSection = () => {
  const [active, setActive] = useState("agenda");
  const feat = features[active];

  return (
    <section id="funcionalidades" className="bg-muted py-20 px-[5%]">
      <div className="max-w-[1200px] mx-auto">
        <div className="mb-14">
          <div className="inline-flex items-center gap-1.5 text-primary text-[13px] font-bold uppercase tracking-wider mb-3">
            <span className="inline-block w-5 h-0.5 bg-primary rounded" />
            Funcionalidades
          </div>
          <h2 className="text-3xl md:text-[38px] font-extrabold text-foreground leading-tight mb-3.5">
            Tudo que você precisa <span className="text-primary">em um só lugar</span>
          </h2>
          <p className="text-[17px] text-muted-foreground leading-relaxed max-w-[560px]">
            Do agendamento ao financeiro, o PsicoManager cobre todas as necessidades do seu consultório ou clínica.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 flex-wrap mb-10">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActive(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-[10px] border-[1.5px] text-sm font-semibold transition-all cursor-pointer ${
                  active === tab.id
                    ? "bg-primary border-primary text-primary-foreground"
                    : "bg-card border-border text-muted-foreground hover:border-primary hover:text-primary"
                }`}
              >
                <Icon className="w-[18px] h-[18px]" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h3 className="text-2xl font-extrabold text-foreground mb-3">{feat.title}</h3>
            <p className="text-muted-foreground mb-6 leading-relaxed">{feat.desc}</p>
            <ul className="space-y-0">
              {feat.items.map((item) => (
                <li key={item.title} className="flex items-start gap-3 py-3.5 border-b border-border last:border-b-0 text-[15px] text-muted-foreground">
                  <div className="w-[22px] h-[22px] rounded-full bg-primary-light flex items-center justify-center shrink-0 mt-0.5 text-primary-dark text-xs font-extrabold">
                    ✓
                  </div>
                  <div>
                    <span className="font-bold text-foreground block mb-0.5">{item.title}</span>
                    {item.desc}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-card rounded-xl p-7 border border-border shadow-brand">
            <FeatureMockup tab={active} />
          </div>
        </div>
      </div>
    </section>
  );
};

const FeatureMockup = ({ tab }: { tab: string }) => {
  if (tab === "agenda") return <AgendaMockup />;
  if (tab === "prontuario") return <ProntuarioMockup />;
  if (tab === "financeiro") return <FinanceiroMockup />;
  if (tab === "relatorios") return <RelatoriosMockup />;
  return <GenericMockup tab={tab} />;
};

const AgendaMockup = () => (
  <div className="rounded-[10px] overflow-hidden border border-border">
    <div className="bg-muted px-3.5 py-2.5 flex items-center gap-1.5 border-b border-border">
      <div className="w-2 h-2 rounded-full bg-destructive/50" />
      <div className="w-2 h-2 rounded-full bg-amber-400/50" />
      <div className="w-2 h-2 rounded-full bg-emerald-400/50" />
      <span className="text-[11px] text-muted-foreground ml-2">Agenda – Abril 2025</span>
    </div>
    <div className="p-4">
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm font-bold text-foreground">Abril 2025</span>
        <div className="flex gap-1 text-muted-foreground text-xs">
          <span className="cursor-pointer">◂</span>
          <span className="cursor-pointer">▸</span>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-4">
        {["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"].map(d => (
          <div key={d} className="text-[9px] font-bold text-muted-foreground text-center py-1">{d}</div>
        ))}
        {Array.from({ length: 17 }, (_, i) => i + 1).map(d => (
          <div key={d} className={`text-[11px] text-center py-1.5 rounded-md cursor-pointer hover:bg-primary-light ${d === 2 ? "bg-primary text-primary-foreground font-bold rounded-full" : ""}`}>
            {d}
          </div>
        ))}
      </div>
      <div className="space-y-1.5">
        {[
          { name: "Ana Clara Mendes", time: "08:00 – 09:00 · Online", color: "bg-primary", badge: "Confirmado", badgeClass: "bg-emerald-50 text-emerald-700" },
          { name: "Roberto Silva", time: "09:30 – 10:30 · Presencial", color: "bg-accent", badge: "Aguardando", badgeClass: "bg-amber-50 text-amber-700" },
          { name: "Fernanda Lima", time: "11:00 – 12:00 · Online", color: "bg-primary", badge: "Confirmado", badgeClass: "bg-emerald-50 text-emerald-700" },
        ].map(s => (
          <div key={s.name} className="flex items-center gap-2 p-2.5 rounded-lg bg-muted border border-border">
            <div className={`w-1 h-9 rounded-sm shrink-0 ${s.color}`} />
            <div className="flex-1">
              <div className="text-[11px] font-bold text-foreground">{s.name}</div>
              <div className="text-[10px] text-muted-foreground">{s.time}</div>
            </div>
            <span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold ${s.badgeClass}`}>{s.badge}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const ProntuarioMockup = () => (
  <div>
    <div className="flex items-center gap-3 pb-3 border-b border-border mb-3">
      <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-extrabold text-sm">FC</div>
      <div>
        <div className="text-sm font-bold text-foreground">Fernanda Costa</div>
        <div className="text-[11px] text-muted-foreground">Paciente desde Jan/2024 · 28 sessões</div>
      </div>
    </div>
    <div className="flex gap-1 mb-4">
      <span className="text-[9px] px-2 py-0.5 rounded-full font-semibold bg-primary-light text-primary-dark">TCC</span>
      <span className="text-[9px] px-2 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-700">Ativo</span>
    </div>
    <div className="text-xs font-bold text-muted-foreground mb-3">Linha do tempo</div>
    {[
      { date: "02 Abr 2025 · Sessão 28", note: "Paciente relatou melhora significativa nos episódios de ansiedade.", tags: ["Ansiedade", "Progresso"] },
      { date: "26 Mar 2025 · Sessão 27", note: "Discussão sobre pensamentos automáticos negativos no trabalho.", tags: ["Pensamentos"] },
    ].map(t => (
      <div key={t.date} className="flex gap-2.5 mb-3">
        <div className="flex flex-col items-center">
          <div className="w-2.5 h-2.5 rounded-full bg-primary shrink-0 mt-1" />
          <div className="w-0.5 flex-1 bg-border mt-0.5" />
        </div>
        <div className="flex-1">
          <div className="text-[10px] text-muted-foreground font-semibold mb-1">{t.date}</div>
          <div className="bg-muted rounded-lg p-2.5 text-[11px] text-muted-foreground border border-border leading-relaxed">{t.note}</div>
          <div className="flex gap-1 mt-1.5">
            {t.tags.map(tag => (
              <span key={tag} className="text-[9px] px-2 py-0.5 rounded-full font-semibold bg-primary-light text-primary-dark">{tag}</span>
            ))}
          </div>
        </div>
      </div>
    ))}
  </div>
);

const FinanceiroMockup = () => (
  <div>
    <div className="grid grid-cols-2 gap-2 mb-3">
      {[
        { label: "Receita", value: "R$ 12.400", cls: "bg-emerald-50 border-emerald-200 text-emerald-800" },
        { label: "Despesas", value: "R$ 2.100", cls: "bg-orange-50 border-orange-200 text-orange-800" },
        { label: "Pendente", value: "R$ 800", cls: "bg-amber-50 border-amber-200 text-amber-800" },
        { label: "PIX recebido", value: "R$ 9.500", cls: "bg-primary-light border-primary/20 text-primary-dark" },
      ].map(c => (
        <div key={c.label} className={`rounded-[10px] p-3 border ${c.cls}`}>
          <div className="text-[10px] font-bold text-muted-foreground mb-1">{c.label}</div>
          <div className="text-base font-extrabold">{c.value}</div>
        </div>
      ))}
    </div>
    <div className="flex items-end gap-1.5 h-16 mt-2.5">
      {[40, 55, 70, 50, 80, 65, 90, 75, 85, 60, 95, 88].map((h, i) => (
        <div key={i} className="flex-1 flex flex-col items-center">
          <div className="w-full rounded-t bg-primary/70 hover:bg-primary transition-opacity" style={{ height: `${h}%` }} />
          <span className="text-[8px] text-muted-foreground mt-1">{["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"][i]}</span>
        </div>
      ))}
    </div>
  </div>
);

const RelatoriosMockup = () => (
  <div>
    <div className="grid grid-cols-2 gap-2 mb-4">
      <div className="bg-muted rounded-[10px] p-3 border border-border">
        <div className="text-[10px] text-muted-foreground font-semibold">Taxa de Ocupação</div>
        <div className="text-2xl font-extrabold text-primary-dark">87%</div>
        <div className="text-[9px] text-emerald-600">↑ 5% vs mês anterior</div>
      </div>
      <div className="bg-muted rounded-[10px] p-3 border border-border">
        <div className="text-[10px] text-muted-foreground font-semibold">Retenção de Pacientes</div>
        <div className="text-2xl font-extrabold text-primary-dark">92%</div>
        <div className="text-[9px] text-emerald-600">↑ 3% vs mês anterior</div>
      </div>
    </div>
    <div className="bg-muted rounded-[10px] p-3 border border-border mb-3">
      <div className="text-[11px] font-bold text-foreground mb-2">Sessões por Tipo</div>
      <div className="space-y-2">
        {[
          { label: "Online", pct: 62, color: "bg-primary" },
          { label: "Presencial", pct: 30, color: "bg-accent" },
          { label: "Misto", pct: 8, color: "bg-amber-400" },
        ].map(r => (
          <div key={r.label}>
            <div className="flex justify-between text-[10px] text-muted-foreground mb-0.5">
              <span>{r.label}</span><span>{r.pct}%</span>
            </div>
            <div className="h-2 bg-border rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${r.color}`} style={{ width: `${r.pct}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
    <div className="text-center">
      <span className="text-[11px] text-primary font-semibold cursor-pointer hover:underline">Exportar PDF ↓</span>
    </div>
  </div>
);

const GenericMockup = ({ tab }: { tab: string }) => {
  const labels: Record<string, { title: string; items: string[] }> = {
    sala: { title: "Sala Virtual", items: ["Videochamada HD criptografada", "Chat integrado em tempo real", "Compartilhamento de tela", "Gravação com consentimento"] },
    psicobank: { title: "PsicoBank", items: ["PIX instantâneo integrado", "Extrato em tempo real", "Sem mensalidade", "Split para clínicas"] },
  };
  const data = labels[tab] || { title: tab, items: [] };
  return (
    <div className="text-center py-8">
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl gradient-primary flex items-center justify-center text-primary-foreground text-2xl font-extrabold">
        {tab === "sala" ? "📹" : "🏦"}
      </div>
      <h4 className="text-lg font-bold text-foreground mb-4">{data.title}</h4>
      <div className="space-y-2">
        {data.items.map(item => (
          <div key={item} className="flex items-center gap-2 justify-center text-sm text-muted-foreground">
            <span className="text-primary font-bold">✓</span> {item}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FeaturesSection;
