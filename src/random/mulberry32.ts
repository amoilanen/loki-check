/**
 * Mulberry32 — a small, fast, well-distributed 32-bit PRNG.
 *
 * @param seed - initial 32-bit seed.
 * @returns a function that yields the next pseudo-random number in `[0, 1)` on each call.
 */
export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return function next(): number {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
