// Three original scenes, painted procedurally on offscreen canvases: no image
// files, no network, and the two sides of a scene are identical except for
// the seven differences. A scene painter takes `mods`, the set of difference
// ids to apply: the left picture paints with no mods, the right picture with
// all seven. Every random value is generated up front, before any drawing, so
// a skipped element can never shift the random stream between the two sides.

import { createRandom, range } from './random.js';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function glow(ctx, x, y, r, color, alpha) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalAlpha = alpha;
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function sparkle(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y);
  ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.fill();
}

function lantern(ctx, x, y, s, color, lit) {
  // A paper lantern: ribbed ellipse, caps, tassel, warm glow when lit.
  if (lit) glow(ctx, x, y, s * 1.9, '#ffb347', 0.5);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, s * 0.72, s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(120,20,20,0.45)';
  ctx.lineWidth = 1.5;
  for (let i = -2; i <= 2; i += 1) {
    ctx.beginPath();
    ctx.ellipse(x, y, s * 0.72 * Math.abs(Math.cos((i * Math.PI) / 6)), s, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = '#c9973f';
  ctx.fillRect(x - s * 0.28, y - s - 4, s * 0.56, 6);
  ctx.fillRect(x - s * 0.28, y + s - 2, s * 0.56, 6);
  ctx.strokeStyle = '#d23b2e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y + s + 4);
  ctx.lineTo(x, y + s + 16);
  ctx.stroke();
}

function fish(ctx, x, y, s, color, flip) {
  // A simple tropical fish: body, tail, fin, eye. flip mirrors it.
  ctx.save();
  ctx.translate(x, y);
  if (flip) ctx.scale(-1, 1);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(0, 0, s, s * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-s * 0.85, 0);
  ctx.lineTo(-s * 1.45, -s * 0.5);
  ctx.lineTo(-s * 1.45, s * 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.beginPath();
  ctx.ellipse(s * 0.1, -s * 0.5, s * 0.22, s * 0.32, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#12202e';
  ctx.beginPath();
  ctx.arc(s * 0.55, -s * 0.08, s * 0.09, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(s * 0.58, -s * 0.11, s * 0.035, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function coralBranch(ctx, x, y, len, ang, color, depth) {
  if (depth === 0 || len < 6) return;
  const x2 = x + Math.cos(ang) * len;
  const y2 = y + Math.sin(ang) * len;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, depth * 2.2);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  coralBranch(ctx, x2, y2, len * 0.72, ang - 0.5, color, depth - 1);
  coralBranch(ctx, x2, y2, len * 0.72, ang + 0.45, color, depth - 1);
  coralBranch(ctx, x2, y2, len * 0.6, ang - 0.1, color, depth - 1);
}

// ---------------------------------------------------------------------------
// Scene 1 — Lantern Night Market
// ---------------------------------------------------------------------------

function drawMarket(ctx, W, H, mods, rnd) {
  // Random scatter, generated up front so both sides agree.
  const stars = [];
  for (let i = 0; i < 90; i += 1) stars.push({ x: range(rnd, 8, W - 8), y: range(rnd, 8, 250), r: range(rnd, 0.7, 2.1), a: range(rnd, 0.35, 0.95) });
  const cobbles = [];
  for (let i = 0; i < 46; i += 1) cobbles.push({ x: range(rnd, 10, W - 10), y: range(rnd, 505, H - 14), w: range(rnd, 26, 52), h: range(rnd, 10, 18) });
  const bulbColors = ['#ffd76a', '#ff9db1', '#7fe3d0', '#ffb347'];

  // Sky.
  const sky = ctx.createLinearGradient(0, 0, 0, H * 0.62);
  sky.addColorStop(0, '#141033');
  sky.addColorStop(0.55, '#2c1850');
  sky.addColorStop(1, '#5a2a52');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H * 0.62);

  // Stars (one bright sparkle is a difference).
  for (const s of stars) {
    ctx.globalAlpha = s.a;
    ctx.fillStyle = '#fff8e0';
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  if (!mods.has('star')) sparkle(ctx, 92, 92, 9, '#fff3c4');

  // Moon: crescent on the left, full on the right.
  glow(ctx, 520, 62, 70, '#ffeec2', 0.55);
  ctx.fillStyle = '#ffedbb';
  ctx.beginPath();
  ctx.arc(520, 62, 30, 0, Math.PI * 2);
  ctx.fill();
  if (!mods.has('moon')) {
    ctx.fillStyle = '#2c1850';
    ctx.beginPath();
    ctx.arc(508, 54, 26, 0, Math.PI * 2);
    ctx.fill();
  }

  // Distant rooftops with lit windows.
  ctx.fillStyle = '#1b1238';
  ctx.beginPath();
  ctx.moveTo(0, 330);
  ctx.lineTo(0, 300); ctx.lineTo(70, 300); ctx.lineTo(90, 282); ctx.lineTo(130, 282); ctx.lineTo(150, 300);
  ctx.lineTo(230, 300); ctx.lineTo(250, 316); ctx.lineTo(330, 316); ctx.lineTo(350, 296); ctx.lineTo(400, 296);
  ctx.lineTo(420, 312); ctx.lineTo(500, 312); ctx.lineTo(520, 292); ctx.lineTo(570, 292); ctx.lineTo(600, 306);
  ctx.lineTo(600, 330); ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffd76a';
  const winXs = [36, 108, 190, 268, 372, 452, 540];
  for (const x of winXs) ctx.fillRect(x, 308, 7, 9);

  // String lights across the top.
  for (let row = 0; row < 2; row += 1) {
    const y0 = 30 + row * 34;
    ctx.strokeStyle = 'rgba(20,12,40,0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, y0);
    ctx.quadraticCurveTo(W / 2, y0 + 26, W, y0 - 6);
    ctx.stroke();
    for (let i = 0; i <= 12; i += 1) {
      const t = i / 12;
      const x = t * W;
      const y = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * (y0 + 26) + t * t * (y0 - 6);
      const c = bulbColors[(i + row * 3) % bulbColors.length];
      glow(ctx, x, y + 8, 9, c, 0.7);
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(x, y + 8, 3.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Cobblestone path.
  ctx.fillStyle = '#8d7d6b';
  ctx.fillRect(0, 490, W, H - 490);
  ctx.fillStyle = '#7a6a58';
  for (const c of cobbles) {
    ctx.beginPath();
    ctx.ellipse(c.x, c.y, c.w / 2, c.h / 2, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = 'rgba(60,45,35,0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 490);
  ctx.lineTo(W, 490);
  ctx.stroke();

  // Stall A — fruit stand (left). Awning red/white, sign with gold dots.
  ctx.fillStyle = '#6b3f22';
  ctx.fillRect(48, 420, 170, 70);
  ctx.fillStyle = '#8a5a33';
  ctx.fillRect(48, 420, 170, 10);
  for (let i = 0; i < 7; i += 1) {
    const ax = 48 + i * 25;
    ctx.fillStyle = i % 2 === 0 ? '#d23b2e' : '#f5efe0';
    ctx.beginPath();
    ctx.moveTo(ax, 352);
    ctx.lineTo(ax + 25, 352);
    ctx.lineTo(ax + 19, 382);
    ctx.lineTo(ax + 6, 382);
    ctx.closePath();
    ctx.fill();
  }
  // Fruit piles.
  const fruits = [
    { x: 80, y: 408, c: '#ff7a2e' }, { x: 104, y: 408, c: '#ff7a2e' }, { x: 92, y: 392, c: '#ff9a3e' },
    { x: 140, y: 408, c: '#d23b2e' }, { x: 164, y: 408, c: '#d23b2e' }, { x: 152, y: 392, c: '#e5534b' },
    { x: 190, y: 408, c: '#ffd23e' }, { x: 206, y: 408, c: '#ffd23e' },
  ];
  for (const f of fruits) {
    ctx.fillStyle = f.c;
    ctx.beginPath();
    ctx.arc(f.x, f.y, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.arc(f.x - 3, f.y - 4, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  // The extra orange is a difference.
  if (mods.has('fruit')) {
    ctx.fillStyle = '#ff7a2e';
    ctx.beginPath();
    ctx.arc(120, 432, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.arc(117, 428, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  // Sign board: three gold dots on the left, two on the right.
  ctx.fillStyle = '#3a2417';
  rr(ctx, 96, 288, 68, 26, 5);
  ctx.fill();
  ctx.fillStyle = '#f2c94c';
  const dots = mods.has('sign') ? [112, 130] : [108, 126, 144];
  for (const x of dots) {
    ctx.beginPath();
    ctx.arc(x, 301, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Stall B — lantern stall (centre). Awning changes colour on the right.
  const awn = mods.has('awning') ? '#2f8f8a' : '#d23b2e';
  for (let i = 0; i < 7; i += 1) {
    const ax = 232 + i * 25;
    ctx.fillStyle = i % 2 === 0 ? awn : '#f5efe0';
    ctx.beginPath();
    ctx.moveTo(ax, 352);
    ctx.lineTo(ax + 25, 352);
    ctx.lineTo(ax + 19, 382);
    ctx.lineTo(ax + 6, 382);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = '#5a3a24';
  ctx.fillRect(240, 420, 150, 70);
  ctx.fillStyle = '#7a5230';
  ctx.fillRect(240, 420, 150, 10);
  // Lanterns on the stall frame.
  lantern(ctx, 262, 400, 15, '#d23b2e', true);
  lantern(ctx, 315, 402, 18, '#f2a541', true);
  lantern(ctx, 366, 400, 15, '#d23b2e', true);
  // Hanging lantern row across the scene; the middle one changes colour.
  lantern(ctx, 120, 168, 17, '#d23b2e', true);
  lantern(ctx, 210, 160, 15, '#f2a541', true);
  lantern(ctx, 300, 168, 17, mods.has('lantern-color') ? '#2f8f8a' : '#d23b2e', true);
  lantern(ctx, 390, 160, 15, '#f2a541', true);
  lantern(ctx, 480, 168, 17, '#d23b2e', true);

  // Stall C — fabric stall (right). Orange/white awning, folded fabrics, a crate.
  for (let i = 0; i < 7; i += 1) {
    const ax = 424 + i * 25;
    ctx.fillStyle = i % 2 === 0 ? '#e87a2e' : '#f5efe0';
    ctx.beginPath();
    ctx.moveTo(ax, 352);
    ctx.lineTo(ax + 25, 352);
    ctx.lineTo(ax + 19, 382);
    ctx.lineTo(ax + 6, 382);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = '#5a3a24';
  ctx.fillRect(432, 420, 150, 70);
  ctx.fillStyle = '#7a5230';
  ctx.fillRect(432, 420, 150, 10);
  const fabrics = ['#c94f7c', '#4f8ac9', '#4fc98a', '#e8b23e', '#8a5fc9'];
  fabrics.forEach((c, i) => {
    ctx.fillStyle = c;
    rr(ctx, 446 + i * 26, 396 - (i % 2) * 8, 22, 26, 3);
    ctx.fill();
  });
  // Crate with a cat (the cat is a difference).
  ctx.fillStyle = '#8a6a42';
  ctx.fillRect(492, 452, 44, 38);
  ctx.strokeStyle = '#5a4226';
  ctx.lineWidth = 2;
  ctx.strokeRect(492, 452, 44, 38);
  ctx.beginPath();
  ctx.moveTo(492, 471);
  ctx.lineTo(536, 471);
  ctx.stroke();
  if (!mods.has('cat')) {
    // A small cat sitting on the crate, tail curled.
    ctx.fillStyle = '#2e2a33';
    ctx.beginPath();
    ctx.ellipse(514, 440, 13, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(514, 424, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(507, 419);
    ctx.lineTo(505, 410);
    ctx.lineTo(512, 416);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(521, 419);
    ctx.lineTo(523, 410);
    ctx.lineTo(518, 416);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#2e2a33';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(526, 446);
    ctx.quadraticCurveTo(540, 442, 538, 430);
    ctx.stroke();
    ctx.fillStyle = '#ffd76a';
    ctx.beginPath();
    ctx.arc(511, 423, 1.6, 0, Math.PI * 2);
    ctx.arc(517, 423, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }

  // Two shoppers, dark silhouettes with a warm rim.
  function shopper(x, y, s, coat) {
    ctx.fillStyle = coat;
    ctx.beginPath();
    ctx.arc(x, y - s * 1.5, s * 0.32, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x - s * 0.42, y);
    ctx.quadraticCurveTo(x - s * 0.5, y - s * 1.2, x, y - s * 1.2);
    ctx.quadraticCurveTo(x + s * 0.5, y - s * 1.2, x + s * 0.42, y);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ffd76a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y - s * 1.5, s * 0.32, -0.6, 0.9);
    ctx.stroke();
  }
  shopper(222, 500, 34, '#241d3a');
  shopper(400, 505, 30, '#3a1d2e');

  // Steam wisps from the food cart near stall A.
  ctx.strokeStyle = 'rgba(240,235,255,0.5)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 3; i += 1) {
    ctx.beginPath();
    ctx.moveTo(66 + i * 14, 420);
    ctx.bezierCurveTo(60 + i * 14, 400, 78 + i * 14, 392, 70 + i * 14, 372);
    ctx.stroke();
  }

  // Foreground: baskets of goods and a shopper crossing the path, so the
  // cobblestones are not an empty band at the bottom of the picture.
  function basket(x, y, s, goods) {
    ctx.fillStyle = '#8a6a42';
    ctx.beginPath();
    ctx.moveTo(x - s / 2, y);
    ctx.lineTo(x + s / 2, y);
    ctx.lineTo(x + s / 2 - 6, y + s * 0.55);
    ctx.lineTo(x - s / 2 + 6, y + s * 0.55);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#5a4226';
    ctx.lineWidth = 2;
    ctx.stroke();
    for (const g of goods) {
      ctx.fillStyle = g.c;
      ctx.beginPath();
      ctx.arc(x + g.dx, y + g.dy, g.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  basket(78, 566, 52, [
    { dx: -12, dy: -8, r: 9, c: '#ff7a2e' }, { dx: 2, dy: -10, r: 9, c: '#ff7a2e' },
    { dx: 14, dy: -6, r: 8, c: '#ffd23e' }, { dx: -4, dy: -18, r: 8, c: '#d23b2e' },
  ]);
  basket(528, 576, 52, [
    { dx: -12, dy: -8, r: 7, c: '#c94f7c' }, { dx: 2, dy: -10, r: 7, c: '#e87ab1' },
    { dx: 14, dy: -6, r: 7, c: '#f2a541' }, { dx: -4, dy: -18, r: 7, c: '#c94f7c' },
  ]);
  // Scattered petals on the path.
  ctx.fillStyle = 'rgba(255,150,180,0.8)';
  for (const p of [{ x: 200, y: 560 }, { x: 250, y: 600 }, { x: 330, y: 585 }, { x: 420, y: 610 }, { x: 160, y: 615 }]) {
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, 5, 3, 0.6, 0, Math.PI * 2);
    ctx.fill();
  }
  shopper(300, 596, 40, '#1d2e4a');
}

// ---------------------------------------------------------------------------
// Scene 2 — Coral Reef
// ---------------------------------------------------------------------------

function drawReef(ctx, W, H, mods, rnd) {
  const bubbles = [];
  for (let i = 0; i < 26; i += 1) bubbles.push({ x: range(rnd, 30, W - 30), y: range(rnd, 60, 500), r: range(rnd, 2, 6) });
  const speckles = [];
  for (let i = 0; i < 60; i += 1) speckles.push({ x: range(rnd, 10, W - 10), y: range(rnd, 530, H - 10), r: range(rnd, 1, 2.6) });
  const plankton = [];
  for (let i = 0; i < 40; i += 1) plankton.push({ x: range(rnd, 10, W - 10), y: range(rnd, 40, 500), r: range(rnd, 0.8, 1.8), a: range(rnd, 0.2, 0.6) });

  // Water.
  const water = ctx.createLinearGradient(0, 0, 0, H);
  water.addColorStop(0, '#0b3a66');
  water.addColorStop(0.55, '#12707f');
  water.addColorStop(1, '#2a9d8f');
  ctx.fillStyle = water;
  ctx.fillRect(0, 0, W, H);

  // Light rays from the surface.
  ctx.fillStyle = 'rgba(255,255,220,0.10)';
  for (let i = 0; i < 4; i += 1) {
    const x0 = 90 + i * 140;
    ctx.beginPath();
    ctx.moveTo(x0, 0);
    ctx.lineTo(x0 + 60, 0);
    ctx.lineTo(x0 + 190, 520);
    ctx.lineTo(x0 + 90, 520);
    ctx.closePath();
    ctx.fill();
  }

  // Plankton specks.
  for (const p of plankton) {
    ctx.globalAlpha = p.a;
    ctx.fillStyle = '#dff7f2';
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Sandy floor with ripples.
  ctx.fillStyle = '#e8d5a3';
  ctx.beginPath();
  ctx.moveTo(0, 540);
  ctx.quadraticCurveTo(150, 520, 300, 538);
  ctx.quadraticCurveTo(450, 556, 600, 534);
  ctx.lineTo(600, H);
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(160,130,80,0.5)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 5; i += 1) {
    ctx.beginPath();
    ctx.moveTo(20 + i * 30, 556 + i * 14);
    ctx.quadraticCurveTo(200 + i * 40, 548 + i * 14, 420 + i * 30, 560 + i * 14);
    ctx.stroke();
  }
  for (const s of speckles) {
    ctx.fillStyle = '#b89a68';
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Rocks.
  ctx.fillStyle = '#6b7a86';
  ctx.beginPath();
  ctx.ellipse(60, 545, 52, 26, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#5a6874';
  ctx.beginPath();
  ctx.ellipse(540, 552, 64, 30, 0, 0, Math.PI * 2);
  ctx.fill();

  // Seaweed fronds.
  function frond(x, h, lean, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, 560);
    ctx.bezierCurveTo(x + lean, 500, x - lean, 460, x + lean * 0.6, 560 - h);
    ctx.stroke();
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(x + 14, 560);
    ctx.bezierCurveTo(x + 14 + lean, 510, x + 14 - lean, 480, x + 14 + lean * 0.5, 560 - h * 0.8);
    ctx.stroke();
  }
  frond(240, 150, 26, '#2e8a5a');
  frond(420, 120, -20, '#3aa56e');
  frond(80, 110, 18, '#2e8a5a');
  frond(520, 90, -16, '#3aa56e');

  // Corals. The pink one changes colour on the right.
  ctx.save();
  ctx.translate(180, 470);
  coralBranch(ctx, 0, 0, 34, -Math.PI / 2, mods.has('coral-color') ? '#8a5fc9' : '#ff7a9e', 4);
  ctx.restore();
  ctx.save();
  ctx.translate(450, 480);
  coralBranch(ctx, 0, 0, 30, -Math.PI / 2, '#ff9a3e', 4);
  ctx.restore();
  ctx.save();
  ctx.translate(320, 500);
  coralBranch(ctx, 0, 0, 22, -Math.PI / 2, '#c95f8a', 3);
  ctx.restore();

  // Anemone with a clownfish.
  ctx.strokeStyle = '#ff8ab1';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  for (let i = 0; i < 9; i += 1) {
    const a = -Math.PI / 2 + (i - 4) * 0.22;
    ctx.beginPath();
    ctx.moveTo(545, 520);
    ctx.quadraticCurveTo(545 + Math.cos(a) * 22, 520 + Math.sin(a) * 22, 545 + Math.cos(a) * 34, 520 + Math.sin(a) * 34);
    ctx.stroke();
  }
  fish(ctx, 520, 470, 13, '#ff7a2e', false);

  // Turtle (absent on the right).
  if (!mods.has('turtle')) {
    ctx.fillStyle = '#3e7a4e';
    ctx.beginPath();
    ctx.ellipse(120, 120, 46, 30, -0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2a5a38';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(120, 120, 30, 18, -0.15, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(100, 108);
    ctx.lineTo(140, 132);
    ctx.moveTo(140, 108);
    ctx.lineTo(100, 132);
    ctx.stroke();
    ctx.fillStyle = '#3e7a4e';
    ctx.beginPath();
    ctx.arc(172, 112, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#12202e';
    ctx.beginPath();
    ctx.arc(176, 109, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#3e7a4e';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(90, 132);
    ctx.lineTo(70, 150);
    ctx.moveTo(150, 136);
    ctx.lineTo(168, 152);
    ctx.moveTo(88, 106);
    ctx.lineTo(68, 92);
    ctx.moveTo(148, 102);
    ctx.lineTo(164, 86);
    ctx.stroke();
  }

  // Fish. The blue one changes colour; one flips direction.
  fish(ctx, 250, 300, 26, '#ff9a3e', mods.has('fish-flip'));
  fish(ctx, 420, 180, 24, mods.has('fish-color') ? '#ff7a2e' : '#4f9ad9', false);
  fish(ctx, 150, 220, 20, '#ffd23e', true);
  fish(ctx, 480, 300, 18, '#ff7a9e', true);
  fish(ctx, 350, 130, 15, '#c95f8a', false);
  fish(ctx, 90, 380, 16, '#5ec98a', false);

  // Bubbles: two trails always, a third only on the right.
  function bubbleTrail(x, y0) {
    for (let i = 0; i < 6; i += 1) {
      const bx = x + Math.sin(i * 1.3) * 7;
      const by = y0 - i * 22;
      ctx.strokeStyle = 'rgba(255,255,255,0.75)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(bx, by, 7 - i * 0.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath();
      ctx.arc(bx - 2, by - 2, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  bubbleTrail(180, 300);
  bubbleTrail(500, 360);
  if (mods.has('bubbles')) bubbleTrail(350, 260);

  // Ambient bubbles.
  for (const b of bubbles) {
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Starfish: one is a difference.
  function starfish(x, y, s, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < 5; i += 1) {
      const a = -Math.PI / 2 + (i * Math.PI * 2) / 5;
      const a2 = a + Math.PI / 5;
      ctx.lineTo(x + Math.cos(a) * s, y + Math.sin(a) * s);
      ctx.lineTo(x + Math.cos(a2) * s * 0.45, y + Math.sin(a2) * s * 0.45);
    }
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    ctx.arc(x, y, s * 0.2, 0, Math.PI * 2);
    ctx.fill();
  }
  starfish(200, 566, 16, '#ff8a5e');
  if (!mods.has('starfish')) starfish(480, 520, 16, '#ff8a5e');

  // A shell on the sand (absent on the right).
  if (!mods.has('shell')) {
    ctx.fillStyle = '#f2e3c9';
    ctx.beginPath();
    ctx.arc(90, 540, 14, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#c9a87a';
    ctx.lineWidth = 1.5;
    for (let i = -2; i <= 2; i += 1) {
      ctx.beginPath();
      ctx.moveTo(90, 540);
      ctx.lineTo(90 + i * 6, 526);
      ctx.stroke();
    }
  }
}

// ---------------------------------------------------------------------------
// Scene 3 — Sunset Harbour
// ---------------------------------------------------------------------------

function drawHarbour(ctx, W, H, mods, rnd) {
  const gulls = [{ x: 200, y: 80 }, { x: 420, y: 90 }];
  const clouds = [];
  for (let i = 0; i < 6; i += 1) clouds.push({ x: range(rnd, 40, W - 60), y: range(rnd, 50, 240), w: range(rnd, 60, 130), h: range(rnd, 14, 26) });
  const shimmer = [];
  for (let i = 0; i < 40; i += 1) shimmer.push({ x: range(rnd, 20, W - 20), y: range(rnd, 400, 620), w: range(rnd, 14, 46) });

  // Sunset sky.
  const sky = ctx.createLinearGradient(0, 0, 0, 390);
  sky.addColorStop(0, '#ff8a3c');
  sky.addColorStop(0.55, '#ff9e7a');
  sky.addColorStop(1, '#ffd27a');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, 390);

  // Sun with glow, low over the sea.
  glow(ctx, 300, 360, 120, '#ffdf8a', 0.8);
  ctx.fillStyle = '#fff0b8';
  ctx.beginPath();
  ctx.arc(300, 360, 46, 0, Math.PI * 2);
  ctx.fill();

  // Clouds.
  for (const c of clouds) {
    ctx.fillStyle = 'rgba(255,190,170,0.75)';
    ctx.beginPath();
    ctx.ellipse(c.x, c.y, c.w / 2, c.h / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,220,200,0.6)';
    ctx.beginPath();
    ctx.ellipse(c.x - c.w * 0.2, c.y - 6, c.w / 3, c.h / 2.4, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Gulls. One is a difference.
  function gull(x, y, s) {
    ctx.strokeStyle = '#3a2a3e';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - s, y);
    ctx.quadraticCurveTo(x - s * 0.4, y - s * 0.7, x, y);
    ctx.quadraticCurveTo(x + s * 0.4, y - s * 0.7, x + s, y);
    ctx.stroke();
  }
  gull(200, 80, 13);
  gull(420, 90, 11);
  if (!mods.has('gull')) gull(300, 100, 12);

  // Distant town silhouette on the horizon.
  ctx.fillStyle = '#6e3a52';
  ctx.beginPath();
  ctx.moveTo(420, 390);
  ctx.lineTo(420, 356); ctx.lineTo(448, 356); ctx.lineTo(448, 340); ctx.lineTo(462, 340); ctx.lineTo(462, 356);
  ctx.lineTo(500, 356); ctx.lineTo(500, 366); ctx.lineTo(530, 366); ctx.lineTo(530, 348); ctx.lineTo(556, 348);
  ctx.lineTo(556, 366); ctx.lineTo(600, 366); ctx.lineTo(600, 390);
  ctx.closePath();
  ctx.fill();

  // Sea.
  const sea = ctx.createLinearGradient(0, 390, 0, H);
  sea.addColorStop(0, '#e87a4a');
  sea.addColorStop(0.5, '#8a4a6e');
  sea.addColorStop(1, '#3a2a4e');
  ctx.fillStyle = sea;
  ctx.fillRect(0, 390, W, H - 390);

  // Sun reflection path.
  ctx.fillStyle = 'rgba(255,220,130,0.5)';
  for (let i = 0; i < 12; i += 1) {
    const y = 400 + i * 19;
    const w = 60 + i * 10;
    ctx.fillRect(300 - w / 2, y, w, 5);
  }
  for (const s of shimmer) {
    ctx.fillStyle = 'rgba(255,200,140,0.28)';
    ctx.fillRect(s.x, s.y, s.w, 3);
  }

  // Lighthouse on rocks (left). Its beam is a difference.
  ctx.fillStyle = '#5a4a52';
  ctx.beginPath();
  ctx.moveTo(30, 400);
  ctx.lineTo(60, 340); ctx.lineTo(90, 330); ctx.lineTo(120, 340); ctx.lineTo(150, 400);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#f5efe0';
  ctx.fillRect(70, 190, 40, 150);
  ctx.fillStyle = '#d23b2e';
  ctx.fillRect(70, 230, 40, 26);
  ctx.fillRect(70, 282, 40, 26);
  ctx.fillStyle = '#2e2a33';
  ctx.fillRect(66, 176, 48, 16);
  ctx.fillStyle = '#ffd76a';
  ctx.fillRect(76, 158, 28, 18);
  ctx.fillStyle = '#2e2a33';
  ctx.beginPath();
  ctx.moveTo(66, 158);
  ctx.lineTo(90, 142);
  ctx.lineTo(114, 158);
  ctx.closePath();
  ctx.fill();
  if (!mods.has('light')) {
    const beam = ctx.createLinearGradient(104, 167, 320, 120);
    beam.addColorStop(0, 'rgba(255,240,170,0.55)');
    beam.addColorStop(1, 'rgba(255,240,170,0)');
    ctx.fillStyle = beam;
    ctx.beginPath();
    ctx.moveTo(104, 158);
    ctx.lineTo(320, 108);
    ctx.lineTo(320, 150);
    ctx.lineTo(104, 176);
    ctx.closePath();
    ctx.fill();
    glow(ctx, 90, 167, 26, '#ffe98a', 0.8);
  }

  // Sailboat. Its sail changes colour; its reflection can vanish.
  function sailboat(x, y, s) {
    ctx.fillStyle = '#5a2e1e';
    ctx.beginPath();
    ctx.moveTo(x - s * 0.9, y);
    ctx.lineTo(x + s * 0.9, y);
    ctx.lineTo(x + s * 0.6, y + s * 0.3);
    ctx.lineTo(x - s * 0.6, y + s * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#3a1d12';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y - s * 1.5);
    ctx.stroke();
  }
  sailboat(380, 320, 42);
  ctx.fillStyle = mods.has('sail') ? '#d23b2e' : '#f5efe0';
  ctx.beginPath();
  ctx.moveTo(380, 258);
  ctx.lineTo(380, 318);
  ctx.lineTo(424, 318);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = mods.has('sail') ? '#e5534b' : '#e8ddc9';
  ctx.beginPath();
  ctx.moveTo(378, 262);
  ctx.lineTo(378, 318);
  ctx.lineTo(344, 318);
  ctx.closePath();
  ctx.fill();
  // Reflection under the sailboat (absent on the right).
  if (!mods.has('reflection')) {
    ctx.fillStyle = 'rgba(255,220,130,0.4)';
    ctx.beginPath();
    ctx.moveTo(352, 356);
    ctx.lineTo(408, 356);
    ctx.lineTo(420, 420);
    ctx.lineTo(344, 420);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(90,46,30,0.5)';
    ctx.fillRect(366, 360, 28, 46);
  }

  // Fishing boat with cabin.
  ctx.fillStyle = '#2e4a6e';
  ctx.beginPath();
  ctx.moveTo(150, 440);
  ctx.lineTo(240, 440);
  ctx.lineTo(222, 462);
  ctx.lineTo(168, 462);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#f5efe0';
  ctx.fillRect(186, 416, 30, 24);
  ctx.fillStyle = '#2e2a33';
  ctx.fillRect(196, 424, 10, 8);
  ctx.strokeStyle = '#2e2a33';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(201, 416);
  ctx.lineTo(201, 392);
  ctx.stroke();

  // Wooden pier across the lower part.
  ctx.fillStyle = '#6b4a2e';
  ctx.fillRect(0, 500, W, 60);
  ctx.fillStyle = '#8a6a42';
  for (let x = 0; x < W; x += 46) ctx.fillRect(x, 500, 40, 60);
  ctx.strokeStyle = 'rgba(40,25,12,0.6)';
  ctx.lineWidth = 2;
  for (let x = 0; x < W; x += 46) {
    ctx.beginPath();
    ctx.moveTo(x + 43, 500);
    ctx.lineTo(x + 43, 560);
    ctx.stroke();
  }
  ctx.fillStyle = '#5a3a24';
  for (const x of [60, 300, 540]) ctx.fillRect(x - 8, 560, 16, 80);
  // Coiled rope on the pier.
  ctx.strokeStyle = '#d9b06a';
  ctx.lineWidth = 4;
  for (let i = 0; i < 3; i += 1) {
    ctx.beginPath();
    ctx.arc(120, 522, 12 - i * 3, 0, Math.PI * 2);
    ctx.stroke();
  }
  // Crates on the pier; one extra on the right.
  function crate(x, y, s) {
    ctx.fillStyle = '#a87a42';
    ctx.fillRect(x, y, s, s);
    ctx.strokeStyle = '#6b4a22';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, s, s);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + s, y + s);
    ctx.moveTo(x + s, y);
    ctx.lineTo(x, y + s);
    ctx.stroke();
  }
  crate(340, 508, 34);
  crate(380, 516, 26);
  if (mods.has('crate')) crate(200, 506, 32);
  // Flag on a pier pole (absent on the right).
  ctx.strokeStyle = '#3a2a1e';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(540, 500);
  ctx.lineTo(540, 420);
  ctx.stroke();
  if (!mods.has('flag')) {
    ctx.fillStyle = '#d23b2e';
    ctx.beginPath();
    ctx.moveTo(540, 420);
    ctx.lineTo(574, 430);
    ctx.lineTo(540, 442);
    ctx.closePath();
    ctx.fill();
  }
  // Rowboat in the water below the pier (absent on the right).
  if (!mods.has('boat')) {
    ctx.fillStyle = '#7a4a2e';
    ctx.beginPath();
    ctx.ellipse(470, 606, 46, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#5a341e';
    ctx.beginPath();
    ctx.ellipse(470, 602, 38, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#5a341e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(440, 596);
    ctx.lineTo(500, 596);
    ctx.stroke();
  }
}

// ---------------------------------------------------------------------------
// Scene table
// ---------------------------------------------------------------------------

export const SCENES = [
  {
    id: 'market',
    name: 'Lantern Night Market',
    seed: 11,
    paint: drawMarket,
    diffs: [
      { id: 'moon', x: 520, y: 62, r: 34, label: 'the moon' },
      { id: 'star', x: 92, y: 92, r: 20, label: 'a bright star' },
      { id: 'lantern-color', x: 300, y: 168, r: 26, label: 'a lantern colour' },
      { id: 'awning', x: 305, y: 330, r: 42, label: 'the lantern stall awning' },
      { id: 'sign', x: 125, y: 300, r: 24, label: 'the stall sign' },
      { id: 'fruit', x: 120, y: 432, r: 22, label: 'an extra orange' },
      { id: 'cat', x: 505, y: 468, r: 30, label: 'the cat on the crate' },
    ],
  },
  {
    id: 'reef',
    name: 'Coral Reef',
    seed: 23,
    paint: drawReef,
    diffs: [
      { id: 'turtle', x: 120, y: 120, r: 44, label: 'the turtle' },
      { id: 'fish-color', x: 420, y: 180, r: 30, label: 'a fish colour' },
      { id: 'bubbles', x: 350, y: 260, r: 24, label: 'a bubble trail' },
      { id: 'fish-flip', x: 250, y: 300, r: 30, label: 'a fish direction' },
      { id: 'coral-color', x: 180, y: 420, r: 36, label: 'a coral colour' },
      { id: 'starfish', x: 480, y: 520, r: 26, label: 'a starfish' },
      { id: 'shell', x: 90, y: 540, r: 22, label: 'a shell' },
    ],
  },
  {
    id: 'harbour',
    name: 'Sunset Harbour',
    seed: 37,
    paint: drawHarbour,
    diffs: [
      { id: 'gull', x: 300, y: 100, r: 24, label: 'a gull' },
      { id: 'light', x: 90, y: 150, r: 40, label: 'the lighthouse beam' },
      { id: 'sail', x: 380, y: 300, r: 36, label: 'the sail colour' },
      { id: 'reflection', x: 380, y: 420, r: 30, label: 'a boat reflection' },
      { id: 'flag', x: 540, y: 430, r: 24, label: 'the pier flag' },
      { id: 'crate', x: 200, y: 506, r: 26, label: 'an extra crate' },
      { id: 'boat', x: 470, y: 600, r: 30, label: 'the rowboat' },
    ],
  },
];

/** Paint one side of a scene onto a canvas: variant 0 is the original, 1 has every difference. */
export function paintScene(scene, variant, canvas) {
  const ctx = canvas.getContext('2d');
  const rnd = createRandom(scene.seed);
  const mods = new Set(variant === 1 ? scene.diffs.map((d) => d.id) : []);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  scene.paint(ctx, canvas.width, canvas.height, mods, rnd);
}
