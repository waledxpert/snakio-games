// render-core.js — position-agnostic Snakiox art renderer.
//
// Shared by the static generator (which drives segment positions from the
// deterministic on-chain path) and by any future game (which drives them from
// the live, moving snake). Nothing in here knows HOW the path is produced:
// every layer draws from a `pos(i) => [x, y]` callback that returns the pixel
// center of body segment i. Feed it `point(i, len, seed)` for a static token,
// or your live snake's cell coordinates for a running game — same artwork.

// ─── TRAIT INDEX ORDER ────────────────────────────────────────────────────────
// Canonical ordered trait names. The array index IS the on-chain trait value,
// so these MUST stay in lockstep with the contract and the generator's
// selection lists. The game can map a token's numeric traits straight through.
export const TRAIT_INDEX = {
  // MARK: aura / elemental signature around the body (index 0 = None)
  marks: [
    "None", "Hellfire Ring", "Glacial Halo", "Death Shroud", "Storm Mantle",
    "Prismatic Veil", "Toxic Mist", "Void Bleed", "Neon Corona", "Spirit Trail",
    "Lava Seep", "Plague Cloud", "Starfall Dust"
  ],
  // GAZE: eye trait (index 0..9 — matches the renderer's eye handling)
  gazes: [
    "Predator Split", "Void Stare", "Third Eye", "Crystal Sight", "Ember Glow",
    "Dead Eye", "Mechanical Lens", "Rune Carved", "Pixel Scan", "God Eye"
  ],
  // CROWN: head accessory (index 0..22)
  crowns: [
    "None", "Tyrant Crown", "Bone Halo", "Demon Horns", "Death Wings",
    "Void Antlers", "Third Eye Gem", "Plague Mask", "Straw Hat", "Flower Crown",
    "Bandana", "Leaf Sprout", "Antenna Bobble", "Jester Cap", "Cracked Halo",
    "Spiked Mohawk", "Goggles", "Ram Horns", "Storm Crown", "Serpent Tongue Crown",
    "Celestial Rings", "Abyssal Crown", "Golden Aegis"
  ],
  // SIGIL: tail-end marking (index 0..7)
  sigils: [
    "None", "Blade Tip", "Poison Barb", "Rattle", "Comet Trail", "Bone Spur",
    "Flame Tip", "Root Anchor"
  ],
  // CURSE: full-frame tint modifier (index 0..6)
  curses: [
    "None", "Inverted", "Rotting", "Overclocked", "Blessed", "Forsaken", "Ascended"
  ],
  // PATTERN: body-scale overlay (index 0..9; "None" renders nothing)
  patterns: [
    "Serpent Waves", "Diamond Mesh", "Pixel Checker", "Slash Marks", "Chrome Sheen",
    "Spotted", "Chevron", "Hex Plating", "Crosshatch", "Prism Shards"
  ]
};

const RARITY_TIERS = { Common: 0, Uncommon: 1, Rare: 2, Epic: 3, Legendary: 4, Mythic: 5 };

// ─── PALETTES ─────────────────────────────────────────────────────────────────
// Keyed to skin values. [primary, shadow, accent]
export const PALETTES = {
  // Forged
  "Obsidian Shard":      ["#1a1625", "#06040a", "#6b5cff"],
  "Rusted Iron":         ["#8b4513", "#3d1a06", "#c8752a"],
  "Damascus Coil":       ["#6b7c8a", "#1c2730", "#c8d4dc"],
  "Cold Steel":          ["#8ca0b0", "#2a3540", "#dce8f0"],
  "Black Chrome":        ["#15171c", "#050507", "#9fffff"],
  "Gilded Scale":        ["#c8960a", "#5c3b00", "#fff1a0"],
  "Platinum Sovereign":  ["#d9e2ec", "#58616d", "#ffffff"],
  "Rose Alloy":          ["#c87878", "#5c2828", "#ffe0d6"],
  "Bronze Relic":        ["#a06030", "#3a1a06", "#f0c060"],
  "Corroded Copper":     ["#5aaa78", "#1a3a28", "#a0ffb8"],
  "Titanfall":           ["#607080", "#1a2030", "#b0c8d8"],
  "Mercurial":           ["#b0c8d8", "#203040", "#e8f8ff"],
  // Gemborn
  "Amethyst Vein":       ["#9d4edd", "#3c096c", "#f3d9ff"],
  "Void Crystal":        ["#07000f", "#000000", "#9b5cff"],
  "Prism Fracture":      ["#ff70d0", "#380060", "#70ffff"],
  "Blood Ruby":          ["#cc1030", "#500010", "#ff8090"],
  "Deep Sapphire":       ["#1840cc", "#060c50", "#90b8ff"],
  "Emerald Core":        ["#00a850", "#004020", "#80ffc0"],
  "Black Opal":          ["#101828", "#040810", "#60ffb8"],
  "Citrine Flash":       ["#d8a000", "#503800", "#fff080"],
  "Aqua Garnet":         ["#00a8c8", "#003848", "#80ffff"],
  "White Diamond":       ["#e8f8ff", "#8098a8", "#ffffff"],
  "Moonstone Haze":      ["#c8d0e8", "#404870", "#f0f4ff"],
  "Peridot Bloom":       ["#70c820", "#204008", "#c8ff60"],
  // Elemental
  "Magma Drip":          ["#ff3d00", "#2b0703", "#ffb703"],
  "Frostbitten":         ["#a8f1ff", "#1d5d7a", "#ffffff"],
  "Stormwracked":        ["#4060c8", "#081028", "#a0c8ff"],
  "Ashfall":             ["#787878", "#202020", "#d0d0d0"],
  "Toxic Bloom":         ["#80ff00", "#204000", "#d0ff80"],
  "Embervein":           ["#ff6000", "#400800", "#ffc060"],
  "Sandstorm":           ["#d8a858", "#503010", "#fff8c0"],
  "Mudborn":             ["#706040", "#281808", "#c0a868"],
  "Soul Flame":          ["#8040ff", "#180860", "#e0c0ff"],
  "Permafrost":          ["#d0f0ff", "#306080", "#ffffff"],
  "Thunderclad":         ["#f0e840", "#303800", "#ffffff"],
  "Poison Tide":         ["#40d040", "#084008", "#c0ffc0"],
  // Cosmic
  "Void Walker":         ["#070010", "#000000", "#8030ff"],
  "Nebula Drift":        ["#c040c0", "#280028", "#40e0ff"],
  "Dark Matter":         ["#080818", "#000008", "#4040a0"],
  "Solar Remnant":       ["#ff9000", "#400800", "#fff080"],
  "Starforged":          ["#c0d8ff", "#080828", "#ffffff"],
  "Event Horizon":       ["#060608", "#000000", "#6000ff"],
  "Aurora Veil":         ["#40ffc0", "#004830", "#ff80ff"],
  "Supernova Scar":      ["#ff4000", "#280000", "#ffd080"],
  "Lunar Phase":         ["#d0d8e8", "#404858", "#f8f8ff"],
  "Cosmic Static":       ["#6060a0", "#101030", "#c0c0ff"],
  "Pulsar":              ["#40ffb0", "#004030", "#ffffff"],
  "Antimatter":          ["#ff00ff", "#280028", "#00ffff"],
  // Corrupted
  "Rotbone":             ["#d8c890", "#504820", "#fff8c0"],
  "Fleshweave":          ["#c86858", "#481810", "#ffb090"],
  "Chitin Crack":        ["#484030", "#181408", "#a09070"],
  "Eldritch Moss":       ["#406030", "#101808", "#90e860"],
  "Festered Vine":       ["#507820", "#182808", "#c0f060"],
  "Fungal Crown":        ["#c098c0", "#382038", "#f8e0f8"],
  "Plague Scale":        ["#709040", "#202808", "#d8ff80"],
  "Barnacle God":        ["#708090", "#182028", "#c0e8ff"],
  "Spore Drift":         ["#d0a0d0", "#482848", "#ffe0ff"],
  "Hollow Shell":        ["#907060", "#302018", "#e8c8a0"],
  "Parasite Host":       ["#a0c040", "#283008", "#e0ff80"],
  "Gore Bloom":          ["#c02030", "#400008", "#ff6070"],
  // Spectral
  "Wraith Skin":         ["#c0c8e0", "#303848", "#f0f4ff"],
  "Phantom Veil":        ["#a0b8d8", "#203040", "#e0f0ff"],
  "Astral Trace":        ["#8090c0", "#181828", "#d0d8ff"],
  "Nightmare Weave":     ["#180828", "#080008", "#8030c0"],
  "Soul Shard":          ["#c060ff", "#200840", "#f0d0ff"],
  "Demonic Pact":        ["#c02020", "#400000", "#ff8080"],
  "Angelic Fall":        ["#f0f4ff", "#808898", "#ffffff"],
  "Dream Fracture":      ["#a040c0", "#200030", "#e0a0ff"],
  "Void Echo":           ["#080010", "#000000", "#6040a0"],
  "Shadow Bleed":        ["#202030", "#040408", "#8070a0"],
  "Spirit Coil":         ["#d0e8e0", "#405850", "#f8fffc"],
  "Cursed Sigil":        ["#400820", "#180008", "#c03060"],
  // Digital
  "Glitch Form":         ["#00fff0", "#0b0b12", "#ff006e"],
  "Matrix Overflow":     ["#36ff6f", "#031107", "#a8ffbf"],
  "Neon Pulse":          ["#28ffbf", "#09111f", "#ff2bd6"],
  "Data Decay":          ["#808890", "#181c20", "#c0ccd8"],
  "Cyber Lattice":       ["#40d0ff", "#083040", "#c0f8ff"],
  "Vaporwave Ghost":     ["#e060d0", "#280838", "#80e8ff"],
  "Hologram Flicker":    ["#60f0ff", "#083040", "#ff60d0"],
  "Binary Scar":         ["#d0d8e0", "#303840", "#ffffff"],
  "AI Corruption":       ["#80ff40", "#104008", "#ffffff"],
  "RGB Overload":        ["#ff0040", "#200008", "#00ffff"],
  "Synthwave Drift":     ["#d040ff", "#180830", "#60ffff"],
  "Pixel Artifact":      ["#8cff4a", "#183b1c", "#fbff87"],
  // Ancient
  "Fossil Slate":        ["#888070", "#282418", "#d8d0b8"],
  "Jade Tomb":           ["#00a878", "#064f3c", "#d8ffe8"],
  "Moonstone Ruin":      ["#c8d0e8", "#404870", "#f0f4ff"],
  "Meteorite Fall":      ["#505868", "#101820", "#90a8c0"],
  "Sandstone God":       ["#d8a858", "#503010", "#fff8c0"],
  "Basalt Titan":        ["#484848", "#101010", "#909090"],
  "Quartz Idol":         ["#e0f0ff", "#607080", "#ffffff"],
  "Coral Scripture":     ["#ff8070", "#582028", "#ffd0c0"],
  "Amber Sealed":        ["#d89030", "#402808", "#ffe080"],
  "Obsidian Altar":      ["#1a1625", "#06040a", "#6b5cff"],
  "Granite Effigy":      ["#808878", "#282c20", "#c8d0b8"],
  "Onyx Pharaoh":        ["#111318", "#030406", "#c8ccd5"]
};

