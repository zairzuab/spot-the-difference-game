// The screenshot scenes behind ?shot=start|play-market|play-reef|play-harbour.
// Each one sets the world to a fixed, deterministic state — the same seed
// always gives the same frame — with markers on some differences found, several
// still unfound, and the counter visible, exactly as the bounty asks.

import { SCENES } from './scenes.js';
import { SCREEN_TITLE, SCREEN_PLAY } from './world.js';

/** Which differences are already found in each play shot, by scene index. */
const SHOT_FOUND = {
  'play-market': [0, 2, 4, 5],
  'play-reef': [0, 1, 4],
  'play-harbour': [0, 2, 3, 4, 6],
};

/** The timer and score each play shot shows. */
const SHOT_STATS = {
  'play-market': { timer: 83, score: 400 },
  'play-reef': { timer: 47, score: 300 },
  'play-harbour': { timer: 125, score: 500 },
};

/**
 * Set `world` to the named scene and return the screen to draw.
 * Unknown names stage the title screen.
 */
export function stageShot(name, world) {
  const state = world.state;
  if (name === 'play-market' || name === 'play-reef' || name === 'play-harbour') {
    const index = name === 'play-market' ? 0 : name === 'play-reef' ? 1 : 2;
    world.startLevel(index);
    const stats = SHOT_STATS[name];
    state.timer = stats.timer;
    state.score = stats.score;
    const found = SHOT_FOUND[name];
    for (const i of found) state.found.add(SCENES[index].diffs[i].id);
    state.lastFound = SCENES[index].diffs[found[found.length - 1]];
    state.flash = 0.9;
    return SCREEN_PLAY;
  }
  state.screen = SCREEN_TITLE;
  return SCREEN_TITLE;
}
