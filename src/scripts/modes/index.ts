import { classicMode } from '../engine/generator';
import type { GenMode, PanelCode } from '../engine/types';
import { modeValues } from './modeValues';

// Panel personalities. Panels without an entry fall back to classic growth.
const registry = new Map<PanelCode, GenMode>([
  ['0003', modeValues()],
]);

export function modeFor(code: PanelCode): GenMode {
  return registry.get(code) ?? classicMode(code);
}
