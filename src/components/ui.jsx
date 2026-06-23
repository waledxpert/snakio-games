// Tiny shared UI components used across screens.

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

export function WalletPill({ wallet, onDisconnect }) {
  if (!wallet) {
    return (
      <button
        className="pix-btn pix-btn--phosphor"
        onClick={onDisconnect}
        title="Connect a demo wallet"
      >
        Connect Wallet
      </button>
    );
  }
  return (
    <span className="wallet-pill" title={wallet.id}>
      <span className="dot" />
      {wallet.label}
    </span>
  );
}
