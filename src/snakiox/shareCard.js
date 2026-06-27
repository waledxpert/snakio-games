// Generates a downloadable "run result" card (PNG) for a finished game: the
// Snakiox you played, plus score / length / level — styled to match the arcade's
// CRT phosphor theme. Everything is drawn on a canvas so the export is a single
// crisp image with no external assets.
import { renderSnakeSvg } from "./generator";

const C = {
  bgTop: "#0f130f",
  bgBot: "#080b08",
  panel: "#141914",
  panel2: "#1b211b",
  ink: "#e8f3da",
  inkDim: "#9fb18c",
  inkFaint: "#5e6e51",
  line: "#2a3327",
  lineBright: "#3d4a37",
  phosphor: "#b6ff5a",
  phosphorDim: "#6f9d3a",
  amber: "#ffc24b"
};

const PIXEL = '"Pixelify Sans", system-ui, sans-serif';
const MONO = '"JetBrains Mono", monospace';
const SANS = '"DM Sans", system-ui, sans-serif';

// ─── small canvas helpers ────────────────────────────────────────────────────

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// L-shaped brackets at each corner (the arcade "panel-corner" look).
function corners(ctx, x, y, w, h, len, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  const seg = (ax, ay, bx, by, cx, cy) => {
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.lineTo(cx, cy);
    ctx.stroke();
  };
  seg(x, y + len, x, y, x + len, y);
  seg(x + w - len, y, x + w, y, x + w, y + len);
  seg(x, y + h - len, x, y + h, x + len, y + h);
  seg(x + w - len, y + h, x + w, y + h, x + w, y + h - len);
}

function text(ctx, str, x, y, { font, size, color, align = "left", spacing = 0 }) {
  ctx.font = `${font.weight || 700} ${size}px ${font.family}`;
  ctx.fillStyle = color;
  ctx.textAlign = spacing ? "left" : align;
  ctx.textBaseline = "alphabetic";
  if (!spacing) {
    ctx.fillText(str, x, y);
    return;
  }
  // Manual letter-spacing for the mono labels.
  ctx.font = `${font.weight || 700} ${size}px ${font.family}`;
  const chars = String(str).split("");
  const widths = chars.map((c) => ctx.measureText(c).width + spacing);
  const total = widths.reduce((a, b) => a + b, 0) - spacing;
  let cx = align === "center" ? x - total / 2 : align === "right" ? x - total : x;
  for (let i = 0; i < chars.length; i++) {
    ctx.fillText(chars[i], cx, y);
    cx += widths[i];
  }
}

function decodeSvg(dataUri) {
  if (!dataUri?.startsWith("data:image/svg+xml;base64,")) return null;
  const b64 = dataUri.split(",")[1];
  try {
    return decodeURIComponent(escape(window.atob(b64)));
  } catch {
    try { return window.atob(b64); } catch { return null; }
  }
}