export const DEFAULT_PALETTE = ["#77d879", "#265c34", "#e8ffd9"];

export function getPalette(skin) {
  return PALETTES[skin] ?? DEFAULT_PALETTE;
}

export function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16)
  };
}

export function luminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

export function isDarkPalette(palette) {
  return luminance(palette[0]) < 0.16 || luminance(palette[1]) < 0.08;
}

// ─── ART PRIMITIVES ───────────────────────────────────────────────────────────

const sub = (v, a) => (v > a ? v - a : 0);
const absDiff = (a, b) => (a > b ? a - b : b - a);

export function rect(x, y, w, h, rx, fill, op, stroke, sw) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" opacity="${op}" stroke="${stroke}" stroke-width="${sw}" shape-rendering="crispEdges"/>`;
}

export function facingFrom(hx, hy, nx, ny) {
  if (absDiff(hx, nx) >= absDiff(hy, ny)) return hx >= nx ? 0 : 2;
  return hy >= ny ? 1 : 3;
}

function dirPoint(cx, cy, dir, forward, sideRaw) {
  const negativeSide = sideRaw > 180;
  const side = negativeSide ? 360 - sideRaw : sideRaw;
  if (dir === 0) return [cx + forward, negativeSide ? sub(cy, side) : cy + side];
  if (dir === 2) return [sub(cx, forward), negativeSide ? cy + side : sub(cy, side)];
  if (dir === 1) return [negativeSide ? cx + side : sub(cx, side), cy + forward];
  return [negativeSide ? sub(cx, side) : cx + side, sub(cy, forward)];
}

export function gazeColor(gaze, accentColor) {
  if (gaze === 1) return "#05070a";
  if (gaze === 3) return "#d8fbff";
  if (gaze === 4) return "#ff6a00";
  if (gaze === 5) return "#d8ded7";
  if (gaze === 6) return "#9fffff";
  if (gaze === 7) return "#c060ff";
  if (gaze === 8) return "#36ff6f";
  return accentColor;
}

// ─── BODY PATTERNS ──────────────────────────────────────────────────────────

export function patternDefs(pattern) {
  if (pattern === 10) return "";
  if (pattern === 0) return '<symbol id="bodyPattern0" width="28" height="28" viewBox="0 0 28 28"><path d="M-7 7 Q0 0 7 7 T21 7 T35 7 M-7 21 Q0 14 7 21 T21 21 T35 21" fill="none" stroke="currentColor" stroke-width="3"/></symbol>';
  if (pattern === 1) return '<symbol id="bodyPattern1" width="28" height="28" viewBox="0 0 28 28"><polygon points="14,1 27,14 14,27 1,14" fill="none" stroke="currentColor" stroke-width="3"/></symbol>';
  if (pattern === 2) return '<symbol id="bodyPattern2" width="28" height="28" viewBox="0 0 28 28"><path d="M0 0H7V7H0ZM14 0H21V7H14ZM7 7H14V14H7ZM21 7H28V14H21ZM0 14H7V21H0ZM14 14H21V21H14ZM7 21H14V28H7ZM21 21H28V28H21Z" fill="currentColor"/></symbol>';
  if (pattern === 3) return '<symbol id="bodyPattern3" width="28" height="28" viewBox="0 0 28 28"><polygon points="-4,20 4,28 32,0 24,-8" fill="currentColor"/></symbol>';
  if (pattern === 4) return '<linearGradient id="bodyGradient" gradientUnits="userSpaceOnUse" x1="70" y1="70" x2="830" y2="830"><stop offset="0%" stop-color="#ffffff" stop-opacity=".78"/><stop offset="100%" stop-color="#05070a" stop-opacity=".52"/></linearGradient><symbol id="bodyPattern4" width="28" height="28" viewBox="0 0 28 28"><rect width="28" height="28" fill="url(#bodyGradient)" opacity=".82"/></symbol>';
  if (pattern === 5) return '<symbol id="bodyPattern5" width="28" height="28" viewBox="0 0 28 28"><circle cx="14" cy="14" r="4" fill="currentColor"/><circle cx="5" cy="5" r="2" fill="currentColor"/><circle cx="23" cy="23" r="2" fill="currentColor"/></symbol>';
  if (pattern === 6) return '<symbol id="bodyPattern6" width="28" height="28" viewBox="0 0 28 28"><polyline points="1,25 14,3 27,25" fill="none" stroke="currentColor" stroke-width="4"/></symbol>';
  if (pattern === 7) return '<symbol id="bodyPattern7" width="28" height="28" viewBox="0 0 28 28"><polygon points="14,1 25,7 25,21 14,27 3,21 3,7" fill="none" stroke="currentColor" stroke-width="3"/></symbol>';
  if (pattern === 8) return '<symbol id="bodyPattern8" width="28" height="28" viewBox="0 0 28 28"><path d="M-7 7L7-7M0 28L28 0M21 35L35 21M-7 21L7 35M0 0L28 28M21-7L35 7" stroke="currentColor" stroke-width="2"/></symbol>';
  return '<symbol id="bodyPattern9" width="28" height="28" viewBox="0 0 28 28"><polygon points="0,0 20,0 8,20" fill="#28e7ff" opacity=".48"/><polygon points="28,0 28,20 8,8" fill="#ff39cf" opacity=".45"/><polygon points="0,28 20,28 20,8" fill="#ffe45e" opacity=".42"/></symbol>';
}

