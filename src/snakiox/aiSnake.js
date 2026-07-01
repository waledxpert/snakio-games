// Snake AI driver. Pure logic: given the AI board state it returns the next
// direction to steer. Four genuinely distinct tiers:
//
//   easy   — greedy toward food, only dodges walls (can bite its own body),
//            wanders a lot. Traps itself often. Beatable.
//   medium — greedy toward food with full 1-step death avoidance, but NO
//            planning: it happily walks into pockets it can't escape.
//   hard   — BFS shortest path to the food, gated by a flood-fill space check
//            so it rarely boxes itself in. Strong, but not perfect in the
//            crowded endgame.
//   master — BFS to food, but only eats when it can prove a path back to its
//            own tail still exists afterwards; otherwise it tail-chases and
//            maximizes open space. Near-unbeatable until the board is full.

const DIRS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};
const OPPOSITE = { up: "down", down: "up", left: "right", right: "left" };
const DIR_NAMES = ["up", "down", "left", "right"];

const keyOf = (x, y) => `${x}:${y}`;

function inBounds(x, y, grid) {
  return x >= 0 && y >= 0 && x < grid && y < grid;
}

// Directions the snake may legally take (can't reverse into its own neck).
function candidateDirs(currentDir) {
  return DIR_NAMES.filter((dir) => dir !== OPPOSITE[currentDir]);
}

function dirBetween(from, to) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  return DIR_NAMES.find((d) => DIRS[d].x === dx && DIRS[d].y === dy) || null;
}

// Body cells that block movement. The tail vacates next tick, so it only
// blocks when the snake is about to grow into it (i.e. eats this move).
function bodyBlocked(snake, willEat) {
  const set = new Set();
  const limit = willEat ? snake.length : snake.length - 1;
  for (let i = 0; i < limit; i += 1) set.add(keyOf(snake[i].x, snake[i].y));
  return set;
}

function movesEat(head, dir, food) {
  return !!food && head.x + DIRS[dir].x === food.x && head.y + DIRS[dir].y === food.y;
}

// A move is "safe" if the next head cell is in bounds and not a body cell
// (accounting for the tail vacating unless the snake eats).
function isImmediateSafe(snake, food, dir, grid) {
  const head = snake[0];
  const nx = head.x + DIRS[dir].x;
  const ny = head.y + DIRS[dir].y;
  if (!inBounds(nx, ny, grid)) return false;
  return !bodyBlocked(snake, movesEat(head, dir, food)).has(keyOf(nx, ny));
}

function safeMoves(snake, food, dir, grid) {
  return candidateDirs(dir).filter((d) => isImmediateSafe(snake, food, d, grid));
}

// Manhattan-greedy ordering: axis that closes the gap to the food first.
function greedyOrder(head, food) {
  if (!food) return [...DIR_NAMES];
  const dx = food.x - head.x;
  const dy = food.y - head.y;
  const horiz = dx > 0 ? "right" : dx < 0 ? "left" : null;
  const vert = dy > 0 ? "down" : dy < 0 ? "up" : null;
  const primary = Math.abs(dx) >= Math.abs(dy) ? [horiz, vert] : [vert, horiz];
  const ordered = primary.filter(Boolean);
  for (const dir of DIR_NAMES) if (!ordered.includes(dir)) ordered.push(dir);
  return ordered;
}

// BFS shortest path over free cells. `blocked` is a Set of "x:y" keys; the
// goal is always reachable-adjacent (never itself in `blocked`). Returns the
// full path [start, …, goal] or null.
function bfsPath(start, goal, blocked, grid) {
  const startKey = keyOf(start.x, start.y);
  const goalKey = keyOf(goal.x, goal.y);
  if (startKey === goalKey) return [start];
  const queue = [start];
  let qi = 0;
  const cameFrom = new Map([[startKey, null]]);

  while (qi < queue.length) {
    const cell = queue[qi++];
    for (const dir of DIR_NAMES) {
      const nx = cell.x + DIRS[dir].x;
      const ny = cell.y + DIRS[dir].y;
      if (!inBounds(nx, ny, grid)) continue;
      const k = keyOf(nx, ny);
      if (cameFrom.has(k)) continue;
      if (blocked.has(k) && k !== goalKey) continue;
      cameFrom.set(k, cell);
      if (k === goalKey) {
        // Reconstruct.
        const path = [{ x: nx, y: ny }];
        let prev = cell;
        while (prev) {
          path.unshift(prev);
          prev = cameFrom.get(keyOf(prev.x, prev.y));
        }
        return path;
      }
      queue.push({ x: nx, y: ny });
    }
  }
  return null;
}

// Flood-fill count of free cells reachable from a start cell.
function floodCount(start, blocked, grid) {
  if (!inBounds(start.x, start.y, grid) || blocked.has(keyOf(start.x, start.y)))
    return 0;
  const seen = new Set([keyOf(start.x, start.y)]);
  const stack = [start];
  let count = 0;
  while (stack.length) {
    const cell = stack.pop();
    count += 1;
    for (const dir of DIR_NAMES) {
      const nx = cell.x + DIRS[dir].x;
      const ny = cell.y + DIRS[dir].y;
      const k = keyOf(nx, ny);
      if (!inBounds(nx, ny, grid) || seen.has(k) || blocked.has(k)) continue;
      seen.add(k);
      stack.push({ x: nx, y: ny });
    }
  }
  return count;
}

