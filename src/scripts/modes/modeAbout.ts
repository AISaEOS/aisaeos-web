import { defaultChunk } from '../engine/generator';
import type { GenMode, PanelCode, Segment } from '../engine/types';

const ABOUT_CODE: PanelCode = '0002';
const INJECT_CHANCE = 0.15;
const HOLD_MIN = 2; // a wrong word holds for HOLD_MIN..HOLD_MIN+2 ticks
// The engine tick is fixed, so the faster correction tempo is realized by
// fixing two characters per tick instead of following the chunk plan.
const CORRECT_STEP = 2;

function wordEndFrom(text: string, pos: number): number {
  let i = pos;
  while (i < text.length && text.charAt(i) !== ' ') i += 1;
  return i;
}

function isWordStart(text: string, pos: number): boolean {
  if (pos >= text.length || text.charAt(pos) === ' ') return false;
  return pos === 0 || text.charAt(pos - 1) === ' ';
}

function toNextWordStart(text: string, pos: number): number {
  let i = pos;
  while (i < text.length && text.charAt(i) !== ' ') i += 1;
  while (i < text.length && text.charAt(i) === ' ') i += 1;
  return Math.max(i - pos, 1);
}

// About (0002): classic growth with occasional foreign words. At a word
// boundary a word from one of the two other languages may appear instead of
// the correct one; after a couple of ticks it is removed and the correct word
// is fixed quickly, then normal growth resumes. The final text is the source.
export function modeAbout(): GenMode {
  let segments: Segment[] = [];
  let alt: string[][] = [];
  let total = 0;
  let solved = 0;
  let index = 0;
  let shownInSeg = 0;
  let phase: 'normal' | 'holding' | 'correcting' = 'normal';
  let hold = 0;
  let foreignWord = '';
  let wordLen = 0;
  let corrected = 0;
  let blockInject = false;

  function pickForeign(rng: () => number): string {
    const others = alt[index];
    if (!others || others.length === 0) return '';
    const langText = others[Math.floor(rng() * others.length)];
    const words = langText.split(/\s+/).filter(Boolean);
    if (words.length === 0) return '';
    return words[Math.floor(rng() * words.length)];
  }

  return {
    id: ABOUT_CODE,
    init(ctx) {
      segments = ctx.data.segments;
      alt = ctx.data.altSegments ?? [];
      total = segments.reduce((sum, s) => sum + s.text.length, 0);
      solved = 0;
      index = 0;
      shownInSeg = 0;
      phase = 'normal';
      hold = 0;
      foreignWord = '';
      wordLen = 0;
      corrected = 0;
      blockInject = false;
      for (const segment of segments) ctx.write(segment.el, '');
    },
    tick(ctx) {
      if (phase === 'normal') {
        while (index < segments.length && shownInSeg >= segments[index].text.length) {
          index += 1;
          shownInSeg = 0;
          blockInject = false;
        }
        if (index >= segments.length) return true;
      }
      const seg = segments[index];
      const text = seg.text;

      if (phase === 'holding') {
        hold -= 1;
        ctx.write(seg.el, text.slice(0, shownInSeg) + foreignWord);
        if (hold <= 0) {
          phase = 'correcting';
          corrected = 0;
        }
        return false;
      }

      if (phase === 'correcting') {
        corrected = Math.min(corrected + CORRECT_STEP, wordLen);
        ctx.write(seg.el, text.slice(0, shownInSeg + corrected));
        if (corrected >= wordLen) {
          shownInSeg += wordLen;
          solved += wordLen;
          phase = 'normal';
          blockInject = true;
        }
        return solved >= total;
      }

      // normal growth, capped at the next word start so boundaries are visited
      const remaining = text.slice(shownInSeg);
      const step = Math.min(defaultChunk(solved / total, remaining, ctx.rng), remaining.length, toNextWordStart(text, shownInSeg));
      shownInSeg += step;
      solved += step;
      ctx.write(seg.el, text.slice(0, shownInSeg));
      if (isWordStart(text, shownInSeg)) {
        if (blockInject) {
          blockInject = false;
        } else if (ctx.rng() < INJECT_CHANCE) {
          const fw = pickForeign(ctx.rng);
          if (fw) {
            foreignWord = fw;
            wordLen = wordEndFrom(text, shownInSeg) - shownInSeg;
            phase = 'holding';
            hold = HOLD_MIN + Math.floor(ctx.rng() * 3);
          }
        }
      }
      return solved >= total;
    },
  };
}
