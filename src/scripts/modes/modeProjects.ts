import type { GenMode, PanelCode, Segment } from '../engine/types';

const PROJECTS_CODE: PanelCode = '0004';
const BLOCK_MIN = 3;
const BLOCK_MAX = 6;
const PAUSE_CHANCE = 0.15; // probability of a one-tick pause after a block

function blockSize(rng: () => number): number {
  return BLOCK_MIN + Math.floor(rng() * (BLOCK_MAX - BLOCK_MIN + 1));
}

// Projects (0004): modular block generation. Reveals whole blocks of three to
// six characters per tick — the default chunk plan is overridden here — with an
// occasional one-tick pause between blocks. Segment text (including a project's
// display override or its honest name and status) comes from buildRenderData.
export function modeProjects(): GenMode {
  let segments: Segment[] = [];
  let index = 0;
  let shownInSeg = 0;
  let paused = false;
  return {
    id: PROJECTS_CODE,
    init(ctx) {
      segments = ctx.data.segments;
      index = 0;
      shownInSeg = 0;
      paused = false;
      for (const segment of segments) ctx.write(segment.el, '');
    },
    tick(ctx) {
      if (paused) {
        paused = false;
        return false; // a pause reveals nothing this tick
      }
      while (index < segments.length && shownInSeg >= segments[index].text.length) {
        index += 1;
        shownInSeg = 0;
      }
      if (index >= segments.length) return true;
      const segment = segments[index];
      const remaining = segment.text.length - shownInSeg;
      shownInSeg += Math.min(blockSize(ctx.rng), remaining);
      ctx.write(segment.el, segment.text.slice(0, shownInSeg));
      const done = ctx.progress() >= 1;
      if (!done && ctx.rng() < PAUSE_CHANCE) paused = true;
      return done;
    },
  };
}
