import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const hours = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];
const days = ["Seg 26", "Ter 27", "Qua 28", "Qui 29", "Sex 30"];

const events: Record<string, { d: number; h: string; n: string; c: string }[]> = {
  list: [
    { d: 0, h: "09:00", n: "Maria Silva", c: "bg-primary-light border-l-4 border-primary text-primary-dark" },
    { d: 0, h: "14:00", n: "Ana Costa", c: "bg-blue-50 border-l-4 border-blue-500 text-blue-700" },
    { d: 1, h: "10:00", n: "João Pereira", c: "bg-orange-50 border-l-4 border-orange-500 text-orange-700" },
    { d: 2, h: "11:00", n: "Carlos M.", c: "bg-primary-light border-l-4 border-primary text-primary-dark" },
    { d: 2, h: "15:00", n: "Lucas A.", c: "bg-purple-50 border-l-4 border-purple-500 text-purple-700" },
    { d: 3, h: "09:00", n: "Beatriz S.", c: "bg-primary-light border-l-4 border-primary text-primary-dark" },
    { d: 3, h: "16:00", n: "Maria Silva", c: "bg-primary-light border-l-4 border-primary text-primary-dark" },
    { d: 4, h: "10:00", n: "Ana Costa", c: "bg-blue-50 border-l-4 border-blue-500 text-blue-700" },
    { d: 4, h: "14:00", n: "João P.", c: "bg-orange-50 border-l-4 border-orange-500 text-orange-700" },
  ],
};

export default function Agenda() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Agenda</h1>
          <p className="text-muted-foreground text-sm mt-1">Semana de 26 a 30 de maio, 2026</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon"><ChevronLeft className="w-4 h-4" /></Button>
          <Button variant="outline">Hoje</Button>
          <Button variant="outline" size="icon"><ChevronRight className="w-4 h-4" /></Button>
          <Button className="gradient-primary text-primary-foreground"><Plus className="w-4 h-4 mr-2" /> Nova sessão</Button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="grid grid-cols-[80px_repeat(5,1fr)] border-b border-border bg-muted/30">
          <div className="p-3"></div>
          {days.map((d) => (
            <div key={d} className="p-3 text-center text-xs font-bold text-foreground uppercase border-l border-border">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-[80px_repeat(5,1fr)]">
          {hours.map((h) => (
            <div key={h} className="contents">
              <div className="p-2 text-xs text-muted-foreground font-medium border-b border-border text-right pr-3">{h}</div>
              {days.map((_, di) => {
                const ev = events.list.find(e => e.d === di && e.h === h);
                return (
                  <div key={di} className="border-l border-b border-border min-h-[60px] p-1 hover:bg-muted/20 transition-colors">
                    {ev && (
                      <div className={`rounded-md px-2 py-1.5 text-xs font-semibold ${ev.c}`}>
                        {ev.n}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
