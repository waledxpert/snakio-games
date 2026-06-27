// Browser port of the on-chain Snakiox generator. The Node CLI (file output)
// has been stripped; trait selection, the deterministic path, and SVG rendering
// are identical to the canonical generator so demo snakes match minted tokens.
import {
  TRAIT_INDEX,
  renderSnakeSvg as renderSnakeSvgCore,
  normalizeTraits,
  renderInner,
  creatureInner,
  liveDefs,
  creatureDefs,
  segSize,
  facingFrom,
  getPalette,
  isDarkPalette,
  PALETTES,
  patternDefs,
  patternOverlay,
  gazeColor,
  body,
  head,
  tailTip,
  crownLayer,
  sigilLayer,
  markLayer,
  curseLayer,
  arena
} from "./render-core.js";

// Unicode-safe base64 for data: URLs (browser replacement for Node's Buffer).
function toBase64(str) {
  return btoa(unescape(encodeURIComponent(str)));
}

// ─── TRAITS ──────────────────────────────────────────────────────────────────
// Lore-first collectible identities. The render-relevant lists (marks, gazes,
// crowns, sigils, curses, patterns) are sourced from render-core's TRAIT_INDEX
// so their order — i.e. the on-chain trait value — has a single source of truth.

const TRAITS = {

  // SKIN: what the snake IS made of, conveyed through palette + body rendering
  skins: {
    "Forged": [
      "Obsidian Shard", "Rusted Iron", "Damascus Coil", "Cold Steel",
      "Black Chrome", "Gilded Scale", "Platinum Sovereign", "Rose Alloy",
      "Bronze Relic", "Corroded Copper", "Titanfall", "Mercurial"
    ],
    "Gemborn": [
      "Amethyst Vein", "Void Crystal", "Prism Fracture", "Blood Ruby",
      "Deep Sapphire", "Emerald Core", "Black Opal", "Citrine Flash",
      "Aqua Garnet", "White Diamond", "Moonstone Haze", "Peridot Bloom"
    ],
    "Elemental": [
      "Magma Drip", "Frostbitten", "Stormwracked", "Ashfall",
      "Toxic Bloom", "Embervein", "Sandstorm", "Mudborn",
      "Soul Flame", "Permafrost", "Thunderclad", "Poison Tide"
    ],
    "Cosmic": [
      "Void Walker", "Nebula Drift", "Dark Matter", "Solar Remnant",
      "Starforged", "Event Horizon", "Aurora Veil", "Supernova Scar",
      "Lunar Phase", "Cosmic Static", "Pulsar", "Antimatter"
    ],
    "Corrupted": [
      "Rotbone", "Fleshweave", "Chitin Crack", "Eldritch Moss",
      "Festered Vine", "Fungal Crown", "Plague Scale", "Barnacle God",
      "Spore Drift", "Hollow Shell", "Parasite Host", "Gore Bloom"
    ],
    "Spectral": [
      "Wraith Skin", "Phantom Veil", "Astral Trace", "Nightmare Weave",
      "Soul Shard", "Demonic Pact", "Angelic Fall", "Dream Fracture",
      "Void Echo", "Shadow Bleed", "Spirit Coil", "Cursed Sigil"
    ],
    "Digital": [
      "Glitch Form", "Matrix Overflow", "Neon Pulse", "Data Decay",
      "Cyber Lattice", "Vaporwave Ghost", "Hologram Flicker", "Binary Scar",
      "AI Corruption", "RGB Overload", "Synthwave Drift", "Pixel Artifact"
    ],
    "Ancient": [
      "Fossil Slate", "Jade Tomb", "Moonstone Ruin", "Meteorite Fall",
      "Sandstone God", "Basalt Titan", "Quartz Idol", "Coral Scripture",
      "Amber Sealed", "Obsidian Altar", "Granite Effigy", "Onyx Pharaoh"
    ]
  },

  // FORM: the snake's body archetype — gives it a creature identity
  forms: {
    "Serpent": [
      "Pit Viper", "King Cobra", "Black Mamba", "Boa Constrictor",
      "Sidewinder", "Fer-de-Lance", "Inland Taipan", "Bushmaster"
    ],
    "Dragon": [
      "Bone Drake", "Sea Wyrm", "Feathered Serpent", "Storm Wyrm",
      "Celestial Lung", "Chaos Drake", "Ember Lindworm", "Void Wyvern"
    ],
    "Machine": [
      "Drill Head", "Chainlink", "Hydraulic Spine", "Clockwork Coil",
      "Steam Crawler", "Nano Thread", "Piston Body", "Rail Serpent"
    ],
    "Deity": [
      "Ouroboros", "Leviathan", "Serpent God", "World Coil",
      "Chaos Worm", "Deep Titan", "Primordial", "The Endless"
    ],
    "Parasite": [
      "Spine Leech", "Brain Worm", "Host Crawler", "Nerve Tap",
      "Marrow Feeder", "Root Parasite", "Mind Thread", "Hollow Borer"
    ],
    "Pixel": [
      "8-Bit Classic", "16-Bit Crawler", "Dithered Form", "CRT Ghost",
      "Voxel Coil", "Arcade Sprite", "LCD Glitch", "Monochrome Run"
    ],
    "Celestial": [
      "Solar Asp", "Lunar Boa", "Star Serpent", "Aurora Coil",
      "Void Seraph", "Nebula Wyrm", "Cosmic Eel", "Pulsar Spine"
    ],
    "Abyssal": [
      "Deep Sea Eel", "Biolume Crawler", "Trench Leviathan", "Abyssal Koi",
      "Pressure Spine", "Hadal Worm", "Midnight Eel", "Rift Serpent"
    ]
  },

  // Render-relevant trait lists (index == on-chain value) live in render-core.
  marks:    TRAIT_INDEX.marks,
  gazes:    TRAIT_INDEX.gazes,
  crowns:   TRAIT_INDEX.crowns,
  sigils:   TRAIT_INDEX.sigils,
  curses:   TRAIT_INDEX.curses,
  patterns: TRAIT_INDEX.patterns
};

