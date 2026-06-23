// Browser-safe port of the on-chain Snakiox art generator.
// Mirrors the trait names, palettes, path layout and SVG renderer found in the
// Solidity generator (SnakioxDOTSOL/generator/generator.js) so that the playable
// snake and its preview look identical to the minted NFT.

// ─── TRAITS ──────────────────────────────────────────────────────────────────
export const TRAITS = {
  skins: {
    Forged: [
      "Obsidian Shard", "Rusted Iron", "Damascus Coil", "Cold Steel",
      "Black Chrome", "Gilded Scale", "Platinum Sovereign", "Rose Alloy",
      "Bronze Relic", "Corroded Copper", "Titanfall", "Mercurial"
    ],
    Gemborn: [
      "Amethyst Vein", "Void Crystal", "Prism Fracture", "Blood Ruby",
      "Deep Sapphire", "Emerald Core", "Black Opal", "Citrine Flash",
      "Aqua Garnet", "White Diamond", "Moonstone Haze", "Peridot Bloom"
    ],
    Elemental: [
      "Magma Drip", "Frostbitten", "Stormwracked", "Ashfall",
      "Toxic Bloom", "Embervein", "Sandstorm", "Mudborn",
      "Soul Flame", "Permafrost", "Thunderclad", "Poison Tide"
    ],
    Cosmic: [
      "Void Walker", "Nebula Drift", "Dark Matter", "Solar Remnant",
      "Starforged", "Event Horizon", "Aurora Veil", "Supernova Scar",
      "Lunar Phase", "Cosmic Static", "Pulsar", "Antimatter"
    ],
    Corrupted: [
      "Rotbone", "Fleshweave", "Chitin Crack", "Eldritch Moss",
      "Festered Vine", "Fungal Crown", "Plague Scale", "Barnacle God",
      "Spore Drift", "Hollow Shell", "Parasite Host", "Gore Bloom"
    ],
    Spectral: [
      "Wraith Skin", "Phantom Veil", "Astral Trace", "Nightmare Weave",
      "Soul Shard", "Demonic Pact", "Angelic Fall", "Dream Fracture",
      "Void Echo", "Shadow Bleed", "Spirit Coil", "Cursed Sigil"
    ],
    Digital: [
      "Glitch Form", "Matrix Overflow", "Neon Pulse", "Data Decay",
      "Cyber Lattice", "Vaporwave Ghost", "Hologram Flicker", "Binary Scar",
      "AI Corruption", "RGB Overload", "Synthwave Drift", "Pixel Artifact"
    ],
    Ancient: [
      "Fossil Slate", "Jade Tomb", "Moonstone Ruin", "Meteorite Fall",
      "Sandstone God", "Basalt Titan", "Quartz Idol", "Coral Scripture",
      "Amber Sealed", "Obsidian Altar", "Granite Effigy", "Onyx Pharaoh"
    ]
  },
  forms: {
    Serpent: [
      "Pit Viper", "King Cobra", "Black Mamba", "Boa Constrictor",
      "Sidewinder", "Fer-de-Lance", "Inland Taipan", "Bushmaster"
    ],
    Dragon: [
      "Bone Drake", "Sea Wyrm", "Feathered Serpent", "Storm Wyrm",
      "Celestial Lung", "Chaos Drake", "Ember Lindworm", "Void Wyvern"
    ],
    Machine: [
      "Drill Head", "Chainlink", "Hydraulic Spine", "Clockwork Coil",
      "Steam Crawler", "Nano Thread", "Piston Body", "Rail Serpent"
    ],
    Deity: [
      "Ouroboros", "Leviathan", "Serpent God", "World Coil",
      "Chaos Worm", "Deep Titan", "Primordial", "The Endless"
    ],
    Parasite: [
      "Spine Leech", "Brain Worm", "Host Crawler", "Nerve Tap",
      "Marrow Feeder", "Root Parasite", "Mind Thread", "Hollow Borer"
    ],
    Pixel: [
      "8-Bit Classic", "16-Bit Crawler", "Dithered Form", "CRT Ghost",
      "Voxel Coil", "Arcade Sprite", "LCD Glitch", "Monochrome Run"
    ],
    Celestial: [
      "Solar Asp", "Lunar Boa", "Star Serpent", "Aurora Coil",
      "Void Seraph", "Nebula Wyrm", "Cosmic Eel", "Pulsar Spine"
    ],
    Abyssal: [
      "Deep Sea Eel", "Biolume Crawler", "Trench Leviathan", "Abyssal Koi",
      "Pressure Spine", "Hadal Worm", "Midnight Eel", "Rift Serpent"
    ]
  },
  marks: [
    "None", "Hellfire Ring", "Glacial Halo", "Death Shroud", "Storm Mantle",
    "Prismatic Veil", "Toxic Mist", "Void Bleed", "Neon Corona", "Spirit Trail",
    "Lava Seep", "Plague Cloud", "Starfall Dust"
  ],
  gazes: [
    "Predator Split", "Void Stare", "Third Eye", "Crystal Sight", "Ember Glow",
    "Dead Eye", "Mechanical Lens", "Rune Carved", "Pixel Scan", "God Eye"
  ],
  crowns: [
    "None", "Tyrant Crown", "Bone Halo", "Demon Horns", "Death Wings",
    "Void Antlers", "Third Eye Gem", "Plague Mask"
  ],
  sigils: [
    "None", "Blade Tip", "Poison Barb", "Rattle", "Comet Trail",
    "Bone Spur", "Flame Tip", "Root Anchor"
  ],
  curses: ["None", "Inverted", "Rotting", "Overclocked", "Blessed", "Forsaken", "Ascended"]
};

export const RARITY_WEIGHTS = [
  { name: "Common", weight: 500 },
  { name: "Uncommon", weight: 270 },
  { name: "Rare", weight: 145 },
  { name: "Epic", weight: 65 },
  { name: "Legendary", weight: 17 },
  { name: "Mythic", weight: 3 }
];

const RARITY_TIERS = { Common: 0, Uncommon: 1, Rare: 2, Epic: 3, Legendary: 4, Mythic: 5 };

