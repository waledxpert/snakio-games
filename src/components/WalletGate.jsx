import { useState } from "react";
import { MOCK_WALLETS } from "../snakiox/mockWallet";

export default function WalletGate({ onConnect, onCancel }) {
  const [pending, setPending] = useState(null);

  const connect = (wallet) => {
    setPending(wallet.id);
    // Simulate the wallet signature round-trip.
    window.setTimeout(() => {
      onConnect(wallet);
    }, 850);
  };

  return (
    <div className="page">
      <div className="gate-wrap">
        <div className="gate-card panel">
          <span className="panel-corner tl" />
          <span className="panel-corner tr" />
          <span className="panel-corner bl" />
          <span className="panel-corner br" />

          <p className="page-eyebrow">Demo wallet</p>
          <h2>Connect to play with your Snakiox</h2>
          <p>
            Your playable serpents come from the Snakiox NFTs in your wallet.
            Connect below to load your collection. This is a demo — no
            transactions are signed.
          </p>

          <div className="wallet-list">
            {MOCK_WALLETS.map((w) => (
              <button
                key={w.id}
                className="wallet-option"
                disabled={pending !== null}
                onClick={() => connect(w)}
              >
                <span
                  className="wo-mark"
                  style={{ background: w.accent, color: "#0a0d0a", borderColor: w.accent }}
                >
                  {w.kind[0]}
                </span>
                <span className="stack">
                  <span className="wo-name">{w.kind}</span>
                  <span className="wo-addr">{w.label}</span>
                </span>
                {pending === w.id ? (
                  <span className="spinner" style={{ marginLeft: "auto" }} />
                ) : (
                  <span className="tag" style={{ marginLeft: "auto" }}>Connect</span>
                )}
              </button>
            ))}
          </div>

          <p className="gate-note">
            Demo mode · pick either to load a sample collection of 6 Snakiox.
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
