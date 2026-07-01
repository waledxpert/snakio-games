import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { fetchLeaderboard } from "./arcadeApi";

const LeaderboardContext = createContext(null);

const PAGE_SIZE = 20;

const DEFAULT_FILTERS = {
  mode: "all",
  difficulty: "all",
  opponent: "all",
};

export function LeaderboardProvider({ children }) {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [page, setPageState] = useState(1);
  const [entries, setEntries] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const loadSeq = useRef(0);

  const load = useCallback(
    async (nextFilters, nextPage) => {
      const seq = ++loadSeq.current;
      setLoading(true);
      setError("");
      try {
        const result = await fetchLeaderboard({
          ...nextFilters,
          page: nextPage,
          pageSize: PAGE_SIZE,
        });
        if (seq !== loadSeq.current) return;
        setEntries(result.entries || []);
        setTotal(result.total || 0);
      } catch (err) {
        if (seq !== loadSeq.current) return;
        setEntries([]);
        setTotal(0);
        setError(err?.message || "Could not load the leaderboard.");
      } finally {
        if (seq === loadSeq.current) setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load(filters, page);
  }, [filters, page, load]);

  const setFilter = useCallback((key, value) => {
    setPageState(1);
    setFilters((current) => ({ ...current, [key]: value }));
  }, []);

  const setPage = useCallback((next) => {
    setPageState(Math.max(1, next));
  }, []);

  const refresh = useCallback(() => load(filters, page), [load, filters, page]);

  // Optimistically show a freshly-submitted score at the top of the current
  // view when it matches the active filters and we're on the first page.
  const optimisticInsert = useCallback(
    (row) => {
      if (!row) return;
      const matches =
        (filters.mode === "all" || filters.mode === row.mode) &&
        (filters.difficulty === "all" || filters.difficulty === row.difficulty) &&
        (filters.opponent === "all" || filters.opponent === row.opponent);
      if (!matches || page !== 1) return;
      setEntries((current) => {
        const next = [{ ...row, _optimistic: true }, ...current].slice(0, PAGE_SIZE);
        return next.map((entry, index) => ({ ...entry, rank: index + 1 }));
      });
      setTotal((current) => current + 1);
    },
    [filters, page],
  );

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <LeaderboardContext.Provider
      value={{
        ...filters,
        page,
        pageSize: PAGE_SIZE,
        entries,
        total,
        totalPages,
        loading,
        error,
        setFilter,
        setPage,
        refresh,
        optimisticInsert,
      }}
    >
      {children}
    </LeaderboardContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLeaderboard() {
  const value = useContext(LeaderboardContext);
  if (!value)
    throw new Error("useLeaderboard must be used within LeaderboardProvider");
  return value;
}