// ─── RARITY ──────────────────────────────────────────────────────────────────

const RARITY_WEIGHTS = [
  { name: "Common",    weight: 500 },
  { name: "Uncommon",  weight: 270 },
  { name: "Rare",      weight: 145 },
  { name: "Epic",      weight: 65  },
  { name: "Legendary", weight: 17  },
  { name: "Mythic",    weight: 3   }
];

// Rarity gates: traits only appear at or above a certain rarity tier
const RARITY_TIERS = { Common: 0, Uncommon: 1, Rare: 2, Epic: 3, Legendary: 4, Mythic: 5 };

const GATED_CROWNS = {
  "None":                 0,  // Common+
  "Third Eye Gem":        0,
  "Straw Hat":            0,
  "Flower Crown":         0,
  "Leaf Sprout":          0,
  "Antenna Bobble":       0,
  "Plague Mask":          1,  // Uncommon+
  "Bone Halo":            1,
  "Bandana":              1,
  "Spiked Mohawk":        1,
  "Goggles":              1,
  "Demon Horns":          2,  // Rare+
  "Void Antlers":         2,
  "Jester Cap":           2,
  "Cracked Halo":         2,
  "Ram Horns":            2,
  "Death Wings":          3,  // Epic+
  "Tyrant Crown":         3,
  "Serpent Tongue Crown": 3,
  "Storm Crown":          4,  // Legendary+
  "Celestial Rings":      4,
  "Abyssal Crown":        4,
  "Golden Aegis":         5   // Mythic only
};

const GATED_CURSES = {
  "None":         0,
  "Rotting":      2,  // Rare+
  "Inverted":     2,
  "Overclocked":  3,  // Epic+
  "Forsaken":     3,
  "Blessed":      4,  // Legendary+
  "Ascended":     5   // Mythic only
};

const SKIN_WEIGHTS = {
  "Forged":    160,
  "Ancient":   140,
  "Elemental": 135,
  "Gemborn":   115,
  "Corrupted": 100,
  "Digital":    90,
  "Spectral":   75,
  "Cosmic":     55
};

