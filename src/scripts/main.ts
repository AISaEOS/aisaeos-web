import { onMotionChange, reducedMotion } from './motion';

// Runtime entry point. Experience modules initialize here from M5 onward.
// The motion gate reflects its state on the root element, so the experience
// layer can switch off collectively from a single source (Konzept 10.2).
function applyMotionPreference(reduced: boolean): void {
  document.documentElement.classList.toggle('reduce-motion', reduced);
}

applyMotionPreference(reducedMotion());
onMotionChange(applyMotionPreference);
