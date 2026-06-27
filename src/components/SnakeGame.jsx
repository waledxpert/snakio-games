import { useEffect, useRef, useState } from "react";
import { CELL, cellCenter, creatureMarkup } from "../snakiox/liveSnake";
import { rarityClass } from "../lib/helpers";
import { downloadResultCard } from "../snakiox/shareCard";
import SnakeAvatar from "./SnakeAvatar";

const GRID = 22;
const BASE_SPEED = 135;    // ms per step at level 1
const SPEED_STEP = 9;      // ms shaved per level
const MIN_SPEED = 60;
const SCORE_PER_FOOD = 1;
const FOOD_PER_LEVEL = 5;

const DIRS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 }
};
const OPPOSITE = { up: "down", down: "up", left: "right", right: "left" };
const KEY_MAP = {
  ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
  w: "up", s: "down", a: "left", d: "right",
  W: "up", S: "down", A: "left", D: "right"
};

const START_SNAKE = [
  { x: 6, y: 11 },
  { x: 5, y: 11 },
  { x: 4, y: 11 },
  { x: 3, y: 11 }
];

function initialBest() {
  return Number(localStorage.getItem("snakiox.best") || 0);
}

function spawnFood(snake) {
  const occupied = new Set(snake.map((c) => `${c.x}:${c.y}`));
  const open = [];
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      if (!occupied.has(`${x}:${y}`)) open.push({ x, y });
    }
  }
  if (open.length === 0) return null;
  return open[Math.floor(Math.random() * open.length)];
}

function levelFromScore(score) {
  return Math.floor(score / (SCORE_PER_FOOD * FOOD_PER_LEVEL)) + 1;
}
function speedForLevel(level) {
  return Math.max(MIN_SPEED, BASE_SPEED - (level - 1) * SPEED_STEP);
}

