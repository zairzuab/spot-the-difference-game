// All sound is synthesised with WebAudio: no audio files, no network.
// A soft music-box loop plays under the game; every effect is a short
// oscillator envelope. Everything is muted together with M.

const NOTE = {
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.0, B5: 987.77,
  C6: 1046.5, E6: 1318.5, G6: 1568.0,
};

// A gentle pentatonic music-box pattern, one note every half second.
const MELODY = [
  'E5', 'G5', 'A5', 'G5', 'E5', 'D5', 'C5', 'D5',
  'E5', 'G5', 'C6', 'A5', 'G5', 'E5', 'D5', 'C5',
];

export function createAudio() {
  let ctx = null;
  let master = null;
  let muted = false;
  let musicTimer = 0;
  let melodyIndex = 0;

  function ensure() {
    if (ctx) return true;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
      return true;
    } catch {
      return false;
    }
  }

  function tone(freq, when, dur, type, vol) {
    if (!ctx || muted) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, ctx.currentTime + when);
    gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + when + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + when + dur);
    osc.connect(gain);
    gain.connect(master);
    osc.start(ctx.currentTime + when);
    osc.stop(ctx.currentTime + when + dur + 0.05);
  }

  function unlock() {
    if (ensure() && ctx.state === 'suspended') ctx.resume();
  }

  return {
    unlock,
    isMuted() { return muted; },
    toggleMute() {
      muted = !muted;
      if (master) master.gain.value = muted ? 0 : 0.5;
      return muted;
    },
    /** A soft tick for a plain click. */
    click() {
      if (!ensure()) return;
      tone(1200, 0, 0.06, 'sine', 0.08);
    },
    /** Two-note chime when a difference is found. */
    found() {
      if (!ensure()) return;
      tone(NOTE.E5, 0, 0.18, 'sine', 0.22);
      tone(NOTE.A5, 0.09, 0.3, 'sine', 0.22);
      tone(NOTE.E6, 0.18, 0.35, 'sine', 0.1);
    },
    /** Low buzz for a wrong click. */
    wrong() {
      if (!ensure()) return;
      tone(130, 0, 0.18, 'square', 0.12);
      tone(98, 0.05, 0.2, 'square', 0.1);
    },
    /** A soft ping when a hint is used. */
    hint() {
      if (!ensure()) return;
      tone(NOTE.G5, 0, 0.25, 'sine', 0.14);
      tone(NOTE.C6, 0.12, 0.3, 'sine', 0.1);
    },
    /** Arpeggio when a scene is finished. */
    level() {
      if (!ensure()) return;
      const seq = ['C5', 'E5', 'G5', 'C6'];
      seq.forEach((n, i) => tone(NOTE[n], i * 0.11, 0.35, 'triangle', 0.2));
    },
    /** Longer fanfare for finishing all three scenes. */
    win() {
      if (!ensure()) return;
      const seq = ['C5', 'E5', 'G5', 'C6', 'G5', 'C6', 'E6', 'G6'];
      seq.forEach((n, i) => tone(NOTE[n], i * 0.13, 0.4, 'triangle', 0.2));
    },
    /** Advance the music-box loop by dt seconds. */
    update(dt) {
      if (!ctx || muted || ctx.state !== 'running') return;
      musicTimer += dt;
      while (musicTimer >= 0.5) {
        musicTimer -= 0.5;
        const name = MELODY[melodyIndex % MELODY.length];
        melodyIndex += 1;
        tone(NOTE[name], 0, 0.45, 'sine', 0.045);
      }
    },
  };
}
