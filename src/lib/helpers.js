// Shared non-component helpers (kept out of ui.jsx so ui.jsx stays
// fast-refresh-friendly as a components-only module).

// Paint a small thumbnail preview of a background to a canvas ref.
export function paintThumb(canvas, paint, cellPx = 14) {
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
  paint(ctx, w, h, cellPx);
}

// Rarity → CSS modifier class for tile badges.
export function rarityClass(rarity) {
  return `r-${rarity}`;
}