export default function SnakeGame({ snake, bg, onExit, onChangeSetup }) {
  const canvasRef = useRef(null);
  const svgRef = useRef(null);
  const rafRef = useRef(0);
  const lastTickRef = useRef(0);
  const lastSigRef = useRef("");

  // Game world + phase live in refs so the rAF loop reads fresh values without
  // re-subscribing, and never touches them during render.
  const worldRef = useRef({
    snake: START_SNAKE.map((c) => ({ ...c })),
    food: spawnFood(START_SNAKE),
    dir: "right",
    dirQueue: [],
    score: 0,
    best: initialBest()
  });
  const phaseRef = useRef("idle");

  const [phase, setPhase] = useState("idle"); // idle | playing | paused | dead | won
  const [hud, setHud] = useState({
    score: 0,
    length: START_SNAKE.length,
    level: 1,
    best: initialBest()
  });
  const [saving, setSaving] = useState(false);

  const traits = snake.traits;

  // Export a styled PNG of the finished run (snake + score/length/level).
  async function saveResultCard() {
    if (saving) return;
    setSaving(true);
    try {
      await downloadResultCard({
        token: snake,
        score: hud.score,
        length: hud.length,
        level: hud.level,
        best: hud.best,
        outcome: phaseRef.current === "won" ? "won" : "dead"
      });
    } catch {
      /* canvas/export failed — leave the run intact */
    } finally {
      setSaving(false);
    }
  }

  // Transition helper — keeps the ref and state in sync.
  function goPhase(next) {
    phaseRef.current = next;
    setPhase(next);
  }

  // ── Resize backing store to its CSS box (crisp pixels). ────────────────────
  function resize() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width));
    canvas.width = w * dpr;
    canvas.height = w * dpr;
  }

  // ── Draw current frame ─────────────────────────────────────────────────────
  // Background paints to the canvas every frame (cheap). The serpent itself is
  // the REAL render-core artwork, drawn as an SVG overlay and rebuilt only when
  // it actually moves/grows — so the in-game snake is identical to the NFT
  // (full skin, body taper with no "neck", head, crown, sigil, mark, pattern).
  function draw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const cssSize = canvas.width / dpr;
    const cellPx = cssSize / GRID;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    bg.paint(ctx, cssSize, cssSize, cellPx);

    drawSnakeSvg();
  }

  // Rebuild the SVG serpent overlay only when its shape changes.
  function drawSnakeSvg() {
    const host = svgRef.current;
    if (!host) return;
    const { snake: body, food } = worldRef.current;
    const head = body[0];
    const sig = `${body.length}:${head.x}:${head.y}:${food ? food.x + "," + food.y : "x"}`;
    if (sig === lastSigRef.current) return;
    lastSigRef.current = sig;

    const len = body.length;
    // pos(i): tail (i=0) … head (i=len-1). worldRef.snake[0] is the head.
    const pos = (i) => cellCenter(body[len - 1 - i].x, body[len - 1 - i].y);
    const foodPos = food ? cellCenter(food.x, food.y) : null;
    const vb = GRID * CELL;

    host.innerHTML =
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vb} ${vb}" width="100%" height="100%" preserveAspectRatio="none" shape-rendering="crispEdges">` +
      creatureMarkup(traits, len, pos, foodPos) +
      "</svg>";
  }

  // ── Advance one tick; returns "alive" | "dead" | "won" ─────────────────────
  function step() {
    const w = worldRef.current;
    const next = w.dirQueue.length ? w.dirQueue.shift() : w.dir;
    w.dir = next;
    const delta = DIRS[next];
    const head = w.snake[0];
    const nx = head.x + delta.x;
    const ny = head.y + delta.y;

    if (nx < 0 || ny < 0 || nx >= GRID || ny >= GRID) return "dead";

    const ate = w.food && nx === w.food.x && ny === w.food.y;
    const newSnake = [{ x: nx, y: ny }, ...w.snake];
    const bodyToCheck = ate ? w.snake : w.snake.slice(0, -1);
    if (bodyToCheck.some((c) => c.x === nx && c.y === ny)) return "dead";

    if (ate) {
      w.score += SCORE_PER_FOOD;
      w.food = spawnFood(newSnake);
      if (!w.food) { w.snake = newSnake; return "won"; }
    } else {
      newSnake.pop();
    }
    w.snake = newSnake;
    return "alive";
  }

  function syncHud() {
    const w = worldRef.current;
    setHud({
      score: w.score,
      length: w.snake.length,
      level: levelFromScore(w.score),
      best: w.best
    });
  }

  // ── Run control ────────────────────────────────────────────────────────────
  function beginRun() {
    worldRef.current = {
      snake: START_SNAKE.map((c) => ({ ...c })),
      food: spawnFood(START_SNAKE),
      dir: "right",
      dirQueue: [],
      score: 0,
      best: initialBest()
    };
    lastTickRef.current = 0;
    lastSigRef.current = "";
    syncHud();
    goPhase("playing");
  }

  function resume() {
    lastTickRef.current = 0;
    goPhase("playing");
  }

  function pause() {
    if (phaseRef.current === "playing") goPhase("paused");
  }

  function queueDir(dir) {
    const w = worldRef.current;
    const last = w.dirQueue.length ? w.dirQueue[w.dirQueue.length - 1] : w.dir;
    if (dir === last || dir === OPPOSITE[last]) return;
    if (w.dirQueue.length < 2) w.dirQueue.push(dir);
  }

  // ── Main loop (mounted once) ───────────────────────────────────────────────
  useEffect(() => {
    const loop = (now) => {
      rafRef.current = requestAnimationFrame(loop);
      draw();

      if (phaseRef.current === "playing") {
        const interval = speedForLevel(levelFromScore(worldRef.current.score));
        if (now - lastTickRef.current >= interval) {
          lastTickRef.current = now;
          const result = step();
          if (result === "dead" || result === "won") {
            const w = worldRef.current;
            if (w.score > w.best) {
              w.best = w.score;
              localStorage.setItem("snakiox.best", String(w.score));
            }
            syncHud();
            goPhase(result === "won" ? "won" : "dead");
          } else {
            syncHud();
          }
        }
      }
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bg, traits.skin, traits.gaze, traits.form, traits.skinSeries]);

  // ── Resize + initial draw ──────────────────────────────────────────────────
  useEffect(() => {
    resize();
    draw();
    const onResize = () => { resize(); draw(); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bg, traits.skin, traits.gaze, traits.form, traits.skinSeries]);

  // ── Keyboard ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      const dir = KEY_MAP[e.key];
      if (dir) {
        e.preventDefault();
        queueDir(dir);
        if (phaseRef.current === "idle") beginRun();
        return;
      }
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        const p = phaseRef.current;
        if (p === "idle" || p === "dead" || p === "won") beginRun();
        else if (p === "playing") pause();
        else if (p === "paused") resume();
      }
      if (e.key === "Escape") pause();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Touch / swipe on the board ─────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let startX = 0, startY = 0, active = false;
    const onStart = (e) => {
      const t = e.touches ? e.touches[0] : e;
      startX = t.clientX; startY = t.clientY; active = true;
    };
    const onMove = (e) => {
      if (!active) return;
      const t = e.touches ? e.touches[0] : e;
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      if (Math.abs(dx) < 24 && Math.abs(dy) < 24) return;
      if (Math.abs(dx) > Math.abs(dy)) queueDir(dx > 0 ? "right" : "left");
      else queueDir(dy > 0 ? "down" : "up");
      active = false;
      if (phaseRef.current === "idle") beginRun();
    };
    canvas.addEventListener("touchstart", onStart, { passive: true });
    canvas.addEventListener("touchmove", onMove, { passive: true });
    return () => {
      canvas.removeEventListener("touchstart", onStart);
      canvas.removeEventListener("touchmove", onMove);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="page">
      <div className="flex-between" style={{ marginBottom: "1.2rem" }}>
        <button className="pix-btn pix-btn--ghost pix-btn--lg" onClick={onExit}>
          ← Arcade
        </button>
        <div className="tag">Classic Coil</div>
      </div>

      <div className="game-screen">
        <div className="arena">
          <span className="panel-corner tl" />
          <span className="panel-corner tr" />
          <span className="panel-corner bl" />
          <span className="panel-corner br" />

          <div className="arena-canvas-wrap">
            <canvas ref={canvasRef} />
            <div ref={svgRef} className="arena-snake" aria-hidden="true" />
            {phase !== "playing" && (
              <div className="arena-overlay">
                {phase === "idle" && (
                  <>
                    <h3>Ready, {traits.skin}?</h3>
                    <p>Eat the orbs to grow your coil. Don't hit the walls or your own tail.</p>
                    <button className="pix-btn pix-btn--phosphor pix-btn--lg" onClick={beginRun}>
                      ▶ Start
                    </button>
                    <p className="tag mt-sm">or press any arrow key</p>
                  </>
                )}
                {phase === "paused" && (
                  <>
                    <h3>Paused</h3>
                    <p>Take a breath, serpent.</p>
                    <button className="pix-btn pix-btn--phosphor pix-btn--lg" onClick={resume}>
                      Resume
                    </button>
                  </>
                )}
                {(phase === "dead" || phase === "won") && (
                  <>
                    <h3>{phase === "won" ? "Maximum Coil!" : "Game Over"}</h3>
                    <p>
                      {phase === "won"
                        ? "You filled the whole arena. Legendary."
                        : `Your coil reached length ${hud.length}.`}
                    </p>
                    <div className="flex gap-sm" style={{ justifyContent: "center", flexWrap: "wrap" }}>
                      <button className="pix-btn pix-btn--phosphor pix-btn--lg" onClick={beginRun}>
                        ↻ Run Again
                      </button>
                      <button className="pix-btn pix-btn--amber pix-btn--lg" onClick={saveResultCard} disabled={saving}>
                        {saving ? "Saving…" : "⤓ Save Result"}
                      </button>
                      <button className="pix-btn pix-btn--ghost pix-btn--lg" onClick={onChangeSetup}>
                        Change Snake
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="hud">
          <div className="hud-stat-grid">
            <div className="hud-stat">
              <div className="label">Score</div>
              <div className="value phosphor">{hud.score}</div>
            </div>
            <div className="hud-stat">
              <div className="label">Length</div>
              <div className="value">{hud.length}</div>
            </div>
            <div className="hud-stat">
              <div className="label">Level</div>
              <div className="value">{hud.level}</div>
            </div>
            <div className="hud-stat">
              <div className="label">Best</div>
              <div className="value">{hud.best}</div>
            </div>
          </div>

          <div className="panel" style={{ padding: "0.8rem" }}>
            <h3 className="section-title">Controls</h3>
            <div className="keys-hint">
              <div className="key">↑ W</div>
              <div className="key">↓ S</div>
              <div className="key">← A</div>
              <div className="key">→ D</div>
            </div>
            <div className="tag mt-sm" style={{ marginTop: "0.6rem", lineHeight: 1.5 }}>
              Space / Enter — start · pause<br />
              Swipe on the board to steer on mobile
            </div>
            <div className="flex gap-sm mt-sm" style={{ marginTop: "0.7rem", flexWrap: "wrap" }}>
              {phase === "playing" && (
                <button className="pix-btn pix-btn--ghost" onClick={pause}>Pause</button>
              )}
              {phase === "paused" && (
                <button className="pix-btn pix-btn--phosphor" onClick={resume}>Resume</button>
              )}
              <button className="pix-btn pix-btn--ghost" onClick={beginRun}>Restart</button>
              {(phase === "dead" || phase === "won") && (
                <button className="pix-btn pix-btn--amber" onClick={saveResultCard} disabled={saving}>
                  {saving ? "Saving…" : "⤓ Save"}
                </button>
              )}
            </div>
          </div>

          <div className="legend-mini">
            <SnakeAvatar token={snake} className="legend-avatar" />
            <div className="stack">
              <span className="lm-name">{traits.skin}</span>
              <span className="lm-sub">{traits.gaze} · {traits.form}</span>
              <span className={`rarity-tag ${rarityClass(traits.rarity)}`} style={{ marginTop: 4 }}>
                {traits.rarity}
              </span>
            </div>
          </div>

          {/* On-screen dpad for touch */}
          <div className="panel" style={{ padding: "0.9rem", display: "grid", placeItems: "center" }}>
            <div className="dpad">
              <button className="up" onClick={() => queueDir("up")}>▲</button>
              <button className="left" onClick={() => queueDir("left")}>◀</button>
              <button className="down" onClick={() => queueDir("down")}>▼</button>
              <button className="right" onClick={() => queueDir("right")}>▶</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
