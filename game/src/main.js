// Boot and the one loop: input is read every frame, the world advances in fixed
// 1/60 s steps, and the renderer paints what is there. The game moves between
// four screens: title, play, level complete and win, plus a pause overlay.
//
// ?shot=start|play-market|play-reef|play-harbour stages that scene instead of
// running the loop, paints it twice and sets window.__shotReady for a screenshot.
import { FIELD, LAYOUT, SCENE, STEP } from './config.js';
import { createWorld, SCREEN_TITLE, SCREEN_PLAY, SCREEN_LEVEL, SCREEN_WIN } from './world.js';
import { createInput, ACTION_CONFIRM, ACTION_HINT, ACTION_PAUSE, ACTION_MUTE, ACTION_MAGNIFY } from './input.js';
import { createRenderer } from './render.js';
import { createAudio } from './audio.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall (a hidden tab) is dropped, not replayed. */
const MAX_FRAME = 0.25;
/** Keyboard cursor speed, in scene units per second. */
const CURSOR_SPEED = 520;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');

const canvas = document.getElementById('game');
// The drawing buffer is the logical field itself: without this the canvas
// stays at its 300x150 default and the game paints off-canvas, zoomed.
canvas.width = FIELD.width;
canvas.height = FIELD.height;
const status = document.getElementById('status');
const world = createWorld();
const renderer = createRenderer(canvas);
const audio = createAudio();

