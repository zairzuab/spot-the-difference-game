// Paints the whole game on the main canvas: header, the two picture panels
// with their markers, footer, and the title / level / win / paused screens.
// Button rectangles are kept in `buttons` so the loop can hit-test clicks.

import { FIELD, LAYOUT, SCENE, PALETTE, FONT, FONT_DISPLAY, LENS_RADIUS, MAGNIFY, DIFFS_PER_SCENE, WRONG_SECONDS } from './config.js';
import { SCENES, paintScene } from './scenes.js';
import { SCREEN_TITLE, SCREEN_PLAY, SCREEN_LEVEL, SCREEN_WIN } from './world.js';

function fmtTime(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

function button(ctx, rect, label, opts = {}) {
  const { fill = PALETTE.button, text = PALETTE.buttonText, font = `700 15px ${FONT}` } = opts;
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.roundRect(rect.x, rect.y, rect.w, rect.h, 9);
  ctx.fill();
  ctx.strokeStyle = PALETTE.buttonLine;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = text;
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, rect.x + rect.w / 2, rect.y + rect.h / 2 + 1);
}

function pill(ctx, x, y, w, h, label, value, accent) {
  ctx.fillStyle = 'rgba(255,255,255,0.07)';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 9);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.16)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = PALETTE.muted;
  ctx.font = `600 11px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(label, x + 10, y + 15);
  ctx.fillStyle = accent || PALETTE.text;
  ctx.font = `700 19px ${FONT}`;
  ctx.fillText(value, x + 10, y + 34);
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  const buttons = {};
  // Title-screen thumbnails, painted once.
  const thumbs = SCENES.map((scene) => {
    const c = document.createElement('canvas');
    c.width = SCENE.w;
    c.height = SCENE.h;
    return c;
  });
  let thumbsPainted = false;

  function paintThumbs() {
    if (thumbsPainted) return;
    thumbsPainted = true;
    SCENES.forEach((scene, i) => paintScene(scene, 0, thumbs[i]));
  }

  function drawHeader(state, scene) {
    ctx.fillStyle = PALETTE.header;
    ctx.fillRect(0, 0, FIELD.width, LAYOUT.header.h);
    ctx.fillStyle = PALETTE.headerLine;
    ctx.fillRect(0, LAYOUT.header.h - 2, FIELD.width, 2);

    ctx.fillStyle = PALETTE.gold;
    ctx.font = `700 26px ${FONT_DISPLAY}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('SPOT THE DIFFERENCE', 20, 32);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `600 12px ${FONT}`;
    ctx.fillText('three scenic hunts', 20, 52);

    // Scene name + level dots, centred.
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.text;
    ctx.font = `700 17px ${FONT}`;
    ctx.fillText(scene.name, 640, 24);
    for (let i = 0; i < SCENES.length; i += 1) {
      ctx.fillStyle = i === state.level ? PALETTE.gold : i < state.level ? PALETTE.green : 'rgba(255,255,255,0.25)';
      ctx.beginPath();
      ctx.arc(604 + i * 22, 46, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Counter, timer, score pills.
    pill(ctx, 830, 12, 96, 40, 'FOUND', `${state.found.size} / ${DIFFS_PER_SCENE}`, PALETTE.gold);
    pill(ctx, 934, 12, 86, 40, 'TIME', fmtTime(state.timer));
    pill(ctx, 1028, 12, 92, 40, 'SCORE', String(state.score), PALETTE.gold);

    // Header buttons.
    buttons.hint = { x: 1130, y: 14, w: 62, h: 36 };
    button(ctx, buttons.hint, `💡 ${state.hintsLeft}`, { font: `700 15px ${FONT}` });
    buttons.magnifier = { x: 1198, y: 14, w: 36, h: 36 };
    button(ctx, buttons.magnifier, '🔍', { fill: state.magnifier ? PALETTE.teal : PALETTE.button, text: state.magnifier ? '#062a2c' : PALETTE.buttonText });
  }

  function drawMarker(panel, d, pulse) {
    const r = d.r * (1 + 0.12 * pulse);
    ctx.strokeStyle = PALETTE.gold;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(panel.x + d.x, panel.y + d.y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(20,12,4,0.85)';
    ctx.lineWidth = 6.5;
    ctx.beginPath();
    ctx.arc(panel.x + d.x, panel.y + d.y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = PALETTE.gold;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(panel.x + d.x, panel.y + d.y, r, 0, Math.PI * 2);
    ctx.stroke();
    // A small check in the middle.
    ctx.strokeStyle = PALETTE.gold;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(panel.x + d.x - 8, panel.y + d.y);
    ctx.lineTo(panel.x + d.x - 2, panel.y + d.y + 6);
    ctx.lineTo(panel.x + d.x + 9, panel.y + d.y - 6);
    ctx.stroke();
  }

  function drawPanels(state, scene, mouse) {
    const { left, right } = LAYOUT;
    for (const panel of [left, right]) {
      ctx.fillStyle = PALETTE.panel;
      ctx.fillRect(panel.x - 4, panel.y - 4, panel.w + 8, panel.h + 8);
      ctx.strokeStyle = PALETTE.panelLine;
      ctx.lineWidth = 2;
      ctx.strokeRect(panel.x - 4, panel.y - 4, panel.w + 8, panel.h + 8);
    }
    if (state.leftCanvas) ctx.drawImage(state.leftCanvas, left.x, left.y);
    if (state.rightCanvas) ctx.drawImage(state.rightCanvas, right.x, right.y);

    // Labels on the pictures.
    ctx.fillStyle = 'rgba(10,8,20,0.72)';
    ctx.beginPath();
    ctx.roundRect(left.x + 10, left.y + 10, 96, 26, 7);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(right.x + 10, right.y + 10, 96, 26, 7);
    ctx.fill();
    ctx.fillStyle = PALETTE.text;
    ctx.font = `700 13px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ORIGINAL', left.x + 58, left.y + 24);
    ctx.fillText('SPOT IT!', right.x + 58, right.y + 24);

    // Divider with a badge.
    ctx.strokeStyle = PALETTE.goldDim;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(640, 76);
    ctx.lineTo(640, 716);
    ctx.stroke();
    ctx.fillStyle = PALETTE.gold;
    ctx.beginPath();
    ctx.arc(640, 396, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.buttonText;
    ctx.font = `700 13px ${FONT}`;
    ctx.fillText('7', 640, 397);

    // Found markers on both pictures.
    for (const d of scene.diffs) {
      if (!state.found.has(d.id)) continue;
      const pulse = state.lastFound === d ? Math.max(0, state.flash) : 0;
      drawMarker(left, d, pulse);
      drawMarker(right, d, pulse);
    }

    // Hint ring, pulsing, on both pictures.
    if (state.hintDiff) {
      const d = state.hintDiff;
      const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 130);
      ctx.strokeStyle = `rgba(79,195,199,${0.55 + 0.45 * pulse})`;
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 6]);
      for (const panel of [left, right]) {
        ctx.beginPath();
        ctx.arc(panel.x + d.x, panel.y + d.y, d.r + 6 + 4 * pulse, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }

    // Wrong-click X marks (only on the panel that was clicked).
    for (const w of state.wrongs) {
      const panel = w.panel === 0 ? left : right;
      const x = panel.x + w.x;
      const y = panel.y + w.y;
      const a = Math.min(1, w.t / WRONG_SECONDS);
      ctx.strokeStyle = `rgba(229,83,75,${a})`;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x - 10, y - 10);
      ctx.lineTo(x + 10, y + 10);
      ctx.moveTo(x + 10, y - 10);
      ctx.lineTo(x - 10, y + 10);
      ctx.stroke();
    }

    // Keyboard cursor.
    if (state.cursor.visible && state.screen === SCREEN_PLAY) {
      const panel = state.cursor.panel === 0 ? left : right;
      const x = panel.x + state.cursor.x;
      const y = panel.y + state.cursor.y;
      ctx.strokeStyle = PALETTE.gold;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(x, y, 16, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - 24, y);
      ctx.lineTo(x - 10, y);
      ctx.moveTo(x + 10, y);
      ctx.lineTo(x + 24, y);
      ctx.moveTo(x, y - 24);
      ctx.lineTo(x, y - 10);
      ctx.moveTo(x, y + 10);
      ctx.lineTo(x, y + 24);
      ctx.stroke();
    }

    // Magnifier lens, following the mouse (or the keyboard cursor).
    if (state.magnifier && state.screen === SCREEN_PLAY && mouse.inside) {
      const panel = mouse.x < 640 ? left : right;
      const canvas = mouse.x < 640 ? state.leftCanvas : state.rightCanvas;
      if (canvas) {
        const sx = mouse.x - panel.x;
        const sy = mouse.y - panel.y;
        if (sx >= 0 && sx < SCENE.w && sy >= 0 && sy < SCENE.h) {
          const sw = (LENS_RADIUS * 2) / MAGNIFY;
          ctx.save();
          ctx.beginPath();
          ctx.arc(mouse.x, mouse.y, LENS_RADIUS, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(canvas, sx - sw / 2, sy - sw / 2, sw, sw, mouse.x - LENS_RADIUS, mouse.y - LENS_RADIUS, LENS_RADIUS * 2, LENS_RADIUS * 2);
          ctx.restore();
          ctx.strokeStyle = PALETTE.gold;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(mouse.x, mouse.y, LENS_RADIUS, 0, Math.PI * 2);
          ctx.stroke();
          ctx.strokeStyle = 'rgba(242,201,76,0.7)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(mouse.x - LENS_RADIUS, mouse.y);
          ctx.lineTo(mouse.x + LENS_RADIUS, mouse.y);
          ctx.moveTo(mouse.x, mouse.y - LENS_RADIUS);
          ctx.lineTo(mouse.x, mouse.y + LENS_RADIUS);
          ctx.stroke();
        }
      }
    }
  }

  function drawFooter(state) {
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `600 13px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('Click a difference  •  Arrows move the cursor, Enter marks  •  H hint  •  L magnifier  •  P pause  •  M mute', 20, 758);
    ctx.textAlign = 'right';
    ctx.fillText(`Best ${state.best}`, 1260, 758);
    buttons.mute = { x: 1180, y: 740, w: 80, h: 36 };
    button(ctx, buttons.mute, state.muted ? '🔇 Muted' : '♪ Sound', { font: `700 14px ${FONT}` });
  }

  function drawTitle(state, best) {
    paintThumbs();
    const g = ctx.createLinearGradient(0, 0, 0, FIELD.height);
    g.addColorStop(0, '#1c1440');
    g.addColorStop(0.55, '#2c1850');
    g.addColorStop(1, '#14101f');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);

    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.gold;
    ctx.font = `700 64px ${FONT_DISPLAY}`;
    ctx.fillText('SPOT THE DIFFERENCE', 640, 108);
    ctx.fillStyle = PALETTE.text;
    ctx.font = `400 21px ${FONT}`;
    ctx.fillText('Three scenic hunts — find all 7 differences in each picture', 640, 152);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `400 15px ${FONT}`;
    ctx.fillText('Two pictures side by side. One hides 7 changes. How sharp are your eyes?', 640, 182);

    // Three scene cards with live thumbnails.
    const cardW = 300;
    const cardH = 330;
    const gap = 30;
    const total = cardW * 3 + gap * 2;
    const x0 = (FIELD.width - total) / 2;
    SCENES.forEach((scene, i) => {
      const x = x0 + i * (cardW + gap);
      const y = 220;
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.beginPath();
      ctx.roundRect(x, y, cardW, cardH, 14);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.16)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      if (thumbs[i].width > 0) {
        ctx.drawImage(thumbs[i], x + 10, y + 10, cardW - 20, 240);
      }
      ctx.fillStyle = PALETTE.text;
      ctx.font = `700 19px ${FONT}`;
      ctx.fillText(scene.name, x + cardW / 2, y + 282);
      ctx.fillStyle = PALETTE.muted;
      ctx.font = `400 14px ${FONT}`;
      ctx.fillText('7 differences  •  3 hints', x + cardW / 2, y + 308);
    });

    buttons.play = { x: 540, y: 596, w: 200, h: 56 };
    button(ctx, buttons.play, '▶  PLAY', { font: `700 22px ${FONT}` });
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `400 14px ${FONT}`;
    ctx.fillText('Mouse or keyboard — click a difference, or move the cursor with the arrows and press Enter', 640, 676);
    if (best > 0) {
      ctx.fillStyle = PALETTE.gold;
      ctx.font = `700 15px ${FONT}`;
      ctx.fillText(`Best score ${best}`, 640, 706);
    }
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `400 12px ${FONT}`;
    ctx.fillText('Original art, painted in code — no photos, no downloads', 640, 742);
  }

  function drawLevel(state, scene) {
    drawHeader(state, scene);
    drawPanels(state, scene, { inside: false, x: 0, y: 0 });
    // Dim the play field behind the panel.
    ctx.fillStyle = 'rgba(10,8,20,0.72)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.fillStyle = '#241d3a';
    ctx.beginPath();
    ctx.roundRect(390, 220, 500, 340, 18);
    ctx.fill();
    ctx.strokeStyle = PALETTE.gold;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.gold;
    ctx.font = `700 38px ${FONT_DISPLAY}`;
    ctx.fillText('Scene complete!', 640, 282);
    ctx.fillStyle = PALETTE.text;
    ctx.font = `400 18px ${FONT}`;
    ctx.fillText(`${scene.name} — all 7 differences found`, 640, 322);
    ctx.font = `700 20px ${FONT}`;
    ctx.fillText(`Time ${fmtTime(state.timer)}   •   Time bonus +${state.levelBonus}`, 640, 366);
    ctx.fillText(`Score ${state.score}`, 640, 402);
    buttons.next = { x: 530, y: 440, w: 220, h: 52 };
    const last = state.level + 1 >= SCENES.length;
    button(ctx, buttons.next, last ? 'See results  ▶' : 'Next scene  ▶', { font: `700 19px ${FONT}` });
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `400 13px ${FONT}`;
    ctx.fillText('or press Enter', 640, 522);
  }

  function drawWin(state) {
    const g = ctx.createLinearGradient(0, 0, 0, FIELD.height);
    g.addColorStop(0, '#1c1440');
    g.addColorStop(1, '#14101f');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.gold;
    ctx.font = `700 56px ${FONT_DISPLAY}`;
    ctx.fillText('You found them all!', 640, 180);
    ctx.fillStyle = PALETTE.text;
    ctx.font = `400 20px ${FONT}`;
    ctx.fillText('21 differences across three scenes — sharp eyes indeed.', 640, 226);
    ctx.font = `700 26px ${FONT}`;
    ctx.fillStyle = PALETTE.gold;
    ctx.fillText(`Final score  ${state.score}`, 640, 320);
    ctx.fillStyle = PALETTE.text;
    ctx.font = `400 19px ${FONT}`;
    ctx.fillText(`Total time  ${fmtTime(state.totalTime)}      Best  ${state.best}`, 640, 362);
    buttons.again = { x: 530, y: 420, w: 220, h: 56 };
    button(ctx, buttons.again, '↻  Play again', { font: `700 20px ${FONT}` });
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `400 14px ${FONT}`;
    ctx.fillText('or press Enter', 640, 506);
  }

  function drawPaused() {
    ctx.fillStyle = 'rgba(10,8,20,0.66)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.text;
    ctx.font = `700 44px ${FONT_DISPLAY}`;
    ctx.fillText('Paused', 640, 380);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `400 17px ${FONT}`;
    ctx.fillText('Press P or click to resume', 640, 424);
  }

  function draw(state, best, mouse) {
    // Clear the button map each frame; the screens repopulate it.
    for (const k of Object.keys(buttons)) delete buttons[k];
    ctx.clearRect(0, 0, FIELD.width, FIELD.height);
    ctx.fillStyle = PALETTE.backdrop;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    const scene = SCENES[state.level];
    if (state.screen === SCREEN_TITLE) {
      drawTitle(state, best);
    } else if (state.screen === SCREEN_WIN) {
      drawWin(state);
    } else if (state.screen === SCREEN_LEVEL) {
      drawLevel(state, scene);
    } else {
      drawHeader(state, scene);
      drawPanels(state, scene, mouse);
      drawFooter(state);
      if (state.paused) drawPaused();
      if (state.toast) {
        ctx.fillStyle = 'rgba(10,8,20,0.85)';
        const w = ctx.measureText(state.toast).width + 36;
        ctx.beginPath();
        ctx.roundRect(640 - w / 2, 690, w, 30, 8);
        ctx.fill();
        ctx.fillStyle = PALETTE.red;
        ctx.font = `600 14px ${FONT}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(state.toast, 640, 706);
      }
    }
  }

  return { draw, buttons };
}