export function patternOverlay(index, x, y, size, bodyPattern) {
  if (bodyPattern === 10) return "";
  const h = Math.floor(size / 2);
  return `<use href="#bodyPattern${bodyPattern}" x="${sub(x, h)}" y="${sub(y, h)}" width="${size}" height="${size}" opacity=".6"/>`;
}

// ─── BACKGROUND ─────────────────────────────────────────────────────────────

function bgColor(pattern, rarity, darkSkin, stop) {
  const elite = rarity >= 4;
  if (pattern === 9) {
    if (darkSkin) return stop < 2 ? (elite ? "#8991a4" : "#969dac") : (stop === 2 ? "#a7adba" : "#858d9d");
    return stop < 2 ? (stop === 0 ? "#171625" : "#08090f") : (stop === 2 ? "#1d1b2d" : "#10111a");
  }
  if (pattern === 0 || pattern === 7) {
    if (darkSkin) return stop < 2 ? (stop === 0 ? "#9eafa5" : "#74877c") : (stop === 2 ? "#adbbb2" : "#87998e");
    return stop < 2 ? (stop === 0 ? "#263a32" : "#14231d") : (stop === 2 ? "#30483c" : "#1d3128");
  }
  if (pattern === 1 || pattern === 3 || pattern === 6) {
    if (darkSkin) return stop < 2 ? (stop === 0 ? "#b3a894" : "#887d69") : (stop === 2 ? "#c0b5a0" : "#998d77");
    return stop < 2 ? (stop === 0 ? "#3d3027" : "#211a16") : (stop === 2 ? "#49392d" : "#2d241d");
  }
  if (pattern === 2 || pattern === 8) {
    if (darkSkin) return stop < 2 ? (stop === 0 ? "#a6b0b8" : "#7a858e") : (stop === 2 ? "#b5bdc4" : "#909aa3");
    return stop < 2 ? (stop === 0 ? "#29313a" : "#141a20") : (stop === 2 ? "#323c46" : "#202830");
  }
  if (darkSkin) return stop < 2 ? (stop === 0 ? "#a8b0b7" : "#7d878f") : (stop === 2 ? "#b6bdc3" : "#929ba3");
  return stop < 2 ? (stop === 0 ? (elite ? "#252634" : "#20262d") : "#101419") : (stop === 2 ? "#293139" : "#181e24");
}

function bgDefs(darkSkin, pattern, rarity) {
  return `<linearGradient id="bg" x1="0" y1="0" x2="900" y2="900" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="${bgColor(pattern, rarity, darkSkin, 0)}"/><stop offset="100%" stop-color="${bgColor(pattern, rarity, darkSkin, 1)}"/></linearGradient><linearGradient id="field" x1="42" y1="42" x2="858" y2="858" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="${bgColor(pattern, rarity, darkSkin, 2)}"/><stop offset="100%" stop-color="${bgColor(pattern, rarity, darkSkin, 3)}"/></linearGradient><clipPath id="arenaClip"><rect x="42" y="42" width="816" height="816" rx="8"/></clipPath><pattern id="grid" width="28" height="28" patternUnits="userSpaceOnUse"><path d="M 28 0 H 0 V 28" fill="none" stroke="${darkSkin ? "#303b45" : "#9aa6b2"}" stroke-width="1.5"/></pattern>`;
}

export function arena(darkSkin, pattern, rarity) {
  return `<rect x="42" y="42" width="816" height="816" rx="8" fill="url(#field)" stroke="${rarity >= 4 ? "#b89b62" : (darkSkin ? "#65717c" : "#39434f")}" stroke-width="3"/><rect x="42" y="42" width="816" height="816" fill="url(#grid)" opacity="${pattern === 9 ? (darkSkin ? ".22" : ".20") : (darkSkin ? ".25" : ".22")}" clip-path="url(#arenaClip)" shape-rendering="crispEdges"/>`;
}

// ─── CREATURE: BODY ───────────────────────────────────────────────────────────

function opacity(index, len) {
  const value = 78 + Math.floor((index * 22) / len);
  return "0." + value;
}

function corruptionPatch(x, y) {
  return rect(sub(x, 5), sub(y, 5), 10, 10, "0", "#7dff49", ".82", "#143d0d", "1");
}

// Taper sizes from tail (small) toward the body (full 28).
export function segSize(i, len) {
  if (i === 0) return 13;
  if (i === 1) return 19;
  if (i === 2) return 24;
  const fromHead = len - 2 - i; // body runs 0..len-2 (head is len-1)
  if (fromHead === 0) return 26;
  return 28;
}

function bodySegment(i, len, p, darkSkin, isMech, isCorrupted, bodyPattern, pos) {
  const [x, y] = pos(i);
  const size = segSize(i, len);
  const h = Math.floor(size / 2);
  // Volume comes from a per-block diagonal gradient (glint -> body -> shadow);
  // a faint dark edge keeps scales legible.
  const edge = isMech ? p.accent : (darkSkin ? p.accent : p.shadow);
  const segment = rect(
    sub(x, h), sub(y, h), size, size,
    i < 2 ? "5" : "3",
    "url(#scale)",
    opacity(i, len),
    edge,
    isMech || darkSkin ? "1.5" : "0.75"
  );
  const overlay = patternOverlay(i, x, y, size, bodyPattern);
  if (isCorrupted && i > 1 && i % 4 === 0) {
    return segment + overlay + corruptionPatch(x, y);
  }
  return segment + overlay;
}

export function body(len, p, darkSkin, isMech, isCorrupted, bodyPattern, pos) {
  let out = `<g color="${darkSkin ? p.accent : p.shadow}" shape-rendering="crispEdges">`;
  out += tailTip(len, p, darkSkin, pos);
  for (let i = 0; i + 1 < len; i++) out += bodySegment(i, len, p, darkSkin, isMech, isCorrupted, bodyPattern, pos);
  return out + "</g>";
}

// A short stepped point trailing off the tail end (index 0), pointing away
// from the body so the snake resolves to a tip instead of a blunt block.
export function tailTip(len, p, darkSkin, pos) {
  if (len < 3) return "";
  const [x0, y0] = pos(0);
  const [x1, y1] = pos(1);
  const dir = facingFrom(x0, y0, x1, y1); // points away from body
  let out = "";
  const steps = [[12, 9], [22, 5], [30, 3]];
  for (const [fwd, half] of steps) {
    let cx, cy;
    if (dir === 0) { cx = x0 + fwd; cy = y0; }
    else if (dir === 2) { cx = sub(x0, fwd); cy = y0; }
    else if (dir === 1) { cx = x0; cy = y0 + fwd; }
    else { cx = x0; cy = sub(y0, fwd); }
    out += rect(sub(cx, half), sub(cy, half), half * 2, half * 2, "1", "url(#scale)", ".85", darkSkin ? p.accent : p.shadow, "0.75");
  }
  return out;
}

// ─── CREATURE: HEAD ───────────────────────────────────────────────────────────

