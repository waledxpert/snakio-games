import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  getConnectedAccount,
  loadWalletSnakes,
  watchWallet,
} from "../snakiox/chain";

const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const [address, setAddress] = useState(null);
  const [snakes, setSnakes] = useState([]);
  const [loadingSnakes, setLoadingSnakes] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [loadedSnakesOnce, setLoadedSnakesOnce] = useState(false);
  const loadSeq = useRef(0);

  const loadSnakes = useCallback(async (addr) => {
    if (!addr) return;
    const seq = ++loadSeq.current;
    setLoadingSnakes(true);
    setLoadError("");
    try {
      const owned = await loadWalletSnakes(addr);
      if (seq !== loadSeq.current) return;
      setSnakes(owned);
      setLoadedSnakesOnce(true);
    } catch (error) {
      if (seq !== loadSeq.current) return;
      setSnakes([]);
      setLoadError(error?.message || "Could not load your Snakiox.");
      setLoadedSnakesOnce(true);
    } finally {
      if (seq === loadSeq.current) setLoadingSnakes(false);
    }
  }, []);

  const acceptConnectedAddress = useCallback(
    (addr) => {
      setAddress(addr);
      loadSnakes(addr);
    },
    [loadSnakes],
  );

  const disconnect = useCallback(() => {
    loadSeq.current += 1;
    setAddress(null);
    setSnakes([]);
    setLoadError("");
    setLoadingSnakes(false);
    setLoadedSnakesOnce(false);
  }, []);

  useEffect(() => {
    getConnectedAccount().then((addr) => {
      if (addr) acceptConnectedAddress(addr);
    });

    const unwatch = watchWallet({
      onAccountsChanged: (addr) => {
        if (!addr) {
          disconnect();
          return;
        }
        acceptConnectedAddress(addr);
      },
      onChainChanged: () => {
        setAddress((current) => {
          if (current) loadSnakes(current);
          return current;
        });
      },
    });

    return unwatch;
  }, [acceptConnectedAddress, disconnect, loadSnakes]);

  return (
    <WalletContext.Provider
      value={{
        address,
        snakes,
        loadingSnakes,
        loadError,
        loadedSnakesOnce,
        acceptConnectedAddress,
        disconnect,
        reloadSnakes: () => address && loadSnakes(address),
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useWallet() {
  const value = useContext(WalletContext);
  if (!value) throw new Error("useWallet must be used within WalletProvider");
  return value;
}
