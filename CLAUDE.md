# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A static HTML/CSS/JS site for "홀리윈 2026 전도 명단" (a church outreach event's mobile prayer-list app). No framework, no bundler, no `package.json` — plain files loaded via `<link>`/`<script>` tags. The whole app renders inside a single `.phone` mockup (390×844) with two screens toggled by CSS class (`#screen-list`, `#screen-ticket`).

## Running it locally

There is no build/lint/test tooling (no `package.json`). To view the site:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080/index.html`. Opening `index.html` directly via `file://` will break `fetch()` (CORS), since `entries.js` fetches `assets/data/entries.json`.

## Architecture

**Entry point:** `index.html` at the repo root contains both screens' markup (list screen + ticket detail screen) inside one `.phone` container, and loads `assets/css/init.css` + `assets/css/entries.css` + `assets/js/entries.js`.

**Screen flow (`assets/js/entries.js`):** fetches `./assets/data/entries.json` (fetch paths resolve relative to `index.html`, not to the script file), renders list cards into `#list-recent`/`#list-past`, and toggles screens via the `.screen--hidden` class rather than routing — there is no router or multi-page navigation.

**Asset layout is organized by file type, not by feature:** `assets/css/`, `assets/js/`, `assets/data/`, `assets/fonts/`, `assets/imgs/`. When adding a new feature/screen, follow this convention (e.g. a new feature gets `assets/css/<feature>.css`, `assets/js/<feature>.js`, `assets/data/<feature>.json`) rather than grouping by feature folder.

**Fonts:** Pretendard is self-hosted (`assets/fonts/*.woff2`, 9 static weights) and registered via `@font-face` at the top of `entries.css`. No external font CDN is used.

**Design system (`docs/`):** `docs/DESIGN.md` is the entry point — it's a reference index (`@docs/01-...md` through `@docs/09-...md`) meant to be passed to the AI alongside every new screen request. The numbered files hold the actual filled-in values for this project (colors, type scale, spacing scale, radius, elevation, components, DO/DON'T guidelines) and `09-shadcn-tokens.md` mirrors those values as shadcn/ui-named CSS custom properties. The `:root` variables actually used in `entries.css` (`--ink`, `--paper`, `--bg`, `--accent`, `--accent-soft`, `--muted`, `--line`, `--card-muted`, `--card-muted-line`) should stay in sync with `docs/02-colors.md` and `docs/09-shadcn-tokens.md` — when changing a color, update both the CSS and the docs. `docs/08-guidelines.md` is meant to keep growing (add a DON'T line whenever a screen comes out looking wrong) rather than be treated as finished.

Current theme is light only (see `docs/01-style-reference.md`); there is no dark-mode variant in the code.

## Memory

Important project memory (decisions, past incidents, conventions learned during work) is stored **inside this repo at `.claude/memory/`**, not in Claude Code's default global per-project memory path (`~/.claude/projects/.../memory/`). Start of `.claude/memory/MEMORY.md` is the index; read it at the start of a session for this repo, since the global auto-memory system does not auto-inject content from this in-repo path — it must be read explicitly. When saving new memory (e.g. via `/save-memory` or ad hoc), write the file directly into `.claude/memory/` using the same `{type}_{slug}.md` frontmatter convention as the existing files there, and update `.claude/memory/MEMORY.md`'s index — do not write to the global path.

## Known repo quirks

- **`.env*` files are hard-blocked.** `.claude/hooks/pre-tool-use.sh` refuses any Read/Write to a path matching `.env`, `.env.*`, etc. (`.claude/settings.json` also denies it at the permissions level). This blocks even `.env.example`. There is currently no working code that reads environment variables — the static JS has no build step to inject them.
- **`.claude/hooks/session-start.sh` and `.mcp.json`'s `supabase` entry describe an unrelated project** ("statkit.cms.api", a Next.js + Supabase + Recoil + shadcn/ui stack — yarn-only, `src/libs/supabase/queries/`, `useAuth()`/`useUser()`, `@/libs/utils`, mock-auth via `profile.id === 'mock-user-id'`). These were copied in from a different repo and do not apply here — this codebase has none of that stack. Ignore the "핵심 규칙" banner printed at session start.
- **`.claude/hooks/formatter.sh`** tries to run `prettier`/`eslint` from `node_modules/.bin` after every Write/Edit; since there's no `node_modules` here, it silently no-ops.

## Foreign agent configs detected

This repo also has an OpenAI Codex config (`.codex/config.toml`, `.codex/agents/`, `AGENTS.md`). Reply `/import` to scan what's importable (MCP servers, slash commands, subagents, instructions) into Claude Code, then `/import --yes=<digest>` to apply it.
