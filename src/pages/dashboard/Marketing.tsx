import { Search, Calendar, Globe, Star, Mail, GraduationCap } from "lucide-react";

const features = [
  { i: Search, t: "Busca Psico", d: "Apareça em uma plataforma de busca de psicólogos e atraia mais clientes.", tag: "PsicoManager" },
  { i: Calendar, t: "Agendamento Online", d: "Permita que seus clientes agendem horários diretamente pelo seu perfil.", tag: "PsicoManager" },
  { i: Globe, t: "Site profissional", d: "Personalize seu site profissional com domínio e identidade visual.", tag: "PsicoMarketing" },
  { i: Star, t: "Avaliação NPS", d: "Meça satisfação e colete feedbacks dos seus pacientes automaticamente.", tag: "PsicoMarketing" },
  { i: Mail, t: "E-mail profissional", d: "Tenha um e-mail com seu domínio para fortalecer sua marca.", tag: "PsicoMarketing" },
  { i: GraduationCap, t: "Cursos & Certificados", d: "Em breve: ofereça cursos para outros profissionais e emita certificados.", tag: "Em breve" },
];

export default function Marketing() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Marketing</h1>
        <p className="text-muted-foreground text-sm mt-1">Ferramentas para divulgar seu consultório e atrair mais pacientes</p>
      </div>

      <div className="gradient-cta rounded-2xl p-8 text-primary-foreground">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold mb-2">Eleve sua presença digital</h2>
          <p className="text-primary-foreground/90 text-sm mb-6">
            Use BuscaPsico, Agendamento Online e mais ferramentas para fazer seu consultório crescer.
          </p>
          <button className="bg-background text-primary-dark font-bold px-6 py-2.5 rounded-lg hover:scale-105 transition-transform">
            Assinar PsicoMarketing
          </button>
        </div>
      </div>

      <div>
        <h3 className="font-bold text-foreground mb-4">Conheça as funcionalidades</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => (
            <div key={f.t} className="bg-card border border-border rounded-2xl p-5 hover:shadow-brand transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="w-11 h-11 rounded-xl bg-primary-light flex items-center justify-center">
                  <f.i className="w-5 h-5 text-primary-dark" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wide text-primary bg-primary-light px-2 py-1 rounded">{f.tag}</span>
              </div>
              <p className="font-bold text-foreground">{f.t}</p>
              <p className="text-xs text-muted-foreground mt-1.5 mb-3">{f.d}</p>
              <button className="text-xs text-primary font-semibold hover:underline">Saiba mais →</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
