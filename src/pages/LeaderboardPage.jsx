import { useLeaderboard } from "../lib/leaderboardContext";
import { useWallet } from "../lib/walletContext";
import { shortAddress } from "../snakiox/chain";

const MODE_TABS = [
  { id: "all", label: "All Modes" },
  { id: "classic_coil", label: "Classic Coil" },
  { id: "time_attack", label: "Time Attack" },
  { id: "last_survivor", label: "Last Survivor" },
  { id: "first_to_length", label: "First to Length" },
  { id: "apple_rush", label: "Apple Rush" },
];

const DIFFICULTY_TABS = [
  { id: "all", label: "All" },
  { id: "easy", label: "Easy" },
  { id: "medium", label: "Medium" },
  { id: "hard", label: "Hard" },
  { id: "master", label: "Master" },
];

const OPPONENT_TABS = [
  { id: "all", label: "All" },
  { id: "solo", label: "Solo" },
  { id: "ai", label: "vs AI" },
  { id: "pvp", label: "PvP" },
];

function formatDuration(ms) {
  if (ms == null) return "—";
  const totalSeconds = Math.round(ms / 1000);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

// The headline metric column(s) shown per mode.
function metricCells(entry, mode) {
  if (mode === "apple_rush") {
    return [`${entry.apples} 🍎`, formatDuration(entry.durationMs)];
  }
  if (mode === "first_to_length") {
    return [`${entry.length} len`, formatDuration(entry.durationMs)];
  }
  return [`${entry.score} pts`, `${entry.length} len`];
}

function metricHeaders(mode) {
  if (mode === "apple_rush") return ["Apples", "Time"];
  if (mode === "first_to_length") return ["Length", "Time"];
  return ["Score", "Length"];
}

export default function LeaderboardPage() {
  const {
    mode, difficulty, opponent, page, totalPages, entries, total,
    loading, error, setFilter, setPage,
  } = useLeaderboard();
  const { address } = useWallet();
  const myAddress = address?.toLowerCase();

  const [m1, m2] = metricHeaders(mode);

  return (
    <div className="page page--wide">
      <header className="page-head">
        <p className="page-eyebrow">Global rankings</p>
        <h1 className="page-title">Leaderboard</h1>
        <p className="page-sub">
          The top 100 runs across every mode. Switch tabs to rank by a mode's own
          metric, and filter by AI difficulty or opponent.
        </p>
      </header>

      {/* Mode tabs */}
      <div className="lb-tabs">
        {MODE_TABS.map((tab) => (
          <button
            key={tab.id}
            className={`lb-tab${mode === tab.id ? " lb-tab--on" : ""}`}
            onClick={() => setFilter("mode", tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="lb-filters">
        <div className="lb-filter-group">
          <span className="lb-filter-label">Difficulty</span>
          <div className="lb-chip-row">
            {DIFFICULTY_TABS.map((d) => (
              <button
                key={d.id}
                className={`lb-chip${difficulty === d.id ? " lb-chip--on" : ""}`}
                onClick={() => setFilter("difficulty", d.id)}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
        <div className="lb-filter-group">
          <span className="lb-filter-label">Opponent</span>
          <div className="lb-chip-row">
            {OPPONENT_TABS.map((o) => (
              <button
                key={o.id}
                className={`lb-chip${opponent === o.id ? " lb-chip--on" : ""}`}
                onClick={() => setFilter("opponent", o.id)}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="panel lb-panel">
        <div className="lb-table" role="table">
          <div className="lb-row lb-row--head" role="row">
            <span className="lb-col lb-col--rank">#</span>
            <span className="lb-col lb-col--player">Player</span>
            {mode === "all" && <span className="lb-col lb-col--mode">Mode</span>}
            <span className="lb-col lb-col--metric">{m1}</span>
            <span className="lb-col lb-col--metric lb-col--metric2">{m2}</span>
            <span className="lb-col lb-col--streak">Streak</span>
          </div>

          {loading && (
            <div className="lb-empty"><span className="spinner" /> Loading rankings…</div>
          )}

          {!loading && error && <div className="lb-empty">{error}</div>}

          {!loading && !error && entries.length === 0 && (
            <div className="lb-empty">No runs recorded yet. Be the first!</div>
          )}

          {!loading && !error &&
            entries.map((entry) => {
              const [c1, c2] = metricCells(entry, mode);
              const mine = myAddress && entry.walletAddress?.toLowerCase() === myAddress;
              return (
                <div
                  key={`${entry.walletAddress}-${entry.rank}-${entry.createdAt}`}
                  className={`lb-row${mine ? " lb-row--me" : ""}${entry._optimistic ? " lb-row--new" : ""}`}
                  role="row"
                >
                  <span className={`lb-col lb-col--rank lb-rank-${entry.rank <= 3 ? entry.rank : "n"}`}>
                    {entry.rank}
                  </span>
                  <span className="lb-col lb-col--player">
                    <span className="lb-player-name">
                      {entry.name || shortAddress(entry.walletAddress)}
                    </span>
                    {mine && <span className="lb-you-tag">YOU</span>}
                  </span>
                  {mode === "all" && (
                    <span className="lb-col lb-col--mode">
                      <span className="lb-mode-tag">
                        {MODE_TABS.find((t) => t.id === entry.mode)?.label || entry.mode}
                      </span>
                    </span>
                  )}
                  <span className="lb-col lb-col--metric">{c1}</span>
                  <span className="lb-col lb-col--metric lb-col--metric2">{c2}</span>
                  <span className="lb-col lb-col--streak">
                    {entry.streak > 0 ? `🔥 ${entry.streak}` : "—"}
                  </span>
                </div>
              );
            })}
        </div>
      </div>

      {/* Pagination */}
      <div className="lb-pager">
        <button
          className="pix-btn pix-btn--ghost"
          onClick={() => setPage(page - 1)}
          disabled={page <= 1 || loading}
        >
          ← Prev
        </button>
        <span className="lb-pager-label">
          Page {page} / {totalPages} · {total} ranked
        </span>
        <button
          className="pix-btn pix-btn--ghost"
          onClick={() => setPage(page + 1)}
          disabled={page >= totalPages || loading}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
