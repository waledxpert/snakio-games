import { BACKGROUNDS, getBackground } from "../snakiox/backgrounds";
import { createToken } from "../snakiox/generator";

const PRESET_SEEDS = [10101, 20202, 30303, 40404, 50505, 60606];

export const SNAKE_PRESETS = PRESET_SEEDS.map((seed, index) =>
  createToken(seed, {
    tokenId: seed,
    length: 18 + index * 2,
  }),
);

export const GAME_MODES = [
  {
    id: "time_attack",
    name: "Time Attack",
    summary: "Grow as much as possible before the timer ends.",
    setting: {
      key: "durationSeconds",
      label: "Time",
      options: [
        { label: "1 min", value: 60 },
        { label: "3 mins", value: 180 },
        { label: "5 mins", value: 300 },
      ],
    },
  },
  {
    id: "last_survivor",
    name: "Last Survivor",
    summary: "The first player to crash loses.",
    setting: null,
  },
  {
    id: "first_to_length",
    name: "First to Length",
    summary: "Reach the target length before your opponent.",
    setting: {
      key: "targetLength",
      label: "Target Length",
      options: [
        { label: "100", value: 100 },
        { label: "200", value: 200 },
        { label: "300", value: 300 },
      ],
    },
  },
  {
    id: "highest_score",
    name: "Highest Score",
    summary: "Both players play until they die. Highest score wins.",
    setting: null,
  },
  {
    id: "apple_rush",
    name: "Apple Rush",
    summary: "Collect the target number of apples first.",
    setting: {
      key: "targetApples",
      label: "Target Apples",
      options: [
        { label: "25", value: 25 },
        { label: "50", value: 50 },
        { label: "100", value: 100 },
      ],
    },
  },
];

// ── Arcade (solo / vs-AI) catalog ────────────────────────────────────────────
// Home-page games. `leaderboardMode` is the mode id stored on the scoreboard.
// `setting` reuses the option shape from GAME_MODES.

export const DIFFICULTIES = [
  { id: "easy", label: "Easy", tick: 200, mistakeRate: 0.25, strategy: "greedy" },
  { id: "medium", label: "Medium", tick: 150, mistakeRate: 0.1, strategy: "safe" },
  { id: "hard", label: "Hard", tick: 120, mistakeRate: 0.02, strategy: "bfs" },
  { id: "master", label: "Master", tick: 95, mistakeRate: 0, strategy: "flood" },
];

export function getDifficulty(id) {
  return DIFFICULTIES.find((entry) => entry.id === id) ?? DIFFICULTIES[1];
}

const DURATION_SETTING = {
  key: "durationSeconds",
  label: "Time",
  options: [
    { label: "1 min", value: 60 },
    { label: "3 mins", value: 180 },
    { label: "5 mins", value: 300 },
  ],
};

const TARGET_LENGTH_SETTING = {
  key: "targetLength",
  label: "Target Length",
  options: [
    { label: "25", value: 25 },
    { label: "50", value: 50 },
    { label: "100", value: 100 },
  ],
};

const TARGET_APPLES_SETTING = {
  key: "targetApples",
  label: "Target Apples",
  options: [
    { label: "15", value: 15 },
    { label: "25", value: 25 },
    { label: "50", value: 50 },
  ],
};

