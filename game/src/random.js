// A small seeded random number generator (mulberry32): the same seed gives the
// same picture, which is what makes the two sides of a scene identical except
// for the differences, and the screenshot scenes repeatable.

export function createRandom(seed) {
  let a = seed | 0;
  return function random() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A random number in [min, max). */
export function range(rnd, min, max) {
  return min + rnd() * (max - min);
}

/** Pick one item from an array. */
export function pick(rnd, items) {
  return items[Math.floor(rnd() * items.length)];
}
