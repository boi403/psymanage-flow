import { Plus, Edit, Lock, Users, FileText, Calendar, Wallet, Bell, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

const sections = [
  { t: "Usuários", icon: Users, items: ["Profissionais", "Colaboradores", "Permissões"] },
  { t: "Modelos", icon: FileText, items: ["Documentos", "Formulário de sessão", "Anamnese", "Recursos terapêuticos"] },
  { t: "Agenda", icon: Calendar, items: ["Agenda e salas"] },
  { t: "Finanças", icon: Wallet, items: ["Pacotes", "Convênios e repasses", "Forma de pagamento", "Categorias financeiras", "Cobranças"] },
  { t: "Notificações", icon: Bell, items: ["Para clientes", "Para o profissional"] },
  { t: "Integrações", icon: LinkIcon, items: ["Assinatura Digital", "Receita Saúde"] },
];

export default function Configuracao() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground text-sm mt-1">Personalize o sistema conforme sua clínica</p>
      </div>

      <div className="bg-card border border-border rounded-2xl">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="font-bold text-foreground">Profissionais</h3>
            <p className="text-xs text-muted-foreground">Usuários que atendem na sua clínica</p>
          </div>
          <Button className="gradient-primary text-primary-foreground"><Plus className="w-4 h-4 mr-2" /> Adicionar profissional</Button>
        </div>
        <div className="divide-y divide-border">
          {[
            { n: "MATEUS OLIVEIRA REZENDE", e: "mateus.orezende@gmail.com" },
            { n: "Dra. Carla Mendes", e: "carla@clinica.com" },
          ].map((p, i) => (
            <div key={i} className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                {p.n.split(" ").map(x => x[0]).join("").slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{p.n}</p>
                <p className="text-xs text-muted-foreground truncate">{p.e}</p>
              </div>
              <span className="hidden md:inline-flex w-2 h-2 rounded-full bg-green-500" />
              <Button variant="ghost" size="icon"><Edit className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon"><Lock className="w-4 h-4" /></Button>
            </div>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {sections.map((s) => (
          <div key={s.t} className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-primary-light flex items-center justify-center">
                <s.icon className="w-4 h-4 text-primary-dark" />
              </div>
              <h3 className="font-bold text-foreground">{s.t}</h3>
            </div>
            <ul className="space-y-1.5">
              {s.items.map((it) => (
                <li key={it}>
                  <button className="w-full text-left text-sm text-muted-foreground hover:text-primary hover:bg-muted/30 px-2 py-1.5 rounded transition-colors">
                    {it}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
