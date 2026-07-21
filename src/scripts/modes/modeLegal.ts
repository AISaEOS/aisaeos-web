import { classicMode } from '../engine/generator';
import type { GenMode } from '../engine/types';

// Legal (0006): classic growth, direct and clear — shares the engine's
// classicMode with the values mode, no duplicated growth logic.
export function modeLegal(): GenMode {
  return classicMode('0006');
}
