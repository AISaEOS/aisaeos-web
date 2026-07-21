import { modeFor } from './modes';
import { onMotionChange, reducedMotion } from './motion';
import { initNav } from './nav';
import { initState } from './state';

// Runtime entry point. Reflects the reduced-motion preference on the document
// root as a single source and keeps it in sync with the OS setting.
function applyMotionPreference(reduced: boolean): void {
  document.documentElement.classList.toggle('reduce-motion', reduced);
}

applyMotionPreference(reducedMotion());
onMotionChange(applyMotionPreference);
initState(modeFor);
initNav();