function inRect(x, y, rect) {
  return rect && x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

/** Which panel (0 left, 1 right) a field point is on, with scene coordinates; null outside both. */
function panelAt(x, y) {
  const { left, right } = LAYOUT;
  if (x >= left.x && x < left.x + left.w && y >= left.y && y < left.y + left.h) {
    return { panel: 0, sx: x - left.x, sy: y - left.y };
  }
  if (x >= right.x && x < right.x + right.w && y >= right.y && y < right.y + right.h) {
    return { panel: 1, sx: x - right.x, sy: y - right.y };
  }
  return null;
}

function runShot(name) {
  stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, world.state.best, { inside: false, x: 0, y: 0 });
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  const state = world.state;
  let best = state.best;
  let accumulator = 0;
  let last = performance.now();

  // Screen readers (and anyone watching the page's text) hear the screen changes.
  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    audio.unlock();
    world.startGame();
    announce(`Playing ${world.scene().name}. Find 7 differences.`);
  }

  function handleClick(click) {
    audio.unlock();
    const { x, y } = click;
    const b = renderer.buttons;
    if (state.screen === SCREEN_TITLE) {
      if (inRect(x, y, b.play)) startGame();
      return;
    }
    if (state.screen === SCREEN_LEVEL) {
      if (inRect(x, y, b.next)) {
        audio.click();
        world.nextLevel();
        if (state.screen === SCREEN_WIN) audio.win();
        announce(state.screen === SCREEN_WIN ? `Finished. Score ${state.score}.` : `Playing ${world.scene().name}.`);
      }
      return;
    }
    if (state.screen === SCREEN_WIN) {
      if (inRect(x, y, b.again)) {
        audio.click();
        startGame();
      }
      return;
    }
    // Play screen.
    if (state.paused) {
      state.paused = false;
      announce('Playing.');
      return;
    }
    if (inRect(x, y, b.hint)) {
      if (world.useHint()) audio.hint();
      return;
    }
    if (inRect(x, y, b.magnifier)) {
      state.magnifier = !state.magnifier;
      audio.click();
      return;
    }
    if (inRect(x, y, b.mute)) {
      state.muted = audio.toggleMute();
      return;
    }
    const hit = panelAt(x, y);
    if (hit) {
      state.cursor.visible = false;
      const result = world.mark(hit.sx, hit.sy, hit.panel);
      if (result === 'found') {
        audio.found();
        if (state.screen === SCREEN_LEVEL) audio.level();
        announce(`Found ${world.foundCount()} of 7. ${world.remaining()} remain.`);
      } else if (result === 'wrong') {
        audio.wrong();
      }
    }
  }

  function handleActions() {
    const actions = input.takeActions();
    if (actions & ACTION_MUTE) {
      state.muted = audio.toggleMute();
      return;
    }
    if (actions & ACTION_MAGNIFY) {
      state.magnifier = !state.magnifier;
      return;
    }
    if (actions & ACTION_PAUSE) {
      if (state.screen === SCREEN_PLAY) {
        state.paused = !state.paused;
        announce(state.paused ? 'Paused.' : 'Playing.');
      }
      return;
    }
    if (actions & ACTION_HINT) {
      if (world.useHint()) audio.hint();
      return;
    }
    if (actions & ACTION_CONFIRM) {
      audio.unlock();
      if (state.screen === SCREEN_TITLE) {
        startGame();
      } else if (state.screen === SCREEN_LEVEL) {
        world.nextLevel();
        if (state.screen === SCREEN_WIN) audio.win();
      } else if (state.screen === SCREEN_WIN) {
        startGame();
      } else if (state.screen === SCREEN_PLAY && !state.paused && state.cursor.visible) {
        const result = world.mark(state.cursor.x, state.cursor.y, state.cursor.panel);
        if (result === 'found') {
          audio.found();
          if (state.screen === SCREEN_LEVEL) audio.level();
          announce(`Found ${world.foundCount()} of 7. ${world.remaining()} remain.`);
        } else if (result === 'wrong') {
          audio.wrong();
        }
      }
    }
  }

  function moveCursor(dt) {
    const dir = input.direction();
    if (dir.dx === 0 && dir.dy === 0) return;
    const c = state.cursor;
    c.visible = true;
    c.x += dir.dx * CURSOR_SPEED * dt;
    c.y += dir.dy * CURSOR_SPEED * dt;
    if (c.x < 0) {
      if (c.panel === 1 && dir.dx < 0) {
        c.panel = 0;
        c.x = SCENE.w - 1;
      } else {
        c.x = 0;
      }
    } else if (c.x >= SCENE.w) {
      if (c.panel === 0 && dir.dx > 0) {
        c.panel = 1;
        c.x = 0;
      } else {
        c.x = SCENE.w - 1;
      }
    }
    c.y = Math.max(0, Math.min(SCENE.h - 1, c.y));
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleActions();
    for (const click of input.takeClicks()) handleClick(click);
    if (state.screen === SCREEN_PLAY && !state.paused) moveCursor(accumulator);
    while (accumulator >= STEP) {
      world.update(STEP);
      audio.update(STEP);
      accumulator -= STEP;
    }
    renderer.draw(state, best, input.mouse());
    best = state.best;
  }

  // Leaving the tab pauses a running game rather than letting the timer run unseen.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && state.screen === SCREEN_PLAY) {
      state.paused = true;
      announce('Paused.');
    }
  });

  announce('Spot the Difference. Press Space or click to start.');
  requestAnimationFrame(frame);
}

// A debug handle for the playtest: state, layout and click points.
window.__game = {
  get state() { return world.state; },
  get screen() { return world.state.screen; },
  get level() { return world.state.level; },
  get found() { return world.state.found.size; },
  get score() { return world.state.score; },
  get hintsLeft() { return world.state.hintsLeft; },
  get timer() { return world.state.timer; },
  get scene() { return world.scene(); },
  layout: LAYOUT,
  sceneSize: SCENE,
  field: FIELD,
  /** Field coordinates of a difference on a panel, for clicking it in a test. */
  clickPoint(diffId, panel) {
    const d = world.scene().diffs.find((x) => x.id === diffId);
    if (!d) return null;
    const rect = panel === 0 ? LAYOUT.left : LAYOUT.right;
    return { x: rect.x + d.x, y: rect.y + d.y };
  },
  /** Field coordinates of an empty spot (no difference nearby), for a wrong click. */
  emptyPoint(panel) {
    const rect = panel === 0 ? LAYOUT.left : LAYOUT.right;
    return { x: rect.x + 300, y: rect.y + 40 };
  },
};

if (shot) runShot(shot);
else runGame();
