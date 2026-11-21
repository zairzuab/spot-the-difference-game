// Game state: screens, levels, found differences, timer, score, hints and the
// keyboard cursor. The two pictures of a scene are painted once, when the
// level loads, onto offscreen canvases the renderer blits each frame.

import {
  DIFFS_PER_SCENE, HINTS_PER_SCENE, HINT_SECONDS, WRONG_SECONDS,
  POINTS_FOUND, POINTS_WRONG, POINTS_HINT, BONUS_SECONDS, BONUS_RATE,
  SCENE, BEST_KEY,
} from './config.js';
import { SCENES, paintScene } from './scenes.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_LEVEL = 'level';
export const SCREEN_WIN = 'win';

export function createWorld() {
  const state = {
    screen: SCREEN_TITLE,
    paused: false,
    level: 0,
    found: new Set(),
    hintsLeft: HINTS_PER_SCENE,
    hintDiff: null,
    hintTimer: 0,
    wrongs: [], // {panel, x, y, t} — wrong-click X marks, in scene coords.
    timer: 0, // seconds in the current level
    totalTime: 0,
    score: 0,
    levelBonus: 0,
    best: 0,
    muted: false,
    magnifier: false,
    // Keyboard cursor: which panel and where, in scene coordinates.
    cursor: { panel: 0, x: SCENE.w / 2, y: SCENE.h / 2, visible: false },
    leftCanvas: null,
    rightCanvas: null,
    flash: 0, // seconds left of the "found" pulse on the newest marker
    lastFound: null,
    toast: null,
    toastTimer: 0,
  };

  try {
    state.best = Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    state.best = 0;
  }

  function saveBest() {
    try {
      window.localStorage.setItem(BEST_KEY, String(state.best));
    } catch {
      // Storage can be off: the best score then lasts this visit only.
    }
  }

  function scene() {
    return SCENES[state.level];
  }

  function paintLevel() {
    state.leftCanvas = document.createElement('canvas');
    state.leftCanvas.width = SCENE.w;
    state.leftCanvas.height = SCENE.h;
    state.rightCanvas = document.createElement('canvas');
    state.rightCanvas.width = SCENE.w;
    state.rightCanvas.height = SCENE.h;
    paintScene(scene(), 0, state.leftCanvas);
    paintScene(scene(), 1, state.rightCanvas);
  }

  function startLevel(index) {
    state.level = index;
    state.found = new Set();
    state.hintsLeft = HINTS_PER_SCENE;
    state.hintDiff = null;
    state.hintTimer = 0;
    state.wrongs = [];
    state.timer = 0;
    state.levelBonus = 0;
    state.lastFound = null;
    state.cursor = { panel: 0, x: SCENE.w / 2, y: SCENE.h / 2, visible: false };
    paintLevel();
    state.screen = SCREEN_PLAY;
  }

  function startGame() {
    state.score = 0;
    state.totalTime = 0;
    startLevel(0);
  }

  /** The difference at a scene point, if it is still unfound. */
  function diffAt(x, y) {
    for (const d of scene().diffs) {
      if (state.found.has(d.id)) continue;
      if (Math.hypot(x - d.x, y - d.y) <= d.r) return d;
    }
    return null;
  }

  /** Try to mark the point (scene coords, on the given panel). Returns 'found' | 'wrong' | 'none'. */
  function mark(x, y, panel) {
    if (state.screen !== SCREEN_PLAY || state.paused) return 'none';
    const d = diffAt(x, y);
    if (d) {
      state.found.add(d.id);
      state.lastFound = d;
      state.flash = 0.9;
      state.score += POINTS_FOUND;
      state.hintDiff = null;
      state.hintTimer = 0;
      if (state.found.size >= DIFFS_PER_SCENE) finishLevel();
      return 'found';
    }
    // Already-found differences are not wrong: they just re-show the marker.
    for (const fd of scene().diffs) {
      if (state.found.has(fd.id) && Math.hypot(x - fd.x, y - fd.y) <= fd.r) return 'none';
    }
    state.wrongs.push({ panel, x, y, t: WRONG_SECONDS });
    state.score = Math.max(0, state.score - POINTS_WRONG);
    state.toast = 'Not a difference — 10 points';
    state.toastTimer = 1.2;
    return 'wrong';
  }

  function useHint() {
    if (state.screen !== SCREEN_PLAY || state.paused) return false;
    if (state.hintsLeft <= 0 || state.found.size >= DIFFS_PER_SCENE) return false;
    const rest = scene().diffs.filter((d) => !state.found.has(d.id));
    if (rest.length === 0) return false;
    state.hintDiff = rest[Math.floor(Math.random() * rest.length)];
    state.hintTimer = HINT_SECONDS;
    state.hintsLeft -= 1;
    state.score = Math.max(0, state.score - POINTS_HINT);
    return true;
  }

  function finishLevel() {
    const bonus = Math.max(0, Math.round((BONUS_SECONDS - state.timer) * BONUS_RATE));
    state.levelBonus = bonus;
    state.score += bonus;
    state.totalTime += state.timer;
    state.screen = SCREEN_LEVEL;
  }

  function nextLevel() {
    if (state.level + 1 >= SCENES.length) {
      state.screen = SCREEN_WIN;
      if (state.score > state.best) {
        state.best = state.score;
        saveBest();
      }
    } else {
      startLevel(state.level + 1);
    }
  }

  function update(dt) {
    if (state.screen === SCREEN_PLAY && !state.paused) state.timer += dt;
    if (state.hintTimer > 0) {
      state.hintTimer -= dt;
      if (state.hintTimer <= 0) state.hintDiff = null;
    }
    if (state.flash > 0) state.flash -= dt;
    if (state.toastTimer > 0) {
      state.toastTimer -= dt;
      if (state.toastTimer <= 0) state.toast = null;
    }
    for (const w of state.wrongs) w.t -= dt;
    state.wrongs = state.wrongs.filter((w) => w.t > 0);
  }

  return {
    state,
    scene,
    startGame,
    startLevel,
    mark,
    useHint,
    nextLevel,
    update,
    foundCount() {
      return state.found.size;
    },
    remaining() {
      return DIFFS_PER_SCENE - state.found.size;
    },
  };
}