function snout(hx, hy, facing, outline) {
  const fill = "url(#headG)";
  if (facing === 0) return rect(hx + 13, sub(hy, 9), 12, 18, "2", fill, "1", outline, "2");
  if (facing === 2) return rect(sub(hx, 25), sub(hy, 9), 12, 18, "2", fill, "1", outline, "2");
  if (facing === 1) return rect(sub(hx, 9), hy + 13, 18, 12, "2", fill, "1", outline, "2");
  return rect(sub(hx, 9), sub(hy, 25), 18, 12, "2", fill, "1", outline, "2");
}

function cranialRidge(hx, hy, facing, p) {
  const vert = facing === 0 || facing === 2;
  return vert
    ? rect(sub(hx, 13), sub(hy, 2), 26, 4, "2", p.accent, ".30", "none", "0")
    : rect(sub(hx, 2), sub(hy, 13), 4, 26, "2", p.accent, ".30", "none", "0");
}

function nostrils(hx, hy, facing, c) {
  const n = (x, y) => rect(x, y, 4, 4, "1", c, ".8", "none", "0");
  if (facing === 0) return n(hx + 16, sub(hy, 6)) + n(hx + 16, hy + 2);
  if (facing === 2) return n(sub(hx, 20), sub(hy, 6)) + n(sub(hx, 20), hy + 2);
  if (facing === 1) return n(sub(hx, 6), hy + 16) + n(hx + 2, hy + 16);
  return n(sub(hx, 6), sub(hy, 20)) + n(hx + 2, sub(hy, 20));
}

function brow(hx, hy, facing, outline) {
  const b = (x, y, w, h) => rect(x, y, w, h, "0", outline, ".55", "none", "0");
  if (facing === 0) return b(sub(hx, 4), sub(hy, 16), 12, 4) + b(sub(hx, 4), hy + 12, 12, 4);
  if (facing === 2) return b(sub(hx, 8), sub(hy, 16), 12, 4) + b(sub(hx, 8), hy + 12, 12, 4);
  if (facing === 1) return b(sub(hx, 16), sub(hy, 4), 4, 12) + b(hx + 12, sub(hy, 4), 4, 12);
  return b(sub(hx, 16), sub(hy, 8), 4, 12) + b(hx + 12, sub(hy, 8), 4, 12);
}

function tongue(hx, hy, facing) {
  const c = "#ff3a6e";
  if (facing === 0) return rect(hx + 24, sub(hy, 2), 10, 4, "0", c, "1", "none", "0") + rect(hx + 32, sub(hy, 7), 9, 3, "0", c, "1", "none", "0") + rect(hx + 32, hy + 4, 9, 3, "0", c, "1", "none", "0");
  if (facing === 2) return rect(sub(hx, 34), sub(hy, 2), 10, 4, "0", c, "1", "none", "0") + rect(sub(hx, 41), sub(hy, 7), 9, 3, "0", c, "1", "none", "0") + rect(sub(hx, 41), hy + 4, 9, 3, "0", c, "1", "none", "0");
  if (facing === 1) return rect(sub(hx, 2), hy + 24, 4, 10, "0", c, "1", "none", "0") + rect(sub(hx, 7), hy + 32, 3, 9, "0", c, "1", "none", "0") + rect(hx + 4, hy + 32, 3, 9, "0", c, "1", "none", "0");
  return rect(sub(hx, 2), sub(hy, 34), 4, 10, "0", c, "1", "none", "0") + rect(sub(hx, 7), sub(hy, 41), 3, 9, "0", c, "1", "none", "0") + rect(hx + 4, sub(hy, 41), 3, 9, "0", c, "1", "none", "0");
}

function eye(cx, cy, size, fill, gaze, accent) {
  const half = Math.floor(size / 2);
  const base = rect(sub(cx, half), sub(cy, half), size, size, "0", fill, "1", "#05070a", "1");
  if (gaze === 0) return base + rect(sub(cx, 1), sub(cy, half - 1), 2, size - 2, "0", "#05070a", "1", "none", "0");
  if (gaze === 3) return base + rect(sub(cx, 3), sub(cy, 3), 6, 6, "0", "#05070a", "1", "none", "0") + rect(sub(cx, 1), sub(cy, 1), 2, 2, "0", "#ffffff", "1", "none", "0");
  if (gaze === 6) return base + rect(sub(cx, 3), sub(cy, 3), 6, 6, "0", "#05070a", "1", "none", "0") + rect(sub(cx, 1), sub(cy, 1), 2, 2, "0", "#ffffff", "1", "none", "0");
  if (gaze === 7) return base + `<path d="M ${sub(cx, 2)} ${cy + 2} H ${cx + 2} M ${cx} ${sub(cy, 3)} V ${cy + 3}" stroke="#05070a" stroke-width="1" shape-rendering="crispEdges"/>`;
  if (gaze === 8) return base + rect(sub(cx, 3), sub(cy, 1), 6, 2, "0", "#05070a", "1", "none", "0");
  return base + rect(cx, cy, size === 14 ? 6 : 4, size === 14 ? 6 : 4, "0", gaze === 1 ? accent : "#05070a", "1", "none", "0") + rect(sub(cx, half - 1), sub(cy, half - 1), 2, 2, "0", "#ffffff", "1", "none", "0");
}

function eyes(hx, hy, facing, p, gaze) {
  const vertical = facing === 0 || facing === 2;
  let ax = hx, ay = hy;
  if (facing === 0) ax = hx + 3;
  else if (facing === 2) ax = sub(hx, 3);
  else if (facing === 1) ay = hy + 3;
  else ay = sub(hy, 3);
  if (gaze === 9) return eye(ax, ay, 14, gazeColor(gaze, p.accent), gaze, p.accent);
  const fill = gazeColor(gaze, p.accent);
  const pair = vertical
    ? eye(ax, sub(ay, 10), 9, fill, gaze, p.accent) + eye(ax, ay + 10, 9, fill, gaze, p.accent)
    : eye(sub(ax, 10), ay, 9, fill, gaze, p.accent) + eye(ax + 10, ay, 9, fill, gaze, p.accent);
  if (gaze === 2) return pair + eye(ax, ay, 8, p.accent, 0, p.accent);
  return pair;
}

export function head(len, p, darkSkin, gaze, pos) {
  const [hx, hy] = pos(len - 1);
  const [nx, ny] = pos(len - 2);
  const facing = facingFrom(hx, hy, nx, ny);
  const outline = darkSkin ? p.accent : "#05070a";
  return "<g shape-rendering=\"crispEdges\">" +
    snout(hx, hy, facing, outline) +
    nostrils(hx, hy, facing, outline) +
    rect(sub(hx, 16), sub(hy, 16), 32, 32, "5", "url(#headG)", "1", outline, "3") +
    cranialRidge(hx, hy, facing, p) +
    brow(hx, hy, facing, outline) +
    eyes(hx, hy, facing, p, gaze) +
    tongue(hx, hy, facing) +
    "</g>";
}

// ─── ART LAYERS: MARK / SIGIL / CROWN / CURSE ─────────────────────────────────

export function markLayer(mark, len, p, pos) {
  if (mark === 0) return "";
  let out = '<g filter="url(#glow)" opacity=".20">';
  for (let i = 0; i < len; i++) {
    const [x, y] = pos(i);
    out += rect(sub(x, 28), sub(y, 28), 56, 56, "0", p.accent, "1", "none", "0");
  }
  return out + "</g>";
}

function trianglePath(cx, cy, dir, tipDist, baseDist, halfWidth) {
  const [tipX, tipY] = dirPoint(cx, cy, dir, tipDist, 0);
  const [ax, ay] = dirPoint(cx, cy, dir, baseDist, 360 - halfWidth);
  const [bx, by] = dirPoint(cx, cy, dir, baseDist, halfWidth);
  return `M ${tipX} ${tipY} L ${ax} ${ay} L ${bx} ${by} Z`;
}

