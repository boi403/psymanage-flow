import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { calendarAction } from "@/components/dashboard/GoogleCalendarCard";
import { toast } from "sonner";

export default function GoogleCalendarReturn() {
  const navigate = useNavigate();
  const { state } = useParams();
  const [msg, setMsg] = useState("Concluindo conexão com o Google Agenda…");
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return; done.current = true;
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    window.history.replaceState(null, "", window.location.pathname);
    if (!code || !state) { setMsg("A autorização foi cancelada ou falhou."); setTimeout(() => navigate("/dashboard/agenda"), 2500); return; }
    calendarAction({ action: "complete", code, state })
      .then(() => { toast.success("Google Agenda conectado"); navigate("/dashboard/agenda"); })
      .catch((e) => setMsg(e instanceof Error ? e.message : "Falha ao conectar."));
  }, [navigate, state]);
  return <div className="min-h-screen grid place-items-center p-6 text-center text-muted-foreground">{msg}</div>;
}
