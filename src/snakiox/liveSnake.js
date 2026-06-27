// Live (moving) Snakiox helpers — shared by the animated wallet avatars and the
// in-game serpent. Everything renders through the REAL render-core layers, so a
// moving snake is byte-for-byte the same artwork as the minted NFT: same skin
// gradient, body taper (no "neck"), head, crown, sigil, mark and pattern.
//
// Coordinate space: render-core draws 28-unit blocks centred on `pos(i)`. We use
// CELL = 28 so a snake on an N-cell grid maps cleanly to an N*CELL viewBox; the
// avatar feeds continuous (sub-cell) centres for smooth slithering.
import { normalizeTraits, creatureInner, getPalette } from "./generator";

export const CELL = 28;

// Center of grid cell (gx, gy) in render-core units.
export function cellCenter(gx, gy) {
  return [gx * CELL + CELL / 2, gy * CELL + CELL / 2];
}

// render-core emits FIXED svg ids (scale, headG, glow, bodyPattern*). When many
// live snakes share one DOM, those ids collide and every snake would borrow the
// first one's gradient. We rewrite ids + references with a per-render scope so
// each inline snake keeps its own palette/pattern. (Filter-internal in=/result=
// names are element-scoped, not document ids, so we leave them alone.)
let _uid = 0;
function scopeIds(markup, scope) {
  return markup
    .replace(/id="([A-Za-z][\w-]*)"/g, (_m, id) => `id="${id}-${scope}"`)
    .replace(/url\(#([A-Za-z][\w-]*)\)/g, (_m, id) => `url(#${id}-${scope})`)
    .replace(/href="#([A-Za-z][\w-]*)"/g, (_m, id) => `href="#${id}-${scope}"`);
}

// A glowing food orb, tinted to the snake's accent (raw, unscoped markup —
// scoped together with the creature so its #glow reference resolves correctly).
function foodOrbRaw(cx, cy, accent, pulse = 1) {
  const r = 9 * pulse;
  return (
    `<g filter="url(#glow)">` +
    `<circle cx="${cx}" cy="${cy}" r="${r + 4}" fill="${accent}" opacity=".28"/>` +
    `<rect x="${cx - r}" y="${cy - r}" width="${r * 2}" height="${r * 2}" rx="${r * 0.4}" ` +
    `fill="${accent}" stroke="#05070a" stroke-width="1.5"/>` +
    `<rect x="${cx - r * 0.45}" y="${cy - r * 0.45}" width="${r * 0.34}" height="${r * 0.34}" fill="#ffffff"/>` +
    `</g>`
  );
}

// Full creature markup (defs + all layers) for a snake of `len` blocks, where
// pos(i) gives the pixel center of block i (0 = tail … len-1 = head). Pass
// `food` as [x, y] (render-core units) to add a glowing orb. Ids are scoped per
// call so any number of these can coexist in the same document.
export function creatureMarkup(traits, len, pos, food = null) {
  let inner = creatureInner(normalizeTraits(traits), len, pos);
  if (food) inner += foodOrbRaw(food[0], food[1], getPalette(traits.skin)[2]);
  return scopeIds(inner, `s${_uid++}`);
}

// ─── GRID WANDERER ───────────────────────────────────────────────────────────
// Drives the "Your Snakiox" avatars with PIXEL-style movement: the head steps
// one whole cell per tick on a gridN×gridN board (no sub-pixel gliding), and the
// body follows cell-by-cell like a classic snake. A self-avoiding random walk
// keeps it off the walls and its own coil, so it reads as a snake exploring its
// box. pos(i) returns the center of body cell i (0 = tail … len-1 = head).
const STEP_DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

export function createGridWanderer({ gridN, len, seed = 1, warm = true }) {
  const rng = mulberry(seed);
  const inBounds = (x, y) => x >= 0 && y >= 0 && x < gridN && y < gridN;

  let dir = STEP_DIRS[Math.floor(rng() * 4)];
  let hx = Math.floor(gridN / 2);
  let hy = Math.floor(gridN / 2);
  const body = [[hx, hy]]; // head first; grows to `len` as it steps

  function validMoves() {
    const opp = [-dir[0], -dir[1]];
    return STEP_DIRS.filter(([dx, dy]) => {
      if (dx === opp[0] && dy === opp[1]) return false; // never reverse
      const nx = hx + dx, ny = hy + dy;
      if (!inBounds(nx, ny)) return false;
      // Avoid the body, except the very tail (it vacates this step).
      for (let k = 0; k < body.length - 1; k++) {
        if (body[k][0] === nx && body[k][1] === ny) return false;
      }
      return true;
    });
  }

  // How many open cells a candidate head cell would still have onward — a cheap
  // one-step lookahead so the snake steers toward open space instead of corners.
  function freedom(nx, ny) {
    let f = 0;
    for (const [dx, dy] of STEP_DIRS) {
      const x = nx + dx, y = ny + dy;
      if (!inBounds(x, y)) continue;
      let occ = false;
      for (let k = 0; k < body.length - 1; k++) {
        if (body[k][0] === x && body[k][1] === y) { occ = true; break; }
      }
      if (!occ) f++;
    }
    return f;
  }

  function step() {
    let moves = validMoves();
    if (moves.length === 0) {
      // Boxed in — take any in-bounds cell (may clip the tail briefly).
      moves = STEP_DIRS.filter(([dx, dy]) => inBounds(hx + dx, hy + dy));
      if (moves.length === 0) return;
    }
    // Keep only the most open moves, then mostly keep going straight.
    let best = -1;
    let pool = [];
    for (const m of moves) {
      const f = freedom(hx + m[0], hy + m[1]);
      if (f > best) { best = f; pool = [m]; }
      else if (f === best) pool.push(m);
    }
    const straight = pool.find(([dx, dy]) => dx === dir[0] && dy === dir[1]);
    dir = straight && rng() < 0.7 ? straight : pool[Math.floor(rng() * pool.length)];
    hx += dir[0];
    hy += dir[1];
    body.unshift([hx, hy]);
    if (body.length > len) body.pop();
  }

  // Unfurl to full length before first paint so the body is whole.
  if (warm) for (let i = 0; i < len * 2; i++) step();

  // pos(i): tail (i=0) … head (i=len-1). body[0] is the head.
  function pos(i) {
    const cell = body[Math.min(body.length - 1, len - 1 - i)];
    return cellCenter(cell[0], cell[1]);
  }

  return { step, pos };
}

// Tiny deterministic RNG so each avatar wanders its own way but reproducibly.
function mulberry(seed) {
  let s = (seed >>> 0) || 1;
  return () => {
    s += 0x6d2b79f5;
    let v = s;
    v = Math.imul(v ^ (v >>> 15), v | 1);
    v ^= v + Math.imul(v ^ (v >>> 7), v | 61);
    return ((v ^ (v >>> 14)) >>> 0) / 4294967296;
  };
}