function triangle(cx, cy, dir, tipDist, baseDist, halfWidth, fill, strokeColor) {
  return `<path d="${trianglePath(cx, cy, dir, tipDist, baseDist, halfWidth)}" fill="${fill}" stroke="${strokeColor}" stroke-width="2" shape-rendering="crispEdges"/>`;
}

function poisonBarb(tailX, tailY, dir) {
  const [tipX, tipY] = dirPoint(tailX, tailY, dir, 30, 0);
  const [ax, ay] = dirPoint(tailX, tailY, dir, 5, 360 - 9);
  const [bx, by] = dirPoint(tailX, tailY, dir, 5, 9);
  const [cx, cy] = dirPoint(tailX, tailY, dir, 18, 5);
  const [dx, dy] = dirPoint(tailX, tailY, dir, 18, 360 - 5);
  return `<path d="M ${tipX} ${tipY} L ${cx} ${cy} L ${bx} ${by} L ${ax} ${ay} L ${dx} ${dy} Z" fill="#80ff00" stroke="#204000" stroke-width="2" shape-rendering="crispEdges"/>`;
}

function boneSpur(tailX, tailY, dir) {
  const [nAx, nAy] = dirPoint(tailX, tailY, dir, 10, 360 - 6);
  const [nBx, nBy] = dirPoint(tailX, tailY, dir, 10, 6);
  const [mAx, mAy] = dirPoint(tailX, tailY, dir, 20, 360 - 3);
  const [mBx, mBy] = dirPoint(tailX, tailY, dir, 20, 3);
  return `<path d="${trianglePath(tailX, tailY, dir, 28, 6, 12)} M ${nAx} ${nAy} L ${mAx} ${mAy} M ${nBx} ${nBy} L ${mBx} ${mBy}" fill="#e8dcc5" stroke="#6d6047" stroke-width="2" fill-opacity=".9" shape-rendering="crispEdges"/>`;
}

function flameTip(tailX, tailY, dir) {
  const [tipX, tipY] = dirPoint(tailX, tailY, dir, 30, 0);
  const [baseX, baseY] = dirPoint(tailX, tailY, dir, 3, 0);
  const [leftX, leftY] = dirPoint(tailX, tailY, dir, 12, 360 - 12);
  const [rightX, rightY] = dirPoint(tailX, tailY, dir, 12, 12);
  const [innerX, innerY] = dirPoint(tailX, tailY, dir, 20, 0);
  return `<path d="M ${tipX} ${tipY} Q ${leftX} ${leftY} ${baseX} ${baseY} Q ${innerX} ${innerY} ${rightX} ${rightY} Q ${leftX} ${leftY} ${tipX} ${tipY}" fill="#ff6000" stroke="#ffb703" stroke-width="2" opacity=".92" shape-rendering="crispEdges"/>`;
}

function comet(len, color, pos) {
  let out = "";
  for (let i = 0; i < 6 && i < len; i++) {
    const [x, y] = pos(i);
    const s = 4 > i ? 4 - i : 1;
    out += rect(sub(x, Math.floor(s / 2)), sub(y, Math.floor(s / 2)), s, s, "0", color, ".45", "none", "0");
  }
  return out;
}

function rattle(tailX, tailY, dir, p) {
  const seg = (fwd, s) => {
    const [cx, cy] = dirPoint(tailX, tailY, dir, fwd, 0);
    return rect(sub(cx, Math.floor(s / 2)), sub(cy, Math.floor(s / 2)), s, s, "2", p.primary, "1", p.shadow, "2");
  };
  return seg(10, 16) + seg(24, 12) + seg(36, 8);
}

function root(tailX, tailY, dir, color) {
  const [tipX, tipY] = dirPoint(tailX, tailY, dir, 30, 0);
  const [aX, aY] = dirPoint(tailX, tailY, dir, 34, 18);
  const [bX, bY] = dirPoint(tailX, tailY, dir, 34, 342);
  return `<path d="M ${tailX} ${tailY} L ${tipX} ${tipY} M ${tipX} ${tipY} L ${aX} ${aY} M ${tipX} ${tipY} L ${bX} ${bY}" stroke="${color}" stroke-width="4" stroke-linecap="round" fill="none"/>`;
}

export function sigilLayer(sigil, len, p, pos) {
  if (sigil === 0) return "";
  const [tailX, tailY] = pos(0);
  const [nx, ny] = pos(1);
  const dir = facingFrom(tailX, tailY, nx, ny);
  if (sigil === 1) return triangle(tailX, tailY, dir, 28, 4, 16, p.accent, p.shadow);
  if (sigil === 2) return poisonBarb(tailX, tailY, dir);
  if (sigil === 3) return rattle(tailX, tailY, dir, p);
  if (sigil === 4) return comet(len, p.accent, pos);
  if (sigil === 5) return boneSpur(tailX, tailY, dir);
  if (sigil === 6) return flameTip(tailX, tailY, dir);
  return root(tailX, tailY, dir, p.primary);
}

// Head ornaments are built from dirPoint(hx,hy,facing,forward,side): forward =
// toward the snout, side 0..180 = right flank, 180..360 = left flank.
function pstr(hx, hy, facing, f, s) {
  const a = dirPoint(hx, hy, facing, f, s);
  return a[0] + " " + a[1];
}

function tyrantCrown(hx, hy, facing) {
  const P = (f, s) => pstr(hx, hy, facing, f, s);
  return `<path d="M ${P(8, 334)} L ${P(34, 338)} L ${P(20, 348)} L ${P(42, 0)} L ${P(20, 12)} L ${P(34, 22)} L ${P(8, 26)} Z" fill="#ffd166" stroke="#5c3b00" stroke-width="2" stroke-linejoin="round" shape-rendering="crispEdges"/><path d="M ${P(11, 0)} L ${P(20, 10)} L ${P(20, 350)} Z" fill="#fff1b8" opacity=".5"/>`;
}

// Shared SVG emitters for the extended crowns — byte-identical to the on-chain
// SnakioxCrowns* helpers so JS and Solidity render the same markup.
const circ = (cx, cy, r, fill, stroke, sw, op) =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" opacity="${op}"/>`;
const circDash = (cx, cy, r, stroke, sw, op, dash) =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${stroke}" stroke-width="${sw}" opacity="${op}" stroke-dasharray="${dash}"/>`;
const ellRot = (cx, cy, rx, ry, deg, stroke, sw, op) =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="${stroke}" stroke-width="${sw}" opacity="${op}" transform="rotate(${deg} ${cx} ${cy})"/>`;

// Redesigned: an elegant halo floating just ahead of the brow — a tilted ellipse
// with soft glow, gold band, bright highlight and two sparkles.
function boneHalo(hx, hy, facing) {
  const [cx, cy] = dirPoint(hx, hy, facing, 16, 0);
  const ell = (rx, ry, st, sw, op) =>
    `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="${st}" stroke-width="${sw}" opacity="${op}"/>`;
  const spark = (sx, sy) =>
    rect(sub(sx, 1), sub(sy, 4), 2, 8, "0", "#fffef5", ".95", "none", "0") +
    rect(sub(sx, 4), sub(sy, 1), 8, 2, "0", "#fffef5", ".95", "none", "0");
  return (
    ell(26, 10, "#fff6d8", "7", ".28") +
    ell(22, 8, "#f0c544", "5", ".5") +
    ell(22, 8, "#ffe9a8", "3", ".95") +
    ell(22, 8, "#fffef5", "1.25", ".9") +
    spark(cx + 16, sub(cy, 7)) +
    spark(sub(cx, 19), cy + 4)
  );
}

function hornShape(hx, hy, facing, i, o, t) {
  const P = (f, s) => pstr(hx, hy, facing, f, s);
  return `<path d="M ${P(2, i)} L ${P(10, o)} L ${P(42, t)} L ${P(22, i)} Z" fill="#c02020" stroke="#5a0a0a" stroke-width="2" stroke-linejoin="round" shape-rendering="crispEdges"/>`;
}

function demonHorns(hx, hy, facing) {
  return hornShape(hx, hy, facing, 10, 24, 34) + hornShape(hx, hy, facing, 350, 336, 326);
}

function antlerSide(hx, hy, facing, sIn, sMid, sOut, color) {
  const P = (f, s) => pstr(hx, hy, facing, f, s);
  return `<path d="M ${P(2, sIn)} L ${P(18, sMid)} L ${P(40, sMid)} M ${P(18, sMid)} L ${P(30, sOut)} M ${P(26, sMid)} L ${P(44, sIn)}" fill="none" stroke="${color}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`;
}

