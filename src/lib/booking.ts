import { z } from "zod";

export const bookingContactSchema = z.object({
  name: z.string().trim().min(1, "Informe seu nome completo").max(120),
  phone: z.string().trim().max(30).refine((v) => /^[+\d\s().-]+$/.test(v) && v.replace(/\D/g, "").length >= 10 && v.replace(/\D/g, "").length <= 15, "Informe um WhatsApp válido com DDD"),
  email: z.string().trim().max(160).refine((v) => !v || z.string().email().safeParse(v).success, "Informe um e-mail válido"),
});

export function buildAvailability(input: { date: string; from: string; to: string; duration: string; gap: string; modality: string }, now = Date.now()) {
  const duration = Number(input.duration), gap = Number(input.gap);
  const start = new Date(`${input.date}T${input.from}`).getTime();
  const end = new Date(`${input.date}T${input.to}`).getTime();
  if (!Number.isInteger(duration) || duration < 1 || duration > 480 || !Number.isInteger(gap) || gap < 0 || gap > 480) throw new Error("Informe duração positiva e intervalo válido");
  if (!Number.isFinite(start) || !Number.isFinite(end) || start <= now || end <= start) throw new Error("Escolha um período futuro, com término após o início");
  if (!["online", "presencial"].includes(input.modality)) throw new Error("Modalidade inválida");
  const rows = [];
  for (let t = start; t + duration * 60_000 <= end; t += (duration + gap) * 60_000) {
    rows.push({ starts_at: new Date(t).toISOString(), duration_min: duration, modality: input.modality });
  }
  if (!rows.length) throw new Error("Intervalo não comporta nenhuma sessão");
  return rows;
}