const GATED_CROWNS = {
  "None": 0, "Third Eye Gem": 0, "Plague Mask": 1, "Bone Halo": 1,
  "Demon Horns": 2, "Void Antlers": 2, "Death Wings": 3, "Tyrant Crown": 3
};

const GATED_CURSES = {
  "None": 0, "Rotting": 2, "Inverted": 2, "Overclocked": 3,
  "Forsaken": 3, "Blessed": 4, "Ascended": 5
};

const SKIN_WEIGHTS = {
  Forged: 160, Ancient: 140, Elemental: 135, Gemborn: 115,
  Corrupted: 100, Digital: 90, Spectral: 75, Cosmic: 55
};

const FORM_WEIGHTS = {
  Serpent: 175, Dragon: 130, Machine: 110, Pixel: 95,
  Abyssal: 90, Parasite: 75, Celestial: 65, Deity: 40
};

// [primary, shadow, accent]
export const PALETTES = {
  "Obsidian Shard": ["#1a1625", "#06040a", "#6b5cff"],
  "Rusted Iron": ["#8b4513", "#3d1a06", "#c8752a"],
  "Damascus Coil": ["#6b7c8a", "#1c2730", "#c8d4dc"],
  "Cold Steel": ["#8ca0b0", "#2a3540", "#dce8f0"],
  "Black Chrome": ["#15171c", "#050507", "#9fffff"],
  "Gilded Scale": ["#c8960a", "#5c3b00", "#fff1a0"],
  "Platinum Sovereign": ["#d9e2ec", "#58616d", "#ffffff"],
  "Rose Alloy": ["#c87878", "#5c2828", "#ffe0d6"],
  "Bronze Relic": ["#a06030", "#3a1a06", "#f0c060"],
  "Corroded Copper": ["#5aaa78", "#1a3a28", "#a0ffb8"],
  "Titanfall": ["#607080", "#1a2030", "#b0c8d8"],
  "Mercurial": ["#b0c8d8", "#203040", "#e8f8ff"],
  "Amethyst Vein": ["#9d4edd", "#3c096c", "#f3d9ff"],
  "Void Crystal": ["#07000f", "#000000", "#9b5cff"],
  "Prism Fracture": ["#ff70d0", "#380060", "#70ffff"],
  "Blood Ruby": ["#cc1030", "#500010", "#ff8090"],
  "Deep Sapphire": ["#1840cc", "#060c50", "#90b8ff"],
  "Emerald Core": ["#00a850", "#004020", "#80ffc0"],
  "Black Opal": ["#101828", "#040810", "#60ffb8"],
  "Citrine Flash": ["#d8a000", "#503800", "#fff080"],
  "Aqua Garnet": ["#00a8c8", "#003848", "#80ffff"],
  "White Diamond": ["#e8f8ff", "#8098a8", "#ffffff"],
  "Moonstone Haze": ["#c8d0e8", "#404870", "#f0f4ff"],
  "Peridot Bloom": ["#70c820", "#204008", "#c8ff60"],
  "Magma Drip": ["#ff3d00", "#2b0703", "#ffb703"],
  "Frostbitten": ["#a8f1ff", "#1d5d7a", "#ffffff"],
  "Stormwracked": ["#4060c8", "#081028", "#a0c8ff"],
  "Ashfall": ["#787878", "#202020", "#d0d0d0"],
  "Toxic Bloom": ["#80ff00", "#204000", "#d0ff80"],
  "Embervein": ["#ff6000", "#400800", "#ffc060"],
  "Sandstorm": ["#d8a858", "#503010", "#fff8c0"],
  "Mudborn": ["#706040", "#281808", "#c0a868"],
  "Soul Flame": ["#8040ff", "#180860", "#e0c0ff"],
  "Permafrost": ["#d0f0ff", "#306080", "#ffffff"],
  "Thunderclad": ["#f0e840", "#303800", "#ffffff"],
  "Poison Tide": ["#40d040", "#084008", "#c0ffc0"],
  "Void Walker": ["#070010", "#000000", "#8030ff"],
  "Nebula Drift": ["#c040c0", "#280028", "#40e0ff"],
  "Dark Matter": ["#080818", "#000008", "#4040a0"],
  "Solar Remnant": ["#ff9000", "#400800", "#fff080"],
  "Starforged": ["#c0d8ff", "#080828", "#ffffff"],
  "Event Horizon": ["#060608", "#000000", "#6000ff"],
  "Aurora Veil": ["#40ffc0", "#004830", "#ff80ff"],
  "Supernova Scar": ["#ff4000", "#280000", "#ffd080"],
  "Lunar Phase": ["#d0d8e8", "#404858", "#f8f8ff"],
  "Cosmic Static": ["#6060a0", "#101030", "#c0c0ff"],
  "Pulsar": ["#40ffb0", "#004030", "#ffffff"],
  "Antimatter": ["#ff00ff", "#280028", "#00ffff"],
  "Rotbone": ["#d8c890", "#504820", "#fff8c0"],
  "Fleshweave": ["#c86858", "#481810", "#ffb090"],
  "Chitin Crack": ["#484030", "#181408", "#a09070"],
  "Eldritch Moss": ["#406030", "#101808", "#90e860"],
  "Festered Vine": ["#507820", "#182808", "#c0f060"],
  "Fungal Crown": ["#c098c0", "#382038", "#f8e0f8"],
  "Plague Scale": ["#709040", "#202808", "#d8ff80"],
  "Barnacle God": ["#708090", "#182028", "#c0e8ff"],
  "Spore Drift": ["#d0a0d0", "#482848", "#ffe0ff"],
  "Hollow Shell": ["#907060", "#302018", "#e8c8a0"],
  "Parasite Host": ["#a0c040", "#283008", "#e0ff80"],
  "Gore Bloom": ["#c02030", "#400008", "#ff6070"],
  "Wraith Skin": ["#c0c8e0", "#303848", "#f0f4ff"],
  "Phantom Veil": ["#a0b8d8", "#203040", "#e0f0ff"],
  "Astral Trace": ["#8090c0", "#181828", "#d0d8ff"],
  "Nightmare Weave": ["#180828", "#080008", "#8030c0"],
  "Soul Shard": ["#c060ff", "#200840", "#f0d0ff"],
  "Demonic Pact": ["#c02020", "#400000", "#ff8080"],
  "Angelic Fall": ["#f0f4ff", "#808898", "#ffffff"],
  "Dream Fracture": ["#a040c0", "#200030", "#e0a0ff"],
  "Void Echo": ["#080010", "#000000", "#6040a0"],
  "Shadow Bleed": ["#202030", "#040408", "#8070a0"],
  "Spirit Coil": ["#d0e8e0", "#405850", "#f8fffc"],
  "Cursed Sigil": ["#400820", "#180008", "#c03060"],
  "Glitch Form": ["#00fff0", "#0b0b12", "#ff006e"],
  "Matrix Overflow": ["#36ff6f", "#031107", "#a8ffbf"],
  "Neon Pulse": ["#28ffbf", "#09111f", "#ff2bd6"],
  "Data Decay": ["#808890", "#181c20", "#c0ccd8"],
  "Cyber Lattice": ["#40d0ff", "#083040", "#c0f8ff"],
  "Vaporwave Ghost": ["#e060d0", "#280838", "#80e8ff"],
  "Hologram Flicker": ["#60f0ff", "#083040", "#ff60d0"],
  "Binary Scar": ["#d0d8e0", "#303840", "#ffffff"],
  "AI Corruption": ["#80ff40", "#104008", "#ffffff"],
  "RGB Overload": ["#ff0040", "#200008", "#00ffff"],
  "Synthwave Drift": ["#d040ff", "#180830", "#60ffff"],
  "Pixel Artifact": ["#8cff4a", "#183b1c", "#fbff87"],
  "Fossil Slate": ["#888070", "#282418", "#d8d0b8"],
  "Jade Tomb": ["#00a878", "#064f3c", "#d8ffe8"],
  "Moonstone Ruin": ["#c8d0e8", "#404870", "#f0f4ff"],
  "Meteorite Fall": ["#505868", "#101820", "#90a8c0"],
  "Sandstone God": ["#d8a858", "#503010", "#fff8c0"],
  "Basalt Titan": ["#484848", "#101010", "#909090"],
  "Quartz Idol": ["#e0f0ff", "#607080", "#ffffff"],
  "Coral Scripture": ["#ff8070", "#582028", "#ffd0c0"],
  "Amber Sealed": ["#d89030", "#402808", "#ffe080"],
  "Obsidian Altar": ["#1a1625", "#06040a", "#6b5cff"],
  "Granite Effigy": ["#808878", "#282c20", "#c8d0b8"],
  "Onyx Pharaoh": ["#111318", "#030406", "#c8ccd5"]
};

