const BG = "#0a0d0a";
const PANEL = "#141914";
const PANEL_2 = "#1b211b";
const INK = "#e8f3da";
const DIM = "#9fb18c";
const LINE = "#2a3327";
const PHOSPHOR = "#b6ff5a";
const AMBER = "#ffc24b";
const DANGER = "#ff5a5a";

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawStatRow(ctx, x, y, label, value, color = INK) {
  ctx.fillStyle = DIM;
  ctx.font = "600 14px 'JetBrains Mono', monospace";
  ctx.fillText(label, x, y);
  ctx.fillStyle = color;
  ctx.font = "700 22px 'DM Sans', system-ui, sans-serif";
  ctx.fillText(String(value), x + 180, y);
}

export async function downloadPvpResultCard({ room, me, opponent, resultLabel }) {
  const W = 1000;
  const H = 680;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  roundRect(ctx, 24, 24, W - 48, H - 48, 14);
  ctx.fillStyle = PANEL;
  ctx.fill();
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = PHOSPHOR;
  ctx.font = "700 20px 'JetBrains Mono', monospace";
  ctx.fillText("SNAKIOX PVP", 48, 66);

  ctx.fillStyle = INK;
  ctx.font = "700 48px 'Pixelify Sans', system-ui, sans-serif";
  ctx.fillText(resultLabel, 48, 136);

  ctx.fillStyle = DIM;
  ctx.font = "500 18px 'DM Sans', system-ui, sans-serif";
  ctx.fillText(room.result?.reason || room.mode, 48, 168);

  roundRect(ctx, 48, 210, 430, 360, 10);
  ctx.fillStyle = PANEL_2;
  ctx.fill();
  ctx.strokeStyle = LINE;
  ctx.stroke();

  roundRect(ctx, 522, 210, 430, 360, 10);
  ctx.fillStyle = PANEL_2;
  ctx.fill();
  ctx.strokeStyle = LINE;
  ctx.stroke();

  ctx.fillStyle = PHOSPHOR;
  ctx.font = "700 18px 'JetBrains Mono', monospace";
  ctx.fillText("YOU", 72, 252);
  ctx.fillStyle = INK;
  ctx.font = "700 32px 'DM Sans', system-ui, sans-serif";
  ctx.fillText(me?.nickname || "—", 72, 294);
  drawStatRow(ctx, 72, 352, "Score", me?.score ?? 0, PHOSPHOR);
  drawStatRow(ctx, 72, 402, "Length", me?.length ?? 0);
  drawStatRow(ctx, 72, 452, "Apples", me?.applesCollected ?? 0, AMBER);
  drawStatRow(ctx, 72, 502, "Status", me?.alive ? "Alive" : "Out", me?.alive ? PHOSPHOR : DANGER);

  ctx.fillStyle = AMBER;
  ctx.font = "700 18px 'JetBrains Mono', monospace";
  ctx.fillText("OPPONENT", 546, 252);
  ctx.fillStyle = INK;
  ctx.font = "700 32px 'DM Sans', system-ui, sans-serif";
  ctx.fillText(opponent?.nickname || "—", 546, 294);
  drawStatRow(ctx, 546, 352, "Score", opponent?.score ?? 0, PHOSPHOR);
  drawStatRow(ctx, 546, 402, "Length", opponent?.length ?? 0);
  drawStatRow(ctx, 546, 452, "Apples", opponent?.applesCollected ?? 0, AMBER);
  drawStatRow(ctx, 546, 502, "Status", opponent?.alive ? "Alive" : "Out", opponent?.alive ? PHOSPHOR : DANGER);

  ctx.fillStyle = DIM;
  ctx.font = "500 16px 'JetBrains Mono', monospace";
  ctx.fillText(`Room ${room.code}`, 48, 622);
  ctx.fillText(new Date().toLocaleString(), 720, 622);

  await new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) return resolve();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `snakiox-pvp-${room.code}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      resolve();
    }, "image/png");
  });
}
