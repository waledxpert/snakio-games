import { useEffect, useState } from "react";
import { connectWallet, hasInjectedWallet, listWallets, shortAddress } from "../snakiox/chain";
import { getPlayer, upsertPlayer } from "../lib/arcadeApi";

export default function WalletGate({ onConnected, onCancel }) {
  const [wallets, setWallets] = useState(() => listWallets());
  const [pending, setPending] = useState(null);
  const [error, setError] = useState("");

  // Second step: set/update the display name once connected.
  const [connectedAddress, setConnectedAddress] = useState(null);
  const [nameInput, setNameInput] = useState("");

  // Wallets can announce themselves a beat after load (EIP-6963) — re-poll
  // briefly so a freshly-injected wallet shows up without a manual refresh.
  useEffect(() => {
    const tick = () => setWallets(listWallets());
    const t1 = setTimeout(tick, 250);
    const t2 = setTimeout(tick, 800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const noWallet = !hasInjectedWallet() && wallets.length === 0;

  const connect = async (wallet) => {
    setError("");
    setPending(wallet.id);
    try {
      const { address } = await connectWallet(wallet);
      // Show the name step immediately; prefill any saved name in the
      // background so a slow backend never delays the UI.
      setConnectedAddress(address);
      setPending(null);
      getPlayer(address)
        .then((profile) => {
          const saved = profile?.name || "";
          if (saved) setNameInput((current) => current || saved);
        })
        .catch(() => {});
    } catch (err) {
      // 4001 = user rejected the request.
      setError(err?.code === 4001 ? "Connection request rejected." : err?.message || "Could not connect.");
      setPending(null);
    }
  };

  const saveNameAndContinue = () => {
    const clean = nameInput.trim().slice(0, 20);
    // Optimistic: continue right away, persist the name in the background.
    if (clean) {
      upsertPlayer({ walletAddress: connectedAddress, name: clean }).catch(() => {});
    }
    onConnected(connectedAddress);
  };

  // ── Step 2: display name ──
  if (connectedAddress) {
    return (
      <div className="page">
        <div className="gate-wrap">
          <div className="gate-card panel">
            <span className="panel-corner tl" />
            <span className="panel-corner tr" />
            <span className="panel-corner bl" />
            <span className="panel-corner br" />

            <p className="page-eyebrow">Connected · {shortAddress(connectedAddress)}</p>
            <h2>Set your display name</h2>
            <p>
              This name shows on the public leaderboard next to your scores. Leave
              it blank to appear as your wallet address. You can change it anytime
              by reconnecting.
            </p>

            <label className="gate-name-field">
              <span className="gate-name-label">Display name</span>
              <input
                className="gate-name-input"
                type="text"
                value={nameInput}
                maxLength={20}
                placeholder="e.g. CoilKing"
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") saveNameAndContinue(); }}
                autoFocus
              />
              <span className="gate-name-count">{nameInput.trim().length}/20</span>
            </label>

            <div className="flex gap-sm" style={{ marginTop: "1.2rem", justifyContent: "center", flexWrap: "wrap" }}>
              <button
                className="pix-btn pix-btn--phosphor pix-btn--lg"
                onClick={saveNameAndContinue}
              >
                Save & continue
              </button>
              <button
                className="pix-btn pix-btn--ghost pix-btn--lg"
                onClick={() => onConnected(connectedAddress)}
              >
                Skip
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="gate-wrap">
        <div className="gate-card panel">
          <span className="panel-corner tl" />
          <span className="panel-corner tr" />
          <span className="panel-corner bl" />
          <span className="panel-corner br" />

          <p className="page-eyebrow">Connect wallet</p>
          <h2>Play with your Snakiox</h2>
          <p>
            Your playable serpents are the Snakiox NFTs you hold on Ethereum.
            Connect your wallet to load your collection — you'll be asked to
            switch to Ethereum mainnet.
          </p>

          {noWallet ? (
            <div className="empty-tile" style={{ textAlign: "left" }}>
              No browser wallet detected. Install{" "}
              <a href="https://metamask.io/download/" target="_blank" rel="noreferrer" className="link">
                MetaMask
              </a>{" "}
              (or another EVM wallet), then reload this page.
            </div>
          ) : (
            <div className="wallet-list">
              {wallets.map((w) => (
                <button
                  key={w.id}
                  className="wallet-option"
                  disabled={pending !== null}
                  onClick={() => connect(w)}
                >
                  <span className="wo-mark" aria-hidden="true">
                    {w.icon ? (
                      <img src={w.icon} alt="" width={22} height={22} style={{ borderRadius: 6 }} />
                    ) : (
                      (w.name?.[0] || "W")
                    )}
                  </span>
                  <span className="stack">
                    <span className="wo-name">{w.name}</span>
                    <span className="wo-addr">Ethereum · ETH</span>
                  </span>
                  {pending === w.id ? (
                    <span className="spinner" style={{ marginLeft: "auto" }} />
                  ) : (
                    <span className="tag" style={{ marginLeft: "auto" }}>Connect</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {error && <p className="gate-error">{error}</p>}

          <p className="gate-note">
            Ethereum mainnet · read-only — we never move funds. We only request
            read access + a network switch.
          </p>

          <div className="flex" style={{ marginTop: "1.2rem", justifyContent: "center" }}>
            <button className="pix-btn pix-btn--ghost" onClick={onCancel}>
              Back to arcade
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
