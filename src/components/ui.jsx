import { useEffect, useRef, useState } from "react";
import { explorerAddressUrl, shortAddress } from "../snakiox/chain";

export function Logo({ size = 26 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <rect x="2" y="9" width="3" height="3" fill="#6f9d3a" />
      <rect x="5" y="9" width="3" height="3" fill="#9fd84f" />
      <rect x="8" y="6" width="3" height="3" fill="#6f9d3a" />
      <rect x="6" y="3" width="6" height="6" fill="#b6ff5a" />
      <rect x="11" y="4" width="2" height="2" fill="#b6ff5a" />
      <rect x="7" y="4" width="1" height="2" fill="#06140a" />
      <rect x="10" y="4" width="1" height="2" fill="#06140a" />
      <rect x="9" y="2" width="2" height="1" fill="#ff3a6e" />
    </svg>
  );
}

export function Brand({ onClick }) {
  return (
    <button className="nav-brand" onClick={onClick} aria-label="Go to arcade">
      <Logo />
      <span className="nav-brand-text">
        SNAKI<span className="nav-brand-o">O</span>X
      </span>
      <span className="nav-brand-tag">Arcade</span>
    </button>
  );
}

export function NavLeaderboardButton({ onClick, active }) {
  return (
    <button
      className={`nav-leaderboard${active ? " nav-leaderboard--active" : ""}`}
      onClick={onClick}
      aria-label="View leaderboard"
    >
      <span className="nav-leaderboard-icon" aria-hidden="true">🏆</span>
      <span className="nav-leaderboard-text">Leaderboard</span>
    </button>
  );
}

export function WalletPill({ address, onConnect, onDisconnect, onMySnakiox }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  if (!address) {
    return (
      <button className="nav-connect" onClick={onConnect}>
        <span className="nav-connect-dot" aria-hidden="true" />
        <span>Connect</span>
      </button>
    );
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch { /* clipboard blocked */ }
  };

  return (
    <div className="nav-wallet-wrap" ref={ref}>
      <button
        className="nav-wallet"
        onClick={() => setOpen((v) => !v)}
        title={address}
        aria-expanded={open}
      >
        <span className="nav-wallet-dot" aria-hidden="true" />
        <span>{shortAddress(address)}</span>
        <span className="nav-wallet-caret" aria-hidden="true">
          {open ? "▴" : "▾"}
        </span>
      </button>

      {open && (
        <div className="nav-dropdown" role="menu">
          <div className="nav-dd-addr">{shortAddress(address)}</div>

          <button
            className="nav-dd-item"
            role="menuitem"
            onClick={() => { setOpen(false); onMySnakiox?.(); }}
          >
            My Snakiox
          </button>

          <button className="nav-dd-item" role="menuitem" onClick={copy}>
            {copied ? "Copied ✓" : "Copy address"}
          </button>

          <a
            className="nav-dd-item"
            role="menuitem"
            href={explorerAddressUrl(address)}
            target="_blank"
            rel="noreferrer"
          >
            Etherscan ↗
          </a>

          <div className="nav-dd-divider" />

          <button
            className="nav-dd-item nav-dd-item--danger"
            role="menuitem"
            onClick={() => { setOpen(false); onDisconnect(); }}
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