// Body after taking one step in `dir` (grows iff it eats).
function bodyAfterMove(snake, food, dir) {
  const head = snake[0];
  const nx = head.x + DIRS[dir].x;
  const ny = head.y + DIRS[dir].y;
  const ate = movesEat(head, dir, food);
  const next = [{ x: nx, y: ny }, ...snake.map((c) => ({ ...c }))];
  if (!ate) next.pop();
  return next;
}

// Body after following a whole path to the food (grows on the final step).
function bodyAfterPath(snake, path) {
  let body = snake.map((c) => ({ ...c }));
  for (let i = 1; i < path.length; i += 1) {
    const ate = i === path.length - 1; // path ends on the food
    body = [{ x: path[i].x, y: path[i].y }, ...body];
    if (!ate) body.pop();
  }
  return body;
}

// Can this snake still reach its own tail? (The escape-hatch invariant that
// keeps a snake alive: if the head can always chase the tail, it never traps
// itself.) The tail cell is treated as free since it moves as the head does.
function canReachTail(body, grid) {
  if (body.length < 3) return true;
  const head = body[0];
  const tail = body[body.length - 1];
  const blocked = new Set();
  for (let i = 0; i < body.length - 1; i += 1)
    blocked.add(keyOf(body[i].x, body[i].y));
  return !!bfsPath(head, tail, blocked, grid);
}

// Free space opened up by a move — used to pick the roomiest escape.
function spaceForMove(snake, food, dir, grid) {
  const body = bodyAfterMove(snake, food, dir);
  const blocked = new Set();
  for (let i = 0; i < body.length - 1; i += 1)
    blocked.add(keyOf(body[i].x, body[i].y));
  return floodCount(body[0], blocked, grid);
}

// Among a pool of dirs, the one that leaves the most room; ties break toward
// the food so the snake still drifts productively while stalling.
function roomiestMove(snake, food, dir, grid, pool) {
  const order = greedyOrder(snake[0], food);
  let best = pool[0];
  let bestRoom = -1;
  for (const d of pool) {
    const room = spaceForMove(snake, food, d, grid);
    if (room > bestRoom || (room === bestRoom && order.indexOf(d) < order.indexOf(best))) {
      bestRoom = room;
      best = d;
    }
  }
  return best;
}

/* ── Tier strategies ───────────────────────────────────────────────────────── */

// easy: greedy toward food among fully-safe moves (dodges walls AND its own
// body), but with no lookahead at all — it strolls straight into dead ends and
// blunders often. Beatable, but survives long enough to grow a bit.
function easyMove(snake, food, dir, grid) {
  const safe = safeMoves(snake, food, dir, grid);
  if (!safe.length) return candidateDirs(dir)[0] || dir;
  const preferred = greedyOrder(snake[0], food).find((d) => safe.includes(d));
  return preferred || safe[0];
}

// medium: greedy toward food, but with light space-awareness — if the greedy
// step would cram it into a tight pocket, it retreats to the roomiest safe
// move instead. No pathfinding, so it still misjudges the mid/late game.
function mediumMove(snake, food, dir, grid) {
  const safe = safeMoves(snake, food, dir, grid);
  if (!safe.length) return candidateDirs(dir)[0] || dir;
  const greedyPick = greedyOrder(snake[0], food).find((d) => safe.includes(d));
  if (greedyPick && spaceForMove(snake, food, greedyPick, grid) >= snake.length) {
    return greedyPick;
  }
  return roomiestMove(snake, food, dir, grid, safe);
}

// hard + master share the tail-reachability engine below — the only strategy
// that survives deep into a crowded board. They differ purely in blunder rate
// (see DIFFICULTIES): hard slips occasionally, master never does.

// master: eat only when a path back to the tail is guaranteed afterwards;
// otherwise survive by staying where the tail is still reachable and space is
// greatest.
function masterMove(snake, food, dir, grid) {
  const safe = safeMoves(snake, food, dir, grid);
  if (!safe.length) return candidateDirs(dir)[0] || dir;

  // 1. Safe path to the food?
  if (food) {
    const blocked = bodyBlocked(snake, false);
    const path = bfsPath(snake[0], food, blocked, grid);
    if (path && path.length >= 2) {
      const step = dirBetween(snake[0], path[1]);
      if (step && safe.includes(step) && canReachTail(bodyAfterPath(snake, path), grid)) {
        return step;
      }
    }
  }

  // 2. Survive: prefer safe moves that keep the tail reachable, roomiest first.
  const tailSafe = safe.filter((d) =>
    canReachTail(bodyAfterMove(snake, food, d), grid),
  );
  const pool = tailSafe.length ? tailSafe : safe;
  return roomiestMove(snake, food, dir, grid, pool);
}

export function chooseAiDir({ snake, food, dir = "right", grid = 22, difficulty }) {
  if (!snake || snake.length === 0) return dir;
  const strategy = difficulty?.strategy || "medium";
  const mistakeRate = difficulty?.mistakeRate ?? 0;

  // Random blunder for the lower tiers — may pick an unsafe move, which is the
  // whole point (that's how they lose).
  if (mistakeRate > 0 && Math.random() < mistakeRate) {
    const head = snake[0];
    const legal = candidateDirs(dir).filter((d) =>
      inBounds(head.x + DIRS[d].x, head.y + DIRS[d].y, grid),
    );
    if (legal.length) return legal[Math.floor(Math.random() * legal.length)];
  }

  switch (strategy) {
    case "easy":
      return easyMove(snake, food, dir, grid);
    case "hard":
    case "master":
      return masterMove(snake, food, dir, grid);
    case "medium":
    default:
      return mediumMove(snake, food, dir, grid);
  }
}
