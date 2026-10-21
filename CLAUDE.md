# GIANT: project guide for Claude Code

GIANT is a strategy and life-sim game set in modern Nigeria. The player rises from Lagos ward councillor to President. Along the way they manage a state treasury and a personal account, AI-driven characters, politics, security and, in the end, Nigeria's sovereignty against foreign powers.

- Full design doc: export it from Claude Docs as Markdown to `docs/GDD.md`, and read it when a task needs story, mission or system detail.
- Current phase: **Phase 0, the "Ward 7" prototype** (one ward in Mushin, Lagos). See `PHASE0_TASKS.md`.

## Non-negotiable rules

1. **The simulation decides outcomes; AI only writes words.** Character AI returns dialogue plus, at most, one intent from a whitelist. The sim validates the intent and applies it. Model text never changes game state directly.
2. **Deterministic simulation.** `packages/sim` is pure TypeScript: no I/O, no `Date.now()`, no `Math.random()`. A seeded RNG lives in state. The same inputs must always produce the same outputs.
3. **Money is integer kobo** (₦1 = 100 kobo). Never use floats for money.
4. **Real places, invented people.** Real Nigerian places are fine. Never use real politicians, parties, agencies, armed groups, companies or countries; use the invented names below.
5. **No ethnic, regional or religious villains.** Treat Christian and Muslim communities with equal care and respect.
6. **Corruption is playable but never free.** Every siphoning action raises heat and carries consequences.
7. **Non-graphic violence.** No gore, ever.
8. **Mobile first.** Everything must work on a mid-range Android phone at 360px wide on a slow network.
9. **No real brand UI.** The chat app is WhatsApp-style, not WhatsApp: no logos, names or exact copies of real apps.

## Stack

- pnpm monorepo, TypeScript in strict mode
- `apps/web`: Vite, React, Tailwind; PixiJS for the isometric map; Capacitor later for Android and iOS
- `packages/sim`: the game simulation (pure TS) with Vitest tests
- `packages/content`: typed game data (buildings, characters, events, missions, balance numbers)
- `supabase/`: Postgres migrations with RLS, and Edge Functions (`character-chat`, `voice`)
- `tools/voice-mcp`: local MCP server that wraps Nigerian text-to-speech providers
- Web builds deploy to Cloudflare Pages

```
apps/web/            game client (map, phone UI)
packages/sim/        tick(), systems, tests
packages/content/    buildings, characters, missions, balance.ts
supabase/            migrations, functions
tools/voice-mcp/     voice MCP server
assets/              art, voice, PROMPTS.md
docs/                GDD.md, playtest notes
```

## Simulation conventions

- `tick(state, actions, rng) -> { state, events }` advances one in-game month.
- State is plain, serialisable data.
- Each system (treasury, heat, prices, approval, characters, missions) is its own module with unit tests.
- All balance numbers live in `packages/content/balance.ts`, never hard-coded in systems.
- Ward 7 approval groups: youth, traders and market women, transport workers, families, elites. Each is 0 to 100.
- Heat thresholds: 30 rumours, 50 investigation opens, 70 accounts frozen and defections, 90 arrest.

## Characters and AI chat

- One bible per character in `packages/content/characters/<id>.ts` with name, role, traits (loyalty, ambition, greed, integrity, faith, influence, temper, each 0 to 100), goals, voice (language mix and speech style) and red lines.
- Memories live in the Supabase table `character_memories` (character_id, player_id, month, summary, weight).
- The `character-chat` Edge Function builds the prompt from the bible, the top memories and the relevant state. It calls the Claude API and returns `{ dialogue, intent }`.
- Intent whitelist: `request_meeting`, `offer_bribe`, `offer_support`, `withdraw_support`, `threaten_exposure`, `ask_favour`, `give_info`, `none`.
- API keys stay server-side only.
- Use a small, fast model for routine chat and a stronger one for key story scenes. Cache replies where possible and enforce a daily chat allowance per player, with pre-written fallback lines.
- Pidgin, Yoruba, Hausa and Igbo appear naturally in dialogue. Keep them respectful; no caricature.

## Invented names (use these, never real ones)

- Parties: Green Eagle Party (GEP), Rising Sun Alliance (RSA), People's Voice Movement (PVM)
- Agencies: Financial Integrity Commission (FIC), National Electoral Board (NEB), State Intelligence Bureau (SIB)
- Unions: University Lecturers' Union (ULU), Park Owners' Union (POU)
- Armed groups: Black Harmattan, Creek Lords, Forest Riders, The Syndicate
- Foreign and outside players: Vestria, Ostrakhan, International Monetary Board (IMB), Halvorsen Petroleum, West African Union (WAU)
- Media and apps: The Lagos Ledger (newspaper), Gist (social app)

## MCP tools

- **Higgsfield:** concept art, character portraits, building concepts. Keep one reference sheet per character in `assets/refs/` and reuse it for consistent faces. Save outputs to `assets/` with descriptive names and log every prompt in `assets/PROMPTS.md`.
- **voice** (`tools/voice-mcp`): generates voice lines through a configurable provider (YarnGPT, 9jaLingo or Spitch). Save to `assets/voice/<character>/<line-id>.mp3`. Native speakers check every scripted line before release.
- **Unreal Engine:** Phase 3 only. Don't use it in Phases 0 to 2.

## How to work

- Plan first for any change touching more than 3 files, then build in small steps.
- Add or update tests for every sim change. Run `pnpm test`, `pnpm typecheck` and `pnpm lint` before calling a task done.
- Commit after each working step with a clear message.
- Ask before adding a dependency, changing a rule in this file, or changing the stack.
- UI copy: plain, warm Nigerian English. Show money as ₦ with thousands separators.
