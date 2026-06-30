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
