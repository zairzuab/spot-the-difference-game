// Keyboard and pointer input. The canvas is a fixed logical field, so every
// pointer position is converted from client pixels into field units here.
// Clicks are queued with their position and taken once by the loop, so a
// click between two frames is never lost and never counted twice.

import { FIELD } from './config.js';

export const ACTION_CONFIRM = 1;
export const ACTION_HINT = 2;
export const ACTION_PAUSE = 4;
export const ACTION_MUTE = 8;
export const ACTION_MAGNIFY = 16;

const CONFIRM = new Set(['Space', 'Enter']);
const HINT = new Set(['KeyH']);
const PAUSE = new Set(['KeyP', 'Escape']);
const MUTE = new Set(['KeyM']);
const MAGNIFY = new Set(['KeyL']);
const ARROWS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']);

export function createInput(canvas) {
  let mouseX = FIELD.width / 2;
  let mouseY = FIELD.height / 2;
  let mouseIn = false;
  let clicks = [];
  let actions = 0;
  const held = new Set();

  function toField(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (FIELD.width / rect.width),
      y: (event.clientY - rect.top) * (FIELD.height / rect.height),
    };
  }

  window.addEventListener('keydown', (event) => {
    if (ARROWS.has(event.code)) {
      held.add(event.code);
      event.preventDefault();
    } else if (CONFIRM.has(event.code)) {
      if (!event.repeat) actions |= ACTION_CONFIRM;
      event.preventDefault();
    } else if (HINT.has(event.code)) {
      if (!event.repeat) actions |= ACTION_HINT;
    } else if (PAUSE.has(event.code)) {
      if (!event.repeat) actions |= ACTION_PAUSE;
    } else if (MUTE.has(event.code)) {
      if (!event.repeat) actions |= ACTION_MUTE;
    } else if (MAGNIFY.has(event.code)) {
      if (!event.repeat) actions |= ACTION_MAGNIFY;
    } else {
      return;
    }
  });
  window.addEventListener('keyup', (event) => {
    held.delete(event.code);
  });
  // A key released while the tab is hidden never sends keyup: let go on blur.
  window.addEventListener('blur', () => held.clear());

  canvas.addEventListener('pointermove', (event) => {
    const p = toField(event);
    mouseX = p.x;
    mouseY = p.y;
    mouseIn = true;
  });
  canvas.addEventListener('pointerdown', (event) => {
    const p = toField(event);
    mouseX = p.x;
    mouseY = p.y;
    mouseIn = true;
    clicks.push({ x: p.x, y: p.y });
  });
  canvas.addEventListener('pointerleave', () => {
    mouseIn = false;
  });

  return {
    mouse() {
      return { x: mouseX, y: mouseY, inside: mouseIn };
    },
    /** -1/0/1 per axis from the held arrow keys. */
    direction() {
      const dx = (held.has('ArrowRight') ? 1 : 0) - (held.has('ArrowLeft') ? 1 : 0);
      const dy = (held.has('ArrowDown') ? 1 : 0) - (held.has('ArrowUp') ? 1 : 0);
      return { dx, dy };
    },
    /** True when any arrow key is held (keyboard cursor is active). */
    arrowsHeld() {
      return held.size > 0;
    },
    takeClicks() {
      const taken = clicks;
      clicks = [];
      return taken;
    },
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
  };
}