const DEFAULT_PALETTE = ["#77d879", "#265c34", "#e8ffd9"];

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

// ─── PATH ────────────────────────────────────────────────────────────────────
function makePixelSnake(random, options = {}) {
  const length = options.length ?? 34 + Math.floor(random() * 28);
  const pixelSize = options.pixelSize ?? 28;
  const canvasSize = options.canvasSize ?? 900;
  const margin = 82;
  const walkLimit = 20;
  const maxSpan = Math.floor((canvasSize - margin * 2) / pixelSize);
  const directions = [
    { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 0, y: -1 }
  ];

  const keyFor = (b) => `${b.x},${b.y}`;
  const isSameDirection = (a, b) => a.x === b.x && a.y === b.y;
  const hasClearHeadSpace = (blocks, dir, occ) => {
    const h = blocks.at(-1);
    const f1 = { x: h.x + dir.x, y: h.y + dir.y };
    const f2 = { x: h.x + dir.x * 2, y: h.y + dir.y * 2 };
    return !occ.has(keyFor(f1)) && !occ.has(keyFor(f2));
  };
  const touchesBodyTooClosely = (cand, curr, occ) =>
    [
      { x: cand.x + 1, y: cand.y }, { x: cand.x - 1, y: cand.y },
      { x: cand.x, y: cand.y + 1 }, { x: cand.x, y: cand.y - 1 }
    ].some(n => keyFor(n) !== keyFor(curr) && occ.has(keyFor(n)));
  const exceedsClusterLimit = (cand, blocks) =>
    [...blocks, cand].some(center => {
      const count = blocks.reduce((t, b) =>
        t + (Math.abs(b.x - center.x) <= 1 && Math.abs(b.y - center.y) <= 1 ? 1 : 0),
        Math.abs(cand.x - center.x) <= 1 && Math.abs(cand.y - center.y) <= 1 ? 1 : 0);
      return count > 4;
    });
  const exceedsCanvasSpan = (cand, blocks) => {
    const nb = [...blocks, cand];
    const xs = nb.map(b => b.x), ys = nb.map(b => b.y);
    return Math.max(...xs) - Math.min(...xs) > maxSpan || Math.max(...ys) - Math.min(...ys) > maxSpan;
  };

  const makeAttempt = () => {
    let direction = pick(directions, random);
    const local = [{ x: 0, y: 0 }];
    const occupied = new Set(["0,0"]);
    let straightRun = 1;
    for (let i = 1; i < length; i++) {
      const curr = local.at(-1);
      const left = { x: -direction.y, y: direction.x };
      const right = { x: direction.y, y: -direction.x };
      const back = { x: -direction.x, y: -direction.y };
      const turnFirst = random() < 0.16 || straightRun >= 12;
      const firstTurn = random() < 0.5 ? left : right;
      const secondTurn = firstTurn === left ? right : left;
      const candidates = turnFirst
        ? [firstTurn, secondTurn, direction, back]
        : [direction, firstTurn, secondTurn, back];
      const nextDir = candidates.find(c => {
        const nx = curr.x + c.x, ny = curr.y + c.y;
        const n = { x: nx, y: ny };
        return (
          Math.abs(nx) <= walkLimit && Math.abs(ny) <= walkLimit &&
          !occupied.has(keyFor(n)) &&
          !touchesBodyTooClosely(n, curr, occupied) &&
          !exceedsClusterLimit(n, local) &&
          !exceedsCanvasSpan(n, local)
        );
      });
      if (!nextDir) break;
      straightRun = isSameDirection(direction, nextDir) ? straightRun + 1 : 1;
      direction = nextDir;
      const next = { x: curr.x + direction.x, y: curr.y + direction.y };
      local.push(next);
      occupied.add(keyFor(next));
    }
    while (local.length > 2 && !hasClearHeadSpace(local, direction, occupied)) {
      occupied.delete(keyFor(local.pop()));
    }
    return local;
  };

  let local = makeAttempt();
  for (let a = 1; a < 60 && local.length < length; a++) {
    const c = makeAttempt();
    if (c.length > local.length) local = c;
  }

  const minX = Math.min(...local.map(b => b.x));
  const maxX = Math.max(...local.map(b => b.x));
  const minY = Math.min(...local.map(b => b.y));
  const maxY = Math.max(...local.map(b => b.y));
  const mnOffX = margin - minX * pixelSize;
  const mxOffX = canvasSize - margin - maxX * pixelSize;
  const mnOffY = margin - minY * pixelSize;
  const mxOffY = canvasSize - margin - maxY * pixelSize;
  const ocX = Math.floor(mnOffX / pixelSize) + Math.floor(random() * (Math.floor(mxOffX / pixelSize) - Math.floor(mnOffX / pixelSize) + 1));
  const ocY = Math.floor(mnOffY / pixelSize) + Math.floor(random() * (Math.floor(mxOffY / pixelSize) - Math.floor(mnOffY / pixelSize) + 1));

  const centerOffset = pixelSize / 2;
  return local.map((b, i) => ({
    index: i,
    x: ocX * pixelSize + b.x * pixelSize + centerOffset,
    y: ocY * pixelSize + b.y * pixelSize + centerOffset
  }));
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
export function getPalette(skin) {
  return PALETTES[skin] ?? DEFAULT_PALETTE;
}

function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16)
  };
}

function luminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

export function isDarkPalette(palette) {
  return luminance(palette[0]) < 0.16 || luminance(palette[1]) < 0.08;
}

function getFacingFromBlocks(blocks) {
  const head = blocks.at(-1);
  const neck = blocks.at(-2) ?? head;
  const dx = head.x - neck.x, dy = head.y - neck.y;
  return Math.abs(dx) >= Math.abs(dy) ? (dx >= 0 ? "right" : "left") : (dy >= 0 ? "down" : "up");
}

function getTailDirection(blocks) {
  const tail = blocks[0];
  const next = blocks[1] ?? tail;
  const dx = tail.x - next.x, dy = tail.y - next.y;
  if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? "right" : "left";
  return dy >= 0 ? "down" : "up";
}

function pointFromDirection(cx, cy, direction, forward, side) {
  const vectors = {
    right: { fx: 1, fy: 0, sx: 0, sy: 1 },
    left: { fx: -1, fy: 0, sx: 0, sy: -1 },
    down: { fx: 0, fy: 1, sx: -1, sy: 0 },
    up: { fx: 0, fy: -1, sx: 1, sy: 0 }
  };
  const v = vectors[direction];
  return { x: cx + v.fx * forward + v.sx * side, y: cy + v.fy * forward + v.sy * side };
}

function trianglePath(cx, cy, direction, tipDistance, baseDistance, halfWidth) {
  const tip = pointFromDirection(cx, cy, direction, tipDistance, 0);
  const a = pointFromDirection(cx, cy, direction, baseDistance, -halfWidth);
  const b = pointFromDirection(cx, cy, direction, baseDistance, halfWidth);
  return `M ${tip.x} ${tip.y} L ${a.x} ${a.y} L ${b.x} ${b.y} Z`;
}

// ─── HEAD ────────────────────────────────────────────────────────────────────
function buildEyes(parts, ax, ay, layout, palette, gaze) {
  const eyeSize = gaze === "God Eye" ? 14 : 8;
  const pupilSize = gaze === "God Eye" ? 6 : 4;
  const spread = gaze === "God Eye" ? 0 : 9;
  const eyeFill = {
    "Void Stare": "#05070a", "Crystal Sight": "#d8fbff", "Ember Glow": "#ff6a00",
    "Dead Eye": "#d8ded7", "Mechanical Lens": "#9fffff", "Rune Carved": "#c060ff",
    "Pixel Scan": "#36ff6f", "God Eye": palette[2]
  }[gaze] ?? palette[2];
  const pupilFill = gaze === "Void Stare" ? palette[2] : "#05070a";
  const positions = gaze === "God Eye"
    ? [{ x: ax, y: ay }]
    : layout === "vertical"
      ? [{ x: ax, y: ay - spread }, { x: ax, y: ay + spread }]
      : [{ x: ax - spread, y: ay }, { x: ax + spread, y: ay }];
  for (const { x, y } of positions) {
    const ex = x - Math.floor(eyeSize / 2), ey = y - Math.floor(eyeSize / 2);
    parts.push(`<rect x="${ex}" y="${ey}" width="${eyeSize}" height="${eyeSize}" fill="${eyeFill}" stroke="#05070a" stroke-width="1.5" shape-rendering="crispEdges"/>`);
    if (gaze === "Predator Split") {
      parts.push(`<rect x="${x - 1}" y="${ey + 1}" width="2" height="${eyeSize - 2}" fill="${pupilFill}" shape-rendering="crispEdges"/>`);
    } else if (gaze === "Mechanical Lens") {
      parts.push(`<rect x="${x - 3}" y="${y - 3}" width="6" height="6" fill="#05070a" shape-rendering="crispEdges"/>`);
      parts.push(`<rect x="${x - 1}" y="${y - 1}" width="2" height="2" fill="#ffffff" shape-rendering="crispEdges"/>`);
    } else if (gaze === "Rune Carved") {
      parts.push(`<path d="M ${ex + 2} ${ey + 6} H ${ex + 6} M ${ex + 4} ${ey + 2} V ${ey + 7}" stroke="#05070a" stroke-width="1" shape-rendering="crispEdges"/>`);
    } else if (gaze === "Pixel Scan") {
      parts.push(`<rect x="${ex + 1}" y="${ey + 3}" width="${eyeSize - 2}" height="2" fill="#05070a" shape-rendering="crispEdges"/>`);
    } else {
      parts.push(`<rect x="${ex + eyeSize - pupilSize - 1}" y="${ey + eyeSize - pupilSize - 1}" width="${pupilSize}" height="${pupilSize}" fill="${pupilFill}" shape-rendering="crispEdges"/>`);
      parts.push(`<rect x="${ex + 1}" y="${ey + 1}" width="2" height="2" fill="#ffffff" shape-rendering="crispEdges"/>`);
    }
  }
  if (gaze === "Third Eye") {
    const ex = ax - 4, ey = ay - 4;
    parts.push(`<rect x="${ex}" y="${ey}" width="8" height="8" fill="${palette[2]}" stroke="#05070a" stroke-width="1.5" shape-rendering="crispEdges"/>`);
    parts.push(`<rect x="${ax - 1}" y="${ay - 3}" width="2" height="6" fill="#05070a" shape-rendering="crispEdges"/>`);
    parts.push(`<rect x="${ex + 1}" y="${ey + 1}" width="2" height="2" fill="#ffffff" shape-rendering="crispEdges"/>`);
  }
}

