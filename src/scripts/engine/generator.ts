import type { GenMode, ModeContext, PanelCode, PanelRenderData, Segment } from './types';

export const TICK_MS = 42;
export const TICK_JITTER_MS = 1; // tick wobbles between 41 and 42 ms
export const FADE_MS = 21; // content fade on panel switch

let timer: number | null = null;
let caret: HTMLElement | null = null;
let writingEl: HTMLElement | null = null;

function rng(): number {
  return Math.random();
}

function firstDelimiter(text: string, delimiters: string): number {
  for (let i = 0; i < text.length; i++) {
    if (delimiters.includes(text.charAt(i))) return i;
  }
  return -1;
}

function wordChunk(text: string): number {
  let i = 0;
  while (i < text.length && text.charAt(i) === ' ') i++;
  while (i < text.length && text.charAt(i) !== ' ' && text.charAt(i) !== '\n') i++;
  if (i < text.length) i++; // include the trailing separator
  return i;
}

// Chunk size for the next tick, accelerating from single characters to whole
// paragraphs across the progress span (0..1). `remaining` is the not-yet-shown
// text of the current segment; word and sentence bounds use simple delimiters.
export function defaultChunk(progress: number, remaining: string, random: () => number = Math.random): number {
  const len = remaining.length;
  if (len === 0) return 0;
  if (progress < 0.08) return 1;
  if (progress < 0.18) return Math.min(2, len);
  if (progress < 0.32) return Math.min(random() < 0.5 ? 3 : 4, len);
  if (progress < 0.5) return wordChunk(remaining);
  if (progress < 0.7) {
    const i = firstDelimiter(remaining, ',;:.!?\n');
    return i < 0 ? len : i + 1;
  }
  if (progress < 0.85) {
    const i = firstDelimiter(remaining, '.!?\n');
    return i < 0 ? len : i + 1;
  }
  return len;
}

function createCaret(): HTMLElement {
  const el = document.createElement('span');
  el.className = 'caret';
  el.setAttribute('aria-hidden', 'true');
  return el;
}

function removeCaret(): void {
  if (caret) {
    caret.remove();
    caret = null;
  }
}

function placeCaret(): void {
  if (caret && writingEl) writingEl.appendChild(caret);
}

function createContext(data: PanelRenderData): ModeContext {
  const total = data.segments.reduce((sum, segment) => sum + segment.text.length, 0);
  const shown = new Map<HTMLElement, number>();
  let written = 0;
  return {
    data,
    write(el, text) {
      written += text.length - (shown.get(el) ?? 0);
      shown.set(el, text.length);
      el.textContent = text;
      writingEl = el;
    },
    progress() {
      return total === 0 ? 1 : written / total;
    },
    rng,
  };
}

function finish(onDone?: () => void): void {
  removeCaret();
  writingEl = null;
  if (onDone) onDone();
}

function scheduleTick(mode: GenMode, ctx: ModeContext, onDone?: () => void): void {
  const delay = TICK_MS - (rng() < 0.5 ? TICK_JITTER_MS : 0); // 41 or 42 ms
  timer = setTimeout(() => {
    timer = null;
    if (mode.tick(ctx)) {
      finish(onDone);
    } else {
      placeCaret();
      scheduleTick(mode, ctx, onDone);
    }
  }, delay);
}

// Start the one generation process. An implicit stop() ends any running one.
export function start(mode: GenMode, data: PanelRenderData, onDone?: () => void): void {
  stop();
  const ctx = createContext(data);
  mode.init(ctx);
  writingEl = data.segments.length > 0 ? data.segments[0].el : null;
  caret = createCaret();
  placeCaret();
  scheduleTick(mode, ctx, onDone);
}

// Stop immediately and completely: clear the timer, drop the caret, forget state.
export function stop(): void {
  if (timer !== null) {
    clearTimeout(timer);
    timer = null;
  }
  removeCaret();
  writingEl = null;
}

// Base mode: reveals each segment in order using the default chunk plan.
export function classicMode(code: PanelCode): GenMode {
  let segments: Segment[] = [];
  let index = 0;
  let shownInSeg = 0;
  return {
    id: code,
    init(ctx) {
      segments = ctx.data.segments;
      index = 0;
      shownInSeg = 0;
      for (const segment of segments) ctx.write(segment.el, '');
    },
    tick(ctx) {
      while (index < segments.length && shownInSeg >= segments[index].text.length) {
        index++;
        shownInSeg = 0;
      }
      if (index >= segments.length) return true;
      const segment = segments[index];
      const remaining = segment.text.slice(shownInSeg);
      shownInSeg += Math.min(defaultChunk(ctx.progress(), remaining, ctx.rng), remaining.length);
      ctx.write(segment.el, segment.text.slice(0, shownInSeg));
      return ctx.progress() >= 1;
    },
  };
}
