import { Suspense, lazy } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { Brand, NavLeaderboardButton, WalletPill } from "./components/ui";
import { WalletProvider, useWallet } from "./lib/walletContext";
import { ProfileProvider } from "./lib/profileContext";
import { LeaderboardProvider } from "./lib/leaderboardContext";

const ArcadePage = lazy(() => import("./pages/ArcadePage"));
const HomePage = lazy(() => import("./pages/HomePage"));
const CreateMatchPage = lazy(() => import("./pages/CreateMatchPage"));
const JoinMatchPage = lazy(() => import("./pages/JoinMatchPage"));
const LobbyPage = lazy(() => import("./pages/LobbyPage"));
const MatchPage = lazy(() => import("./pages/MatchPage"));
const ResultsPage = lazy(() => import("./pages/ResultsPage"));
const ConnectWalletPage = lazy(() => import("./pages/ConnectWalletPage"));
const ShareResultPage = lazy(() => import("./pages/ShareResultPage"));
const LeaderboardPage = lazy(() => import("./pages/LeaderboardPage"));

function RouteFallback() {
  return (
    <div className="page page--wide">
      <div className="panel pvp-panel-pad center">
        <p className="page-eyebrow">Loading</p>
        <p className="muted">Preparing the next screen…</p>
      </div>
    </div>
  );
}

function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const { address, disconnect } = useWallet();

  return (
    <div className="app-shell crt-bg">
      <header className="navbar">
        <Brand onClick={() => navigate("/")} />
        <div className="navbar-actions">
          <NavLeaderboardButton
            onClick={() => navigate("/leaderboard")}
            active={location.pathname === "/leaderboard"}
          />
          <WalletPill
            address={address}
            onConnect={() =>
              navigate("/connect", { state: { from: location.pathname } })
            }
            onDisconnect={disconnect}
            onMySnakiox={() => navigate("/")}
          />
        </div>
      </header>

      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<ArcadePage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/pvp" element={<HomePage />} />
          <Route path="/connect" element={<ConnectWalletPage />} />
          <Route path="/create-match" element={<CreateMatchPage />} />
          <Route path="/play/:code" element={<JoinMatchPage />} />
          <Route path="/lobby/:code" element={<LobbyPage />} />
          <Route path="/match/:code" element={<MatchPage />} />
          <Route path="/results/:code" element={<ResultsPage />} />
          <Route path="/share/:shareId" element={<ShareResultPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>

      <footer
        className="tag center"
        style={{ padding: "1.4rem", borderTop: "1px solid var(--line)" }}
      >
        Snakiox Arcade · classic coil + private PvP
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <WalletProvider>
        <ProfileProvider>
          <LeaderboardProvider>
            <AppShell />
          </LeaderboardProvider>
        </ProfileProvider>
      </WalletProvider>
    </BrowserRouter>
  );
}
