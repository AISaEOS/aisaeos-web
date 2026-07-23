import { createBreath } from './breath';
import { reducedMotion } from './motion';

const TAU_MS = 420; // afterglow time constant
const MAX_SCALE = 0.07; // breath amplitude at full energy
const SPEED_SCALE = 0.02; // pointer travel (px) mapped to breath energy

// Purple dot that replaces the system cursor on fine-pointer devices: follows
// the pointer, breathes with pointer speed and eases back into rest, and turns
// into a ring over interactive elements. Absent under reduced motion, where the
// system cursor applies.
export function initCursor(): void {
  if (reducedMotion()) return;
  if (!matchMedia('(pointer: fine)').matches) return;

  const dot = document.createElement('div');
  dot.className = 'cursor';
  dot.setAttribute('aria-hidden', 'true');
  document.body.appendChild(dot);
  document.documentElement.classList.add('has-cursor');

  const breath = createBreath(TAU_MS);
  let x = 0;
  let y = 0;
  let seen = false;
  let lastFrame = 0;

  document.addEventListener('pointermove', (event) => {
    if (seen) breath.impulse(Math.hypot(event.clientX - x, event.clientY - y) * SPEED_SCALE);
    x = event.clientX;
    y = event.clientY;
    seen = true;
  });

  // Delegated: the dot becomes a ring over any button or link.
  document.addEventListener('pointerover', (event) => {
    const over = event.target instanceof Element && event.target.closest('button, a') !== null;
    dot.classList.toggle('is-over', over);
  });

  function frame(now: number): void {
    const dt = lastFrame === 0 ? 16 : now - lastFrame;
    lastFrame = now;
    const scale = 1 + breath.sample(dt) * MAX_SCALE;
    dot.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) scale(${scale})`;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