function antlers(hx, hy, facing, color) {
  return antlerSide(hx, hy, facing, 12, 26, 44, color) + antlerSide(hx, hy, facing, 348, 334, 316, color);
}

function wingSide(hx, hy, facing, s0, s1, s2, s3, s4, s5, color) {
  const P = (f, s) => pstr(hx, hy, facing, f, s);
  return `<path d="M ${P(2, s0)} L ${P(40, s1)} L ${P(26, s2)} L ${P(14, s3)} L ${P(2, s4)} L ${P(0, s5)} Z" fill="${color}" stroke="#05070a" stroke-width="2" stroke-linejoin="round" opacity=".6" shape-rendering="crispEdges"/><path d="M ${P(2, s0)} L ${P(40, s1)}" stroke="#05070a" stroke-width="1.5" opacity=".45" fill="none"/>`;
}

function deathWings(hx, hy, facing, color) {
  return wingSide(hx, hy, facing, 14, 44, 66, 50, 58, 26, color) +
    wingSide(hx, hy, facing, 346, 316, 294, 310, 302, 334, color);
}

function thirdEye(hx, hy, facing, accent) {
  const P = (f, s) => pstr(hx, hy, facing, f, s);
  const [gx, gy] = dirPoint(hx, hy, facing, 15, 0);
  return `<path d="M ${P(24, 0)} L ${P(14, 16)} L ${P(4, 0)} L ${P(14, 344)} Z" fill="${accent}" stroke="#05070a" stroke-width="2" stroke-linejoin="round" shape-rendering="crispEdges"/>` +
    rect(sub(gx, 2), sub(gy, 3), 4, 4, "0", "#ffffff", ".9", "none", "0");
}

function plagueMask(hx, hy, facing) {
  const P = (f, s) => pstr(hx, hy, facing, f, s);
  const [lx, ly] = dirPoint(hx, hy, facing, 4, 16);
  const [rx, ry] = dirPoint(hx, hy, facing, 4, 344);
  const goggle = (x, y) => rect(sub(x, 4), sub(y, 4), 8, 8, "4", "#11160a", ".92", "#536b2e", "2");
  return `<path d="M ${P(46, 0)} L ${P(12, 12)} L ${P(12, 348)} Z" fill="#7d8a5f" stroke="#2c3416" stroke-width="2" stroke-linejoin="round" shape-rendering="crispEdges"/>` +
    goggle(lx, ly) + goggle(rx, ry);
}

// ── extended crowns (8..22) — mirror of SnakioxCrownsB/C/D ────────────────────

// 8 — Straw Hat.
function strawHat(hx, hy, facing) {
  const P = (f, s) => pstr(hx, hy, facing, f, s);
  const [dcx, dcy] = dirPoint(hx, hy, facing, 12, 0);
  const brim = `<path d="M ${P(2, 54)} L ${P(20, 40)} L ${P(30, 0)} L ${P(20, 320)} L ${P(2, 306)}" fill="#e3c178" stroke="#8a5a2b" stroke-width="2" stroke-linejoin="round" shape-rendering="crispEdges"/>`;
  return brim + circ(dcx, dcy, 13, "none", "#b9823c", "3", ".85") + circ(dcx, dcy, 11, "#f0d79a", "#8a5a2b", "2", "1");
}

// 9 — Flower Crown.
function flowerCrown(hx, hy, facing) {
  const fl = (F, S) => {
    const [cx, cy] = dirPoint(hx, hy, facing, F, S);
    return circ(cx, cy, 6, "#ff8fb0", "#c0466e", "1.5", "1") + circ(cx, cy, 2, "#ffe08a", "none", "0", "1");
  };
  return fl(12, 322) + fl(18, 341) + fl(22, 0) + fl(18, 19) + fl(12, 38);
}

// 10 — Bandana.
function bandana(hx, hy, facing) {
  const P = (f, s) => pstr(hx, hy, facing, f, s);
  const [kx, ky] = dirPoint(hx, hy, facing, 2, 56);
  const wedge = `<path d="M ${P(0, 52)} L ${P(0, 308)} L ${P(28, 0)}" fill="#c0392b" stroke="#7d1f17" stroke-width="2" stroke-linejoin="round" shape-rendering="crispEdges"/>`;
  const fold = `<path d="M ${P(2, 46)} L ${P(22, 6)}" stroke="#e8645a" stroke-width="2" fill="none" opacity=".7"/>`;
  const tails = `<path d="M ${P(2, 52)} L ${P(16, 72)} L ${P(2, 64)} Z" fill="#a72f22"/><path d="M ${P(4, 50)} L ${P(18, 38)} L ${P(6, 44)} Z" fill="#a72f22"/>`;
  return wedge + fold + tails + circ(kx, ky, 4, "#c0392b", "#7d1f17", "1.5", "1");
}

// 11 — Leaf Sprout.
function leafSprout(hx, hy, facing) {
  const P = (f, s) => pstr(hx, hy, facing, f, s);
  const main = `<path d="M ${P(8, 0)} Q ${P(24, 18)} ${P(38, 0)} Q ${P(24, 342)} ${P(8, 0)} Z" fill="#6cc04a" stroke="#2f7d2a" stroke-width="2" stroke-linejoin="round"/>`;
  const rib = `<path d="M ${P(8, 0)} L ${P(36, 0)}" stroke="#2f7d2a" stroke-width="1.5" fill="none" opacity=".7"/>`;
  const side = `<path d="M ${P(10, 8)} Q ${P(22, 26)} ${P(28, 18)} Q ${P(16, 10)} ${P(10, 8)} Z" fill="#7fd05a" stroke="#2f7d2a" stroke-width="1.5" stroke-linejoin="round"/>`;
  return main + rib + side;
}

