import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CELL, cellCenter, creatureMarkup } from "../snakiox/liveSnake";
import { chooseAiDir } from "../snakiox/aiSnake";
import {
  SNAKE_PRESETS,
  getArcadeMode,
  getDifficulty,
} from "../lib/pvpCatalog";
import { rarityClass } from "../lib/helpers";
import { downloadResultCard } from "../snakiox/shareCard";
import { submitScore } from "../lib/arcadeApi";
import { useWallet } from "../lib/walletContext";
import { useProfile } from "../lib/profileContext";
import { useLeaderboard } from "../lib/leaderboardContext";
import SnakeAvatar from "./SnakeAvatar";

const GRID = 22;
const BASE_SPEED = 135;
const SPEED_STEP = 9;
const MIN_SPEED = 60;
const FOOD_PER_LEVEL = 5;
const ARROWS = { up: "▲", down: "▼", left: "◀", right: "▶" };

const DIRS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};
const OPPOSITE = { up: "down", down: "up", left: "right", right: "left" };
const KEY_MAP = {
  ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
  w: "up", s: "down", a: "left", d: "right",
  W: "up", S: "down", A: "left", D: "right",
};

const START_SNAKE = [
  { x: 6, y: 11 },
  { x: 5, y: 11 },
  { x: 4, y: 11 },
  { x: 3, y: 11 },
];

function spawnFood(snake) {
  const occupied = new Set(snake.map((c) => `${c.x}:${c.y}`));
  const open = [];
  for (let y = 0; y < GRID; y += 1) {
    for (let x = 0; x < GRID; x += 1) {
      if (!occupied.has(`${x}:${y}`)) open.push({ x, y });
    }
  }
  if (!open.length) return null;
  return open[Math.floor(Math.random() * open.length)];
}

function createWorld() {
  const snake = START_SNAKE.map((c) => ({ ...c }));
  return {
    snake,
    food: spawnFood(snake),
    dir: "right",
    dirQueue: [],
    score: 0,
    applesCollected: 0,
    alive: true,
    thresholdReachedAt: null,
  };
}

function levelFromScore(score) {
  return Math.floor(score / FOOD_PER_LEVEL) + 1;
}
function speedForLevel(level) {
  return Math.max(MIN_SPEED, BASE_SPEED - (level - 1) * SPEED_STEP);
}

// Advance one world by a single step. Mutates and returns the world.
function stepWorld(world) {
  if (!world.alive) return world;
  const next = world.dirQueue.length ? world.dirQueue.shift() : world.dir;
  world.dir = next;
  const delta = DIRS[next];
  const head = world.snake[0];
  const nx = head.x + delta.x;
  const ny = head.y + delta.y;

  if (nx < 0 || ny < 0 || nx >= GRID || ny >= GRID) {
    world.alive = false;
    return world;
  }
  const ate = world.food && nx === world.food.x && ny === world.food.y;
  const nextSnake = [{ x: nx, y: ny }, ...world.snake];
  const collide = (ate ? world.snake : world.snake.slice(0, -1)).some(
    (c) => c.x === nx && c.y === ny,
  );
  if (collide) {
    world.alive = false;
    return world;
  }
  if (ate) {
    world.score += 1;
    world.applesCollected += 1;
    world.food = spawnFood(nextSnake);
  } else {
    nextSnake.pop();
  }
  world.snake = nextSnake;
  return world;
}

// Tie-break comparisons (mirror the server's evaluateRoom helpers).
function betterBy(a, b, keys) {
  for (const key of keys) {
    if (a[key] !== b[key]) return a[key] > b[key] ? "player" : "ai";
  }
  return "draw";
}