function buildHead(blocks, pixelSize, palette, gaze) {
  const head = blocks.at(-1);
  const facing = getFacingFromBlocks(blocks);
  const hx = head.x, hy = head.y, hs = pixelSize, half = Math.floor(hs / 2);
  const snoutLen = 10, snoutH = Math.floor(hs * 0.55);
  const tongueBase = 10, tongueFork = 9, forkSpread = 5;
  const nw = 3, nh = 3;
  const outline = isDarkPalette(palette) ? palette[2] : "#05070a";

  let parts = [];
  parts.push(`<rect x="${hx - half}" y="${hy - half}" width="${hs}" height="${hs}" fill="${palette[0]}" stroke="${outline}" stroke-width="3" shape-rendering="crispEdges"/>`);
  const inset = 4;
  parts.push(`<rect x="${hx - half + inset}" y="${hy - half + inset}" width="${hs - inset * 2}" height="${hs - inset * 2}" fill="${palette[1]}" shape-rendering="crispEdges"/>`);

  if (facing === "right") {
    const sx = hx + half - 2, sy = hy - Math.floor(snoutH / 2);
    parts.push(`<rect x="${sx}" y="${sy}" width="${snoutLen}" height="${snoutH}" fill="${palette[0]}" stroke="${outline}" stroke-width="2" shape-rendering="crispEdges"/>`);
    parts.push(`<rect x="${sx + 2}" y="${sy + 2}" width="${nw}" height="${nh}" fill="#05070a" shape-rendering="crispEdges"/>`);
    parts.push(`<rect x="${sx + 2}" y="${sy + snoutH - nh - 2}" width="${nw}" height="${nh}" fill="#05070a" shape-rendering="crispEdges"/>`);
    const tx = sx + snoutLen, tmid = hy;
    parts.push(`<rect x="${tx}" y="${tmid - 2}" width="${tongueBase}" height="4" fill="#ff3a6e" shape-rendering="crispEdges"/>`);
    parts.push(`<rect x="${tx + tongueBase - 2}" y="${tmid - 2 - forkSpread}" width="${tongueFork}" height="3" fill="#ff3a6e" shape-rendering="crispEdges"/>`);
    parts.push(`<rect x="${tx + tongueBase - 2}" y="${tmid + 2 + forkSpread - 3}" width="${tongueFork}" height="3" fill="#ff3a6e" shape-rendering="crispEdges"/>`);
    buildEyes(parts, hx - half + 6, hy, "vertical", palette, gaze);
  } else if (facing === "left") {
    const sx = hx - half - snoutLen + 2, sy = hy - Math.floor(snoutH / 2);
    parts.push(`<rect x="${sx}" y="${sy}" width="${snoutLen}" height="${snoutH}" fill="${palette[0]}" stroke="${outline}" stroke-width="2" shape-rendering="crispEdges"/>`);
    parts.push(`<rect x="${sx + snoutLen - nw - 2}" y="${sy + 2}" width="${nw}" height="${nh}" fill="#05070a" shape-rendering="crispEdges"/>`);
    parts.push(`<rect x="${sx + snoutLen - nw - 2}" y="${sy + snoutH - nh - 2}" width="${nw}" height="${nh}" fill="#05070a" shape-rendering="crispEdges"/>`);
    const tx = sx - tongueBase, tmid = hy;
    parts.push(`<rect x="${tx}" y="${tmid - 2}" width="${tongueBase}" height="4" fill="#ff3a6e" shape-rendering="crispEdges"/>`);
    parts.push(`<rect x="${tx - tongueFork + 2}" y="${tmid - 2 - forkSpread}" width="${tongueFork}" height="3" fill="#ff3a6e" shape-rendering="crispEdges"/>`);
    parts.push(`<rect x="${tx - tongueFork + 2}" y="${tmid + 2 + forkSpread - 3}" width="${tongueFork}" height="3" fill="#ff3a6e" shape-rendering="crispEdges"/>`);
    buildEyes(parts, hx + half - 14, hy, "vertical", palette, gaze);
  } else if (facing === "down") {
    const sx = hx - Math.floor(snoutH / 2), sy = hy + half - 2;
    parts.push(`<rect x="${sx}" y="${sy}" width="${snoutH}" height="${snoutLen}" fill="${palette[0]}" stroke="${outline}" stroke-width="2" shape-rendering="crispEdges"/>`);
    parts.push(`<rect x="${sx + 2}" y="${sy + 2}" width="${nh}" height="${nw}" fill="#05070a" shape-rendering="crispEdges"/>`);
    parts.push(`<rect x="${sx + snoutH - nh - 2}" y="${sy + 2}" width="${nh}" height="${nw}" fill="#05070a" shape-rendering="crispEdges"/>`);
    const ty = sy + snoutLen;
    parts.push(`<rect x="${hx - 2}" y="${ty}" width="4" height="${tongueBase}" fill="#ff3a6e" shape-rendering="crispEdges"/>`);
    parts.push(`<rect x="${hx - 2 - forkSpread}" y="${ty + tongueBase - 2}" width="3" height="${tongueFork}" fill="#ff3a6e" shape-rendering="crispEdges"/>`);
    parts.push(`<rect x="${hx + 2 + forkSpread - 3}" y="${ty + tongueBase - 2}" width="3" height="${tongueFork}" fill="#ff3a6e" shape-rendering="crispEdges"/>`);
    buildEyes(parts, hx, hy - half + 6, "horizontal", palette, gaze);
  } else {
    const sx = hx - Math.floor(snoutH / 2), sy = hy - half - snoutLen + 2;
    parts.push(`<rect x="${sx}" y="${sy}" width="${snoutH}" height="${snoutLen}" fill="${palette[0]}" stroke="${outline}" stroke-width="2" shape-rendering="crispEdges"/>`);
    parts.push(`<rect x="${sx + 2}" y="${sy + snoutLen - nw - 2}" width="${nh}" height="${nw}" fill="#05070a" shape-rendering="crispEdges"/>`);
    parts.push(`<rect x="${sx + snoutH - nh - 2}" y="${sy + snoutLen - nw - 2}" width="${nh}" height="${nw}" fill="#05070a" shape-rendering="crispEdges"/>`);
    const ty = sy - tongueBase;
    parts.push(`<rect x="${hx - 2}" y="${ty}" width="4" height="${tongueBase}" fill="#ff3a6e" shape-rendering="crispEdges"/>`);
    parts.push(`<rect x="${hx - 2 - forkSpread}" y="${ty - tongueFork + 2}" width="3" height="${tongueFork}" fill="#ff3a6e" shape-rendering="crispEdges"/>`);
    parts.push(`<rect x="${hx + 2 + forkSpread - 3}" y="${ty - tongueFork + 2}" width="3" height="${tongueFork}" fill="#ff3a6e" shape-rendering="crispEdges"/>`);
    buildEyes(parts, hx, hy + half - 14, "horizontal", palette, gaze);
  }
  return parts.join("\n  ");
}

