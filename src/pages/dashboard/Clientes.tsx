import { Search, Plus, Filter, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const clientes = [
  { n: "Maria Silva", e: "maria@email.com", t: "(11) 98765-4321", a: "TCC", s: "Ativo", u: "Hoje" },
  { n: "João Pereira", e: "joao@email.com", t: "(11) 97654-3210", a: "Psicanálise", s: "Ativo", u: "Ontem" },
  { n: "Ana Costa", e: "ana@email.com", t: "(11) 96543-2109", a: "Casal", s: "Pendente", u: "3 dias" },
  { n: "Carlos Mendes", e: "carlos@email.com", t: "(11) 95432-1098", a: "TCC", s: "Ativo", u: "Hoje" },
  { n: "Lucas Almeida", e: "lucas@email.com", t: "(11) 94321-0987", a: "Humanista", s: "Novo", u: "Hoje" },
  { n: "Beatriz Santos", e: "bia@email.com", t: "(11) 93210-9876", a: "TCC", s: "Inativo", u: "30 dias" },
];

const statusColor: Record<string, string> = {
  Ativo: "bg-green-50 text-green-700",
  Pendente: "bg-orange-50 text-orange-700",
  Novo: "bg-blue-50 text-blue-700",
  Inativo: "bg-gray-100 text-gray-600",
};

export default function Clientes() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pacientes</h1>
          <p className="text-muted-foreground text-sm mt-1">Gerencie seus pacientes e prontuários.</p>
        </div>
        <Button className="gradient-primary text-primary-foreground"><Plus className="w-4 h-4 mr-2" /> Novo paciente</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { l: "Total", v: "127", c: "text-foreground" },
          { l: "Ativos", v: "98", c: "text-green-600" },
          { l: "Pendentes", v: "12", c: "text-orange-600" },
          { l: "Novos (mês)", v: "8", c: "text-blue-600" },
        ].map((k) => (
          <div key={k.l} className="bg-card border border-border rounded-2xl p-4">
            <p className="text-xs text-muted-foreground font-medium">{k.l}</p>
            <p className={`text-2xl font-bold mt-1 ${k.c}`}>{k.v}</p>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-2xl">
        <div className="p-4 border-b border-border flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar paciente..." className="pl-9" />
          </div>
          <Button variant="outline"><Filter className="w-4 h-4 mr-2" /> Filtros</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground border-b border-border">
                <th className="font-semibold px-4 py-3">Paciente</th>
                <th className="font-semibold px-4 py-3 hidden md:table-cell">Contato</th>
                <th className="font-semibold px-4 py-3 hidden lg:table-cell">Abordagem</th>
                <th className="font-semibold px-4 py-3">Status</th>
                <th className="font-semibold px-4 py-3 hidden md:table-cell">Última sessão</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((c, i) => (
                <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                        {c.n.split(" ").map(p => p[0]).join("").slice(0, 2)}
                      </div>
                      <span className="font-semibold text-foreground">{c.n}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                    <div className="flex flex-col gap-0.5">
                      <span className="flex items-center gap-1.5 text-xs"><Mail className="w-3 h-3" /> {c.e}</span>
                      <span className="flex items-center gap-1.5 text-xs"><Phone className="w-3 h-3" /> {c.t}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">{c.a}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${statusColor[c.s]}`}>{c.s}</span></td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{c.u}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
