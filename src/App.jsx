import { useCallback, useMemo, useState } from "react";
import Hub from "./components/Hub";
import WalletGate from "./components/WalletGate";
import SnakeSelect from "./components/SnakeSelect";
import SnakeGame from "./components/SnakeGame";
import { Brand, WalletPill } from "./components/ui";
import { loadWalletSnakes } from "./snakiox/mockWallet";

// Screens: hub -> wallet -> select -> game
export default function App() {
  const [wallet, setWallet] = useState(null);
  const [screen, setScreen] = useState("hub"); // hub | wallet | select | game
  const [snakes, setSnakes] = useState([]);

  // Remember choices so returning from a run preserves your setup.
  const [pickedSnakeId, setPickedSnakeId] = useState(null);
  const [pickedBgId, setPickedBgId] = useState(null);
  const [activeSnake, setActiveSnake] = useState(null);
  const [activeBg, setActiveBg] = useState(null);

  const connect = useCallback((w) => {
    setWallet(w);
    setSnakes(loadWalletSnakes(w.id));
    setScreen("select");
  }, []);

  const disconnect = useCallback(() => {
    setWallet(null);
    setSnakes([]);
    setActiveSnake(null);
    setActiveBg(null);
    setPickedSnakeId(null);
    setPickedBgId(null);
    setScreen("hub");
  }, []);

  const goHub = useCallback(() => setScreen("hub"), []);

  const handlePlayGame = useCallback(() => {
    if (!wallet) {
      setScreen("wallet");
    } else {
      setScreen("select");
    }
  }, [wallet]);

  const handleStartRun = useCallback(({ snake, bg }) => {
    setActiveSnake(snake);
    setActiveBg(bg);
    setPickedSnakeId(snake.tokenId);
    setPickedBgId(bg.id);
    setScreen("game");
  }, []);

  const gameReady = activeSnake && activeBg;
  const headerWalletPill = useMemo(() => wallet, [wallet]);

  return (
    <div className="app-shell crt-bg">
      <header className="topbar">
        <Brand onClick={goHub} />
        <div className="flex gap-sm">
          {wallet && (
            <button className="pix-btn pix-btn--ghost" onClick={() => setScreen("select")}>
              My Snakiox
            </button>
          )}
          <WalletPill
            wallet={headerWalletPill}
            onDisconnect={wallet ? disconnect : () => setScreen("wallet")}
          />
        </div>
      </header>

      {screen === "hub" && <Hub onPlay={handlePlayGame} wallet={wallet} />}

      {screen === "wallet" && (
        <WalletGate onConnect={connect} onCancel={goHub} />
      )}

      {screen === "select" && (
        <SnakeSelect
          wallet={wallet}
          snakes={snakes}
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
