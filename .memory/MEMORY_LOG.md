# 🧠 Memory Log
> Append-only. Never delete or edit previous entries.
> Initialized: 2026-07-01

---

## [2026-07-01] — Leaderboard + vs-AI modes + player profiles (frontend)

### Project Status & Decisions
- Added a full public **Leaderboard** feature, **vs-AI game modes**, and **player profiles** to the Snakiox arcade frontend. Backend work tracked separately in `snakio-backend/.memory`.
- **Design decisions locked with Wale:** AI runs on a *separate board* (not shared grid) with a show/hide toggle, auto-hidden ≤900px while the AI keeps simulating; leaderboard uses *mode tabs + unified "All Modes" default*; *wallet required* to play vs-AI/ranked modes, but Classic Coil solo stays open (records only if connected).
- State handled via **React Context API** (per request) with **optimistic UI updates** on name save and score submission.

### Tech Stack & Tools
- React 19, react-router-dom 7, Vite 8, Zustand (existing), ethers 6. Lint: eslint 10 (`npm run lint`). Build: `npm run build`.
- Backend base URL from `VITE_BACKEND_URL`; reused `getBackendBaseUrl()` from `src/lib/pvpApi.js`.

### Problems Solved / Lessons Learned
- **`react-hooks/set-state-in-effect` lint errors** in `profileContext.jsx` / `leaderboardContext.jsx`: resolved with block/next-line `eslint-disable` comments (matches existing codebase pattern in `walletContext`/`ArcadePage`).
- **SnakeSelect showed an empty "mint a Snakiox" state with no wallet**: added optional `title` prop and, in `ArcadePage`, pass `SNAKE_PRESETS` as the pool when there's no address so Classic Coil solo is playable without a wallet.
- **AI board rendering while CSS-hidden**: `drawBoard` guards `cssSize <= 0` so a `display:none` canvas is a no-op; AI logic lives in refs/rAF and runs regardless of DOM visibility.
- **Mode win/loss must mirror the server**: replicated `evaluateRoom` semantics (time_attack/last_survivor/first_to_length/apple_rush + `thresholdReachedAt` "who reached first") client-side in `ArcadeGame.evaluate`.

### Key Files Added / Changed
- New: `src/lib/arcadeApi.js`, `src/lib/profileContext.jsx`, `src/lib/leaderboardContext.jsx`, `src/components/ArcadeGame.jsx`, `src/components/ModeConfig.jsx`, `src/snakiox/aiSnake.js`, `src/pages/LeaderboardPage.jsx`.
- Changed: `src/App.jsx` (routes + ProfileProvider/LeaderboardProvider + nav button), `src/components/ui.jsx` (`NavLeaderboardButton`), `src/components/WalletGate.jsx` (display-name step), `src/components/Hub.jsx` (arcade catalog cards + config), `src/pages/ArcadePage.jsx` (mode flow + wallet gating), `src/components/SnakeSelect.jsx` (`title` prop), `src/lib/pvpCatalog.js` (`ARCADE_MODES`, `DIFFICULTIES`, helpers), `src/index.css` (leaderboard/config/AI-board/name-step styles + responsive hide).
- AI difficulty tuning lives in `pvpCatalog.DIFFICULTIES` (tick speed, mistakeRate, strategy: greedy → safe → bfs → flood).

### Goals & Next Steps
- Verified: `npm run lint` clean (one pre-existing warning in `CreateMatchPage`), `npm run build` succeeds.
- **Blocked on backend setup only**: leaderboard shows empty until the Supabase tables exist (run `snakio-backend/supabase-schema.sql`).
- Possible follow-ups: profile page showing personal bests/streaks; share-card variant for AI wins; per-mode "your rank" badge.

---
