# Architecture rules
- Store owner-scoped clinical data in Lovable Cloud with row-level security; never use browser storage for authorization.
- Enforce clinical sequence allocation, immutable final documents and financial audit snapshots in database triggers; concurrency and browser bypasses must not defeat these rules.
- Generate printable clinical documents locally with jsPDF; document export must not mutate fiscal receipt state.
- Process session media through authenticated streaming Cloud functions; cache transcripts, anonymize text before report generation, and require professional review of AI drafts.