// ─── BODY ────────────────────────────────────────────────────────────────────
function buildBody(blocks, pixelSize, palette, traits) {
  const segSize = pixelSize;
  const form = traits.form;
  const isMech = form.includes("Drill") || form.includes("Chainlink") || form.includes("Hydraulic") ||
    form.includes("Clockwork") || form.includes("Piston") || form.includes("Rail") ||
    form.includes("Nano") || form.includes("Steam");
  const isCorrupted = traits.skinSeries === "Corrupted" || TRAITS.skins.Corrupted.includes(traits.skin);
  const outline = isDarkPalette(palette) ? palette[2] : palette[1];

  return blocks.map((block, index) => {
    if (index === blocks.length - 1) return "";
    const isTail = index === 0;
    const progress = index / (blocks.length - 1);
    const size = isTail ? Math.round(segSize * 0.55) : index === 1 ? Math.round(segSize * 0.75) : segSize;
    const half = Math.floor(size / 2);
    const fill = index % 2 === 0 ? palette[0] : palette[1];
    const opacity = (0.78 + progress * 0.22).toFixed(2);
    const strokeColor = isMech ? palette[2] : outline;
    const strokeW = isMech || isDarkPalette(palette) ? "2" : "1";
    const rx = isTail ? "4" : "2";
    const body = `<rect x="${block.x - half}" y="${block.y - half}" width="${size}" height="${size}" rx="${rx}" fill="${fill}" opacity="${opacity}" stroke="${strokeColor}" stroke-width="${strokeW}" shape-rendering="crispEdges"/>`;
    const rot = isCorrupted && index > 1 && index % 4 === 0
      ? `<rect x="${block.x - 5}" y="${block.y - 5}" width="10" height="10" fill="#7dff49" opacity=".82" stroke="#143d0d" stroke-width="1" shape-rendering="crispEdges"/>`
      : "";
    return `${body}${rot}`;
  }).join("\n  ");
}