/* ─── Swipe Trackpad (self-contained, mirrors SnakeGame) ───────────────────── */
function Trackpad({ onDir, onTap }) {
  const padRef = useRef(null);
  const startRef = useRef(null);
  const [touched, setTouched] = useState(false);
  const [flashDir, setFlashDir] = useState(null);
  const timerRef = useRef(null);

  const fire = (dir) => {
    onDir(dir);
    setFlashDir(dir);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setFlashDir(null), 260);
  };
  const onStart = (e) => {
    e.preventDefault();
    const t = e.touches[0];
    startRef.current = { x: t.clientX, y: t.clientY };
    setTouched(true);
  };
  const onMove = (e) => {
    e.preventDefault();
    if (!startRef.current) return;
    const t = e.touches[0];
    const dx = t.clientX - startRef.current.x;
    const dy = t.clientY - startRef.current.y;
    if (Math.hypot(dx, dy) < 22) return;
    fire(
      Math.abs(dx) > Math.abs(dy)
        ? dx > 0 ? "right" : "left"
        : dy > 0 ? "down" : "up",
    );
    startRef.current = { x: t.clientX, y: t.clientY };
  };
  const onEnd = () => {
    startRef.current = null;
    setTouched(false);
  };
  useEffect(() => () => clearTimeout(timerRef.current), []);

  return (
    <div
      ref={padRef}
      className={`trackpad${touched ? " trackpad--active" : ""}`}
      onTouchStart={onStart}
      onTouchMove={onMove}
      onTouchEnd={onEnd}
      onTouchCancel={onEnd}
      onClick={onTap}
      role="button"
      tabIndex={0}
      aria-label="Swipe trackpad to steer"
    >
      <span className="tp-c tl" /><span className="tp-c tr" />
      <span className="tp-c bl" /><span className="tp-c br" />
      {Object.entries(ARROWS).map(([d, glyph]) => (
        <span key={d} className={`tp-arrow tp-${d}${flashDir === d ? " tp-lit" : ""}`}>
          {glyph}
        </span>
      ))}
      <span className="tp-label">{touched ? "" : "swipe to steer"}</span>
    </div>
  );
}

