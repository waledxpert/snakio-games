// Renders the playable snake onto a canvas grid cell using the chosen Snakiox's
// palette + gaze, so the in-game serpent visually matches the minted NFT.
import { getPalette, isDarkPalette } from "./generator";

// Per-gaze eye fill (mirrors the on-chain gaze palette).
const GAZE_EYE_FILL = {
  "Void Stare": "#05070a",
  "Crystal Sight": "#d8fbff",
  "Ember Glow": "#ff6a00",
  "Dead Eye": "#d8ded7",
  "Mechanical Lens": "#9fffff",
  "Rune Carved": "#c060ff",
  "Pixel Scan": "#36ff6f"
};

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

// Draw a single body segment (cell units) — tail smaller, alternating shade,
// rounded corners, accent outline for dark/mech skins, just like the NFT body.
function drawSegment(ctx, cell, index, total, cellPx, palette, isMech, isDark, isCorrupted) {
  const isTail = index === 0;
  const isNeck = index === 1;
  const progress = total > 1 ? index / (total - 1) : 1;
  const scale = isTail ? 0.62 : isNeck ? 0.82 : 1;
  const size = cellPx * scale;
  const pad = (cellPx - size) / 2;
  const x = cell.x * cellPx + pad;
  const y = cell.y * cellPx + pad;

  ctx.save();
  ctx.globalAlpha = 0.82 + progress * 0.18;
  ctx.fillStyle = index % 2 === 0 ? palette[0] : palette[1];
  roundRect(ctx, x, y, size, size, isTail ? cellPx * 0.16 : cellPx * 0.1);
  ctx.fill();

  const outline = isMech ? palette[2] : (isDark ? palette[2] : palette[1]);
  ctx.lineWidth = (isMech || isDark) ? Math.max(1, cellPx * 0.07) : Math.max(1, cellPx * 0.04);
  ctx.strokeStyle = outline;
  ctx.stroke();

  // Corrupted skin patch every 4th segment — green rot, like the NFT.
  if (isCorrupted && index > 1 && index % 4 === 0) {
    const s = cellPx * 0.34;
    ctx.globalAlpha = 0.82;
    ctx.fillStyle = "#7dff49";
    roundRect(ctx, cell.x * cellPx + (cellPx - s) / 2, cell.y * cellPx + (cellPx - s) / 2, s, s, 2);
    ctx.fill();
    ctx.strokeStyle = "#143d0d";
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.restore();
}

// Head + snout + eyes for the current facing direction.
function drawHead(ctx, head, next, cellPx, palette, gaze, isDark) {
  const cx = head.x * cellPx + cellPx / 2;
  const cy = head.y * cellPx + cellPx / 2;
  const dx = head.x - next.x;
  const dy = head.y - next.y;
  // facing: the head points away from the neck.
  let dir;
  if (Math.abs(dx) >= Math.abs(dy)) dir = dx >= 0 ? "right" : "left";
  else dir = dy >= 0 ? "down" : "up";

  const hs = cellPx * 1.02;
  const half = hs / 2;
  const outline = isDark ? palette[2] : "#05070a";

  ctx.save();
  // Head block
  ctx.fillStyle = palette[0];
  roundRect(ctx, cx - half, cy - half, hs, hs, cellPx * 0.14);
  ctx.fill();
  ctx.lineWidth = Math.max(1.5, cellPx * 0.1);
  ctx.strokeStyle = outline;
  ctx.stroke();

  // Inner shade
  ctx.fillStyle = palette[1];
  const inset = cellPx * 0.14;
  roundRect(ctx, cx - half + inset, cy - half + inset, hs - inset * 2, hs - inset * 2, cellPx * 0.08);
  ctx.fill();

  // Snout
  const snoutLen = cellPx * 0.36;
  const snoutH = cellPx * 0.5;
  ctx.fillStyle = palette[0];
  let sx, sy, sw, sh;
  if (dir === "right") { sx = cx + half - cellPx * 0.07; sy = cy - snoutH / 2; sw = snoutLen; sh = snoutH; }
  else if (dir === "left") { sx = cx - half - snoutLen + cellPx * 0.07; sy = cy - snoutH / 2; sw = snoutLen; sh = snoutH; }
  else if (dir === "down") { sx = cx - snoutH / 2; sy = cy + half - cellPx * 0.07; sw = snoutH; sh = snoutLen; }
  else { sx = cx - snoutH / 2; sy = cy - half - snoutLen + cellPx * 0.07; sw = snoutH; sh = snoutLen; }
  roundRect(ctx, sx, sy, sw, sh, cellPx * 0.08);
  ctx.fill();
  ctx.lineWidth = Math.max(1, cellPx * 0.06);
  ctx.strokeStyle = outline;
  ctx.stroke();

  // Nostrils
  ctx.fillStyle = "#05070a";
  const nostrilSize = Math.max(1.5, cellPx * 0.06);
  if (dir === "right" || dir === "left") {
    const nx = dir === "right" ? sx + cellPx * 0.08 : sx + sw - cellPx * 0.08 - nostrilSize;
    ctx.fillRect(nx, sy + cellPx * 0.08, nostrilSize, nostrilSize);
    ctx.fillRect(nx, sy + sh - cellPx * 0.08 - nostrilSize, nostrilSize, nostrilSize);
  } else {
    const ny = dir === "down" ? sy + cellPx * 0.08 : sy + sh - cellPx * 0.08 - nostrilSize;
    ctx.fillRect(sx + cellPx * 0.08, ny, nostrilSize, nostrilSize);
    ctx.fillRect(sx + sw - cellPx * 0.08 - nostrilSize, ny, nostrilSize, nostrilSize);
  }

  // Eyes (placed on the side opposite the snout, perpendicular to travel).
  const vertical = dir === "right" || dir === "left";
  const isGodEye = gaze === "God Eye";
  const eyeSize = isGodEye ? cellPx * 0.5 : cellPx * 0.3;
  const spread = isGodEye ? 0 : cellPx * 0.34;
  const eyeFill = GAZE_EYE_FILL[gaze] ?? palette[2];

  const positions = isGodEye
    ? [{ x: cx, y: cy }]
    : vertical
      ? [{ x: cx - half + cellPx * 0.22, y: cy - spread }, { x: cx - half + cellPx * 0.22, y: cy + spread }]
      : [{ x: cx - spread, y: cy - half + cellPx * 0.22 }, { x: cx + spread, y: cy - half + cellPx * 0.22 }];

  for (const p of positions) {
    const ex = p.x - eyeSize / 2;
    const ey = p.y - eyeSize / 2;
    ctx.fillStyle = eyeFill;
    roundRect(ctx, ex, ey, eyeSize, eyeSize, 1);
    ctx.fill();
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = "#05070a";
    ctx.stroke();

    if (gaze === "Predator Split") {
      ctx.fillStyle = "#05070a";
      ctx.fillRect(p.x - 1, ey + 1, 2, eyeSize - 2);
    } else if (gaze === "Mechanical Lens") {
      ctx.fillStyle = "#05070a";
      roundRect(ctx, p.x - cellPx * 0.1, p.y - cellPx * 0.1, cellPx * 0.2, cellPx * 0.2, 1);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(p.x - 1, p.y - 1, 2, 2);
    } else if (gaze === "Pixel Scan") {
      ctx.fillStyle = "#05070a";
      ctx.fillRect(ex + 1, ey + eyeSize * 0.4, eyeSize - 2, 2);
    } else {
      const psize = isGodEye ? cellPx * 0.18 : cellPx * 0.12;
      ctx.fillStyle = "#05070a";
      ctx.fillRect(ex + eyeSize - psize - 1, ey + eyeSize - psize - 1, psize, psize);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(ex + 2, ey + 2, 2, 2);
    }
  }

  // Third Eye — extra eye on the crown.
  if (gaze === "Third Eye") {
    const ts = cellPx * 0.26;
    const tx = cx - ts / 2;
    let ty = cy - half - ts * 0.4;
    ctx.fillStyle = palette[2];
    roundRect(ctx, tx, ty, ts, ts, 2);
    ctx.fill();
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = "#05070a";
    ctx.stroke();
    ctx.fillStyle = "#05070a";
    ctx.fillRect(cx - 1, ty + 2, 2, ts - 4);
  }
  ctx.restore();
}

// Food: a glowing pixel orb tinted toward the snake's accent.
function drawFood(ctx, food, cellPx, palette, frame) {
  const cx = food.x * cellPx + cellPx / 2;
  const cy = food.y * cellPx + cellPx / 2;
  const pulse = 0.78 + Math.sin(frame * 0.18) * 0.12;
  const r = (cellPx * 0.34) * pulse;

  ctx.save();
  // glow
  const grad = ctx.createRadialGradient(cx, cy, 1, cx, cy, cellPx * 0.9);
  grad.addColorStop(0, palette[2]);
  grad.addColorStop(0.4, `${palette[2]}66`);
  grad.addColorStop(1, `${palette[2]}00`);
  ctx.fillStyle = grad;
  ctx.fillRect(food.x * cellPx - cellPx * 0.4, food.y * cellPx - cellPx * 0.4, cellPx * 1.8, cellPx * 1.8);

  ctx.fillStyle = palette[2];
  roundRect(ctx, cx - r, cy - r, r * 2, r * 2, r * 0.4);
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = "#05070a";
  ctx.stroke();
  // highlight pixel
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(cx - r * 0.45, cy - r * 0.45, r * 0.32, r * 0.32);
  ctx.restore();
}

export function drawSnake(ctx, snake, food, cellPx, skin, gaze, form, skinSeries, frame = 0) {
  const palette = getPalette(skin);
  const isDark = isDarkPalette(palette);
  const isMech = /(Drill|Chainlink|Hydraulic|Clockwork|Piston|Rail|Nano|Steam)/.test(form);
  const isCorrupted = skinSeries === "Corrupted";

  if (food) drawFood(ctx, food, cellPx, palette, frame);

  const total = snake.length;
  for (let i = total - 2; i >= 0; i--) {
    drawSegment(ctx, snake[i], i, total, cellPx, palette, isMech, isDark, isCorrupted);
  }
  // Head uses the first two segments to derive facing.
  drawHead(ctx, snake[0], snake[1] ?? snake[0], cellPx, palette, gaze, isDark);
}

export { getPalette, isDarkPalette };
