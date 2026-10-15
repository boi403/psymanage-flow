import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CalendarCheck, RefreshCw, Unlink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";

// On native, this must match CFBundleURLSchemes (iOS) / the intent-filter
// scheme (Android) -- see ios/App/App/Info.plist and
// android/app/src/main/AndroidManifest.xml. No "//" after the colon
// (so `${origin}/oauth/...` below produces one slash, not two/three).
const NATIVE_OAUTH_SCHEME = "com.psicomanager.app:";

export async function calendarAction(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("calendar-connect", { body });
  if (error) {
    const ctx = (error as { context?: Response }).context;
    let msg = error.message;
    try { if (ctx) msg = (await ctx.json()).error || msg; } catch { /* keep */ }
    throw new Error(msg);
  }
  return data;
}

export function GoogleCalendarCard() {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const { data, isLoading } = useQuery({ queryKey: ["gcal-status"], queryFn: () => calendarAction({ action: "status" }) });
  const run = async (action: string) => {
    setBusy(true);
    try {
      if (action === "start") {
        const native = Capacitor.isNativePlatform();
        const r = await calendarAction({ action, origin: native ? NATIVE_OAUTH_SCHEME : window.location.origin });
        // Google blocks OAuth consent screens inside an embedded WebView, so on
        // native this must open in the system browser; the return_url (built
        // server-side from NATIVE_OAUTH_SCHEME above) comes back as a deep link
        // handled by useDeepLinks(), not a WebView navigation.
        if (native) { await Browser.open({ url: r.authorizationUrl }); }
        else { window.location.href = r.authorizationUrl; }
        return;
      }
      await calendarAction({ action });
      toast.success(action === "sync" ? "Agenda sincronizada" : "Google Agenda desconectado");
      qc.invalidateQueries({ queryKey: ["gcal-status"] });
    } catch (e) { toast.error(e instanceof Error ? e.message : "Falha"); }
    finally { setBusy(false); }
  };
  const connected = data?.connected && !data?.reconnectRequired;
  return (
    <div className="bg-card border border-border rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <CalendarCheck className="w-5 h-5 text-primary" />
        <div>
          <p className="font-semibold text-foreground">Google Agenda</p>
          <p className="text-xs text-muted-foreground">
            {isLoading ? "Verificando…" : connected ? "Conectado — consultas são enviadas como eventos privados, sem dados clínicos." : data?.reconnectRequired ? "Reconecte sua conta." : "Envie suas consultas para a sua conta Google."}
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        {connected ? <>
          <Button size="sm" variant="outline" disabled={busy} onClick={() => run("sync")}><RefreshCw className="w-4 h-4 mr-1" />Sincronizar agora</Button>
          <AlertDialog>
            <AlertDialogTrigger asChild><Button size="sm" variant="ghost" disabled={busy}><Unlink className="w-4 h-4 mr-1" />Desconectar</Button></AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader><AlertDialogTitle>Desconectar Google Agenda?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
              <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => run("disconnect")}>Confirmar</AlertDialogAction></AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </> : <Button size="sm" disabled={busy || isLoading} onClick={() => run("start")} className="gradient-primary text-primary-foreground">Conectar Google Agenda</Button>}
      </div>
    </div>
  );
}