// 12 — Antenna Bobble.
function antenna(hx, hy, facing, accent) {
  const P = (f, s) => pstr(hx, hy, facing, f, s);
  const [bx, by] = dirPoint(hx, hy, facing, 33, 3);
  const [nx, ny] = dirPoint(hx, hy, facing, 4, 0);
  const stalk = `<path d="M ${P(4, 0)} Q ${P(18, 8)} ${P(33, 3)}" stroke="#9aa3ad" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  return (
    circ(nx, ny, 3, "#9aa3ad", "none", "0", "1") +
    stalk +
    circ(bx, by, 7, accent, "#ffffff", "1.5", "1") +
    circ(sub(bx, 2), sub(by, 2), 2, "#ffffff", "none", "0", ".9")
  );
}

// 13 — Jester Cap.
function jesterCap(hx, hy, facing) {
  const P = (f, s) => pstr(hx, hy, facing, f, s);
  const [rbx, rby] = dirPoint(hx, hy, facing, 8, 60);
  const [lbx, lby] = dirPoint(hx, hy, facing, 8, 300);
  const right = `<path d="M ${P(4, 30)} L ${P(10, 60)} L ${P(0, 52)} Z" fill="#d23b6e" stroke="#7d203f" stroke-width="1.5" stroke-linejoin="round"/>`;
  const left = `<path d="M ${P(4, 330)} L ${P(10, 300)} L ${P(0, 308)} Z" fill="#2f9ec4" stroke="#1c5d73" stroke-width="1.5" stroke-linejoin="round"/>`;
  return right + left + circ(rbx, rby, 4, "#ffd24a", "#a9791b", "1", "1") + circ(lbx, lby, 4, "#ffd24a", "#a9791b", "1", "1");
}

// 14 — Cracked Halo.
function crackedHalo(hx, hy, facing) {
  const [cx, cy] = dirPoint(hx, hy, facing, 14, 0);
  return circDash(cx, cy, 22, "#fff6d8", "7", ".25", "118 20") + circDash(cx, cy, 22, "#ffe9a8", "4", ".95", "118 20");
}

// 15 — Spiked Mohawk.
function mohawk(hx, hy, facing, accent) {
  const P = (f, s) => pstr(hx, hy, facing, f, s);
  const spike = (F) =>
    `<path d="M ${P(F + 9, 0)} L ${P(F, 7)} L ${P(F, 353)} Z" fill="${accent}" stroke="#05070a" stroke-width="1.5" stroke-linejoin="round" shape-rendering="crispEdges"/>`;
  return spike(0) + spike(7) + spike(14) + spike(21) + spike(28);
}

// 16 — Goggles.
function goggles(hx, hy, facing, accent) {
  const P = (f, s) => pstr(hx, hy, facing, f, s);
  const [rx, ry] = dirPoint(hx, hy, facing, 6, 30);
  const [lx, ly] = dirPoint(hx, hy, facing, 6, 330);
  const strap = `<path d="M ${P(6, 52)} L ${P(6, 308)}" stroke="#2a2f36" stroke-width="6" fill="none"/>`;
  return (
    strap +
    circ(rx, ry, 9, accent, "#15181d", "3", ".55") +
    circ(lx, ly, 9, accent, "#15181d", "3", ".55") +
    circ(sub(rx, 3), sub(ry, 3), 2, "#ffffff", "none", "0", ".85") +
    circ(sub(lx, 3), sub(ly, 3), 2, "#ffffff", "none", "0", ".85")
  );
}

// 17 — Ram Horns.
function ramHorns(hx, hy, facing) {
  const P = (f, s) => pstr(hx, hy, facing, f, s);
  const right = `<path d="M ${P(2, 40)} Q ${P(30, 60)} ${P(42, 30)} Q ${P(46, 8)} ${P(32, 6)}" fill="none" stroke="#d8c89a" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`;
  const left = `<path d="M ${P(2, 320)} Q ${P(30, 300)} ${P(42, 330)} Q ${P(46, 352)} ${P(32, 354)}" fill="none" stroke="#d8c89a" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`;
  return right + left;
}

// 18 — Storm Crown.
function stormCrown(hx, hy, facing) {
  const P = (f, s) => pstr(hx, hy, facing, f, s);
  const bolt = (F, S) =>
    `<path d="M ${P(F, S)} L ${P(F + 8, S + 3)} L ${P(F + 6, S)} L ${P(F + 14, S + 2)}" stroke="#ffe24a" stroke-width="3" fill="none" stroke-linejoin="round" stroke-linecap="round"/>`;
  return `<g filter="url(#glow)">` + bolt(14, 322) + bolt(18, 341) + bolt(20, 0) + bolt(18, 19) + bolt(14, 38) + `</g>`;
}

// 19 — Serpent Tongue Crown.
function serpentTongue(hx, hy, facing) {
  const P = (f, s) => pstr(hx, hy, facing, f, s);
  const [rx, ry] = dirPoint(hx, hy, facing, 40, 18);
  const [lx, ly] = dirPoint(hx, hy, facing, 40, 342);
  const prongs = `<path d="M ${P(6, 4)} Q ${P(22, 8)} ${P(40, 18)} M ${P(6, 356)} Q ${P(22, 352)} ${P(40, 342)}" stroke="#ff3a6e" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  return prongs + circ(rx, ry, 2, "#ff3a6e", "none", "0", "1") + circ(lx, ly, 2, "#ff3a6e", "none", "0", "1");
}

// 20 — Celestial Rings.
function celestialRings(hx, hy, facing, accent) {
  const [cx, cy] = dirPoint(hx, hy, facing, 12, 0);
  return (
    ellRot(cx, cy, 28, 10, "22", "#cfe3ff", "3", ".9") +
    ellRot(cx, cy, 28, 10, "-28", accent, "3", ".9") +
    circ(cx, cy, 5, accent, "#ffffff", "1", "1") +
    rect(cx + 22, sub(cy, 1), 6, 2, "0", "#ffffff", ".9", "none", "0") +
    rect(cx + 24, sub(cy, 3), 2, 6, "0", "#ffffff", ".9", "none", "0")
  );
}

// 21 — Abyssal Crown.
function abyssalCrown(hx, hy, facing, accent) {
  const P = (f, s) => pstr(hx, hy, facing, f, s);
  const spires = `<path d="M ${P(2, 312)} L ${P(34, 322)} L ${P(2, 332)} L ${P(46, 348)} L ${P(2, 356)} L ${P(40, 12)} L ${P(2, 28)} L ${P(30, 40)} L ${P(2, 50)} Z" fill="#160f2a" stroke="${accent}" stroke-width="1.5" stroke-linejoin="round"/>`;
  const [g1x, g1y] = dirPoint(hx, hy, facing, 46, 348);
  const [g2x, g2y] = dirPoint(hx, hy, facing, 40, 12);
  return spires + circ(g1x, g1y, 2, accent, "none", "0", ".95") + circ(g2x, g2y, 2, accent, "none", "0", ".95");
}

// 22 — Golden Aegis.
function goldenAegis(hx, hy, facing, accent) {
  const P = (f, s) => pstr(hx, hy, facing, f, s);
  const [gx, gy] = dirPoint(hx, hy, facing, 38, 0);
  const arc =
    `<path d="M ${P(2, 308)} Q ${P(44, 0)} ${P(2, 52)}" stroke="#f2c84b" stroke-width="7" fill="none" stroke-linecap="round"/>` +
    `<path d="M ${P(2, 308)} Q ${P(40, 0)} ${P(2, 52)}" stroke="#fff0b0" stroke-width="2" fill="none" opacity=".6"/>`;
  const boss = `<path d="M ${P(46, 0)} L ${P(38, 12)} L ${P(30, 0)} L ${P(38, 348)} Z" fill="#f2c84b" stroke="#8a5a1a" stroke-width="1.5" stroke-linejoin="round"/>`;
  return arc + boss + circ(gx, gy, 4, accent, "#8a5a1a", "1", "1");
}

export function crownLayer(crown, len, p, pos) {
  if (crown === 0) return "";
  const [hx, hy] = pos(len - 1);
  const [nx, ny] = pos(len - 2);
  const facing = facingFrom(hx, hy, nx, ny);
  if (crown === 1) return tyrantCrown(hx, hy, facing);
  if (crown === 2) return boneHalo(hx, hy, facing);
  if (crown === 3) return demonHorns(hx, hy, facing);
  if (crown === 4) return deathWings(hx, hy, facing, p.accent);
  if (crown === 5) return antlers(hx, hy, facing, p.accent);
  if (crown === 6) return thirdEye(hx, hy, facing, p.accent);
  if (crown === 7) return plagueMask(hx, hy, facing);
  if (crown === 8) return strawHat(hx, hy, facing);
  if (crown === 9) return flowerCrown(hx, hy, facing);
  if (crown === 10) return bandana(hx, hy, facing);
  if (crown === 11) return leafSprout(hx, hy, facing);
  if (crown === 12) return antenna(hx, hy, facing, p.accent);
  if (crown === 13) return jesterCap(hx, hy, facing);
  if (crown === 14) return crackedHalo(hx, hy, facing);
  if (crown === 15) return mohawk(hx, hy, facing, p.accent);
  if (crown === 16) return goggles(hx, hy, facing, p.accent);
  if (crown === 17) return ramHorns(hx, hy, facing);
  if (crown === 18) return stormCrown(hx, hy, facing);
  if (crown === 19) return serpentTongue(hx, hy, facing);
  if (crown === 20) return celestialRings(hx, hy, facing, p.accent);
  if (crown === 21) return abyssalCrown(hx, hy, facing, p.accent);
  return goldenAegis(hx, hy, facing, p.accent);
}

