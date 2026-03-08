# Supabase Read Proxy Design

**Problem:** Browser clients in mainland China cannot reliably reach `*.supabase.co`, so public card reads time out even when SQL and read-table design are healthy.

**Decision:** Add a Vercel server-side read proxy at `/api/program-cards`. Production frontend reads will go through this API, which queries `public_program_card_reads` server-side and returns paginated JSON. Local development can temporarily keep the direct-Supabase fallback to avoid breaking the current Vite-only workflow.

**Scope:**
- Public card list
- Public search
- Public card detail
- Build diagnostics should reflect API-read success or failure

**Out of Scope:**
- Admin write flows
- Submission workflow refactor
- Compare/favorites/reminders server-side migration

**Why this approach:** It fixes the real bottleneck now proven by runtime evidence: browser-to-Supabase network access. It also preserves the physical read-table work, because the proxy will read from the same `public_program_card_reads` table rather than reintroducing dynamic joins.
