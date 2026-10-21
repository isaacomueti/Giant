# Phase 0: Ward 7 prototype, Claude Code task list

Goal: a playable web build of one Lagos ward (Ward 7, Mushin) in about 8 weeks, ready for 20 playtesters.
Gate to Phase 1: the 20 playtesters finish the prototype and ask for more.

## One-time setup (you do these)

1. Install Claude Code and sign in with your Claude account.
2. Create the repo and put `CLAUDE.md` and this file at the root.
3. Export the GIANT design doc from Claude Docs as Markdown and save it as `docs/GDD.md`.
4. Create a Supabase project. Keep keys in `.env.local` and make sure it is in `.gitignore`.
5. Check your MCP servers: start Claude Code and run `/mcp`.
   - **Higgsfield:** your claude.ai connector should already be listed. If it isn't, run
     `claude mcp add --transport http --scope user higgsfield https://mcp.higgsfield.ai/mcp`
     then sign in from `/mcp`.
   - **Voice:** you build this in Task 9. Before that task, install the MCP builder plugin:
     `/plugin install mcp-server-dev@claude-plugins-official`
   - **Unreal Engine:** not needed until Phase 3. When you get there:
     `/plugin install unreal-engine-skills-for-claude-code@claude-plugins-official`,
     enable the ModelContextProtocol and AllToolsets plugins in Unreal Editor, then run
     `ModelContextProtocol.StartServer` in the editor console. Commit your project before every Unreal session.

## Tasks

Paste each prompt into Claude Code, one task at a time. Start a fresh session for each task, and check the result before moving on.

- [ ] **1. Scaffold the monorepo**
  > Read CLAUDE.md. Scaffold the pnpm monorepo exactly as described: apps/web (Vite, React, TypeScript strict, Tailwind), packages/sim and packages/content with Vitest, a shared tsconfig, ESLint and Prettier, and the scripts pnpm dev, test, typecheck and lint. Add a placeholder home screen that says GIANT. Commit.

- [ ] **2. Simulation core**
  > In packages/sim, build the core: the GameState type, a seeded RNG, and tick(state, actions, rng) that advances one month. Add the treasury and the personal account in integer kobo with income and expense ledgers, and the heat meter (0 to 100) that emits events at 30, 50, 70 and 90. Write unit tests for determinism (same seed, same result), money integrity (no floats, ledgers balance) and the heat thresholds.

- [ ] **3. Ward economy**
  > Add Ward 7's economy in packages/content and packages/sim. Building types: ward office, market, primary school, borehole, primary health centre, motor park, police post, drainage, solar streetlights, and faith land grant (church or mosque). Each has build cost, monthly upkeep, jobs and effects. Add a household food basket (rice, garri, beans, tomatoes, bread, transport fare) whose prices respond to supply, road quality and fuel price. Add approval for the 5 groups in CLAUDE.md. Put every number in balance.ts and test each effect.

- [ ] **4. Isometric map**
  > In apps/web, render Ward 7 as a 24x24 isometric tile map with PixiJS: roads, pan and pinch-zoom on phones, and a build menu to place buildings with placeholder art. Wire placement to sim actions. It must run smoothly at 360px wide on a mid-range Android phone.

- [ ] **5. Phone interface**
  > Build the in-game phone as the main interface: a home screen with Chats, Bank, News, Map and Calendar apps. Bank shows the treasury and personal account side by side with their transactions. News shows the month's sim events as headlines. Chats uses a WhatsApp-style list and thread view with no real-app branding. Add an End Month button that runs tick and shows what changed.

- [ ] **6. Characters and AI chat**
  > Create 8 character bibles in packages/content/characters: Kolawole "KK" Ajibade (chief of staff), Alhaja Morenike Bakare (Iyaloja of the market), Taiwo "Iron Bender" Lawal (Park Owners' Union chairman), Chief Remilekun Oduyoye "The Landlord" (godfather), Ngozi Eze (journalist, The Lagos Ledger), Zainab Yusuf (economics student), Mama Ronke (buka owner) and Sunday Ekpo (okada rider). Add the Supabase migration for character_memories with RLS, and the character-chat Edge Function that calls the Claude API and returns { dialogue, intent } using the whitelist in CLAUDE.md. The sim validates and applies intents. Add pre-written fallback lines for when the API fails or the daily allowance runs out.

- [ ] **7. First three missions**
  > Add three missions as data plus sim hooks: Borehole Politics, Tomato Wahala and The Landlord's Dinner (see docs/GDD.md). Each one arrives as a chat message, offers 2 to 4 choices, and changes money, heat, approval and character memories. Test every branch.

- [ ] **8. Ward election**
  > Add the ward councillor election after 12 in-game months: campaign actions in the last 3 months, turnout by approval group on election day, and a results-night screen that reveals results polling unit by polling unit. Winning or losing ends the prototype with a summary of the player's record.

- [ ] **9. Voice MCP server and bake-off**
  > Run /mcp-server-dev:build-mcp-server and build a local stdio server in tools/voice-mcp with one tool, speak(text, language, voice, out_path). Support three providers chosen by a setting: yarngpt, 9jalingo and spitch, each reading its API key from an environment variable. Register it in .mcp.json using ${VAR} references, never raw keys. Then generate a bake-off: 10 lines each in Nigerian English, Pidgin, Yoruba, Hausa and Igbo, for every provider that supports the language, saved to assets/voice/bakeoff/ with an index.md listing them.

- [ ] **10. Art pass**
  > Using the Higgsfield tools, create a reference portrait sheet for each of the 8 characters (front view, three-quarter view and 3 expressions) and isometric concept art for the 10 building types, all in one consistent style. Save to assets/ and log every prompt in assets/PROMPTS.md. Then replace the placeholder art on the map and in Chats.

- [ ] **11. Playtest build**
  > Deploy apps/web to Cloudflare Pages. Add a short feedback form saved to Supabase and basic event logging: months reached, choices made, and where players quit.

- [ ] **12. Playtest and review** (you lead this one)
  Recruit 20 Nigerian players and watch at least 5 of them play live. Then ask Claude Code:
  > Summarise the playtest logs and feedback into docs/playtest-1.md, with the top 5 problems and a proposed fix for each.

## Tips

- If a task feels big, ask Claude Code to plan it first and approve the plan before it writes code.
- Keep the voice bake-off results and have native speakers vote before you pick a provider.
- YarnGPT's open model is marked experimental, so treat it as a prototype voice until licences are reviewed.