function ensureSized(svg) {
  if (/<svg[^>]*\bwidth=/.test(svg)) return svg;
  const vb = svg.match(/viewBox="([\d.\s-]+)"/);
  let w = 900, h = 900;
  if (vb) {
    const p = vb[1].trim().split(/\s+/).map(Number);
    if (p.length === 4) { w = p[2]; h = p[3]; }
  }
  return svg.replace("<svg", `<svg width="${w}" height="${h}"`);
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// The minted NFT art if we have it; otherwise render fresh from the token's
// traits so the card always shows the right serpent.
async function loadSnakeImage(token) {
  let svg = token.image ? decodeSvg(token.image) : null;
  if (!svg) {
    svg = renderSnakeSvg({ traits: token.traits, len: token.len || 40, seed: 0n });
  }
  svg = ensureSized(svg);
  return loadImage("data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg));
}

async function ensureFonts() {
  if (!document.fonts?.load) return;
  try {
    await Promise.all([
      document.fonts.load(`700 64px ${PIXEL}`),
      document.fonts.load(`700 34px ${PIXEL}`),
      document.fonts.load(`700 20px ${MONO}`),
      document.fonts.load(`500 14px ${MONO}`),
      document.fonts.load(`700 22px ${SANS}`)
    ]);
  } catch {
    /* fall back to whatever's available */
  }
}

// ─── stat box ─────────────────────────────────────────────────────────────────

function statBox(ctx, x, y, w, h, label, value, valueColor) {
  roundRect(ctx, x, y, w, h, 6);
  ctx.fillStyle = C.panel2;
  ctx.fill();
  ctx.strokeStyle = C.line;
  ctx.lineWidth = 1;
  ctx.stroke();

  const cx = x + w / 2;
  text(ctx, label, cx, y + 26, {
    font: { family: MONO, weight: 500 }, size: 13, color: C.inkFaint, align: "center", spacing: 3
  });
  text(ctx, String(value), cx, y + h - 22, {
    font: { family: PIXEL, weight: 700 }, size: 40, color: valueColor, align: "center"
  });
}

// ─── main ─────────────────────────────────────────────────────────────────────

export async function downloadResultCard({ token, score, length, level, best, outcome = "dead" }) {
  await ensureFonts();
  const snakeImg = await loadSnakeImage(token);

  const W = 600, H = 772, S = 2;
  const canvas = document.createElement("canvas");
  canvas.width = W * S;
  canvas.height = H * S;
  const ctx = canvas.getContext("2d");
  ctx.scale(S, S);

  // Background gradient + subtle grid.
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, C.bgTop);
  g.addColorStop(1, C.bgBot);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = "rgba(255,255,255,0.022)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= W; x += 30) { ctx.beginPath(); ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, H); ctx.stroke(); }
  for (let y = 0; y <= H; y += 30) { ctx.beginPath(); ctx.moveTo(0, y + 0.5); ctx.lineTo(W, y + 0.5); ctx.stroke(); }

  // Outer frame.
  const FX = 16, FY = 16, FW = W - 32, FH = H - 32;
  roundRect(ctx, FX, FY, FW, FH, 10);
  ctx.strokeStyle = C.lineBright;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  corners(ctx, FX, FY, FW, FH, 18, C.phosphorDim);

  const PAD = 40;
  const LEFT = PAD, RIGHT = W - PAD, MID = W / 2;

  // ── Header ──
  // Pixel snake mark.
  const mk = LEFT, mky = 52;
  const cell = 7;
  ctx.fillStyle = C.phosphorDim;
  ctx.fillRect(mk, mky + cell, cell, cell);
  ctx.fillRect(mk + cell, mky + cell, cell, cell);
  ctx.fillStyle = C.phosphor;
  ctx.fillRect(mk + cell * 2, mky, cell, cell);
  ctx.fillRect(mk + cell * 3, mky - cell, cell, cell * 2);
  text(ctx, "SNAKIOX", mk + cell * 5, mky + cell + 2, {
    font: { family: PIXEL, weight: 700 }, size: 26, color: C.ink, align: "left"
  });
  text(ctx, "CLASSIC COIL", RIGHT, mky + cell, {
    font: { family: MONO, weight: 500 }, size: 13, color: C.inkDim, align: "right", spacing: 3
  });

  ctx.strokeStyle = C.line;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(LEFT, 78);
  ctx.lineTo(RIGHT, 78);
  ctx.stroke();

  // ── Title ──
  const won = outcome === "won";
  text(ctx, won ? "MAXIMUM COIL" : "GAME OVER", MID, 126, {
    font: { family: PIXEL, weight: 700 }, size: 38, color: won ? C.phosphor : C.ink, align: "center"
  });
  text(ctx, token.name || "Snakiox", MID, 150, {
    font: { family: MONO, weight: 500 }, size: 14, color: C.inkFaint, align: "center", spacing: 2
  });

  // ── Snake art ──
  const ART = 290;
  const AX = MID - ART / 2, AY = 170;
  ctx.save();
  roundRect(ctx, AX, AY, ART, ART, 8);
  ctx.fillStyle = "#05070a";
  ctx.fill();
  ctx.clip();
  ctx.drawImage(snakeImg, AX, AY, ART, ART);
  ctx.restore();
  roundRect(ctx, AX, AY, ART, ART, 8);
  ctx.strokeStyle = C.lineBright;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  corners(ctx, AX, AY, ART, ART, 14, C.phosphor);

  // ── Name ──
  const nameY = AY + ART + 44;
  text(ctx, token.traits?.skin || "Snakiox", MID, nameY, {
    font: { family: SANS, weight: 700 }, size: 22, color: C.ink, align: "center"
  });

  // ── Score (hero) ──
  const sX = LEFT, sY = nameY + 22, sW = RIGHT - LEFT, sH = 96;
  roundRect(ctx, sX, sY, sW, sH, 8);
  ctx.fillStyle = C.panel2;
  ctx.fill();
  ctx.strokeStyle = C.phosphorDim;
  ctx.lineWidth = 1;
  ctx.stroke();
  text(ctx, "SCORE", MID, sY + 28, {
    font: { family: MONO, weight: 500 }, size: 14, color: C.inkFaint, align: "center", spacing: 4
  });
  ctx.save();
  ctx.shadowColor = "rgba(182,255,90,0.5)";
  ctx.shadowBlur = 18;
  text(ctx, String(score), MID, sY + 82, {
    font: { family: PIXEL, weight: 700 }, size: 60, color: C.phosphor, align: "center"
  });
  ctx.restore();

  // ── Length / Level / Best ──
  const gap = 14;
  const rowY = sY + sH + gap;
  const bw = (sW - gap * 2) / 3;
  statBox(ctx, LEFT, rowY, bw, 84, "LENGTH", length, C.ink);
  statBox(ctx, LEFT + bw + gap, rowY, bw, 84, "LEVEL", level, C.amber);
  statBox(ctx, LEFT + (bw + gap) * 2, rowY, bw, 84, "BEST", best ?? score, C.inkDim);

  // ── Footer ──
  const footY = H - 30;
  text(ctx, "SNAKIOX ARCADE", LEFT, footY, {
    font: { family: MONO, weight: 500 }, size: 12, color: C.inkFaint, align: "left", spacing: 2
  });
  const date = new Date().toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  text(ctx, date, RIGHT, footY, {
    font: { family: MONO, weight: 500 }, size: 12, color: C.inkFaint, align: "right", spacing: 1
  });

  // ── Export ──
  const filename = `snakiox-${token.tokenId ?? "run"}-score-${score}.png`;
  await new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) return resolve();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      resolve();
    }, "image/png");
  });
}
