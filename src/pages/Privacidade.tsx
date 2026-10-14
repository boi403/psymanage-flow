import { Link } from "react-router-dom";
import { CalendarCheck, ArrowLeft, AlertTriangle } from "lucide-react";

const SECTIONS = [
  { title: "Dados coletados", text: "[Descreva aqui quais dados pessoais são coletados: nome, telefone, e-mail, dados de agendamento, etc.]" },
  { title: "Finalidade", text: "[Descreva aqui para quais finalidades os dados são utilizados.]" },
  { title: "Retenção", text: "[Descreva aqui por quanto tempo os dados são mantidos e os critérios de retenção.]" },
  { title: "Direitos do titular", text: "[Descreva aqui como o titular pode exercer seus direitos de acesso, correção, exclusão e portabilidade.]" },
  { title: "Contato", text: "[Descreva aqui o canal de contato do controlador/encarregado de dados.]" },
];

export default function Privacidade() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border px-6 py-5">
        <Link to="/" className="flex items-center gap-2 font-bold text-primary max-w-3xl mx-auto"><CalendarCheck className="h-6 w-6" />PsicoManager</Link>
      </header>
      <main className="max-w-3xl mx-auto px-5 py-10 space-y-8">
        <h1 className="text-3xl font-bold">Política de Privacidade</h1>
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-yellow-500/40 bg-yellow-500/10 p-4 text-sm text-yellow-700 dark:text-yellow-300">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <p>⚠️ Texto provisório — substitua por sua Política de Privacidade real antes de publicar. Esta página existe apenas para que o agendamento público tenha um link funcional de consentimento (LGPD).</p>
        </div>
        <div className="space-y-6">
          {SECTIONS.map((s) => (
            <section key={s.title} className="space-y-1">
              <h2 className="text-lg font-semibold">{s.title}</h2>
              <p className="text-sm text-muted-foreground">{s.text}</p>
            </section>
          ))}
        </div>
        <footer className="border-t border-border pt-5"><Link to="/" className="text-sm text-muted-foreground inline-flex items-center gap-2"><ArrowLeft className="w-4 h-4" />PsicoManager</Link></footer>
      </main>
    </div>
  );
}
