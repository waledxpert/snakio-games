import { useEffect, useRef } from "react";

// A procedurally-painted arcade thumbnail so every card looks alive without
// shipping image assets. Each game gets its own painter + palette.
function paintArena(ctx, w, h, cellPx, palette, motif) {
  ctx.fillStyle = palette.bg;
  ctx.fillRect(0, 0, w, h);
  // soft vignette band
  ctx.fillStyle = palette.bg2;
  ctx.fillRect(0, h * 0.6, w, h * 0.4);

  // grid
  ctx.strokeStyle = palette.grid;
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x <= w; x += cellPx) { ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, h); }
  for (let y = 0; y <= h; y += cellPx) { ctx.moveTo(0, y + 0.5); ctx.lineTo(w, y + 0.5); }
  ctx.stroke();
  ctx.globalAlpha = 1;

  motif(ctx, w, h, cellPx, palette);
}

const MOTIFS = {
  classic(ctx, w, h, cellPx, p) {
    // A little serpentine pixel snake eating an orb.
    const segs = [
      [11, 5], [10, 5], [9, 5], [8, 5], [7, 5], [7, 4], [7, 3], [6, 3], [5, 3], [4, 3], [3, 3]
    ];
    segs.forEach(([gx, gy], i) => {
      ctx.fillStyle = i === 0 ? p.snakeA : i % 2 ? p.snakeB : p.snakeA;
      ctx.fillRect(gx * cellPx + 2, gy * cellPx + 2, cellPx - 4, cellPx - 4);
    });
    // head detail
    ctx.fillStyle = "#06140a";
    ctx.fillRect(11 * cellPx + 4, 5 * cellPx + 4, 3, 3);
    // food orb
    ctx.fillStyle = p.food;
    ctx.beginPath();
    ctx.arc(15 * cellPx + cellPx / 2, 7 * cellPx + cellPx / 2, cellPx * 0.4, 0, Math.PI * 2);
    ctx.fill();
  },
  gravity(ctx, w, h, cellPx, p) {
    // Falling blocks silhouette.
    ctx.fillStyle = p.snakeA;
    const shape = [[2, 1], [3, 1], [2, 2], [6, 2], [7, 2], [6, 3], [9, 1], [9, 2], [10, 2]];
    shape.forEach(([c, r], i) => {
      ctx.fillStyle = i % 2 ? p.snakeB : p.snakeA;
      ctx.fillRect(c * cellPx + 2, r * cellPx + 2, cellPx - 3, cellPx - 3);
    });
  },
  race(ctx, w, h, cellPx, p) {
    // A winding track.
    ctx.strokeStyle = p.snakeA;
    ctx.lineWidth = cellPx * 0.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(0, h * 0.7);
    ctx.bezierCurveTo(w * 0.3, h * 0.2, w * 0.5, h * 0.9, w, h * 0.35);
    ctx.stroke();
    // dashed center
    ctx.strokeStyle = p.food;
    ctx.setLineDash([cellPx, cellPx]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.7);
    ctx.bezierCurveTo(w * 0.3, h * 0.2, w * 0.5, h * 0.9, w, h * 0.35);
    ctx.stroke();
    ctx.setLineDash([]);
  },
  duel(ctx, w, h, cellPx, p) {
    // Two opposing serpents.
    const a = [[12, 2], [11, 2], [10, 2], [10, 3], [10, 4]];
    const b = [[2, 6], [3, 6], [4, 6], [4, 5], [4, 4]];
    a.forEach(([gx, gy], i) => { ctx.fillStyle = i % 2 ? p.snakeB : p.snakeA; ctx.fillRect(gx * cellPx + 2, gy * cellPx + 2, cellPx - 4, cellPx - 4); });
    b.forEach(([gx, gy], i) => { ctx.fillStyle = i % 2 ? "#ff5a5a" : "#c0392b"; ctx.fillRect(gx * cellPx + 2, gy * cellPx + 2, cellPx - 4, cellPx - 4); });
  },
  maze(ctx, w, h, cellPx, p) {
    // Maze walls.
    ctx.fillStyle = p.grid;
    const walls = [[1, 1, 5, 1], [1, 1, 1, 3], [3, 2, 1, 2], [5, 1, 1, 4], [7, 2, 2, 1], [9, 1, 1, 4], [1, 5, 6, 1], [8, 5, 3, 1]];
    walls.forEach(([c, r, cw, ch]) => ctx.fillRect(c * cellPx, r * cellPx, cw * cellPx, ch * cellPx));
    ctx.fillStyle = p.snakeA;
    ctx.fillRect(2 * cellPx + 3, 3 * cellPx + 3, cellPx - 6, cellPx - 6);
    ctx.fillStyle = p.food;
    ctx.beginPath();
    ctx.arc(10 * cellPx + cellPx / 2, 3 * cellPx + cellPx / 2, cellPx * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
};

function Thumb({ palette, motif, cellPx = 16 }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width));
    const h = Math.max(1, Math.round(rect.height));
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    paintArena(ctx, w, h, cellPx, palette, MOTIFS[motif] || MOTIFS.classic);
  }, [palette, motif, cellPx]);
  return <canvas ref={ref} className="game-thumb-canvas" />;
}