// ─── DECORATIONS ─────────────────────────────────────────────────────────────
function crownLayer(crown, blocks, palette) {
  if (crown === "None") return "";
  const head = blocks.at(-1);
  const cx = head.x, cy = head.y;
  const facing = getFacingFromBlocks(blocks);
  const isHorizontal = facing === "left" || facing === "right";
  const sideAxis = isHorizontal ? "y" : "x";
  const hornA = sideAxis === "y" ? { x: cx, y: cy - 13, s: -1 } : { x: cx - 13, y: cy, s: -1 };
  const hornB = sideAxis === "y" ? { x: cx, y: cy + 13, s: 1 } : { x: cx + 13, y: cy, s: 1 };
  const frontDir = facing;

  if (crown === "Tyrant Crown")
    return `<path d="M ${cx - 14} ${cy - 20} L ${cx - 7} ${cy - 40} L ${cx} ${cy - 22} L ${cx + 7} ${cy - 40} L ${cx + 14} ${cy - 20} Z" fill="#ffd166" stroke="#5c3b00" stroke-width="2" shape-rendering="crispEdges"/>`;
  if (crown === "Bone Halo")
    return `<rect x="${cx - 23}" y="${cy - 23}" width="46" height="46" fill="none" stroke="#f6ead0" stroke-width="5" opacity=".92" shape-rendering="crispEdges"/><rect x="${cx - 14}" y="${cy - 14}" width="28" height="28" fill="none" stroke="#9b8768" stroke-width="2" opacity=".72" shape-rendering="crispEdges"/>`;
  if (crown === "Demon Horns") {
    const aMid = pointFromDirection(hornA.x, hornA.y, frontDir, 13, hornA.s * 8);
    const aTip = pointFromDirection(hornA.x, hornA.y, frontDir, 30, hornA.s * 18);
    const bMid = pointFromDirection(hornB.x, hornB.y, frontDir, 13, hornB.s * 8);
    const bTip = pointFromDirection(hornB.x, hornB.y, frontDir, 30, hornB.s * 18);
    return `<path d="M ${hornA.x} ${hornA.y} L ${aMid.x} ${aMid.y} L ${aTip.x} ${aTip.y} M ${hornB.x} ${hornB.y} L ${bMid.x} ${bMid.y} L ${bTip.x} ${bTip.y}" stroke="#c02020" stroke-width="7" stroke-linecap="square" stroke-linejoin="miter" fill="none"/>`;
  }
  if (crown === "Death Wings") {
    if (isHorizontal)
      return `<path d="M ${cx} ${cy - 18} L ${cx - 46} ${cy - 60} L ${cx - 32} ${cy - 20} L ${cx - 64} ${cy - 4} L ${cx - 12} ${cy - 8} Z" fill="${palette[2]}" stroke="#05070a" stroke-width="2" opacity=".55" shape-rendering="crispEdges"/><path d="M ${cx} ${cy + 18} L ${cx - 46} ${cy + 60} L ${cx - 32} ${cy + 20} L ${cx - 64} ${cy + 4} L ${cx - 12} ${cy + 8} Z" fill="${palette[2]}" stroke="#05070a" stroke-width="2" opacity=".55" shape-rendering="crispEdges"/>`;
    return `<path d="M ${cx - 18} ${cy} L ${cx - 60} ${cy - 46} L ${cx - 20} ${cy - 32} L ${cx - 4} ${cy - 64} L ${cx - 8} ${cy - 12} Z" fill="${palette[2]}" stroke="#05070a" stroke-width="2" opacity=".55" shape-rendering="crispEdges"/><path d="M ${cx + 18} ${cy} L ${cx + 60} ${cy - 46} L ${cx + 20} ${cy - 32} L ${cx + 4} ${cy - 64} L ${cx + 8} ${cy - 12} Z" fill="${palette[2]}" stroke="#05070a" stroke-width="2" opacity=".55" shape-rendering="crispEdges"/>`;
  }
  if (crown === "Void Antlers")
    return `<path d="M ${cx - 13} ${cy - 14} L ${cx - 30} ${cy - 42} L ${cx - 38} ${cy - 30} M ${cx + 13} ${cy - 14} L ${cx + 30} ${cy - 42} L ${cx + 38} ${cy - 30}" stroke="${palette[2]}" stroke-width="5" stroke-linecap="round" fill="none"/>`;
  if (crown === "Third Eye Gem")
    return `<rect x="${cx - 6}" y="${cy - 6}" width="12" height="12" fill="${palette[2]}" stroke="#05070a" stroke-width="2" shape-rendering="crispEdges"/>`;
  if (crown === "Plague Mask")
    return `<rect x="${cx - 12}" y="${cy - 8}" width="24" height="18" fill="#406030" stroke="#101808" stroke-width="2" opacity=".85" shape-rendering="crispEdges"/>`;
  return "";
}

function sigilLayer(sigil, blocks, palette) {
  if (sigil === "None") return "";
  const tail = blocks[0];
  const tx = tail.x, ty = tail.y;
  const direction = getTailDirection(blocks);
  const base = pointFromDirection(tx, ty, direction, 3, 0);
  const tip = pointFromDirection(tx, ty, direction, 30, 0);
  const rootA = pointFromDirection(tx, ty, direction, 34, -18);
  const rootB = pointFromDirection(tx, ty, direction, 34, 18);

  if (sigil === "Blade Tip")
    return `<path d="${trianglePath(tx, ty, direction, 28, -4, 16)}" fill="${palette[2]}" stroke="${palette[1]}" stroke-width="2" shape-rendering="crispEdges"/>`;
  if (sigil === "Poison Barb") {
    const a = pointFromDirection(tx, ty, direction, 5, -9);
    const b = pointFromDirection(tx, ty, direction, 5, 9);
    const c = pointFromDirection(tx, ty, direction, 18, 5);
    const d = pointFromDirection(tx, ty, direction, 18, -5);
    return `<path d="M ${tip.x} ${tip.y} L ${c.x} ${c.y} L ${b.x} ${b.y} L ${a.x} ${a.y} L ${d.x} ${d.y} Z" fill="#80ff00" stroke="#204000" stroke-width="2" shape-rendering="crispEdges"/>`;
  }
  if (sigil === "Rattle")
    return `<rect x="${tx - 8}" y="${ty - 16}" width="16" height="10" rx="2" fill="${palette[0]}" stroke="${palette[1]}" stroke-width="1.5" shape-rendering="crispEdges"/><rect x="${tx - 6}" y="${ty - 6}" width="12" height="8" rx="2" fill="${palette[0]}" stroke="${palette[1]}" stroke-width="1.5" shape-rendering="crispEdges"/><rect x="${tx - 4}" y="${ty + 2}" width="8" height="8" rx="2" fill="${palette[0]}" stroke="${palette[1]}" stroke-width="1.5" shape-rendering="crispEdges"/>`;
  if (sigil === "Comet Trail")
    return blocks.slice(0, 6).map((b, i) => {
      const s = 4 - Math.floor(i * 0.6);
      if (s <= 0) return "";
      return `<rect x="${b.x - s / 2}" y="${b.y - s / 2}" width="${s}" height="${s}" fill="${palette[2]}" opacity="${(0.7 - i * 0.12).toFixed(2)}" shape-rendering="crispEdges"/>`;
    }).join("\n  ");
  if (sigil === "Bone Spur") {
    const notchA = pointFromDirection(tx, ty, direction, 10, -6);
    const notchB = pointFromDirection(tx, ty, direction, 10, 6);
    const markA = pointFromDirection(tx, ty, direction, 20, -3);
    const markB = pointFromDirection(tx, ty, direction, 20, 3);
    return `<path d="${trianglePath(tx, ty, direction, 28, -6, 12)} M ${notchA.x} ${notchA.y} L ${markA.x} ${markA.y} M ${notchB.x} ${notchB.y} L ${markB.x} ${markB.y}" fill="#e8dcc5" stroke="#6d6047" stroke-width="2" fill-opacity=".9" shape-rendering="crispEdges"/>`;
  }
  if (sigil === "Flame Tip") {
    const left = pointFromDirection(tx, ty, direction, 12, -12);
    const right = pointFromDirection(tx, ty, direction, 12, 12);
    const inner = pointFromDirection(tx, ty, direction, 20, 0);
    return `<path d="M ${tip.x} ${tip.y} Q ${left.x} ${left.y} ${base.x} ${base.y} Q ${inner.x} ${inner.y} ${right.x} ${right.y} Q ${left.x} ${left.y} ${tip.x} ${tip.y}" fill="#ff6000" stroke="#ffb703" stroke-width="2" opacity=".92" shape-rendering="crispEdges"/>`;
  }
  if (sigil === "Root Anchor")
    return `<path d="M ${base.x} ${base.y} L ${tip.x} ${tip.y} M ${tip.x} ${tip.y} L ${rootA.x} ${rootA.y} M ${tip.x} ${tip.y} L ${rootB.x} ${rootB.y}" stroke="${palette[0]}" stroke-width="4" stroke-linecap="round" fill="none"/>`;
  return "";
}

