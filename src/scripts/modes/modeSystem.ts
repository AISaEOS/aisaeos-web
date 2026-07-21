import { classicMode } from '../engine/generator';
import type { GenMode, ModeContext, PanelCode } from '../engine/types';

const SYSTEM_CODE: PanelCode = '0001';
const BRACKET_CHANCE = 0.08; // probability per idle tick that a bracket flickers in

function makeBracket(): HTMLElement {
  const el = document.createElement('span');
  el.className = 'system-bracket';
  el.setAttribute('aria-hidden', 'true');
  el.textContent = '[]';
  return el;
}

// System (0001): classic growth with a faint bracket that flickers at the
// writing position for one or two ticks. The bracket is a transient overlay on
// the stage; the base mode drives the reveal, so the final text is the source
// exactly, with no bracket residue.
export function modeSystem(): GenMode {
  const base = classicMode(SYSTEM_CODE);
  let bracket: HTMLElement | null = null;
  let ticksLeft = 0;
  return {
    id: SYSTEM_CODE,
    init(ctx) {
      base.init(ctx);
      bracket?.remove();
      bracket = null;
      ticksLeft = 0;
    },
    tick(ctx) {
      bracket?.remove();
      // Capture the element the base mode writes to, to place the bracket there.
      const target: { el: HTMLElement | null } = { el: null };
      const proxy: ModeContext = {
        data: ctx.data,
        write: (el, text) => {
          target.el = el;
          ctx.write(el, text);
        },
        progress: () => ctx.progress(),
        rng: () => ctx.rng(),
      };
      if (base.tick(proxy)) {
        ticksLeft = 0;
        return true;
      }
      if (ticksLeft > 0) ticksLeft -= 1;
      if (ticksLeft === 0 && ctx.rng() < BRACKET_CHANCE) {
        ticksLeft = ctx.rng() < 0.5 ? 1 : 2;
      }
      if (ticksLeft > 0 && target.el) {
        bracket ??= makeBracket();
        target.el.appendChild(bracket);
      }
      return false;
    },
  };
}
