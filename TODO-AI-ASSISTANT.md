# AI Business Assistant — Implementation TODO

Legend: `[ ]` pending · `[x]` done

## Backend
- [x] 1. Migration `20260819090000_ai_permissions.sql` — `ai.view` permission + grants
- [x] 2. Migration `20260819100000_ai_chat_schema.sql` — `ai_chat_sessions` + `ai_chat_messages` tables + RLS + indexes
- [x] 3. Edge function `supabase/functions/ai-assistant/index.ts`
  - [x] 3a. Session + `ai.view` permission validation
  - [x] 3b. Provider abstraction (`AIProvider` interface; anthropic / openai / gemini / mock) selected via env vars, no hardcoded keys
  - [x] 3c. Whitelisted intent router (sales, inventory, workshop, finance, rental, forecasting, general)
  - [x] 3d. Tenant-scoped pre-written SQL query per intent (never raw LLM SQL)
  - [x] 3e. Chat history persistence (create/list sessions, append messages)
  - [x] 3f. Graceful fallback to mock provider when no API key configured

## Frontend
- [x] 4. `features/ai/types/ai-types.ts` — types for sessions, messages, assistant response
- [x] 5. `features/ai/api/ai-api.ts` — session CRUD + `askAssistant(question, sessionId, context)`
- [x] 6. `features/ai/components/assistant-message.tsx` — renders text + optional chart + intent badge
- [x] 7. `features/ai/components/assistant-chat.tsx` — chat panel (input, quick chips, message list, loading)
- [x] 8. `features/ai/pages/ai-assistant-page.tsx` — standalone page (session list + chat)

## Wiring
- [x] 9. Route in `App.tsx` (`/ai-assistant`, gated by `ai.view`)
- [x] 10. Nav entry in `nav-items.ts` (Operations → AI Assistant)

## Verify
- [x] 11. `npm run build` passes (no TS errors) — `BUILD_EXIT_CODE=0`, built in 8.16s
- [ ] 12. Document env vars (`AI_PROVIDER`, `*_API_KEY`) in edge function README
