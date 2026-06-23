// Playable backgrounds for the snake arena. Each is a canvas painter plus the
// colors the HUD should borrow so the whole screen feels cohesive.
// Retro/arcade-inspired, no glossy gradients.

function checker(ctx, w, h, cellPx, a, b) {
  for (let y = 0; y < h; y += cellPx) {
    for (let x = 0; x < w; x += cellPx) {
      ctx.fillStyle = ((Math.floor(x / cellPx) + Math.floor(y / cellPx)) % 2 === 0) ? a : b;
      ctx.fillRect(x, y, cellPx, cellPx);
    }
  }
}

function grid(ctx, w, h, cellPx, color, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x <= w; x += cellPx) { ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, h); }
  for (let y = 0; y <= h; y += cellPx) { ctx.moveTo(0, y + 0.5); ctx.lineTo(w, y + 0.5); }
  ctx.stroke();
  ctx.restore();
}

function dots(ctx, w, h, cellPx, color, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  for (let y = cellPx / 2; y < h; y += cellPx) {
    for (let x = cellPx / 2; x < w; x += cellPx) {
      ctx.fillRect(x - 1, y - 1, 2, 2);
    }
  }
  ctx.restore();
}

function scatterStars(ctx, w, h, count, seed) {
  let s = seed >>> 0;
  const rand = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  ctx.save();
  for (let i = 0; i < count; i++) {
    const x = Math.floor(rand() * w);
    const y = Math.floor(rand() * h);
    const sz = rand() < 0.12 ? 2 : 1;
    ctx.globalAlpha = 0.3 + rand() * 0.6;
    ctx.fillStyle = rand() < 0.5 ? "#ffffff" : "#cfe6ff";
    ctx.fillRect(x, y, sz, sz);
  }
  ctx.restore();
}

export const BACKGROUNDS = [
  {
    id: "lcd-classic",
    name: "LCD Classic",
    blurb: "Original pocket-arcade phosphor",
    colors: { base: "#9ab461", baseAlt: "#8aa351", grid: "#536839", text: "#0c130d", accent: "#0c130d" },
    paint(ctx, w, h, cellPx) {
      ctx.fillStyle = this.colors.base;
      ctx.fillRect(0, 0, w, h);
      // soft vertical phosphor lines
      ctx.save();
      ctx.globalAlpha = 0.06;
      ctx.fillStyle = "#000";
      for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1);
      ctx.restore();
      grid(ctx, w, h, cellPx, this.colors.grid, 0.22);
    }
  },
  {
    id: "cathode-green",
    name: "Cathode Green",
    blurb: "CRT terminal glow",
    colors: { base: "#0a1f12", baseAlt: "#08160c", grid: "#1f5230", text: "#7dffa0", accent: "#39ff8a" },
    paint(ctx, w, h, cellPx) {
      ctx.fillStyle = this.colors.base;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = this.colors.baseAlt;
      ctx.fillRect(0, h * 0.5, w, h * 0.5);
      dots(ctx, w, h, cellPx, "#2f8f4d", 0.35);
      grid(ctx, w, h, cellPx, this.colors.grid, 0.3);
    }
  },
  {
    id: "amber-crt",
    name: "Amber CRT",
    blurb: "Monochrome amber monitor",
    colors: { base: "#1a0f00", baseAlt: "#120900", grid: "#5a3a00", text: "#ffb84d", accent: "#ff9000" },
    paint(ctx, w, h, cellPx) {
      ctx.fillStyle = this.colors.base;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = this.colors.baseAlt;
      ctx.fillRect(0, h * 0.55, w, h * 0.45);
      // scanlines
      ctx.save();
      ctx.globalAlpha = 0.07;
      ctx.fillStyle = "#000";
      for (let y = 0; y < h; y += 2) ctx.fillRect(0, y, w, 1);
      ctx.restore();
      grid(ctx, w, h, cellPx, this.colors.grid, 0.28);
    }
  },
  {
    id: "deep-space",
    name: "Deep Space",
    blurb: "Drifting through the void",
    colors: { base: "#05060f", baseAlt: "#02030a", grid: "#1c2348", text: "#cdd6ff", accent: "#8aa0ff" },
    paint(ctx, w, h, cellPx) {
      ctx.fillStyle = this.colors.base;
      ctx.fillRect(0, 0, w, h);
      scatterStars(ctx, w, h, Math.round((w * h) / 2600), 1337);
      grid(ctx, w, h, cellPx, this.colors.grid, 0.22);
    }
  },
  {
    id: "synth-grid",
    name: "Synth Grid",
    blurb: "Neon night drive",
    colors: { base: "#1a0a2e", baseAlt: "#0d0518", grid: "#ff2bd6", text: "#ff8af0", accent: "#28ffbf" },
    paint(ctx, w, h, cellPx) {
      ctx.fillStyle = this.colors.baseAlt;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = this.colors.base;
      ctx.fillRect(0, 0, w, h * 0.5);
      grid(ctx, w, h, cellPx, this.colors.grid, 0.18);
    }
  },
  {
    id: "obsidian-tile",
    name: "Obsidian Tile",
    blurb: "Cold stone checker",
    colors: { base: "#15171c", baseAlt: "#0c0d11", grid: "#2c2f38", text: "#e7eaf2", accent: "#9fffff" },
    paint(ctx, w, h, cellPx) {
      checker(ctx, w, h, cellPx, this.colors.base, this.colors.baseAlt);
      grid(ctx, w, h, cellPx, this.colors.grid, 0.3);
    }
  }
];

export function getBackground(id) {
  return BACKGROUNDS.find((b) => b.id === id) ?? BACKGROUNDS[0];
}
