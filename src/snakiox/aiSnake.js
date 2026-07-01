// Snake AI driver. Pure logic: given the AI board state it returns the next
// direction to steer. Difficulty scales how carefully it plays — from a sloppy
// greedy chaser (easy) up to a flood-fill-safe planner (master).

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

// Body cells that would block a move. The tail vacates unless the snake is
// about to grow, so exclude it when we're not eating into that cell.
function blockedSet(snake, willEat) {
  const set = new Set();
  const limit = willEat ? snake.length : snake.length - 1;
  for (let i = 0; i < limit; i += 1) set.add(keyOf(snake[i].x, snake[i].y));
  return set;
}

function isImmediateSafe(snake, food, dir, grid) {
  const head = snake[0];
  const nx = head.x + DIRS[dir].x;
  const ny = head.y + DIRS[dir].y;
  if (!inBounds(nx, ny, grid)) return false;
  const willEat = food && nx === food.x && ny === food.y;
  return !blockedSet(snake, willEat).has(keyOf(nx, ny));
}

function candidateDirs(currentDir) {
  return DIR_NAMES.filter((dir) => dir !== OPPOSITE[currentDir]);
}

// Manhattan-greedy: prefer the axis that closes the gap to the food most.
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

// BFS shortest path from head to food over currently-free cells. Returns the
// first-step direction, or null if unreachable.
function bfsToFood(snake, food, grid) {
  if (!food) return null;
  const head = snake[0];
  const blocked = blockedSet(snake, false);
  const start = keyOf(head.x, head.y);
  const queue = [{ x: head.x, y: head.y }];
  const cameFrom = new Map([[start, null]]);

  while (queue.length) {
    const cell = queue.shift();
    if (cell.x === food.x && cell.y === food.y) {
      // Walk back to the step adjacent to the head.
      let cur = keyOf(cell.x, cell.y);
      let prev = cameFrom.get(cur);
      while (prev && prev !== start) {
        cur = prev;
        prev = cameFrom.get(cur);
      }
      const [fx, fy] = cur.split(":").map(Number);
      const ddx = fx - head.x;
      const ddy = fy - head.y;
      return (
        DIR_NAMES.find((d) => DIRS[d].x === ddx && DIRS[d].y === ddy) || null
      );
    }
    for (const dir of DIR_NAMES) {
      const nx = cell.x + DIRS[dir].x;
      const ny = cell.y + DIRS[dir].y;
      const k = keyOf(nx, ny);
      if (!inBounds(nx, ny, grid)) continue;
      if (cameFrom.has(k)) continue;
      if (blocked.has(k) && !(nx === food.x && ny === food.y)) continue;
      cameFrom.set(k, keyOf(cell.x, cell.y));
      queue.push({ x: nx, y: ny });
    }
  }
  return null;
}

// Flood fill of reachable free space from a starting cell, given a set of
// blocked cells. Used to avoid steering into a pocket the snake can't escape.
function floodCount(startX, startY, blocked, grid, cap) {
  if (!inBounds(startX, startY, grid) || blocked.has(keyOf(startX, startY)))
    return 0;
  const seen = new Set([keyOf(startX, startY)]);
  const stack = [{ x: startX, y: startY }];
  let count = 0;
  while (stack.length && count < cap) {
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

// Simulate one move and score the resulting free space (higher = safer).
function spaceAfter(snake, food, dir, grid) {
  const head = snake[0];
  const nx = head.x + DIRS[dir].x;
  const ny = head.y + DIRS[dir].y;
  const willEat = food && nx === food.x && ny === food.y;
  const nextSnake = [{ x: nx, y: ny }, ...snake];
  if (!willEat) nextSnake.pop();
  const blocked = new Set(
    nextSnake.slice(0, nextSnake.length - 1).map((c) => keyOf(c.x, c.y)),
  );
  return floodCount(nx, ny, blocked, grid, grid * grid);
}

export function chooseAiDir({ snake, food, dir = "right", grid = 22, difficulty }) {
  if (!snake || snake.length === 0) return dir;
  const strategy = difficulty?.strategy || "safe";
  const mistakeRate = difficulty?.mistakeRate ?? 0.1;

  const options = candidateDirs(dir);
  const safe = options.filter((d) => isImmediateSafe(snake, food, d, grid));

  // Occasional blunder for lower difficulties — pick any legal move.
  if (mistakeRate > 0 && Math.random() < mistakeRate) {
    const pool = safe.length ? safe : options;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  if (!safe.length) {
    // Cornered — keep going straight and hope, or any legal move.
    return options[0] || dir;
  }

  if (strategy === "greedy") {
    const preferred = greedyOrder(snake[0], food).find((d) => safe.includes(d));
    return preferred || safe[0];
  }

  if (strategy === "safe") {
    // Greedy toward food but only among immediately-safe moves.
    const preferred = greedyOrder(snake[0], food).find((d) => safe.includes(d));
    return preferred || safe[0];
  }

  // bfs / flood — plan a path to the food.
  const bfsDir = bfsToFood(snake, food, grid);

  if (strategy === "bfs") {
    if (bfsDir && safe.includes(bfsDir)) return bfsDir;
    const preferred = greedyOrder(snake[0], food).find((d) => safe.includes(d));
    return preferred || safe[0];
  }

  // master: take the BFS step only if it leaves enough room to survive,
  // otherwise pick the safe move that maximizes reachable space.
  if (bfsDir && safe.includes(bfsDir)) {
    const room = spaceAfter(snake, food, bfsDir, grid);
    if (room >= snake.length) return bfsDir;
  }
  let best = safe[0];
  let bestRoom = -1;
  for (const d of safe) {
    const room = spaceAfter(snake, food, d, grid);
    if (room > bestRoom) {
      bestRoom = room;
      best = d;
    }
  }
  return best;
}
