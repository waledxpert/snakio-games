import { Suspense, lazy, useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "../lib/walletContext";

const Hub = lazy(() => import("../components/Hub"));
const WalletGate = lazy(() => import("../components/WalletGate"));
const SnakeSelect = lazy(() => import("../components/SnakeSelect"));
const SnakeGame = lazy(() => import("../components/SnakeGame"));

function ScreenFallback() {
  return (
    <div className="page">
      <div className="panel pvp-panel-pad center">
        <p className="page-eyebrow">Loading</p>
        <p className="muted">Preparing the arcade screen…</p>
      </div>
    </div>
  );
}

export default function ArcadePage() {
  const navigate = useNavigate();
  const {
    address,
    snakes,
    loadingSnakes,
    loadError,
    acceptConnectedAddress,
    reloadSnakes,
  } = useWallet();

  const [screen, setScreen] = useState("hub");
  const [pickedSnakeId, setPickedSnakeId] = useState(null);
  const [pickedBgId, setPickedBgId] = useState(null);
  const [activeSnake, setActiveSnake] = useState(null);
  const [activeBg, setActiveBg] = useState(null);

  useEffect(() => {
    if (!address && screen !== "hub" && screen !== "wallet") {
      setScreen("hub");
    }
  }, [address, screen]);

  const goHub = useCallback(() => setScreen("hub"), []);

  const handlePlayGame = useCallback(
    (gameId) => {
      if (gameId === "pvp") {
        navigate("/pvp");
        return;
      }
      setScreen(address ? "select" : "wallet");
    },
    [address, navigate],
  );

  const handleStartRun = useCallback(({ snake, bg }) => {
    setActiveSnake(snake);
    setActiveBg(bg);
    setPickedSnakeId(snake.tokenId);
    setPickedBgId(bg.id);
    setScreen("game");
  }, []);

  const gameReady = activeSnake && activeBg;

  return (
    <Suspense fallback={<ScreenFallback />}>
      {screen === "hub" && <Hub onPlay={handlePlayGame} wallet={address} />}

      {screen === "wallet" && (
        <WalletGate
          onConnected={(addr) => {
            acceptConnectedAddress(addr);
            setScreen("select");
          }}
          onCancel={goHub}
        />
      )}

      {screen === "select" && (
        <SnakeSelect
          address={address}
          snakes={snakes}
          loading={loadingSnakes}
          error={loadError}
          onReload={reloadSnakes}
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
          <button
            className="pix-btn pix-btn--phosphor mt-md"
            onClick={() => setScreen("select")}
          >
            Choose a snake
          </button>
        </div>
      )}
    </Suspense>
  );
}
