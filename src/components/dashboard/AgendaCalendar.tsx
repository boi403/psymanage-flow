import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Video, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type S = { id: string; starts_at: string; status: string; modality: string; patients?: { name?: string } | null };
const WEEK = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
const dot = (status: string) => status === "Cancelada" || status === "Falta" ? "bg-destructive" : status === "Realizada" ? "bg-muted-foreground" : "bg-primary";

export function AgendaCalendar({ sessions }: { sessions: S[] }) {
  const [mode, setMode] = useState<"semana" | "mes">("semana");
  const [cursor, setCursor] = useState(() => new Date());
  const [selected, setSelected] = useState(() => new Date());
  const byDay = useMemo(() => {
    const m = new Map<string, S[]>();
    for (const s of sessions) { const k = dayKey(new Date(s.starts_at)); m.set(k, [...(m.get(k) ?? []), s]); }
    return m;
  }, [sessions]);
  const days = useMemo(() => {
    if (mode === "semana") {
      const start = new Date(cursor); start.setDate(cursor.getDate() - cursor.getDay());
      return Array.from({ length: 7 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
    }
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const start = new Date(first); start.setDate(1 - first.getDay());
    return Array.from({ length: 42 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
  }, [mode, cursor]);
  const move = (n: number) => { const d = new Date(cursor); mode === "semana" ? d.setDate(d.getDate() + 7 * n) : d.setMonth(d.getMonth() + n); setCursor(d); };
  const today = dayKey(new Date());
  const list = (byDay.get(dayKey(selected)) ?? []).sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  const title = cursor.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  return (
    <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" aria-label="Anterior" onClick={() => move(-1)}><ChevronLeft className="w-4 h-4" /></Button>
          <p className="font-semibold capitalize text-foreground min-w-[140px] text-center">{title}</p>
          <Button size="icon" variant="ghost" aria-label="Próximo" onClick={() => move(1)}><ChevronRight className="w-4 h-4" /></Button>
        </div>
        <div className="flex rounded-lg border border-border overflow-hidden">
          {(["semana", "mes"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} className={cn("px-3 py-1.5 text-sm", mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>{m === "semana" ? "Semana" : "Mês"}</button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEK.map((w) => <p key={w} className="text-xs text-muted-foreground py-1">{w}</p>)}
        {days.map((d) => {
          const items = byDay.get(dayKey(d)) ?? [];
          const isSel = dayKey(d) === dayKey(selected);
          const out = mode === "mes" && d.getMonth() !== cursor.getMonth();
          return (
            <button key={d.toISOString()} onClick={() => setSelected(d)} aria-label={`${d.toLocaleDateString("pt-BR")}: ${items.length} consultas`}
              className={cn("rounded-xl py-2 flex flex-col items-center gap-1 transition-colors", isSel ? "bg-primary/15 ring-1 ring-primary" : "hover:bg-muted", out && "opacity-40")}>
              <span className={cn("text-sm", dayKey(d) === today ? "font-bold text-primary" : "text-foreground")}>{d.getDate()}</span>
              <span className="flex gap-0.5 h-1.5">{items.slice(0, 4).map((s) => <span key={s.id} className={cn("w-1.5 h-1.5 rounded-full", dot(s.status))} />)}</span>
            </button>
          );
        })}
      </div>
      <div className="border-t border-border pt-3">
        <p className="text-sm font-semibold text-foreground mb-2 capitalize">{selected.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}</p>
        {list.length ? list.map((s) => (
          <Link key={s.id} to={`/dashboard/sala/${s.id}`} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
            <span className={cn("w-2 h-2 rounded-full shrink-0", dot(s.status))} />
            <span className="text-sm font-bold text-foreground w-12">{new Date(s.starts_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
            <span className="flex-1 text-sm text-foreground truncate">{s.patients?.name}</span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">{s.modality === "online" ? <Video className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}{s.status}</span>
          </Link>
        )) : <p className="text-sm text-muted-foreground">Nenhuma consulta neste dia.</p>}
      </div>
    </div>
  );
}
