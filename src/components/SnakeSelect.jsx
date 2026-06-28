import { useEffect, useRef, useState } from "react";
import { BACKGROUNDS, getBackground } from "../snakiox/backgrounds";
import { paintThumb, rarityClass } from "../lib/helpers";
import { openseaTokenUrl, shortAddress } from "../snakiox/chain";
import SnakeAvatar from "./SnakeAvatar";

function BgThumb({ bg }) {
  const ref = useRef(null);
  useEffect(() => {
    paintThumb(ref.current, (...args) => bg.paint(...args), 10);
  }, [bg]);
  return <canvas ref={ref} />;
}

function NftTile({ token, selected, onSelect, index = 0 }) {
  return (
    <button
      className={`nft-tile ${selected ? "nft-tile--selected" : ""}`}
      style={{ "--tile-i": index }}
      onClick={() => onSelect(token)}
    >
      <div className="nft-art">
        <SnakeAvatar token={token} />
      </div>
      <div className="nft-meta">
        <div className="nft-id">{token.name}</div>
        <div className="nft-skin">{token.traits.skin}</div>
        <span className={`rarity-tag ${rarityClass(token.traits.rarity)}`}>
          {token.traits.rarity}
        </span>
      </div>
    </button>
  );
}

export default function SnakeSelect({
  address,
  snakes,
  loading,
  error,
  onReload,
  initialSnakeId,
  initialBgId,
  onStart,
  onBack
}) {
  const [snakeId, setSnakeId] = useState(initialSnakeId ?? snakes[0]?.tokenId);
  const [bgId, setBgId] = useState(initialBgId ?? BACKGROUNDS[0].id);

  // The picked id falls back to the first owned token if the current selection
  // isn't in the collection (e.g. after a reload / wallet switch) — derived in
  // render so we never need a state-syncing effect.
  const selectedId = snakes.some((s) => s.tokenId === snakeId) ? snakeId : snakes[0]?.tokenId;

  const header = (
    <>
      <div className="flex-between" style={{ marginBottom: "1.2rem" }}>
        <button className="pix-btn pix-btn--ghost pix-btn--lg" onClick={onBack}>
          ← Arcade
        </button>
        <div className="tag">Classic Coil · Setup</div>
      </div>
      <header className="page-head">
        <p className="page-eyebrow">{address ? shortAddress(address) : "Your collection"}</p>
        <h1 className="page-title">Choose your serpent</h1>
        <p className="page-sub">
          Pick the Snakiox you'll run with — its skin and gaze render live in
          the arena. Then pick a backdrop and start the run.
        </p>
      </header>
    </>
  );

  // ── Loading / empty / error short-circuits ─────────────────────────────────
  if (loading) {
    return (
      <div className="page">
        {header}
        <div className="empty-tile" style={{ display: "grid", placeItems: "center", gap: "0.8rem" }}>
          <span className="spinner" />
          <span>Reading your Snakiox from the chain…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        {header}
        <div className="empty-tile" style={{ textAlign: "center" }}>
          <p style={{ margin: "0 0 1rem" }}>{error}</p>
          <button className="pix-btn pix-btn--phosphor" onClick={onReload}>↻ Retry</button>
        </div>
      </div>
    );
  }

  if (!snakes.length) {
    return (
      <div className="page">
        {header}
        <div className="empty-tile" style={{ textAlign: "center" }}>
          <p style={{ margin: "0 0 0.4rem", fontWeight: 700 }}>No Snakiox in this wallet yet.</p>
          <p className="faint" style={{ margin: "0 0 1.2rem" }}>
            Mint a Snakiox to get a playable serpent, then come back and reload.
          </p>
          <div className="flex gap-sm" style={{ justifyContent: "center", flexWrap: "wrap" }}>
            <button className="pix-btn pix-btn--phosphor" onClick={onReload}>↻ Reload collection</button>
          </div>
        </div>
      </div>
    );
  }

  const snake = snakes.find((s) => s.tokenId === selectedId) ?? snakes[0];
  const bg = getBackground(bgId);
  const t = snake.traits;

  return (
    <div className="page">
      {header}

      <div className="select-layout">
        <section>
          <div className="flex-between" style={{ marginBottom: "0.6rem" }}>
            <h3 className="section-title" style={{ margin: 0 }}>Your Snakiox ({snakes.length})</h3>
            <button className="pix-btn pix-btn--ghost" onClick={onReload}>↻ Reload</button>
          </div>
          <div className="nft-grid">
            {snakes.map((token, i) => (
              <NftTile
                key={token.tokenId}
                token={token}
                selected={token.tokenId === selectedId}
                onSelect={(tk) => setSnakeId(tk.tokenId)}
                index={i}
              />
            ))}
          </div>
        </section>

        <aside className="select-side">
          <div className="panel" style={{ padding: "1rem" }}>
            <span className="panel-corner tl" />
            <span className="panel-corner tr" />
            <span className="panel-corner bl" />
            <span className="panel-corner br" />
            <h3 className="section-title">Selected</h3>
            <div className="legend-mini" style={{ alignItems: "flex-start" }}>
              <SnakeAvatar token={snake} className="legend-avatar" />
              <div className="stack gap-sm">
                <span className="lm-name">{t.skin}</span>
                <span className="lm-sub">{snake.name} · {t.rarity}</span>
                <span className={`rarity-tag ${rarityClass(t.rarity)}`} style={{ marginTop: 2 }}>
                  {t.rarity}
                </span>
              </div>
            </div>
            <dl className="stat-row mt-md">
              <dt>Form</dt><dd>{t.form}</dd>
              <dt>Gaze</dt><dd>{t.gaze}</dd>
              <dt>Series</dt><dd>{t.skinSeries}</dd>
              <dt>Mark</dt><dd>{t.mark}</dd>
              <dt>Crown</dt><dd>{t.crown}</dd>
              <dt>Sigil</dt><dd>{t.sigil}</dd>
            </dl>
            <a
              className="tag link"
              href={openseaTokenUrl(snake.tokenId)}
              target="_blank"
              rel="noreferrer"
              style={{ display: "inline-block", marginTop: "0.6rem" }}
            >
              View on OpenSea ↗
            </a>
          </div>

          <div className="panel" style={{ padding: "1rem" }}>
            <span className="panel-corner tl" />
            <span className="panel-corner br" />
            <h3 className="section-title">Background</h3>
            <div className="bg-row">
              {BACKGROUNDS.map((b) => (
                <button
                  key={b.id}
                  className={`bg-chip ${b.id === bgId ? "bg-chip--selected" : ""}`}
                  onClick={() => setBgId(b.id)}
                  title={b.blurb}
                >
                  <BgThumb bg={b} />
                  <div className="bg-chip-name">{b.name}</div>
                </button>
              ))}
            </div>
            <p className="faint mt-sm" style={{ fontSize: "0.78rem", lineHeight: 1.5, margin: "0.6rem 0 0" }}>
              {bg.blurb}
            </p>
          </div>

          <button
            className="pix-btn pix-btn--phosphor pix-btn--lg pix-btn--block"
            onClick={() => onStart({ snake, bg })}
          >
            ▶ Start Run
          </button>
        </aside>
      </div>
    </div>
  );
}