const FORM_WEIGHTS = {
  "Serpent":   175,
  "Dragon":    130,
  "Machine":   110,
  "Pixel":      95,
  "Abyssal":    90,
  "Parasite":   75,
  "Celestial":  65,
  "Deity":      40
};

// ─── RNG ─────────────────────────────────────────────────────────────────────

function mulberry32(seed) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let v = state;
    v = Math.imul(v ^ (v >>> 15), v | 1);
    v ^= v + Math.imul(v ^ (v >>> 7), v | 61);
    return ((v ^ (v >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(input) {
  const text = String(input);
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function weightedPick(entries, random) {
  const total = entries.reduce((sum, e) => sum + e.weight, 0);
  let roll = random() * total;
  for (const entry of entries) {
    roll -= entry.weight;
    if (roll <= 0) return entry;
  }
  return entries.at(-1);
}

function pick(list, random) {
  return list[Math.floor(random() * list.length)];
}

function pickGated(obj, rarityTier, random) {
  const eligible = Object.entries(obj).filter(([, minTier]) => rarityTier >= minTier);
  if (!eligible.length) return "None";
  const [key] = eligible[Math.floor(random() * eligible.length)];
  return key;
}

function flattenSeries(seriesMap) {
  return Object.entries(seriesMap).flatMap(([series, values]) =>
    values.map((value) => ({ series, value }))
  );
}

function rarityBoostedPick(items, seriesWeights, random, rarity) {
  const rarityBias = {
    Common: 0.3, Uncommon: 0.55, Rare: 0.8,
    Epic: 1.05, Legendary: 1.35, Mythic: 1.7
  }[rarity.name];

  return weightedPick(
    items.map((item, index) => {
      const base = seriesWeights[item.series] ?? 100;
      const tailBoost = 1 + (index / items.length) * rarityBias;
      return { ...item, weight: base / tailBoost + tailBoost * 12 };
    }),
    random
  );
}

// A 96-bit render/path seed (BigInt) — feeds the deterministic snake path below.
function makeSeed(random) {
  let s = 0n;
  for (let i = 0; i < 3; i++) s = (s << 32n) | BigInt(Math.floor(random() * 0x100000000));
  return s;
}

// ─── SNAKE PATH ───────────────────────────────────────────────────────────────
// Deterministic on-chain path port (SnakioxPath.sol). point(i, len, seed)
// returns the pixel center of body segment i. Styles: boustrophedon / spiral /
// herringbone / ribbon, chosen from the low bits of the BigInt seed. The path
// lives HERE (not in render-core) because a live game supplies its own segment
// positions instead of this static layout.

const PIXEL = 28n, CENTER = 14n, SAFE_MIN = 3n, SAFE_CELLS = 24n;
const ceilDiv = (a, b) => (a === 0n ? 0n : ((a - 1n) / b) + 1n);

function pathStyle(len, seed) {
  const raw = seed & 0x3n;
  if (raw === 1n) return "spiral";
  if (raw === 2n) return herringboneFits(len, seed) ? "herringbone" : "ribbon";
  if (raw === 3n) return "ribbon";
  return "boustrophedon";
}

function applyVariant(lx, ly, side, variant) {
  if (variant === 1n) lx = side - 1n - lx;
  else if (variant === 2n) ly = side - 1n - ly;
  else if (variant === 3n) { const t = lx; lx = ly; ly = t; }
  return [lx, ly];
}

function pathWidth(len, seed) {
  const desired = 9n + ((seed >> 16n) % 8n);
  const maxRows = (SAFE_CELLS - 1n) / 2n;
  const minCycle = ceilDiv(len, maxRows);
  const minWidth = minCycle > 2n ? minCycle - 2n : 4n;
  return desired < minWidth ? minWidth : desired;
}

function boustrophedonPoint(index, len, seed) {
  const width = pathWidth(len, seed);
  const cycle = width + 2n;
  const rows = ceilDiv(len, cycle);
  const vertical = ((seed >> 7n) & 1n) === 1n;
  const canvasWidth = vertical ? rows * 2n + 1n : width;
  const canvasHeight = vertical ? width : rows * 2n + 1n;
  const xRange = SAFE_CELLS - canvasWidth;
  const yRange = SAFE_CELLS - canvasHeight;
  const baseX = SAFE_MIN + ((seed >> 32n) % (xRange + 1n));
  const baseY = SAFE_MIN + ((seed >> 48n) % (yRange + 1n));
  const row = index / cycle;
  const within = index % cycle;
  const forward = row % 2n === 0n;
  let localX, localY;
  if (within < width) { localX = forward ? within : width - 1n - within; localY = row * 2n; }
  else { localX = forward ? width - 1n : 0n; localY = row * 2n + within - width + 1n; }
  if (vertical) return [baseX + localY, baseY + localX];
  return [baseX + localX, baseY + localY];
}

function spiralSide(len) {
  let side = 8n + ceilDiv(len, 8n);
  if (side > SAFE_CELLS) side = SAFE_CELLS;
  return side;
}

function spiralLocal(index, side) {
  let left = 0n, right = side - 1n, top = 0n, bottom = side - 1n, remaining = index;
  while (true) {
    const topLen = right - left + 1n;
    if (remaining < topLen) return [left + remaining, top];
    remaining -= topLen; top += 1n; if (top > bottom) break;
    const rightLen = bottom - top + 1n;
    if (remaining < rightLen) return [right, top + remaining];
    remaining -= rightLen; if (right === left) break; right -= 1n;
    const bottomLen = right - left + 1n;
    if (remaining < bottomLen) return [right - remaining, bottom];
    remaining -= bottomLen; bottom -= 1n; if (top > bottom) break;
    const leftLen = bottom - top + 1n;
    if (remaining < leftLen) return [left, bottom - remaining];
    remaining -= leftLen; if (left === right) break; left += 1n;
  }
  return [left, top];
}

function spiralPoint(index, len, seed) {
  const side = spiralSide(len);
  let [lx, ly] = spiralLocal(index, side);
  const variant = (seed >> 2n) & 0x3n;
  [lx, ly] = applyVariant(lx, ly, side, variant);
  const xRange = SAFE_CELLS - side, yRange = SAFE_CELLS - side;
  const baseX = SAFE_MIN + ((seed >> 32n) % (xRange + 1n));
  const baseY = SAFE_MIN + ((seed >> 48n) % (yRange + 1n));
  return [baseX + lx, baseY + ly];
}

function herringboneLegs(len, seed) {
  let legs = pathWidth(len, seed);
  if (legs % 2n === 0n) legs -= 1n;
  if (legs < 5n) return 5n;
  return legs;
}

function herringboneFits(len, seed) {
  const legs = herringboneLegs(len, seed);
  const span = (legs - 1n) / 2n;
  const rows = ceilDiv(len, legs + 2n);
  const rowHeight = span + 2n;
  const longSide = rows * rowHeight + 1n;
  const shortSide = span + 1n;
  return longSide <= SAFE_CELLS && shortSide <= SAFE_CELLS;
}

function herringbonePoint(index, len, seed) {
  const legs = herringboneLegs(len, seed);
  const spanX = (legs - 1n) / 2n, spanY = (legs - 1n) / 2n;
  const cycle = legs + 2n;
  const rowHeight = spanY + 2n;
  const rows = ceilDiv(len, cycle);
  const vertical = ((seed >> 7n) & 1n) === 1n;
  const canvasWidth = vertical ? rows * rowHeight + 1n : spanX + 1n;
  const canvasHeight = vertical ? spanX + 1n : rows * rowHeight + 1n;
  const xRange = SAFE_CELLS - canvasWidth, yRange = SAFE_CELLS - canvasHeight;
  const baseX = SAFE_MIN + ((seed >> 32n) % (xRange + 1n));
  const baseY = SAFE_MIN + ((seed >> 48n) % (yRange + 1n));
  const row = index / cycle, within = index % cycle;
  const forward = row % 2n === 0n;
  let localX, localY;
  if (within < legs) {
    const dx = (within + 1n) / 2n, dy = within / 2n;
    localX = forward ? dx : spanX - dx;
    localY = row * rowHeight + dy;
  } else {
    localX = forward ? spanX : 0n;
    localY = row * rowHeight + spanY + within - legs + 1n;
  }
  if (vertical) return [baseX + localY, baseY + localX];
  return [baseX + localX, baseY + localY];
}

function ribbonWidth(len, seed) {
  const desired = 16n + ((seed >> 18n) % 7n);
  const maxRows = (SAFE_CELLS - 1n) / 3n;
  const minCycle = ceilDiv(len, maxRows);
  const minWidth = minCycle > 3n ? minCycle - 3n : 8n;
  return desired < minWidth ? minWidth : desired;
}

function ribbonPoint(index, len, seed) {
  const width = ribbonWidth(len, seed);
  const cycle = width + 3n;
  const rows = ceilDiv(len, cycle);
  const vertical = ((seed >> 9n) & 1n) === 1n;
  const canvasWidth = vertical ? rows * 3n + 1n : width;
  const canvasHeight = vertical ? width : rows * 3n + 1n;
  const xRange = SAFE_CELLS - canvasWidth, yRange = SAFE_CELLS - canvasHeight;
  const baseX = SAFE_MIN + ((seed >> 36n) % (xRange + 1n));
  const baseY = SAFE_MIN + ((seed >> 52n) % (yRange + 1n));
  const row = index / cycle, within = index % cycle;
  const forward = row % 2n === 0n;
  let localX, localY;
  if (within < width) { localX = forward ? within : width - 1n - within; localY = row * 3n; }
  else { localX = forward ? width - 1n : 0n; localY = row * 3n + within - width + 1n; }
  if (vertical) return [baseX + localY, baseY + localX];
  return [baseX + localX, baseY + localY];
}

function pathPoint(index, len, seed) {
  const style = pathStyle(len, seed);
  if (style === "spiral") return spiralPoint(index, len, seed);
  if (style === "herringbone") return herringbonePoint(index, len, seed);
  if (style === "ribbon") return ribbonPoint(index, len, seed);
  return boustrophedonPoint(index, len, seed);
}

// Returns [x, y] as Numbers (pixel coordinates) for body segment `index`.
function point(index, len, seed) {
  const [cellX, cellY] = pathPoint(BigInt(index), BigInt(len), seed);
  return [Number(cellX * PIXEL + CENTER), Number(cellY * PIXEL + CENTER)];
}

// ─── SVG RENDERER (seed-driven convenience over render-core) ───────────────────

const clampLen = (v) => Math.max(6, Math.min(82, Math.round(v)));

// Renders a static token from named traits + a path seed. Internally builds the
// `pos(i)` callback render-core needs from the deterministic path above.
function renderSnakeSvg({ traits, len = 46, seed = 0n }) {
  const s = typeof seed === "bigint" ? seed : BigInt(seed);
  const drawn = clampLen(len);
  return renderSnakeSvgCore({ traits, len: drawn, pos: (i) => point(i, drawn, s) });
}

// ─── SNAKE STATS ──────────────────────────────────────────────────────────────

// Materialize the deterministic path into {index,x,y} blocks for metadata.
function blocksFromSeed(len, seed) {
  return Array.from({ length: len }, (_, i) => {
    const [x, y] = point(i, len, seed);
    return { index: i, x, y };
  });
}

function snakeStats(blocks) {
  const xs = blocks.map(b => b.x), ys = blocks.map(b => b.y);
  return {
    length: blocks.length,
    bounds: {
      minX: +Math.min(...xs).toFixed(2), minY: +Math.min(...ys).toFixed(2),
      maxX: +Math.max(...xs).toFixed(2), maxY: +Math.max(...ys).toFixed(2),
      width:  +(Math.max(...xs) - Math.min(...xs)).toFixed(2),
      height: +(Math.max(...ys) - Math.min(...ys)).toFixed(2)
    }
  };
}

// ─── TOKEN ───────────────────────────────────────────────────────────────────

function createToken(seedInput, options = {}) {
  const random   = mulberry32(hashSeed(seedInput));
  const rarity   = weightedPick(RARITY_WEIGHTS, random);
  const tier     = RARITY_TIERS[rarity.name];

  const skins    = flattenSeries(TRAITS.skins);
  const forms    = flattenSeries(TRAITS.forms);
  const skin     = rarityBoostedPick(skins, SKIN_WEIGHTS, random, rarity);
  const form     = rarityBoostedPick(forms, FORM_WEIGHTS, random, rarity);

  const mark        = pick(TRAITS.marks,  random);
  const gaze        = pick(TRAITS.gazes,  random);
  const sigil       = pick(TRAITS.sigils, random);
  const crown       = pickGated(GATED_CROWNS, tier, random);
  const curse       = pickGated(GATED_CURSES, tier, random);
  // ~40% of snakes wear no body pattern; the rest pick one of the ten.
  const bodyPattern = random() < 0.4 ? "None" : pick(TRAITS.patterns, random);

  const traits = {
    rarity:     rarity.name,
    skinSeries: skin.series,
    skin:       skin.value,
    formSeries: form.series,
    form:       form.value,
    mark,
    gaze,
    crown,
    sigil,
    curse,
    bodyPattern
  };

  const len    = clampLen(options.length ?? (34 + Math.floor(random() * 30)));
  const seed   = options.seed != null ? BigInt(options.seed) : makeSeed(random);
  const blocks = blocksFromSeed(len, seed);
  const stats  = snakeStats(blocks);
  const svg    = renderSnakeSvg({ traits, len, seed });

  const attributes = [
    { trait_type: "Rarity",      value: traits.rarity },
    { trait_type: "Skin Series", value: traits.skinSeries },
    { trait_type: "Skin",        value: traits.skin },
    { trait_type: "Form Series", value: traits.formSeries },
    { trait_type: "Form",        value: traits.form },
    { trait_type: "Mark",        value: traits.mark },
    { trait_type: "Gaze",        value: traits.gaze },
    { trait_type: "Crown",       value: traits.crown },
    { trait_type: "Sigil",       value: traits.sigil },
    { trait_type: "Curse",       value: traits.curse },
    { trait_type: "Pattern",     value: traits.bodyPattern },
    { trait_type: "Length",      value: stats.length, display_type: "number" }
  ];

  return {
    // tokenId is surfaced for the demo UI (wallet grid keys / selection).
    tokenId: options.tokenId ?? seedInput,
    name: `Snakiox #${String(options.tokenId ?? seedInput).padStart(5, "0")}`,
    description: "A pixel-block snake NFT generated fully on-chain. Each Snakiox carries a unique Skin, Form, Gaze, Mark, Crown, Sigil, Curse, and Pattern — forged from a single seed.",
    seed: seedInput,
    pathSeed: "0x" + seed.toString(16),
    traits,
    len,
    snake: { blocks, ...stats },
    image: `data:image/svg+xml;base64,${toBase64(svg)}`,
    attributes,
    svg
  };
}

// Generator surface: trait selection, path, metadata.
export { TRAITS, createToken, renderSnakeSvg, makeSeed, point, blocksFromSeed, snakeStats, hashSeed };

// Re-export render-core so a game can pull the look + trait mapping from one
// place: `import { normalizeTraits, getPalette, crownLayer, ... } from "./generator.js"`.
export {
  TRAIT_INDEX,
  normalizeTraits,
  renderInner,
  creatureInner,
  liveDefs,
  creatureDefs,
  segSize,
  facingFrom,
  getPalette,
  isDarkPalette,
  PALETTES,
  patternDefs,
  patternOverlay,
  gazeColor,
  body,
  head,
  tailTip,
  crownLayer,
  sigilLayer,
  markLayer,
  curseLayer,
  arena
};