export default function Hub({ onPlay, wallet }) {
  const live = {
    motif: "classic",
    palette: {
      bg: "#0a1f12", bg2: "#08160c", grid: "#1f5230",
      snakeA: "#b6ff5a", snakeB: "#6f9d3a", food: "#ffc24b"
    }
  };
  const soon = [
    { id: "gravity", title: "Gravity Gulp", blurb: "Blocks rain. Catch the right colours, dodge the rest.", motif: "gravity", palette: { bg: "#0d0f1f", bg2: "#080a16", grid: "#26305a", snakeA: "#6b5cff", snakeB: "#9b8bff", food: "#28ffbf" } },
    { id: "race", title: "Coil Rally", blurb: "Out-slither rival serpents on a neon circuit.", motif: "race", palette: { bg: "#1a0a2e", bg2: "#0d0518", grid: "#3a1a55", snakeA: "#ff2bd6", snakeB: "#7a1f66", food: "#28ffbf" } },
    { id: "duel", title: "Venom Duel", blurb: "Head-to-head serpentine combat.", motif: "duel", palette: { bg: "#1a0a0a", bg2: "#120606", grid: "#3a1a1a", snakeA: "#ffc24b", snakeB: "#8a6a1c", food: "#ff5a5a" } },
    { id: "maze", title: "Hiss Labyrinth", blurb: "Navigate a shifting maze for the longest coil.", motif: "maze", palette: { bg: "#101814", bg2: "#0a100d", grid: "#22332a", snakeA: "#5aa9ff", snakeB: "#2c5a8a", food: "#ffc24b" } }
  ];

  return (
    <div className="page">
      <header className="page-head">
        <p className="page-eyebrow">Choose your game</p>
        <h1 className="page-title">The Arcade</h1>
        <p className="page-sub">
          Each Snakiox you mint is your playable serpent — its skin, gaze and
          form carry straight into the arena. Pick a game, pick your snake, and
          grow your coil as long as you can.
        </p>
      </header>

      <div className="games-grid">
        <article
          className="game-card"
          onClick={() => onPlay("classic")}
          role="button"
          tabIndex={0}
        >
          <div className="game-thumb">
            <Thumb palette={live.palette} motif={live.motif} />
            <span className="game-badge game-badge--live">● Live</span>
          </div>
          <div className="game-body">
            <h2 className="game-title">Classic Coil</h2>
            <p className="game-blurb">
              The original. Eat to grow, don't bite your tail. Your Snakiox skin
              and gaze render live as you play.
            </p>
            <div className="game-foot">
              <span>SNAKE · ARCADE</span>
              <span>PLAY →</span>
            </div>
          </div>
        </article>

        {soon.map((g) => (
          <article key={g.id} className="game-card game-card--locked">
            <div className="game-thumb">
              <Thumb palette={g.palette} motif={g.motif} />
              <span className="game-badge game-badge--soon">Soon</span>
            </div>
            <div className="game-body">
              <h2 className="game-title">{g.title}</h2>
              <p className="game-blurb">{g.blurb}</p>
              <div className="game-foot">
                <span>LOCKED</span>
                <span>— —</span>
              </div>
            </div>
          </article>
        ))}
      </div>

      {!wallet && (
        <p className="tag mt-md center" style={{ marginTop: "1.6rem" }}>
          Tip: connecting a wallet lets you play with your own minted Snakiox.
        </p>
      )}
    </div>
  );
}
