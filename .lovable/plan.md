# Agenda com calendário e conexão direta ao Google Agenda

## O que o psicólogo verá
1. Na Agenda: um calendário mensal/semanal com pontos nos dias que têm consultas (cores por status: confirmada, pendente, cancelada).
2. Ao tocar num dia: lista das consultas daquele dia (horário, paciente, modalidade), com acesso à Sala Virtual.
3. Alternância "Semana / Mês", funcionando bem no celular.
4. Botão "Conectar Google Agenda": abre a autorização da própria conta Google do profissional e volta ao app já conectado.
5. Depois de conectado: consultas confirmadas criam eventos no Google Agenda, remarcações atualizam e cancelamentos removem. Botões "Sincronizar agora" e "Desconectar".
6. Os eventos no Google mostram só "Consulta PsicoManager" e o horário, nunca conteúdo clínico, e ficam privados.

## Etapas
1. Calendário com pontos e lista do dia na página Agenda.
2. Cartão de conexão do Google Agenda (status, conectar, sincronizar, desconectar).
3. Página de retorno da autorização que conclui a conexão e volta para a Agenda.
4. Publicar as funções de sincronização e ativar a sincronização automática a cada poucos minutos.
5. Teste real: conectar uma conta, criar, remarcar e cancelar uma consulta e conferir no Google Agenda.

## Ação necessária sua
No Google Cloud Console, adicionar este endereço de retorno autorizado ao aplicativo OAuth: `https://connector-gateway.lovable.dev/api/v1/app-users/oauth2/callback`. Sem isso o Google recusa a conexão.

## Detalhes técnicos
- Backend já existe: função `calendar-connect` (status/start/complete/disconnect/sync/worker) e fila `calendar_sync_jobs` alimentada por gatilho em `sessions`.
- Nova rota `/oauth/google-calendar/return` lê `code`/`state` e chama `complete`; o estado é verificado no servidor.
- Agendamento automático do worker via `pg_cron` + `pg_net` com o segredo do worker.
- Calendário usa o componente `calendar` existente com `modifiers` para os pontos; consultas lidas de `sessions` com RLS por dono.
- Sincronização em um sentido apenas (PsicoManager para Google).
