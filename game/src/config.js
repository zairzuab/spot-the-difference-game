// Every tuning number, colour and layout constant in one place.
// The playfield is a fixed 1280x800 logical area; the renderer scales it to
// the window, so no rule below depends on the screen size.
export const FIELD = { width: 1280, height: 800 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

/** Differences per scene. */
export const DIFFS_PER_SCENE = 7;

/** Hints per scene. */
export const HINTS_PER_SCENE = 3;

/** Score for finding one difference; a wrong click costs WRONG_PENALTY. */
export const POINTS_FOUND = 100;
export const POINTS_WRONG = 10;
export const POINTS_HINT = 25;

/** Time bonus at the end of a scene: up to BONUS_SECONDS seconds counted at BONUS_RATE each. */
export const BONUS_SECONDS = 180;
export const BONUS_RATE = 2;

/** How long a hint ring stays visible, in seconds. */
export const HINT_SECONDS = 2.5;

/** How long a wrong-click X stays visible, in seconds. */
export const WRONG_SECONDS = 0.7;

/** Magnifier zoom and lens radius (screen pixels, logical field units). */
export const MAGNIFY = 2.2;
export const LENS_RADIUS = 78;

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'spot-the-difference.best';

/** Layout of the play screen, in logical field units. */
export const LAYOUT = {
  header: { x: 0, y: 0, w: 1280, h: 64 },
  // Two picture panels, side by side, with a divider between them.
  left: { x: 20, y: 76, w: 600, h: 640 },
  right: { x: 660, y: 76, w: 600, h: 640 },
  footer: { x: 0, y: 724, w: 1280, h: 68 },
};

/** Scene picture size: each panel's inner picture, in scene coordinates. */
export const SCENE = { w: 600, h: 640 };

export const PALETTE = {
  backdrop: '#14101f',
  header: '#1e1830',
  headerLine: '#3a2f5e',
  panel: '#0d0a16',
  panelLine: '#4a3f78',
  text: '#f5efe0',
  muted: '#a89ec4',
  gold: '#f2c94c',
  goldDim: '#b98a1e',
  green: '#5ec98a',
  red: '#e5534b',
  teal: '#4fc3c7',
  button: '#f2c94c',
  buttonText: '#241a05',
  buttonLine: '#8a6d1f',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';
export const FONT_DISPLAY = 'Georgia, "Times New Roman", serif';