// curse index follows TRAIT_INDEX.curses order: 1 Inverted, 2 Rotting,
// 3 Overclocked, 4 Blessed, 5 Forsaken, 6 Ascended.
export function curseLayer(curse) {
  if (curse === 0) return "";
  if (curse === 1) return '<rect width="900" height="900" fill="#bcc7d1" opacity=".08" style="mix-blend-mode:difference"/>';
  if (curse === 2) return '<rect width="900" height="900" fill="#7dff49" opacity=".06"/>';
  if (curse === 3) return '<rect width="900" height="900" fill="#28e7ff" opacity=".06" style="mix-blend-mode:screen"/>';
  if (curse === 4) return '<rect width="900" height="900" fill="#ffd166" opacity=".08"/>';
  if (curse === 5) return '<rect width="900" height="900" fill="#ff002b" opacity=".08"/>';
  return '<rect width="900" height="900" fill="#fff3d0" opacity=".10"/>';
}

// ─── DEFS / FRAME ─────────────────────────────────────────────────────────────

export function creatureDefs(p) {
  return (
    `<linearGradient id="scale" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${p.accent}"/><stop offset=".24" stop-color="${p.primary}"/><stop offset=".62" stop-color="${p.primary}"/><stop offset="1" stop-color="${p.shadow}"/></linearGradient>` +
    `<linearGradient id="headG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.accent}" stop-opacity=".55"/><stop offset=".35" stop-color="${p.primary}"/><stop offset="1" stop-color="${p.shadow}"/></linearGradient>` +
    '<radialGradient id="vig" cx=".5" cy=".48" r=".62"><stop offset="52%" stop-color="#05070a" stop-opacity="0"/><stop offset="100%" stop-color="#05070a" stop-opacity=".5"/></radialGradient>' +
    `<radialGradient id="spot" cx=".5" cy=".42" r=".48"><stop offset="0" stop-color="${p.accent}" stop-opacity=".13"/><stop offset="100%" stop-color="${p.accent}" stop-opacity="0"/></radialGradient>`
  );
}

export const GLOW_FILTER =
  '<filter id="glow" x="-35%" y="-35%" width="170%" height="170%"><feGaussianBlur stdDeviation="9" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>';

function defs(darkSkin, bodyPattern, rarity, p) {
  return "<defs>" + bgDefs(darkSkin, bodyPattern, rarity) + patternDefs(bodyPattern) + creatureDefs(p) +
    GLOW_FILTER + "</defs>";
}

// Just the defs a transparent "live" creature needs (no background / arena) —
// the scale + head gradients, any body-pattern symbols, and the glow filter.
// Lets a game / animated avatar render the SAME creature over its own backdrop.
export function liveDefs(p, bodyPattern) {
  return "<defs>" + patternDefs(bodyPattern) + creatureDefs(p) + GLOW_FILTER + "</defs>";
}

// Inner markup for the creature ONLY (mark, sigil, body, head, crown, curse) —
// driven by a live `pos(i) => [x, y]`. No background, arena, or frame, so it can
// be layered over any backdrop. `n` is a normalizeTraits() result.
export function creatureInner(n, len, pos) {
  const { p, darkSkin, isMech, isCorrupted } = n;
  return liveDefs(p, n.bodyPattern) +
    markLayer(n.mark, len, p, pos) +
    sigilLayer(n.sigil, len, p, pos) +
    body(len, p, darkSkin, isMech, isCorrupted, n.bodyPattern, pos) +
    head(len, p, darkSkin, n.gaze, pos) +
    crownLayer(n.crown, len, p, pos);
}

// Pixel corner brackets framing the arena — a subtle "card" accent.
function frame(darkSkin, rarity) {
  const c = rarity >= 4 ? "#d8b768" : (darkSkin ? "#6f7c88" : "#5a6675");
  const op = rarity >= 4 ? ".8" : ".5";
  const L = (x, y, fx, fy) => rect(x, y, fx ? 54 : 6, fy ? 54 : 6, "0", c, op, "none", "0");
  return `<g shape-rendering="crispEdges">` +
    L(56, 56, 1, 0) + L(56, 56, 0, 1) +
    L(790, 56, 1, 0) + L(838, 56, 0, 1) +
    L(56, 838, 1, 0) + L(56, 790, 0, 1) +
    L(790, 838, 1, 0) + L(838, 790, 0, 1) +
    "</g>";
}

// ─── TRAIT NORMALIZATION + RENDER ─────────────────────────────────────────────

const clampLen = (v) => Math.max(6, Math.min(82, Math.round(v)));

// Map friendly named traits onto the numeric values the art layers consume.
// Accepts the generator's trait object; a game can also build this shape from a
// token's on-chain numeric traits (skip the name lookups and pass indices).
export function normalizeTraits(traits) {
  const palette = getPalette(traits.skin);
  const idx = (arr, value, fallback = 0) => {
    const i = arr.indexOf(value);
    return i < 0 ? fallback : i;
  };
  const pattern = traits.bodyPattern && traits.bodyPattern !== "None"
    ? idx(TRAIT_INDEX.patterns, traits.bodyPattern)   // 0..9
    : 10;                                             // 10 = no pattern
  return {
    p: { primary: palette[0], shadow: palette[1], accent: palette[2] },
    darkSkin: isDarkPalette(palette),
    isMech: traits.formSeries === "Machine",
    isCorrupted: traits.skinSeries === "Corrupted",
    mark: idx(TRAIT_INDEX.marks, traits.mark),
    gaze: idx(TRAIT_INDEX.gazes, traits.gaze),
    crown: idx(TRAIT_INDEX.crowns, traits.crown),
    sigil: idx(TRAIT_INDEX.sigils, traits.sigil),
    curse: idx(TRAIT_INDEX.curses, traits.curse),
    bodyPattern: pattern,
    rarity: RARITY_TIERS[traits.rarity] ?? 0
  };
}

// Inner SVG markup (no outer <svg>) — the full layered art. `pos(i) => [x, y]`
// supplies the pixel center of body segment i (0 = tail … len-1 = head).
export function renderInner(n, len, pos) {
  const { p, darkSkin, isMech, isCorrupted } = n;
  return defs(darkSkin, n.bodyPattern, n.rarity, p) +
    '<rect width="900" height="900" fill="url(#bg)"/>' +
    arena(darkSkin, n.bodyPattern, n.rarity) +
    '<rect x="42" y="42" width="816" height="816" rx="8" fill="url(#spot)"/>' +
    '<rect x="42" y="42" width="816" height="816" rx="8" fill="url(#vig)"/>' +
    frame(darkSkin, n.rarity) +
    markLayer(n.mark, len, p, pos) +
    sigilLayer(n.sigil, len, p, pos) +
    body(len, p, darkSkin, isMech, isCorrupted, n.bodyPattern, pos) +
    head(len, p, darkSkin, n.gaze, pos) +
    crownLayer(n.crown, len, p, pos) +
    curseLayer(n.curse);
}

// Full standalone SVG. `pos` is required (the path layer lives outside core).
export function renderSnakeSvg({ traits, len = 46, pos }) {
  if (typeof pos !== "function") throw new TypeError("renderSnakeSvg: `pos(i) => [x, y]` is required");
  const n = normalizeTraits(traits);
  const drawn = clampLen(len);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 900" width="900" height="900" role="img" aria-label="Snakiox ${traits.skin} ${traits.form}">${renderInner(n, drawn, pos)}</svg>`;
}
