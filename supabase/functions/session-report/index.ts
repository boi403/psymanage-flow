import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const GATEWAY = "https://ai.gateway.lovable.dev/v1";
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

async function readSSE(res: Response, onEvent: (e: any) => void) {
  const reader = res.body!.getReader();
  const dec = new TextDecoder();
  let buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let i;
    while ((i = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, i).trim();
      buf = buf.slice(i + 1);
      if (!line.startsWith("data:")) continue;
      const d = line.slice(5).trim();
      if (!d || d === "[DONE]") continue;
      try { onEvent(JSON.parse(d)); } catch { /* partial */ }
    }
  }
}

const REPORT_FIELDS = ["resumo", "demanda", "relato", "observacoes_clinicas", "intervencoes", "evolucao", "plano"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return json({ error: "Não autenticado" }, 401);
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: auth } },
    });
    const { data: u } = await supabase.auth.getUser(auth.replace("Bearer ", ""));
    if (!u?.user) return json({ error: "Não autenticado" }, 401);

    const { recording_id } = await req.json().catch(() => ({}));
    if (typeof recording_id !== "string" || recording_id.length > 64) return json({ error: "recording_id inválido" }, 400);

    const { data: rec } = await supabase.from("session_recordings").select("*").eq("id", recording_id).maybeSingle();
    if (!rec) return json({ error: "Gravação não encontrada" }, 404);
    const KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let transcript: string = rec.transcript ?? "";
    if (!transcript) {
      const { data: blob, error } = await supabase.storage.from("recordings").download(rec.audio_path);
      if (error || !blob) return json({ error: "Áudio não encontrado" }, 404);
      if (blob.size < 2000) return json({ error: "Gravação vazia — grave novamente" }, 400);
      if (blob.size > 24 * 1024 * 1024) return json({ error: "Áudio muito longo (máx. ~24 MB)" }, 400);
      const form = new FormData();
      form.append("model", "openai/gpt-transcribe");
      form.append("file", new File([blob], "sessao.webm", { type: "audio/webm" }));
      form.append("response_format", "json");
      form.append("stream", "true");
      form.append("languages", "pt");
      const tr = await fetch(`${GATEWAY}/audio/transcriptions`, { method: "POST", headers: { Authorization: `Bearer ${KEY}` }, body: form });
      if (!tr.ok) {
        const t = await tr.text();
        console.error("transcribe", tr.status, t);
        return json({ error: tr.status === 402 ? "Créditos de IA esgotados." : tr.status === 429 ? "Muitas requisições, tente em instantes." : "Falha na transcrição" }, tr.status);
      }
      let deltas = "", done = "";
      await readSSE(tr, (e) => {
        if (e.type === "transcript.text.delta") deltas += e.delta ?? "";
        if (e.type === "transcript.text.done") done = e.text ?? "";
      });
      transcript = (done || deltas).trim();
      if (!transcript) return json({ error: "Nenhuma fala detectada na gravação" }, 400);
      await supabase.from("session_recordings").update({ transcript, status: "transcrito" }).eq("id", rec.id);
    }

    const schema = {
      type: "object", additionalProperties: false, required: REPORT_FIELDS,
      properties: Object.fromEntries(REPORT_FIELDS.map((f) => [f, { type: "string" }])),
    };
    const rr = await fetch(`${GATEWAY}/responses`, {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", "X-Lovable-AIG-SDK": "fetch" },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        stream: true,
        store: false,
        reasoning: { effort: "low" },
        instructions:
          "Você é um assistente de documentação clínica para psicólogos (Resolução CFP 06/2019). A partir da transcrição de uma sessão, escreva em português do Brasil um relatório final objetivo, técnico e ético, sem inventar fatos. Campos: resumo, demanda, relato, observacoes_clinicas, intervencoes, evolucao, plano. Não inclua nomes completos, CPF ou contatos.",
        input: [{ role: "user", content: `Transcrição da sessão:\n\n${transcript.slice(0, 60000)}` }],
        text: { format: { type: "json_schema", name: "relatorio", strict: true, schema } },
      }),
    });
    if (!rr.ok) {
      const t = await rr.text();
      console.error("report", rr.status, t);
      return json({ error: rr.status === 402 ? "Créditos de IA esgotados." : rr.status === 429 ? "Muitas requisições, tente em instantes." : "Falha ao gerar relatório" }, rr.status);
    }
    let out = "";
    await readSSE(rr, (e) => { if (e.type === "response.output_text.delta") out += e.delta ?? ""; });
    let report: Record<string, string>;
    try { report = JSON.parse(out); } catch { return json({ error: "Resposta da IA inválida" }, 502); }
    await supabase.from("session_recordings").update({ report, status: "relatorio" }).eq("id", rec.id);
    return json({ transcript, report });
  } catch (e) {
    console.error(e);
    return json({ error: e instanceof Error ? e.message : "Erro" }, 500);
  }
});
