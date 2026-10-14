import { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileAudio, FileVideo, Upload, Loader2, FileDown, Trash2, Check, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { REPORT_SECTIONS, exportClinicalReport, isClinicalReport } from '@/lib/session-report';
import { dateTimeBR } from '@/lib/format';

export default function SessionRecordings({ sessionId, sessionDate }: { sessionId: string; sessionDate: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [progress, setProgress] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const queryClient = useQueryClient();
  const key = ['session-recordings', sessionId];
  const { data: recordings = [], isLoading, error } = useQuery({ queryKey: key, queryFn: async () => {
    const { data, error } = await supabase.from('session_recordings').select('*').eq('session_id', sessionId).order('created_at', { ascending: false });
    if (error) throw error; return data;
  }});
  const active: any = recordings.find(r => r.id === selected) ?? recordings[0];
  const markReviewed = useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser(); if (!user) throw new Error('Entre novamente.');
      const { error } = await supabase.from('session_recordings').update({ reviewed_at: new Date().toISOString(), reviewed_by: user.id } as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: key }); toast.success('Relatório marcado como revisado.'); },
    onError: (e: Error) => toast.error(e.message),
  });
  function exportReport(format: 'pdf' | 'csv') {
    if (!isClinicalReport(active.report)) return;
    if (!active.reviewed_at && !window.confirm('Este relatório ainda não foi revisado por um profissional. Exportar mesmo assim?')) return;
    exportClinicalReport(active.report, format, dateTimeBR(sessionDate));
  }
  async function upload(file?: File) {
    if (!file) return;
    if (!consent) { toast.error('Confirme o consentimento antes de enviar.'); return; }
    if (!file.type.startsWith('audio/') && !file.type.startsWith('video/')) { toast.error('Selecione um arquivo de áudio ou vídeo.'); return; }
    if (!file.size || file.size > 24 * 1024 * 1024) { toast.error('Envie um arquivo de até 24 MB. Para sessões longas, use áudio comprimido ou arquivos menores.'); return; }
    setBusy('upload'); setProgress('Enviando gravação…');
    let uploadedPath: string | undefined;
    try {
      const { data: { user } } = await supabase.auth.getUser(); if (!user) throw new Error('Entre novamente para enviar a gravação.');
      const ext = file.name.split('.').pop()?.replace(/[^a-z0-9]/gi, '').toLowerCase() || 'webm';
      const path = `${user.id}/${sessionId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from('recordings').upload(path, file, { contentType: file.type }); if (error) throw error;
      uploadedPath = path;
      const { data, error: insertError } = await supabase.from('session_recordings').insert({ user_id: user.id, session_id: sessionId, kind: file.type.startsWith('video/') ? 'video' : 'audio', audio_path: path, media_path: path, consent_at: new Date().toISOString() } as any).select('id').single();
      if (insertError) throw insertError; uploadedPath = undefined; setSelected(data.id);
      await queryClient.invalidateQueries({ queryKey: key }); toast.success('Gravação enviada.');
    } catch (e) { if (uploadedPath) await supabase.storage.from('recordings').remove([uploadedPath]); toast.error(e instanceof Error ? e.message : 'Não foi possível enviar.'); }
    finally { setBusy(null); setProgress(''); if (input.current) input.current.value = ''; }
  }
  async function generate(recordingId: string) {
    if (!consent) { toast.error('Confirme o consentimento para processar com IA.'); return; }
    setBusy(recordingId); setProgress('Preparando transcrição…');
    try {
      const { data: { session } } = await supabase.auth.getSession(); if (!session) throw new Error('Entre novamente.');
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/session-report`, { method: 'POST', headers: { Authorization: `Bearer ${session.access_token}`, apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ recording_id: recordingId }) });
      if (!response.ok) { const body = await response.json(); throw new Error(body.error || body.message || `Erro ${response.status}`); }
      if (!response.body) throw new Error('Resposta vazia.');
      const reader = response.body.getReader(); const decoder = new TextDecoder(); let buffer = ''; let completed = false;
      const consume = (line: string) => {
        if (!line.trim()) return; const event = JSON.parse(line);
        if (event.error) throw new Error(event.error);
        if (event.stage) setProgress(event.stage);
        if (event.report) { if (!isClinicalReport(event.report)) throw new Error('Relatório incompleto.'); completed = true; }
      };
      while (true) { const { done, value } = await reader.read(); if (done) break; buffer += decoder.decode(value, { stream: true }); let i; while ((i = buffer.indexOf('\n')) >= 0) { consume(buffer.slice(0, i)); buffer = buffer.slice(i + 1); } }
      consume(buffer + decoder.decode()); if (!completed) throw new Error('Processamento interrompido; tente novamente.');
      setSelected(recordingId); toast.success('Relatório disponível para revisão.');
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Falha ao gerar relatório.'); }
    finally { await queryClient.invalidateQueries({ queryKey: key }); setBusy(null); setProgress(''); }
  }
  async function remove(id: string, path: string) {
    setBusy(id);
    try { const { error } = await supabase.from('session_recordings').delete().eq('id', id); if (error) throw error; const { error: storageError } = await supabase.storage.from('recordings').remove([path]); if (storageError) toast.error('Registro excluído, mas o arquivo não pôde ser removido.'); await queryClient.invalidateQueries({ queryKey: key }); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Não foi possível excluir.'); } finally { setBusy(null); }
  }
  return <section className="space-y-5 border-t border-border pt-6">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-lg font-semibold text-foreground">Gravações e relatório clínico</h2><p className="text-sm text-muted-foreground">Áudio ou vídeo · até 24 MB por arquivo</p></div>
      <Button disabled={!!busy || !consent} onClick={() => input.current?.click()}><Upload className="mr-2 h-4 w-4" />Enviar gravação</Button>
      <input ref={input} type="file" accept="audio/*,video/mp4,video/webm" className="hidden" aria-label="Arquivo da sessão" onChange={e => upload(e.target.files?.[0])} />
    </div>
    <label className="flex items-start gap-3 text-sm text-muted-foreground"><Checkbox checked={consent} onCheckedChange={v => setConsent(v === true)} disabled={!!busy} /><span>Confirmo o consentimento dos participantes para armazenar a gravação e processar seu conteúdo com IA. O relatório exige revisão profissional.</span></label>
    {busy && <p role="status" className="flex items-center gap-2 text-sm text-primary"><Loader2 className="h-4 w-4 animate-spin" />{progress || 'Aguarde…'}</p>}
    {error && <p role="alert" className="text-destructive">Não foi possível carregar as gravações.</p>}
    {isLoading ? <p className="text-sm text-muted-foreground">Carregando gravações…</p> : !recordings.length && <p className="text-sm text-muted-foreground py-4">Nenhuma gravação nesta sessão.</p>}
    <div className="space-y-2">{recordings.map((r, i) => <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-border py-3">
      <Button variant="ghost" className="h-auto justify-start whitespace-normal text-left" onClick={() => setSelected(r.id)}>{r.kind === 'video' ? <FileVideo className="mr-3 h-5 w-5 shrink-0" /> : <FileAudio className="mr-3 h-5 w-5 shrink-0" />}<span>Gravação {recordings.length - i}<span className="block text-xs text-muted-foreground">{dateTimeBR(r.created_at)} · {r.status === 'relatorio' ? 'Relatório disponível' : r.status === 'transcrito' ? 'Transcrita' : 'Enviada'}</span></span></Button>
      <div className="flex gap-2">{!isClinicalReport(r.report) && <Button size="sm" variant="outline" disabled={!!busy || !consent} onClick={() => generate(r.id)}>Gerar relatório</Button>}
        <AlertDialog>
          <AlertDialogTrigger asChild><Button title="Excluir gravação" aria-label="Excluir gravação" variant="ghost" size="icon" disabled={!!busy}><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Excluir gravação?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita. A gravação e seu relatório serão excluídos.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => remove(r.id, r.audio_path)}>Confirmar</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>)}</div>
    {active && isClinicalReport(active.report) && <div className="space-y-5">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold text-foreground">Relatório clínico · rascunho IA</h3>
          {!active.reviewed_at && <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-accent/15 text-accent">Rascunho de IA — ainda não revisado</span>}
        </div>
        <div className="flex gap-2">
          {!active.reviewed_at && <Button variant="outline" size="sm" disabled={markReviewed.isPending} onClick={() => markReviewed.mutate(active.id)}><Check className="mr-2 h-4 w-4" />Marcar como revisado</Button>}
          <Button variant="outline" size="sm" onClick={() => exportReport('pdf')}><FileDown className="mr-2 h-4 w-4" />PDF</Button>
          <Button variant="outline" size="sm" onClick={() => exportReport('csv')}><FileDown className="mr-2 h-4 w-4" />CSV</Button>
        </div>
      </div>
      {REPORT_SECTIONS.map(([field, label]) => <div key={field}><h4 className="text-sm font-semibold text-foreground mb-1">{label}</h4><p className="text-sm leading-relaxed whitespace-pre-wrap break-words text-muted-foreground">{isClinicalReport(active.report) ? active.report[field] : ''}</p></div>)}
      <div className="border-t border-border pt-4 space-y-2">
        <Button variant="outline" size="sm" onClick={() => setShowTranscript(v => !v)}>{showTranscript ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}{showTranscript ? 'Ocultar transcrição da sessão' : 'Revelar transcrição da sessão'}</Button>
        <p className="text-xs text-muted-foreground">Conteúdo sensível de saúde — exiba apenas quando necessário.</p>
        {showTranscript && <p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">{active.transcript}</p>}
      </div>
    </div>}
  </section>;
}
