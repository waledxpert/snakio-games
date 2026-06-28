import { useCallback, useEffect, useRef, useState } from "react";
import Hub from "./components/Hub";
import WalletGate from "./components/WalletGate";
import SnakeSelect from "./components/SnakeSelect";
import SnakeGame from "./components/SnakeGame";
import { Brand, WalletPill } from "./components/ui";
import {
  getConnectedAccount,
  loadWalletSnakes,
  watchWallet
} from "./snakiox/chain";

// Screens: hub -> wallet -> select -> game
export default function App() {
  const [address, setAddress] = useState(null);
  const [screen, setScreen] = useState("hub"); // hub | wallet | select | game
  const [snakes, setSnakes] = useState([]);
  const [loadingSnakes, setLoadingSnakes] = useState(false);
  const [loadError, setLoadError] = useState("");

  // Remember choices so returning from a run preserves your setup.
  const [pickedSnakeId, setPickedSnakeId] = useState(null);
  const [pickedBgId, setPickedBgId] = useState(null);
  const [activeSnake, setActiveSnake] = useState(null);
  const [activeBg, setActiveBg] = useState(null);

  // Guard against a stale async load (e.g. fast wallet switch) clobbering state.
  const loadSeq = useRef(0);

  const loadSnakes = useCallback(async (addr) => {
    const seq = ++loadSeq.current;
    setLoadingSnakes(true);
    setLoadError("");
    try {
      const owned = await loadWalletSnakes(addr);
      if (seq !== loadSeq.current) return; // a newer load superseded us
      setSnakes(owned);
    } catch (err) {
      if (seq !== loadSeq.current) return;
      setSnakes([]);
      setLoadError(err?.message || "Could not load your Snakiox.");
    } finally {
      if (seq === loadSeq.current) setLoadingSnakes(false);
    }
  }, []);

  const connect = useCallback((addr) => {
    setAddress(addr);
    setScreen("select");
    loadSnakes(addr);
  }, [loadSnakes]);

  const disconnect = useCallback(() => {
    loadSeq.current++; // invalidate any in-flight load
    setAddress(null);
    setSnakes([]);
    setLoadError("");
    setActiveSnake(null);
    setActiveBg(null);
    setPickedSnakeId(null);
    setPickedBgId(null);
    setScreen("hub");
  }, []);

  const goHub = useCallback(() => setScreen("hub"), []);

  // Silent reconnect if the wallet already authorized this site, and react to
  // the user switching accounts / disconnecting from the wallet itself.
  useEffect(() => {
    getConnectedAccount().then((addr) => {
      if (addr) {
        setAddress(addr);
        loadSnakes(addr);
      }
    });

    const unwatch = watchWallet({
      onAccountsChanged: (addr) => {
        if (!addr) {
          disconnect();
          return;
        }
        setAddress(addr);
        setPickedSnakeId(null);
        setPickedBgId(null);
        setActiveSnake(null);
        setActiveBg(null);
        loadSnakes(addr);
      },
      // A network change can change what reads return — simplest correct move is
      // a fresh reload of the collection.
      onChainChanged: () => {
        setAddress((cur) => {
          if (cur) loadSnakes(cur);
          return cur;
        });
      }
    });
    return unwatch;
  }, [loadSnakes, disconnect]);

  const handlePlayGame = useCallback(() => {
    setScreen(address ? "select" : "wallet");
  }, [address]);

  const handleStartRun = useCallback(({ snake, bg }) => {
    setActiveSnake(snake);
    setActiveBg(bg);
    setPickedSnakeId(snake.tokenId);
    setPickedBgId(bg.id);
    setScreen("game");
  }, []);

  const gameReady = activeSnake && activeBg;

  return (
    <div className="app-shell crt-bg">
      <header className="navbar">
        <Brand onClick={goHub} />
        <WalletPill
          address={address}
          onConnect={() => setScreen("wallet")}
          onDisconnect={disconnect}
          onMySnakiox={() => setScreen("select")}
        />
      </header>

      {screen === "hub" && <Hub onPlay={handlePlayGame} wallet={address} />}

      {screen === "wallet" && (
        <WalletGate onConnected={connect} onCancel={goHub} />
      )}

      {screen === "select" && (
        <SnakeSelect
          address={address}
          snakes={snakes}
          loading={loadingSnakes}
          error={loadError}
          onReload={() => address && loadSnakes(address)}
          initialSnakeId={pickedSnakeId}
          initialBgId={pickedBgId}
          onStart={handleStartRun}
          onBack={goHub}
        />
      )}

      {screen === "game" && gameReady && (
        <SnakeGame
          snake={activeSnake}
          bg={activeBg}
          onExit={goHub}
          onChangeSetup={() => setScreen("select")}
        />
      )}

      {screen === "game" && !gameReady && (
        <div className="page">
          <p className="muted">No snake selected.</p>
          <button className="pix-btn pix-btn--phosphor mt-md" onClick={() => setScreen("select")}>
            Choose a snake
          </button>
        </div>
      )}

      <footer className="tag center" style={{ padding: "1.4rem", borderTop: "1px solid var(--line)" }}>
        Snakiox Arcade · demo build · playable serpents powered by your minted NFTs
      </footer>
    </div>
  );
}
