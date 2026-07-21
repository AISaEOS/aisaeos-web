import { defaultChunk } from '../engine/generator';
import type { GenMode, ModeContext, PanelCode, Segment } from '../engine/types';

const PRODUCTS_CODE: PanelCode = '0005';
const NOISE_POOL = 'abcdefghijklmnopqrstuvwxyz0123456789·:/[]';

function noise(count: number, rng: () => number): string {
  let out = '';
  for (let i = 0; i < count; i += 1) {
    out += NOISE_POOL.charAt(Math.floor(rng() * NOISE_POOL.length));
  }
  return out;
}

// Products (0005): chaos settling into order. Each segment starts as an
// equal-length run of random characters; per tick the next n characters
// (n from the standard chunk plan) are fixed left to right, while the unsolved
// characters keep reshuffling. Solved segments stay put; the final text is the
// source exactly.
export function modeProducts(): GenMode {
  let segments: Segment[] = [];
  let total = 0;
  let solved = 0;
  let index = 0;
  let solvedInSeg = 0;

  function writeSegment(ctx: ModeContext, i: number): void {
    const seg = segments[i];
    const fixed = i === index ? solvedInSeg : 0;
    ctx.write(seg.el, seg.text.slice(0, fixed) + noise(seg.text.length - fixed, ctx.rng));
  }

  function render(ctx: ModeContext): void {
    // Rewrite the unsolved segments with fresh noise; solved ones stay as they
    // are. Write the current segment last so the engine places the caret there.
    for (let i = index + 1; i < segments.length; i += 1) writeSegment(ctx, i);
    if (index < segments.length) writeSegment(ctx, index);
  }

  return {
    id: PRODUCTS_CODE,
    init(ctx) {
      segments = ctx.data.segments;
      total = segments.reduce((sum, s) => sum + s.text.length, 0);
      solved = 0;
      index = 0;
      solvedInSeg = 0;
      render(ctx);
    },
    tick(ctx) {
      if (solved >= total) return true;
      while (index < segments.length && solvedInSeg >= segments[index].text.length) {
        index += 1;
        solvedInSeg = 0;
      }
      if (index >= segments.length) return true;
      const remaining = segments[index].text.slice(solvedInSeg);
      const n = Math.min(defaultChunk(solved / total, remaining, ctx.rng), remaining.length);
      solvedInSeg += n;
      solved += n;
      render(ctx);
      return solved >= total;
    },
  };
}
