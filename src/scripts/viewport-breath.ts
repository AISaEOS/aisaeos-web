import { createBreath } from './breath';
import { reducedMotion } from './motion';

const TAU_MS = 420; // afterglow time constant
const MAX_OPACITY = 0.6; // edge intensity at full energy
const IMPULSE = 0.6; // energy per interaction event

// Purple overlay along the viewport edge for coarse-pointer devices: breathes
// on scroll/touch and eases back into rest — the touch counterpart to the
// cursor. Absent under reduced motion.
export function initViewportBreath(): void {
  if (reducedMotion()) return;
  if (!matchMedia('(pointer: coarse)').matches) return;

  const edge = document.createElement('div');
  edge.className = 'viewport-breath';
  edge.setAttribute('aria-hidden', 'true');
  document.body.appendChild(edge);

  const breath = createBreath(TAU_MS);
  const wake = (): void => breath.impulse(IMPULSE);
  window.addEventListener('scroll', wake, { passive: true });
  window.addEventListener('touchstart', wake, { passive: true });
  window.addEventListener('touchmove', wake, { passive: true });

  let lastFrame = 0;
  function frame(now: number): void {
    const dt = lastFrame === 0 ? 16 : now - lastFrame;
    lastFrame = now;
    edge.style.opacity = String(breath.sample(dt) * MAX_OPACITY);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
