import { useEffect, useRef, useState } from "react";
import { BACKGROUNDS, getBackground } from "../snakiox/backgrounds";
import { paintThumb, rarityClass } from "../lib/helpers";

function BgThumb({ bg }) {
  const ref = useRef(null);
  useEffect(() => {
    paintThumb(ref.current, (...args) => bg.paint(...args), 10);
  }, [bg]);
  return <canvas ref={ref} />;
}

function NftTile({ token, selected, onSelect }) {
  const svgUrl = `data:image/svg+xml;utf8,${encodeURIComponent(token.svg)}`;
  return (
    <button
      className={`nft-tile ${selected ? "nft-tile--selected" : ""}`}
      onClick={() => onSelect(token)}
    >
      <div className="nft-art">
        <img src={svgUrl} alt={`${token.name} — ${token.traits.skin}`} loading="lazy" />
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

export default function SnakeSelect({ wallet, snakes, initialSnakeId, initialBgId, onStart, onBack }) {
  const [snakeId, setSnakeId] = useState(initialSnakeId ?? snakes[0]?.tokenId);
  const [bgId, setBgId] = useState(initialBgId ?? BACKGROUNDS[0].id);

  const snake = snakes.find((s) => s.tokenId === snakeId) ?? snakes[0];
  const bg = getBackground(bgId);
  const svgUrl = `data:image/svg+xml;utf8,${encodeURIComponent(snake.svg)}`;
  const t = snake.traits;

  return (
    <div className="page">
      <div className="flex-between" style={{ marginBottom: "1.2rem" }}>
        <button className="pix-btn pix-btn--ghost pix-btn--lg" onClick={onBack}>
          ← Arcade
        </button>
        <div className="tag">Classic Coil · Setup</div>
      </div>

      <header className="page-head">
        <p className="page-eyebrow">{wallet ? wallet.label : "Demo collection"}</p>
        <h1 className="page-title">Choose your serpent</h1>
        <p className="page-sub">
          Pick the Snakiox you'll run with — its skin and gaze render live in
          the arena. Then pick a backdrop and start the run.
        </p>
      </header>

      <div className="select-layout">
        <section>
          <h3 className="section-title">Your Snakiox ({snakes.length})</h3>
          {snakes.length === 0 ? (
            <div className="empty-tile">
              No Snakiox found in this wallet for the demo. Reconnect to reload.
            </div>
          ) : (
            <div className="nft-grid">
              {snakes.map((token) => (
                <NftTile
                  key={token.tokenId}
                  token={token}
                  selected={token.tokenId === snakeId}
                  onSelect={(tk) => setSnakeId(tk.tokenId)}
                />
              ))}
            </div>
          )}
        </section>

        <aside className="select-side">
          <div className="panel" style={{ padding: "1rem" }}>
            <span className="panel-corner tl" />
            <span className="panel-corner tr" />
            <span className="panel-corner bl" />
            <span className="panel-corner br" />
            <h3 className="section-title">Selected</h3>
            <div className="legend-mini" style={{ alignItems: "flex-start" }}>
              <img src={svgUrl} alt={snake.name} />
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