function markLayer(mark, blocks, pixelSize, palette) {
  if (mark === "None") return "";
  const size = pixelSize * 2;
  return blocks.map(b =>
    `<rect x="${b.x - size / 2}" y="${b.y - size / 2}" width="${size}" height="${size}" fill="${palette[2]}" shape-rendering="crispEdges"/>`
  ).join("\n    ");
}

// ─── SVG RENDERER ────────────────────────────────────────────────────────────
export function renderSnakeSvg({ traits, blocks }) {
  const size = 900;
  const pixelSize = 28;
  const palette = getPalette(traits.skin);
  const darkSkin = isDarkPalette(palette);
  const markOpacity = traits.mark === "None" ? 0 : 0.20;
  const bgStops = darkSkin
    ? [`${palette[2]}33`, "#e7edf2", "#b7c4cf"]
    : [palette[1], "#101522", "#06070b"];
  const gridStroke = darkSkin ? "#1b2430" : "#ffffff";
  const checkerLight = "#ffffff";
  const checkerAccent = darkSkin ? "#d6e0e8" : palette[2];
  const checkerOpacity = darkSkin ? ".18" : ".08";
  const gridOpacity = darkSkin ? ".18" : ".12";
  const gridOrigin = 0;

  const bodyHtml = buildBody(blocks, pixelSize, palette, traits);
  const headHtml = buildHead(blocks, pixelSize, palette, traits.gaze);
  const crownHtml = crownLayer(traits.crown, blocks, palette);
  const sigilHtml = sigilLayer(traits.sigil, blocks, palette);
  const markHtml = markLayer(traits.mark, blocks, pixelSize, palette);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" aria-label="Snakiox ${traits.skin} ${traits.form}">
  <defs>
    <radialGradient id="bg" cx="50%" cy="45%" r="70%">
      <stop offset="0%" stop-color="${bgStops[0]}"/>
      <stop offset="58%" stop-color="${bgStops[1]}"/>
      <stop offset="100%" stop-color="${bgStops[2]}"/>
    </radialGradient>
    <filter id="glow" x="-35%" y="-35%" width="170%" height="170%">
      <feGaussianBlur stdDeviation="9" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <rect width="900" height="900" fill="url(#bg)"/>

  <g opacity="${checkerOpacity}" shape-rendering="crispEdges">
    ${Array.from({ length: 33 }, (_, row) =>
    Array.from({ length: 33 }, (_, col) => {
      const fill = (row + col) % 2 === 0 ? checkerLight : checkerAccent;
      const op = (row + col) % 5 === 0 ? ".18" : ".07";
      return `<rect x="${gridOrigin + col * pixelSize}" y="${gridOrigin + row * pixelSize}" width="${pixelSize}" height="${pixelSize}" rx="2" fill="${fill}" opacity="${op}"/>`;
    }).join("")
  ).join("")}
  </g>

  <g opacity="${gridOpacity}" shape-rendering="crispEdges">
    ${Array.from({ length: 34 }, (_, i) => {
    const pos = gridOrigin + i * pixelSize;
    return `<path d="M ${pos} 0 V 900 M 0 ${pos} H 900" stroke="${gridStroke}" stroke-width="0.5"/>`;
  }).join("")}
  </g>

  <g filter="url(#glow)" opacity="${markOpacity}">
    ${markHtml}
  </g>

  <g>${sigilHtml}</g>

  <g>
  ${bodyHtml}
  </g>

  <g>
  ${headHtml}
  </g>

  <g>${crownHtml}</g>

</svg>`;
}

// ─── TOKEN ───────────────────────────────────────────────────────────────────
export function createToken(seedInput, options = {}) {
  const random = mulberry32(hashSeed(seedInput));
  const rarity = weightedPick(RARITY_WEIGHTS, random);
  const tier = RARITY_TIERS[rarity.name];

  const skins = flattenSeries(TRAITS.skins);
  const forms = flattenSeries(TRAITS.forms);
  const skin = rarityBoostedPick(skins, SKIN_WEIGHTS, random, rarity);
  const form = rarityBoostedPick(forms, FORM_WEIGHTS, random, rarity);

  const mark = pick(TRAITS.marks, random);
  const gaze = pick(TRAITS.gazes, random);
  const sigil = pick(TRAITS.sigils, random);
  const crown = pickGated(GATED_CROWNS, tier, random);
  const curse = pickGated(GATED_CURSES, tier, random);

  const traits = {
    rarity: rarity.name,
    skinSeries: skin.series,
    skin: skin.value,
    formSeries: form.series,
    form: form.value,
    mark, gaze, crown, sigil, curse
  };

  const blocks = options.blocks ?? makePixelSnake(random, { length: options.length, pixelSize: 28 });
  const svg = renderSnakeSvg({ traits, blocks });

  return {
    tokenId: options.tokenId ?? seedInput,
    name: `Snakiox #${String(options.tokenId ?? seedInput).padStart(5, "0")}`,
    seed: seedInput,
    traits,
    blocks,
    svg
  };
}

export { makePixelSnake, hashSeed };
