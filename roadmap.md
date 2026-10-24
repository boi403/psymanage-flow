# Requested functionality
- [ ] Mobile agenda: list/week calendar and appointment dots (done); rescheduling UI and private session-notes UI still missing (backend already expects `sessions.notes`).
- [x] Real-data overview panel and working appointment links.
- [ ] Private session notes and AI reports based on notes — AI report backend supports a `notes` source mode, but there is no UI to write/save session notes yet.
- [x] Individual Google Calendar synchronization from PsicoManager.
- [x] Review security of touched booking/report flows — `book_slot` now has both a per-phone cooldown (migration 0010) and an IP throttle (migration 0013); a CAPTCHA (e.g. Turnstile/hCaptcha) in front of `/agendar` remains the stronger mitigation if abuse is observed in practice, but needs a provider account/keys — a product decision, not something added silently.
- [x] Complete online booking: professional opens slots, shares a public link, patient chooses and confirms; validate availability and concurrent bookings.
- [x] Session audio/video uploads, AI Gateway structured clinical reports and PDF/CSV exports (current request).
- [x] Complete patient chart, structured sequential records and PDF.
- [x] Transactional financial settlement, undo, edits and fiscal locks.
- [x] Immutable psychological documents, local PDF and duplication (enforced client-side today; DB-level enforcement not verifiable from the repo's migrations).
- [x] Professional settings and configurable approaches.
- [x] Receita Saúde verified layout and manual receipt controls.
- [ ] Invite registration enforcement, 15-minute Telegram link and external bot — bot/Telegram edge functions exist, but invite-code enforcement on signup could not be confirmed.
- [x] AI drafts with server-side anonymization of approved evolutions.
- [x] Finish earlier recording/report and booking views.
- [ ] Automated WhatsApp reminder one hour before consultations, with professional name and scheduled time (blocked on a hosted WA-AKG service). Manual "send via WhatsApp" link exists as a stopgap.
- [x] Evaluate WA-AKG for each psychologist to connect their own WhatsApp account: user chose unofficial QR pairing; requires external persistent hosting.

# Known accepted risks (2026-10-24 audit)
- Public booking (`book_slot`) resolves an existing patient by name+phone match alone, with no OTP/e-mail verification. Anyone who knows a real patient's full name and phone number can book a session "as" them through the public form. Accepted for this business model; documented in a comment at the match site in migration 0013.
- AI anonymization (`supabase/functions/_shared/anonymize.ts`) is regex/substitution-based best-effort: ASR transcription errors, nicknames not in the patient record, or mentions of third parties (spouse, employer) in the patient's own speech are not guaranteed to be caught before the transcript reaches the AI gateway. The session-report UI now shows an explicit reminder to review before approving an unreviewed AI draft.

# Known gaps (found in code audit, 2026-10-22)
- [ ] `supabase/migrations/` only has 2 files (the `profiles` table); ~17 tables and 6+ RPCs used by the app (patients, sessions, transactions, subscriptions, patient_records, psychological_documents, financial_audit, book_slot, settle_transactions, reverse_receipt, anonymize_patient, etc.) have no migration file in this repo. Need to pull the real schema from the live Supabase/Lovable Cloud project and commit it — requires knowing which project ref is live (ask the user).
- [ ] `src/pages/dashboard/MinhaClinica.tsx`: clinic billing data (CNPJ/address) is still hardcoded placeholders; "Editar" buttons have no handler.
- [ ] `src/pages/dashboard/Marketing.tsx`: static page for unbuilt add-ons (PsicoMarketing, BuscaPsico, site profissional, e-mail profissional); all CTAs are inert — needs a product decision on what they should do (checkout link vs. waitlist vs. remove).
- [ ] No test coverage for edge functions, components, or RLS/DB policies (current tests only cover pure functions in `src/lib/`).