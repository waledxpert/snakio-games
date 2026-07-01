import { Suspense, lazy, useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "../lib/walletContext";
import { SNAKE_PRESETS, getArcadeMode } from "../lib/pvpCatalog";

const Hub = lazy(() => import("../components/Hub"));
const WalletGate = lazy(() => import("../components/WalletGate"));
const SnakeSelect = lazy(() => import("../components/SnakeSelect"));
const ArcadeGame = lazy(() => import("../components/ArcadeGame"));

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

// Classic Coil solo is the only run that's playable without a wallet.
function requiresWallet(config) {
  return !(config.mode === "classic_coil" && config.opponent === "solo");
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
  const [pendingConfig, setPendingConfig] = useState(null);
  const [pickedSnakeId, setPickedSnakeId] = useState(null);
  const [pickedBgId, setPickedBgId] = useState(null);
  const [activeSnake, setActiveSnake] = useState(null);
  const [activeBg, setActiveBg] = useState(null);

  useEffect(() => {
    if (!address && screen !== "hub" && screen !== "wallet") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setScreen("hub");
    }
  }, [address, screen]);

  const goHub = useCallback(() => {
    setScreen("hub");
    setPendingConfig(null);
  }, []);

  const handlePlayPvp = useCallback(() => navigate("/pvp"), [navigate]);

  const handlePlayArcade = useCallback(
    (config) => {
      setPendingConfig(config);
      if (requiresWallet(config) && !address) {
        setScreen("wallet");
        return;
      }
      setScreen("select");
    },
    [address],
  );

  const handleStartRun = useCallback(({ snake, bg }) => {
    setActiveSnake(snake);
    setActiveBg(bg);
    setPickedSnakeId(snake.tokenId);
    setPickedBgId(bg.id);
    setScreen("game");
  }, []);

  const gameReady = activeSnake && activeBg && pendingConfig;

  return (
    <Suspense fallback={<ScreenFallback />}>
      {screen === "hub" && (
        <Hub onPlayArcade={handlePlayArcade} onPlayPvp={handlePlayPvp} wallet={address} />
      )}

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
          snakes={address ? snakes : SNAKE_PRESETS}
          loading={address ? loadingSnakes : false}
          error={address ? loadError : ""}
          onReload={reloadSnakes}
          initialSnakeId={pickedSnakeId}
          initialBgId={pickedBgId}
          onStart={handleStartRun}
          onBack={goHub}
          title={`${getArcadeMode(pendingConfig?.mode).name} · Setup`}
        />
      )}

      {screen === "game" && gameReady && (
        <ArcadeGame
          snake={activeSnake}
          bg={activeBg}
          config={pendingConfig}
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
