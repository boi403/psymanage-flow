import { GraduationCap, Award, BookOpen, Clock, Users } from "lucide-react";

const courses = [
  { title: "TCC para Transtornos de Ansiedade", instructor: "Dra. Marina Alves", hours: "20h", students: "1.240", level: "Intermediário", price: "R$ 297", color: "bg-primary" },
  { title: "Avaliação Psicológica Infantil", instructor: "Dr. Carlos Mendes", hours: "16h", students: "890", level: "Avançado", price: "R$ 349", color: "bg-indigo-500" },
  { title: "Neuropsicologia Clínica", instructor: "Dra. Paula Ribeiro", hours: "24h", students: "2.100", level: "Intermediário", price: "R$ 449", color: "bg-rose-500" },
  { title: "Psicoterapia de Casal", instructor: "Dr. André Lopes", hours: "18h", students: "760", level: "Básico", price: "R$ 249", color: "bg-amber-500" },
  { title: "Mindfulness e ACT", instructor: "Dra. Beatriz Nunes", hours: "12h", students: "1.580", level: "Básico", price: "R$ 197", color: "bg-emerald-500" },
  { title: "Psicodiagnóstico Avançado", instructor: "Dr. Ricardo Teixeira", hours: "30h", students: "650", level: "Avançado", price: "R$ 549", color: "bg-violet-500" },
];

const SpecializationsSection = () => (
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
          Cursos e especializações ministrados por profissionais renomados. Conclua e receba seu certificado digital reconhecido.
        </p>
      </div>

      {/* Certificate highlight */}
      <div className="bg-card rounded-xl border border-border p-8 mb-10 flex flex-col md:flex-row items-center gap-8 shadow-brand">
        <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center shrink-0">
          <Award className="w-10 h-10 text-primary-foreground" />
        </div>
        <div className="text-center md:text-left flex-1">
          <h3 className="text-xl font-extrabold text-foreground mb-2">Certificado Digital Reconhecido</h3>
          <p className="text-muted-foreground leading-relaxed">
            Ao concluir cada curso, emita seu certificado digital com verificação online. Válido para horas complementares e desenvolvimento profissional contínuo.
          </p>
        </div>
        <div className="flex gap-6 shrink-0">
          {[
            { icon: GraduationCap, label: "50+ Cursos" },
            { icon: Users, label: "15k+ Alunos" },
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map(c => (
          <div key={c.title} className="bg-card rounded-xl border border-border p-6 hover:-translate-y-1 hover:shadow-brand-lg hover:border-primary transition-all cursor-default">
            <div className={`w-12 h-12 rounded-[14px] ${c.color}/10 flex items-center justify-center mb-4`}>
              <GraduationCap className={`w-6 h-6 text-primary-dark`} />
            </div>
            <h4 className="text-base font-bold text-foreground mb-1.5">{c.title}</h4>
            <p className="text-[13px] text-muted-foreground mb-4">{c.instructor}</p>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground mb-4">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {c.hours}</span>
              <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {c.students}</span>
              <span className="px-2 py-0.5 rounded-full bg-primary-light text-primary-dark font-semibold">{c.level}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-lg font-extrabold text-foreground">{c.price}</span>
              <button className="px-4 py-2 gradient-primary text-primary-foreground rounded-lg text-[13px] font-bold hover:-translate-y-0.5 transition-all">
                Inscrever-se
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default SpecializationsSection;
