# Gravações de sessão → transcrição → relatório clínico com IA

A base já existe na Sala Virtual (envio de áudio/vídeo até 24 MB, transcrição, relatório em 7 seções, exportação PDF/CSV). Este plano conclui, ativa e valida o recurso de ponta a ponta.

## O que o psicólogo verá
1. Na Sala Virtual de cada sessão: confirmar consentimento, enviar gravação (áudio ou vídeo).
2. Botão "Gerar relatório": mostra o progresso ("Transcrevendo…", "Gerando relatório…").
3. Relatório rascunho com Resumo, Demanda, Relato, Observações clínicas, Intervenções, Evolução e Plano, mais a transcrição.
4. Novo: editar e salvar o rascunho revisado, e marcar "Revisado pelo profissional" antes de exportar.
5. Exportar PDF ou CSV (o rótulo "rascunho IA" some após a revisão).
6. Acesso também pela ficha do paciente (lista de sessões com gravações).

## Etapas
1. Publicar a função de relatório atualizada no backend.
2. Edição/revisão do relatório: campos editáveis, salvar, marcar como revisado (data e autor registrados).
3. Mensagens claras para falta de créditos de IA, arquivo grande demais ou sem fala detectada.
4. Reforçar a anonimização: além dos dados do paciente, remover nomes de terceiros comuns, endereços e números de documento antes de enviar à IA.
5. Testes: validação do relatório, revisão obrigatória antes de remover o rótulo de rascunho, anonimização.
6. Teste real: enviar um áudio curto de fala, gerar o relatório e conferir no app e no PDF/CSV.

## Detalhes técnicos
- Modelos: `openai/gpt-transcribe` (transcrição em streaming) e `openai/gpt-6-astra` via `/v1/responses` com schema JSON estrito; já implementados em `session-report`.
- Nova coluna em `session_recordings`: `reviewed_report jsonb`, `reviewed_at`, `reviewed_by`; RLS por dono mantida.
- Erros 402/403 do gateway exibidos com a mensagem original, sem novas tentativas automáticas.
- Limite atual de 24 MB mantido; arquivos maiores precisam ser divididos.
