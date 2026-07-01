import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { getPlayer, upsertPlayer } from "./arcadeApi";
import { useWallet } from "./walletContext";

const ProfileContext = createContext(null);

export function ProfileProvider({ children }) {
  const { address } = useWallet();
  const [name, setNameState] = useState("");
  const [streaks, setStreaks] = useState({ pvai: 0, pvp: 0 });
  const [loading, setLoading] = useState(false);
  const loadSeq = useRef(0);

  // Load the saved profile whenever the connected wallet changes.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!address) {
      setNameState("");
      setStreaks({ pvai: 0, pvp: 0 });
      return;
    }
    const seq = ++loadSeq.current;
    setLoading(true);
    getPlayer(address)
      .then((profile) => {
        if (seq !== loadSeq.current) return;
        setNameState(profile?.name || "");
        const next = { pvai: 0, pvp: 0 };
        for (const row of profile?.streaks || []) {
          if (row.scope === "pvai") next.pvai = row.current_streak ?? 0;
          if (row.scope === "pvp") next.pvp = row.current_streak ?? 0;
        }
        setStreaks(next);
      })
      .catch(() => {
        // 404 (no profile yet) or offline — leave the name blank.
        if (seq === loadSeq.current) setNameState("");
      })
      .finally(() => {
        if (seq === loadSeq.current) setLoading(false);
      });
  }, [address]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Optimistic name update: apply locally first, roll back if the save fails.
  const setName = useCallback(
    async (nextName) => {
      if (!address) return { ok: false, error: "Connect a wallet first." };
      const clean = String(nextName || "").trim().slice(0, 20);
      const previous = name;
      setNameState(clean);
      try {
        await upsertPlayer({ walletAddress: address, name: clean });
        return { ok: true };
      } catch (error) {
        setNameState(previous);
        return { ok: false, error: error?.message || "Could not save name." };
      }
    },
    [address, name],
  );

  return (
    <ProfileContext.Provider value={{ name, streaks, loading, setName }}>
      {children}
    </ProfileContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useProfile() {
  const value = useContext(ProfileContext);
  if (!value) throw new Error("useProfile must be used within ProfileProvider");
  return value;
}