export default function ArcadeGame({ snake, bg, config, onExit, onChangeSetup }) {
  const mode = getArcadeMode(config.mode);
  const vsAi = config.opponent === "ai";
  const difficulty = vsAi ? getDifficulty(config.difficulty) : null;
  const settings = config.settings || {};
  const durationSeconds = settings.durationSeconds || 180;
  const targetLength = settings.targetLength || 50;
  const targetApples = settings.targetApples || 25;

  const { address } = useWallet();
  const { name } = useProfile();
  const leaderboard = useLeaderboard();

  // AI gets a distinct preset creature so it looks different from the player.
  const aiSnakeToken = useMemo(() => {
    const other = SNAKE_PRESETS.find(
      (p) => String(p.tokenId) !== String(snake.tokenId),
    );
    return other || SNAKE_PRESETS[0];
  }, [snake.tokenId]);

  const playerCanvasRef = useRef(null);
  const playerSvgRef = useRef(null);
  const aiCanvasRef = useRef(null);
  const aiSvgRef = useRef(null);
  const rafRef = useRef(0);
  const playerTickRef = useRef(0);
  const aiTickRef = useRef(0);
  const playerSigRef = useRef("");
  const aiSigRef = useRef("");
  const startedAtRef = useRef(0);

  const worldRef = useRef({ player: createWorld(), ai: createWorld() });
  const phaseRef = useRef("idle");
  const submittedRef = useRef(false);

  const [phase, setPhase] = useState("idle"); // idle | playing | paused | finished
  const [hud, setHud] = useState({
    score: 0, length: START_SNAKE.length, level: 1, apples: 0,
    aiScore: 0, aiLength: START_SNAKE.length, aiApples: 0, aiAlive: true,
    remaining: durationSeconds,
  });
  const [result, setResult] = useState(null); // { outcome, score, length, apples, durationMs }
  const [saving, setSaving] = useState(false);
  const [submitState, setSubmitState] = useState("idle"); // idle | saving | saved | error | no-wallet
  const [ctrlMode, setCtrlMode] = useState(
    () => localStorage.getItem("snakiox.ctrl") ?? "dpad",
  );
  const [showAi, setShowAi] = useState(
    () => (localStorage.getItem("snakiox.arcade.showAi") ?? "true") === "true",
  );

  const switchCtrl = (m) => {
    setCtrlMode(m);
    localStorage.setItem("snakiox.ctrl", m);
  };
  const toggleAi = () => {
    setShowAi((v) => {
      localStorage.setItem("snakiox.arcade.showAi", String(!v));
      return !v;
    });
  };

  const traits = snake.traits;
  const aiTraits = aiSnakeToken.traits;

  function goPhase(next) {
    phaseRef.current = next;
    setPhase(next);
  }

  function syncHud() {
    const { player, ai } = worldRef.current;
    const elapsed = startedAtRef.current
      ? Math.floor((performance.now() - startedAtRef.current) / 1000)
      : 0;
    setHud({
      score: player.score,
      length: player.snake.length,
      level: levelFromScore(player.score),
      apples: player.applesCollected,
      aiScore: ai.score,
      aiLength: ai.snake.length,
      aiApples: ai.applesCollected,
      aiAlive: ai.alive,
      remaining: Math.max(0, durationSeconds - elapsed),
    });
  }

  // ── Result submission (optimistic leaderboard insert) ──────────────────────
  const finalize = useCallback(
    (outcome) => {
      const { player } = worldRef.current;
      const durationMs = startedAtRef.current
        ? Math.round(performance.now() - startedAtRef.current)
        : 0;
      const summary = {
        outcome,
        score: player.score,
        length: player.snake.length,
        apples: player.applesCollected,
        durationMs,
      };
      setResult(summary);
      goPhase("finished");

      if (submittedRef.current) return;
      submittedRef.current = true;

      if (!address) {
        setSubmitState("no-wallet");
        return;
      }

      const won = vsAi
        ? outcome === "win"
          ? true
          : outcome === "loss"
            ? false
            : null
        : null;

      const payload = {
        walletAddress: address,
        name: name || null,
        mode: mode.leaderboardMode,
        opponent: config.opponent,
        difficulty: vsAi ? difficulty.id : null,
        score: player.score,
        length: player.snake.length,
        apples: player.applesCollected,
        durationMs,
        won,
      };

      setSubmitState("saving");
      // Optimistic row shown immediately at the top of the board.
      leaderboard.optimisticInsert({
        walletAddress: address,
        name: name || null,
        mode: mode.leaderboardMode,
        opponent: config.opponent,
        difficulty: vsAi ? difficulty.id : null,
        score: player.score,
        length: player.snake.length,
        apples: player.applesCollected,
        durationMs,
        won,
        streak: 0,
        createdAt: new Date().toISOString(),
      });

      // Fire-and-forget: the result is already on screen; persistence and the
      // leaderboard reconcile happen in the background.
      submitScore(payload)
        .then(() => {
          setSubmitState("saved");
          leaderboard.refresh();
        })
        .catch(() => setSubmitState("error"));
    },
    [address, name, mode.leaderboardMode, config.opponent, vsAi, difficulty, leaderboard],
  );

  // Decide whether the round is over and with what outcome. Returns
  // { finished, outcome } — outcome is null for solo runs.
  const evaluate = useCallback(() => {
    const { player, ai } = worldRef.current;
    const elapsedMs = startedAtRef.current
      ? performance.now() - startedAtRef.current
      : 0;
    const timeUp = elapsedMs >= durationSeconds * 1000;

    if (!vsAi) {
      if (config.mode === "time_attack") {
        if (timeUp || !player.alive) return { finished: true, outcome: null };
        return { finished: false };
      }
      if (config.mode === "apple_rush") {
        if (player.applesCollected >= targetApples || !player.alive)
          return { finished: true, outcome: null };
        return { finished: false };
      }
      // classic_coil solo — play until death.
      if (!player.alive) return { finished: true, outcome: null };
      return { finished: false };
    }

    // ── vs AI ──
    const winnerToOutcome = (w) =>
      w === "player" ? "win" : w === "ai" ? "loss" : "draw";

    if (config.mode === "last_survivor") {
      if (!player.alive && ai.alive) return { finished: true, outcome: "loss" };
      if (!ai.alive && player.alive) return { finished: true, outcome: "win" };
      if (!player.alive && !ai.alive)
        return { finished: true, outcome: winnerToOutcome(betterBy(player, ai, ["score", "length"])) };
      return { finished: false };
    }

    if (config.mode === "first_to_length") {
      const pReached = player.snake.length >= targetLength;
      const aReached = ai.snake.length >= targetLength;
      if (pReached || aReached) {
        const pT = player.thresholdReachedAt ?? Infinity;
        const aT = ai.thresholdReachedAt ?? Infinity;
        if (pT === aT) return { finished: true, outcome: "draw" };
        return { finished: true, outcome: pT < aT ? "win" : "loss" };
      }
      if (!player.alive && !ai.alive)
        return { finished: true, outcome: winnerToOutcome(betterBy(player, ai, ["length", "score"])) };
      return { finished: false };
    }

    if (config.mode === "apple_rush") {
      const pReached = player.applesCollected >= targetApples;
      const aReached = ai.applesCollected >= targetApples;
      if (pReached || aReached) {
        const pT = player.thresholdReachedAt ?? Infinity;
        const aT = ai.thresholdReachedAt ?? Infinity;
        if (pT === aT) return { finished: true, outcome: "draw" };
        return { finished: true, outcome: pT < aT ? "win" : "loss" };
      }
      if (!player.alive && !ai.alive)
        return { finished: true, outcome: winnerToOutcome(betterBy(player, ai, ["applesCollected", "score"])) };
      return { finished: false };
    }

    if (config.mode === "time_attack") {
      if (timeUp || (!player.alive && !ai.alive))
        return { finished: true, outcome: winnerToOutcome(betterBy(player, ai, ["score", "length"])) };
      return { finished: false };
    }

    // classic_coil vs AI — end when the player dies; higher score wins.
    if (!player.alive) {
      if (ai.alive && ai.score > player.score) return { finished: true, outcome: "loss" };
      return { finished: true, outcome: winnerToOutcome(betterBy(player, ai, ["score", "length"])) };
    }
    return { finished: false };
  }, [vsAi, config.mode, durationSeconds, targetApples, targetLength]);

  // Record the moment a world crosses the mode's threshold (for "first to X").
  function stampThreshold(world) {
    if (config.mode === "first_to_length") {
      if (world.snake.length >= targetLength && !world.thresholdReachedAt)
        world.thresholdReachedAt = performance.now();
    } else if (config.mode === "apple_rush") {
      if (world.applesCollected >= targetApples && !world.thresholdReachedAt)
        world.thresholdReachedAt = performance.now();
    }
  }

  const queueDir = useCallback((dir) => {
    const world = worldRef.current.player;
    if (!world.alive) return;
    const last = world.dirQueue.length
      ? world.dirQueue[world.dirQueue.length - 1]
      : world.dir;
    if (dir === last || dir === OPPOSITE[last]) return;
    if (world.dirQueue.length < 2) world.dirQueue.push(dir);
  }, []);

  function beginRun() {
    worldRef.current = { player: createWorld(), ai: createWorld() };
    playerTickRef.current = 0;
    aiTickRef.current = 0;
    playerSigRef.current = "";
    aiSigRef.current = "";
    startedAtRef.current = performance.now();
    submittedRef.current = false;
    setResult(null);
    setSubmitState("idle");
    syncHud();
    goPhase("playing");
  }

  function resume() {
    playerTickRef.current = 0;
    aiTickRef.current = 0;
    goPhase("playing");
  }
  function pause() {
    if (phaseRef.current === "playing") goPhase("paused");
  }

  async function saveResultCard() {
    if (saving) return;
    setSaving(true);
    try {
      await downloadResultCard({
        token: snake,
        score: hud.score,
        length: hud.length,
        level: hud.level,
        best: hud.score,
        outcome: result?.outcome === "win" ? "won" : "dead",
      });
    } catch {
      /* export failed — leave the run intact */
    } finally {
      setSaving(false);
    }
  }

  // ── Render helpers ─────────────────────────────────────────────────────────
  function drawBoard(canvas, svgHost, world, snakeTraits, sigRef) {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const cssSize = canvas.width / dpr;
    if (cssSize <= 0) return;
    const cellPx = cssSize / GRID;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    bg.paint(ctx, cssSize, cssSize, cellPx);

    const host = svgHost;
    if (host && snakeTraits) {
      const { snake: body, food } = world;
      const head = body[0];
      const sig = `${body.length}:${head.x}:${head.y}:${food ? `${food.x},${food.y}` : "x"}`;
      if (sig !== sigRef.current) {
        sigRef.current = sig;
        const len = body.length;
        const pos = (i) => cellCenter(body[len - 1 - i].x, body[len - 1 - i].y);
        const foodPos = food ? cellCenter(food.x, food.y) : null;
        const vb = GRID * CELL;
        host.innerHTML =
          `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vb} ${vb}" width="100%" height="100%" preserveAspectRatio="none" shape-rendering="crispEdges">` +
          creatureMarkup(snakeTraits, len, pos, foodPos) +
          "</svg>";
      }
    }
    if (phaseRef.current !== "playing") {
      ctx.fillStyle = "rgba(0,0,0,0.28)";
      ctx.fillRect(0, 0, cssSize, cssSize);
    }
  }

  function resizeCanvas(canvas) {
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(0, Math.round(rect.width));
    canvas.width = w * dpr;
    canvas.height = w * dpr;
  }

  // ── Main loop ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const loop = (now) => {
      rafRef.current = requestAnimationFrame(loop);
      drawBoard(playerCanvasRef.current, playerSvgRef.current, worldRef.current.player, traits, playerSigRef);
      if (vsAi) {
        drawBoard(aiCanvasRef.current, aiSvgRef.current, worldRef.current.ai, aiTraits, aiSigRef);
      }

      if (phaseRef.current !== "playing") return;
      const { player, ai } = worldRef.current;
      let changed = false;

      const playerInterval = speedForLevel(levelFromScore(player.score));
      if (player.alive && now - playerTickRef.current >= playerInterval) {
        playerTickRef.current = now;
        stepWorld(player);
        stampThreshold(player);
        changed = true;
      }

      if (vsAi && ai.alive && now - aiTickRef.current >= difficulty.tick) {
        aiTickRef.current = now;
        const dir = chooseAiDir({
          snake: ai.snake,
          food: ai.food,
          dir: ai.dir,
          grid: GRID,
          difficulty,
        });
        ai.dirQueue = [dir];
        stepWorld(ai);
        stampThreshold(ai);
        changed = true;
      }

      // Time-attack needs a tick even when nothing moved so the clock resolves.
      if (config.mode === "time_attack") changed = true;

      if (changed) {
        const { finished, outcome } = evaluate();
        syncHud();
        if (finished) void finalize(outcome);
      }
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vsAi, difficulty, evaluate, finalize, config.mode, traits.skin, aiTraits.skin, bg]);

  // ── Resize + initial draw ──────────────────────────────────────────────────
  useEffect(() => {
    const onResize = () => {
      resizeCanvas(playerCanvasRef.current);
      if (vsAi) resizeCanvas(aiCanvasRef.current);
      playerSigRef.current = "";
      aiSigRef.current = "";
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [vsAi, showAi, bg]);

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
        if (p === "idle" || p === "finished") beginRun();
        else if (p === "playing") pause();
        else if (p === "paused") resume();
      }
      if (e.key === "Escape") pause();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queueDir]);

  // ── Touch / swipe on the player board ──────────────────────────────────────
  useEffect(() => {
    const canvas = playerCanvasRef.current;
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
  }, [queueDir]);

  const targetLabel =
    config.mode === "first_to_length"
      ? `${hud.length} / ${targetLength} len`
      : config.mode === "apple_rush"
        ? `${hud.apples} / ${targetApples} 🍎`
        : config.mode === "time_attack"
          ? `${String(Math.floor(hud.remaining / 60)).padStart(2, "0")}:${String(hud.remaining % 60).padStart(2, "0")}`
          : `Lv ${hud.level}`;

  const outcomeLabel =
    result?.outcome === "win" ? "YOU WIN"
      : result?.outcome === "loss" ? "YOU LOSE"
        : result?.outcome === "draw" ? "DRAW"
          : "Run Complete";

  return (
    <div className="page">
      <div className="flex-between" style={{ marginBottom: "1.2rem" }}>
        <button className="pix-btn pix-btn--ghost pix-btn--lg" onClick={onExit}>
          ← Arcade
        </button>
        <div className="tag">
          {mode.name}
          {vsAi ? ` · vs AI (${difficulty.label})` : " · Solo"}
        </div>
      </div>

      {/* Compact HUD */}
      <div className="arcade-hud">
        <div className="arcade-hud-side">
          <span className="arcade-hud-label">YOU</span>
          <strong className="arcade-hud-name">{name || traits.skin}</strong>
          <div className="arcade-hud-stats">
            <span><b>{hud.score}</b> pts</span>
            <span><b>{hud.length}</b> len</span>
          </div>
        </div>
        <div className="arcade-hud-center">
          <span className="arcade-hud-mode">{mode.name}</span>
          <strong className="arcade-hud-target">{targetLabel}</strong>
        </div>
        {vsAi ? (
          <div className="arcade-hud-side arcade-hud-side--right">
            <span className="arcade-hud-label">AI · {difficulty.label}</span>
            <strong className="arcade-hud-name">{aiTraits.skin}</strong>
            <div className="arcade-hud-stats">
              <span><b>{hud.aiScore}</b> pts</span>
              <span style={{ color: hud.aiAlive ? "inherit" : "var(--danger)" }}>
                <b>{hud.aiAlive ? hud.aiLength : "✕"}</b> {hud.aiAlive ? "len" : "out"}
              </span>
            </div>
          </div>
        ) : (
          <div className="arcade-hud-side arcade-hud-side--right">
            <span className="arcade-hud-label">BEST</span>
            <strong className="arcade-hud-name">Solo Run</strong>
            <div className="arcade-hud-stats"><span><b>{hud.apples}</b> 🍎</span></div>
          </div>
        )}
      </div>

      <div className={`arcade-stage${vsAi && showAi ? " arcade-stage--dual" : ""}`}>
        {/* Player board */}
        <div className="arena arcade-arena">
          <span className="panel-corner tl" /><span className="panel-corner tr" />
          <span className="panel-corner bl" /><span className="panel-corner br" />
          <div className="arena-canvas-wrap">
            <canvas ref={playerCanvasRef} />
            <div ref={playerSvgRef} className="arena-snake" aria-hidden="true" />
            {phase !== "playing" && (
              <div className="arena-overlay">
                {phase === "idle" && (
                  <>
                    <h3>{mode.name}</h3>
                    <p>{mode.blurb}</p>
                    <button className="pix-btn pix-btn--phosphor pix-btn--lg" onClick={beginRun}>
                      ▶ Start
                    </button>
                    <p className="tag mt-sm">or press any arrow key</p>
                  </>
                )}
                {phase === "paused" && (
                  <>
                    <h3>Paused</h3>
                    <button className="pix-btn pix-btn--phosphor pix-btn--lg" onClick={resume}>
                      Resume
                    </button>
                  </>
                )}
                {phase === "finished" && (
                  <>
                    <h3>{outcomeLabel}</h3>
                    <p>
                      Score {result?.score} · Length {result?.length}
                      {config.mode === "apple_rush" && ` · ${result?.apples} 🍎`}
                    </p>
                    {submitState === "saving" && <p className="tag">Saving score…</p>}
                    {submitState === "saved" && <p className="tag">Saved to leaderboard ✓</p>}
                    {submitState === "error" && <p className="tag">Could not save score.</p>}
                    {submitState === "no-wallet" && (
                      <p className="tag">Connect a wallet to rank this run.</p>
                    )}
                    <div className="flex gap-sm" style={{ justifyContent: "center", flexWrap: "wrap" }}>
                      <button className="pix-btn pix-btn--phosphor pix-btn--lg" onClick={beginRun}>
                        ↻ Play Again
                      </button>
                      <button className="pix-btn pix-btn--amber pix-btn--lg" onClick={saveResultCard} disabled={saving}>
                        {saving ? "Saving…" : "⤓ Save Card"}
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

        {/* AI board (optional, auto-hidden on small screens via CSS) */}
        {vsAi && showAi && (
          <div className="arena arcade-arena arcade-arena--ai">
            <span className="panel-corner tl" /><span className="panel-corner tr" />
            <span className="panel-corner bl" /><span className="panel-corner br" />
            <div className="arena-ai-tag">AI · {difficulty.label}</div>
            <div className="arena-canvas-wrap">
              <canvas ref={aiCanvasRef} />
              <div ref={aiSvgRef} className="arena-snake" aria-hidden="true" />
              {!hud.aiAlive && phase === "playing" && (
                <div className="arena-overlay arena-overlay--mini">
                  <h3>AI crashed</h3>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Controls + toggles */}
      <div className="arcade-controls">
        {vsAi && (
          <button className="pix-btn pix-btn--ghost" onClick={toggleAi}>
            {showAi ? "Hide AI board" : "Show AI board"}
          </button>
        )}
        <div className="ctrl-toggle">
          <button
            className={`ctrl-toggle-btn${ctrlMode === "dpad" ? " ctrl-toggle-btn--on" : ""}`}
            onClick={() => switchCtrl("dpad")}
          >
            D-Pad
          </button>
          <button
            className={`ctrl-toggle-btn${ctrlMode === "trackpad" ? " ctrl-toggle-btn--on" : ""}`}
            onClick={() => switchCtrl("trackpad")}
          >
            Swipe
          </button>
        </div>

        {ctrlMode === "dpad" ? (
          <div className="dpad">
            <button className="up" onClick={() => { queueDir("up"); if (phaseRef.current === "idle") beginRun(); }}>▲</button>
            <button className="left" onClick={() => { queueDir("left"); if (phaseRef.current === "idle") beginRun(); }}>◀</button>
            <button className="down" onClick={() => { queueDir("down"); if (phaseRef.current === "idle") beginRun(); }}>▼</button>
            <button className="right" onClick={() => { queueDir("right"); if (phaseRef.current === "idle") beginRun(); }}>▶</button>
          </div>
        ) : (
          <Trackpad
            onDir={(dir) => { queueDir(dir); if (phaseRef.current === "idle") beginRun(); }}
            onTap={() => {
              const p = phaseRef.current;
              if (p === "idle" || p === "finished") beginRun();
              else if (p === "playing") pause();
              else if (p === "paused") resume();
            }}
          />
        )}

        <div className="legend-mini">
          <SnakeAvatar token={snake} className="legend-avatar" />
          <div className="stack">
            <span className="lm-name">{traits.skin}</span>
            <span className={`rarity-tag ${rarityClass(traits.rarity)}`} style={{ marginTop: 4 }}>
              {traits.rarity}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
