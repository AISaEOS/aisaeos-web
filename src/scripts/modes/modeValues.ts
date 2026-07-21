import { classicMode } from '../engine/generator';
import type { GenMode } from '../engine/types';

// Values (0003): classic growth, identical to the engine's default chunk plan.
export function modeValues(): GenMode {
  return classicMode('0003');
}
