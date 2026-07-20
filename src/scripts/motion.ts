// The single prefers-reduced-motion gate. No other module queries motion state;
// experience modules read it through reducedMotion() / onMotionChange().
const query: MediaQueryList = matchMedia('(prefers-reduced-motion: reduce)');

export function reducedMotion(): boolean {
  return query.matches;
}

export function onMotionChange(callback: (reduced: boolean) => void): void {
  query.addEventListener('change', (event) => callback(event.matches));
}
