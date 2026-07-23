// Shared breathing dynamics for the two experience layers (cursor, viewport
// edge). Interaction adds energy up to a ceiling; stillness lets it decay
// exponentially — the afterglow back into rest. Pure: each caller maps the
// 0..1 energy onto its own property (scale, opacity).
export interface Breath {
  impulse(amount: number): void;
  sample(dtMs: number): number;
}

export function createBreath(tauMs: number): Breath {
  let energy = 0;
  return {
    impulse(amount) {
      energy = Math.min(1, energy + amount);
    },
    sample(dtMs) {
      energy *= Math.exp(-dtMs / tauMs);
      return energy;
    },
  };
}
