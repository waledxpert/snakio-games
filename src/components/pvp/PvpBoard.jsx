import { useCallback, useEffect, useRef, useState } from "react";
import { CELL, cellCenter, creatureMarkup } from "../../snakiox/liveSnake";

const GRID = 22;
const START_SNAKE = [
  { x: 6, y: 11 },
  { x: 5, y: 11 },
  { x: 4, y: 11 },
  { x: 3, y: 11 },
];
const DIRS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};
const OPPOSITE = { up: "down", down: "up", left: "right", right: "left" };
const KEY_MAP = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  w: "up",
  a: "left",
  s: "down",
  d: "right",
  W: "up",
  A: "left",
  S: "down",
  D: "right",
};
const ARROWS = { up: "▲", down: "▼", left: "◀", right: "▶" };

function Trackpad({ onDir }) {
  const padRef = useRef(null);
  const startRef = useRef(null);
  const [touched, setTouched] = useState(false);
  const [touchPct, setTouchPct] = useState(null);
  const [flashDir, setFlashDir] = useState(null);
  const timerRef = useRef(null);

  const getRelPos = (touch) => {
    const rect = padRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return {
      x: Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (touch.clientY - rect.top) / rect.height)),
    };
  };

  const fire = (dir) => {
    onDir(dir);
    setFlashDir(dir);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setFlashDir(null), 260);
  };

  const onStart = (event) => {
    event.preventDefault();
    const touch = event.touches[0];
    startRef.current = { x: touch.clientX, y: touch.clientY };
    setTouched(true);
    setTouchPct(getRelPos(touch));
  };

  const onMove = (event) => {
    event.preventDefault();
    if (!startRef.current) return;
    const touch = event.touches[0];
    const dx = touch.clientX - startRef.current.x;
    const dy = touch.clientY - startRef.current.y;
    if (Math.hypot(dx, dy) < 22) return;
    const dir =
      Math.abs(dx) > Math.abs(dy)
        ? dx > 0
          ? "right"
          : "left"
        : dy > 0
          ? "down"
          : "up";
    fire(dir);
    startRef.current = { x: touch.clientX, y: touch.clientY };
    setTouchPct(getRelPos(touch));
  };

  const onEnd = () => {
    startRef.current = null;
    setTouched(false);
    setTouchPct(null);
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
      role="button"
      tabIndex={0}
      aria-label="Swipe trackpad to steer"
    >
      <span className="tp-c tl" />
      <span className="tp-c tr" />
      <span className="tp-c bl" />
      <span className="tp-c br" />

      {Object.entries(ARROWS).map(([dir, glyph]) => (
        <span
          key={dir}
          className={`tp-arrow tp-${dir}${flashDir === dir ? " tp-lit" : ""}`}
        >
          {glyph}
        </span>
      ))}

      <span className="tp-label">{touched ? "" : "swipe to steer"}</span>

      {touchPct && (
        <span
          className="tp-glow"
          style={{ left: `${touchPct.x * 100}%`, top: `${touchPct.y * 100}%` }}
        />
      )}
    </div>
  );
}

function spawnFood(snake) {
  const occupied = new Set(snake.map((cell) => `${cell.x}:${cell.y}`));
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
  return {
    snake: START_SNAKE.map((cell) => ({ ...cell })),
    food: spawnFood(START_SNAKE),
    dir: "right",
    dirQueue: [],
    score: 0,
    alive: true,
    applesCollected: 0,
  };
}

