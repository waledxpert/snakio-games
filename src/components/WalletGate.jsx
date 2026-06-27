import { useEffect, useState } from "react";
import { connectWallet, hasInjectedWallet, listWallets } from "../snakiox/chain";

export default function WalletGate({ onConnected, onCancel }) {
  const [wallets, setWallets] = useState(() => listWallets());
  const [pending, setPending] = useState(null);
  const [error, setError] = useState("");

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
      onConnected(address);
    } catch (err) {
      // 4001 = user rejected the request.
      setError(err?.code === 4001 ? "Connection request rejected." : err?.message || "Could not connect.");
      setPending(null);
    }
  };

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
            Your playable serpents are the Snakiox NFTs you hold on Sepolia.
            Connect your wallet to load your collection — you'll be asked to
            switch to the Sepolia testnet.
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
                    <span className="wo-addr">Sepolia · ETH</span>
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
            Sepolia testnet · no real funds. We only request read access + a
            network switch.
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
