-- Migration: ai_chat_schema (20260819100000)
--
-- Chat history for the AI Business Assistant. Two tables:
--   * ai_chat_sessions — a conversation thread (per company, optionally owned by a user)
--   * ai_chat_messages — the individual turns (user question / assistant answer)
--
-- Both are tenant-scoped via company_id (current_company_id() default + RLS), following
-- the canonical multi-tenant pattern used across every operational table. The assistant
-- answers are read/query-only, so the gating permission is `ai.view` (see
-- 20260819090000_ai_permissions.sql). Messages are append-only by design — there is no
-- update/delete policy, so a chat transcript can never be silently rewritten through
-- the client (matches the stock_movements append-only ledger convention).

create table public.ai_chat_sessions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) default public.current_company_id(),
  user_id uuid not null references public.profiles(id),
  title text not null default 'New conversation',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ai_chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.ai_chat_sessions(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  intent text,
  chart jsonb,
  created_at timestamptz not null default now()
);

alter table public.ai_chat_sessions enable row level security;
alter table public.ai_chat_messages enable row level security;

-- Sessions: tenant-scoped. A user can list/read all sessions in their company (so team
-- members can pick up a shared thread), but only create/soft used by their own user_id.
create policy "ai_sessions_select" on public.ai_chat_sessions
  for select to authenticated using (company_id = public.current_company_id() and public.has_permission('ai.view'));

create policy "ai_sessions_insert" on public.ai_chat_sessions
  for insert to authenticated with check (
    company_id = public.current_company_id()
    and public.has_permission('ai.view')
    and user_id = auth.uid()
  );

create policy "ai_sessions_update" on public.ai_chat_sessions
  for update to authenticated using (user_id = auth.uid() and public.has_permission('ai.view'))
  with check (user_id = auth.uid() and public.has_permission('ai.view'));

create policy "ai_sessions_delete" on public.ai_chat_sessions
  for delete to authenticated using (user_id = auth.uid() and public.has_permission('ai.view'));

-- Messages: tenant-scoped via join to session; append-only (select + insert only).
create policy "ai_messages_select" on public.ai_chat_messages
  for select to authenticated using (
    public.has_permission('ai.view')
    and exists (
      select 1 from public.ai_chat_sessions s
      where s.id = session_id and s.company_id = public.current_company_id()
    )
  );

create policy "ai_messages_insert" on public.ai_chat_messages
  for insert to authenticated with check (
    public.has_permission('ai.view')
    and exists (
      select 1 from public.ai_chat_sessions s
      where s.id = session_id and s.company_id = public.current_company_id()
    )
  );

-- Indexes: session list ordering, message ordering within a session, and the
-- session->user ownership lookup.
create index ai_chat_sessions_company_updated_idx on public.ai_chat_sessions (company_id, updated_at desc);
create index ai_chat_sessions_user_idx on public.ai_chat_sessions (user_id);
create index ai_chat_messages_session_created_idx on public.ai_chat_messages (session_id, created_at asc);

-- Keep session.updated_at fresh whenever a message is added (drives the sidebar sort).
create or replace function public.touch_ai_session()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.ai_chat_sessions set updated_at = now() where id = new.session_id;
  return new;
end;
$$;

create trigger trg_touch_ai_session
  after insert on public.ai_chat_messages
  for each row execute function public.touch_ai_session();