export default function PvpBoard({
  snake,
  background,
  running,
  boardKey,
  onProgress,
}) {
  const canvasRef = useRef(null);
  const svgRef = useRef(null);
  const rafRef = useRef(0);
  const lastTickRef = useRef(0);
  const lastSigRef = useRef("");
  const worldRef = useRef(createWorld());
  const onProgressRef = useRef(onProgress);
  const [snapshot, setSnapshot] = useState({
    score: 0,
    length: START_SNAKE.length,
    alive: true,
    applesCollected: 0,
  });
  const [ctrlMode, setCtrlMode] = useState(
    () => localStorage.getItem("snakiox.pvp.ctrl") ?? "dpad",
  );

  const switchCtrl = (mode) => {
    setCtrlMode(mode);
    localStorage.setItem("snakiox.pvp.ctrl", mode);
  };

  const queueDir = useCallback(
    (dir) => {
      const world = worldRef.current;
      if (!running || !world.alive) return;
      const last = world.dirQueue.length
        ? world.dirQueue[world.dirQueue.length - 1]
        : world.dir;
      if (dir === last || dir === OPPOSITE[last]) return;
      if (world.dirQueue.length < 2) world.dirQueue.push(dir);
    },
    [running],
  );

  useEffect(() => {
    onProgressRef.current = onProgress;
  }, [onProgress]);

  useEffect(() => {
    worldRef.current = createWorld();
    lastTickRef.current = 0;
    lastSigRef.current = "";
    onProgressRef.current?.({
      score: 0,
      length: START_SNAKE.length,
      alive: true,
      applesCollected: 0,
    });
  }, [boardKey]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(1, Math.round(rect.width));
      canvas.width = width * dpr;
      canvas.height = width * dpr;
    }

    function drawSnakeSvg() {
      const host = svgRef.current;
      if (!host || !snake?.traits) return;
      const { snake: body, food } = worldRef.current;
      const head = body[0];
      const sig = `${body.length}:${head?.x}:${head?.y}:${food ? `${food.x},${food.y}` : "x"}`;
      if (sig === lastSigRef.current) return;
      lastSigRef.current = sig;

      const len = body.length;
      const pos = (i) => cellCenter(body[len - 1 - i].x, body[len - 1 - i].y);
      const foodPos = food ? cellCenter(food.x, food.y) : null;
      const vb = GRID * CELL;
      host.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vb} ${vb}" width="100%" height="100%" preserveAspectRatio="none" shape-rendering="crispEdges">${creatureMarkup(snake.traits, len, pos, foodPos)}</svg>`;
    }

    function draw() {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const dpr = window.devicePixelRatio || 1;
      const cssSize = canvas.width / dpr;
      const cellPx = cssSize / GRID;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;
      background.paint(ctx, cssSize, cssSize, cellPx);
      drawSnakeSvg();

      if (!running) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
        ctx.fillRect(0, 0, cssSize, cssSize);
      }
    }

    function step() {
      const world = worldRef.current;
      if (!world.alive) return;
      const nextDir = world.dirQueue.length
        ? world.dirQueue.shift()
        : world.dir;
      world.dir = nextDir;
      const delta = DIRS[nextDir];
      const head = world.snake[0];
      const nextHead = { x: head.x + delta.x, y: head.y + delta.y };

      if (
        nextHead.x < 0 ||
        nextHead.y < 0 ||
        nextHead.x >= GRID ||
        nextHead.y >= GRID
      ) {
        world.alive = false;
      } else {
        const ate =
          world.food &&
          nextHead.x === world.food.x &&
          nextHead.y === world.food.y;
        const nextSnake = [nextHead, ...world.snake];
        const collisionBody = ate ? world.snake : world.snake.slice(0, -1);
        if (
          collisionBody.some(
            (cell) => cell.x === nextHead.x && cell.y === nextHead.y,
          )
        ) {
          world.alive = false;
        } else {
          if (ate) {
            world.score += 10;
            world.applesCollected += 1;
            world.food = spawnFood(nextSnake);
          } else {
            nextSnake.pop();
          }
          world.snake = nextSnake;
        }
      }

      const next = {
        score: world.score,
        length: world.snake.length,
        alive: world.alive,
        applesCollected: world.applesCollected,
      };
      setSnapshot(next);
      onProgressRef.current?.(next);
    }

    function loop(now) {
      rafRef.current = requestAnimationFrame(loop);
      draw();
      if (!running || !worldRef.current.alive) return;
      if (now - lastTickRef.current >= 130) {
        lastTickRef.current = now;
        step();
      }
    }

    resize();
    draw();
    const handleResize = () => {
      resize();
      draw();
    };

    window.addEventListener("resize", handleResize);
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", handleResize);
    };
  }, [background, boardKey, running, snake]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      const dir = KEY_MAP[event.key];
      if (!dir) return;
      event.preventDefault();
      queueDir(dir);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [queueDir]);

  return (
    <div className="pvp-board-shell pvp-board-shell--stacked">
      <div className="pvp-board-wrap">
        <canvas ref={canvasRef} className="pvp-board" />
        <div
          ref={svgRef}
          className="arena-snake pvp-board-snake"
          aria-hidden="true"
        />
        {!running && (
          <div className="pvp-board-overlay">
            <h3>Waiting for match start</h3>
            <p>Both players will launch together when the countdown ends.</p>
          </div>
        )}
        {running && !snapshot.alive && (
          <div className="pvp-board-overlay pvp-board-overlay--danger">
            <h3>You crashed</h3>
            <p>
              Your final score was {snapshot.score}. Waiting for the server to
              resolve the match.
            </p>
          </div>
        )}
      </div>

      <div className="panel dpad-panel pvp-mobile-controls pvp-controls-below">
        <div className="ctrl-toggle">
          <button
            className={`ctrl-toggle-btn${ctrlMode === "dpad" ? " ctrl-toggle-btn--on" : ""}`}
            onClick={() => switchCtrl("dpad")}
            type="button"
          >
            D-Pad
          </button>
          <button
            className={`ctrl-toggle-btn${ctrlMode === "trackpad" ? " ctrl-toggle-btn--on" : ""}`}
            onClick={() => switchCtrl("trackpad")}
            type="button"
          >
            Swipe
          </button>
        </div>

        {ctrlMode === "dpad" ? (
          <div className="dpad">
            <button className="up" type="button" onClick={() => queueDir("up")}>
              ▲
            </button>
            <button
              className="left"
              type="button"
              onClick={() => queueDir("left")}
            >
              ◀
            </button>
            <button
              className="down"
              type="button"
              onClick={() => queueDir("down")}
            >
              ▼
            </button>
            <button
              className="right"
              type="button"
              onClick={() => queueDir("right")}
            >
              ▶
            </button>
          </div>
        ) : (
          <Trackpad onDir={queueDir} />
        )}
      </div>
    </div>
  );
}