export const ARCADE_MODES = [
  {
    id: "classic_coil",
    leaderboardMode: "classic_coil",
    name: "Classic Coil",
    blurb:
      "The original. Eat to grow, don't bite your tail. Race an AI or chase your own best score.",
    foot: "SNAKE · ARCADE",
    allowsSolo: true,
    allowsAi: true,
    setting: null,
    motif: "classic",
    palette: {
      bg: "#0a1f12",
      bg2: "#08160c",
      grid: "#1f5230",
      snakeA: "#b6ff5a",
      snakeB: "#6f9d3a",
      food: "#ffc24b",
    },
  },
  {
    id: "time_attack",
    leaderboardMode: "time_attack",
    name: "Time Attack",
    blurb: "Grow as much as you can before the timer runs out. Solo or against the AI.",
    foot: "TIMED · ARCADE",
    allowsSolo: true,
    allowsAi: true,
    setting: DURATION_SETTING,
    motif: "gravity",
    palette: {
      bg: "#0d0f1f",
      bg2: "#080a16",
      grid: "#26305a",
      snakeA: "#6b5cff",
      snakeB: "#9b8bff",
      food: "#28ffbf",
    },
  },
  {
    id: "last_survivor",
    leaderboardMode: "last_survivor",
    name: "Last Survivor",
    blurb: "Outlast the AI. The first serpent to crash loses the round.",
    foot: "VS AI · SURVIVAL",
    allowsSolo: false,
    allowsAi: true,
    setting: null,
    motif: "duel",
    palette: {
      bg: "#140b16",
      bg2: "#0b0510",
      grid: "#40214c",
      snakeA: "#b6ff5a",
      snakeB: "#6f9d3a",
      food: "#ff5a5a",
    },
  },
  {
    id: "first_to_length",
    leaderboardMode: "first_to_length",
    name: "First to Length",
    blurb: "First to reach the target length wins. Beat the AI to the finish.",
    foot: "VS AI · RACE",
    allowsSolo: false,
    allowsAi: true,
    setting: TARGET_LENGTH_SETTING,
    motif: "race",
    palette: {
      bg: "#1a0a2e",
      bg2: "#0d0518",
      grid: "#3a1a55",
      snakeA: "#ff2bd6",
      snakeB: "#7a1f66",
      food: "#28ffbf",
    },
  },
  {
    id: "apple_rush",
    leaderboardMode: "apple_rush",
    name: "Apple Rush",
    blurb: "Collect the target apples as fast as you can — solo for time, or beat the AI.",
    foot: "SPEED · ARCADE",
    allowsSolo: true,
    allowsAi: true,
    setting: TARGET_APPLES_SETTING,
    motif: "maze",
    palette: {
      bg: "#101814",
      bg2: "#0a100d",
      grid: "#22332a",
      snakeA: "#5aa9ff",
      snakeB: "#2c5a8a",
      food: "#ffc24b",
    },
  },
];

export function getArcadeMode(id) {
  return ARCADE_MODES.find((mode) => mode.id === id) ?? ARCADE_MODES[0];
}

export function createArcadeSettings(modeId) {
  const mode = getArcadeMode(modeId);
  if (!mode.setting) return {};
  return {
    [mode.setting.key]:
      mode.setting.options[1]?.value ?? mode.setting.options[0].value,
  };
}

export function createSnakeSnapshot(snake) {
  return {
    tokenId: String(snake.tokenId),
    name: snake.name,
    len: snake.len,
    image: snake.image || "",
    traits: { ...snake.traits },
  };
}

export function getSnakeChoices(ownedSnakes = []) {
  return ownedSnakes.length ? ownedSnakes : SNAKE_PRESETS;
}

export function getSnakeById(id, pool = SNAKE_PRESETS) {
  return (
    pool.find((snake) => String(snake.tokenId) === String(id)) ??
    pool[0] ??
    SNAKE_PRESETS[0]
  );
}

export function resolveSnake(player, ownedSnakes = []) {
  if (player?.snake?.traits) return player.snake;
  const pool = getSnakeChoices(ownedSnakes);
  return getSnakeById(player?.snakeId, pool);
}

export function getBackgroundById(id) {
  return getBackground(id);
}

export function getModeById(id) {
  return GAME_MODES.find((mode) => mode.id === id) ?? GAME_MODES[0];
}

export function createDefaultSettings(modeId) {
  const mode = getModeById(modeId);
  if (!mode.setting) return {};
  return {
    [mode.setting.key]:
      mode.setting.options[1]?.value ?? mode.setting.options[0].value,
  };
}

export function buildModeSettings(modeId, rawValue) {
  const mode = getModeById(modeId);
  if (!mode.setting) return {};
  return { [mode.setting.key]: Number(rawValue) };
}

export function describeMode(modeId, settings = {}) {
  const mode = getModeById(modeId);
  if (!mode.setting) return mode.name;
  const value = settings[mode.setting.key];
  const option = mode.setting.options.find((entry) => entry.value === value);
  return `${mode.name} · ${mode.setting.label}: ${option?.label ?? value}`;
}

export { BACKGROUNDS };
