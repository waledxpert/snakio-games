// Tiny shared UI components used across screens.
import { useEffect, useRef, useState } from "react";
import { explorerAddressUrl, shortAddress } from "../snakiox/chain";

export function Logo({ size = 28 }) {
  // Blocky pixel serpent head mark.
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      aria-hidden="true"
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
    <div className="topbar-left" onClick={onClick} role="button" tabIndex={0}>
      <Logo />
      <div className="stack">
        <span className="brand">
          SNAKI<span className="brand-accent">O</span>X
        </span>
        <span className="brand-sub">Arcade</span>
      </div>
    </div>
  );
}

export function WalletPill({ address, onConnect, onDisconnect }) {
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
      <button className="pix-btn pix-btn--phosphor" onClick={onConnect} title="Connect your wallet">
        Connect Wallet
      </button>
    );
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* clipboard blocked — ignore */
    }
  };

  return (
    <div className="wallet-menu" ref={ref}>
      <button className="wallet-pill" title={address} onClick={() => setOpen((v) => !v)}>
        <span className="dot" />
        {shortAddress(address)}
        <span className="wallet-pill-caret">▾</span>
      </button>
      {open && (
        <div className="wallet-dropdown panel">
          <span className="panel-corner tl" />
          <span className="panel-corner br" />
          <div className="wd-addr">{shortAddress(address)}</div>
          <button className="wd-item" onClick={copy}>
            {copied ? "Copied ✓" : "Copy address"}
          </button>
          <a className="wd-item" href={explorerAddressUrl(address)} target="_blank" rel="noreferrer">
            View on Etherscan ↗
          </a>
          <button className="wd-item wd-item--danger" onClick={() => { setOpen(false); onDisconnect(); }}>
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
