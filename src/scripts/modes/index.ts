import { classicMode } from '../engine/generator';
import type { GenMode, PanelCode } from '../engine/types';
import { modeLegal } from './modeLegal';
import { modeProducts } from './modeProducts';
import { modeProjects } from './modeProjects';
import { modeSystem } from './modeSystem';
import { modeValues } from './modeValues';

// Panel personalities. Panels without an entry fall back to classic growth.
const registry = new Map<PanelCode, GenMode>([
  ['0001', modeSystem()],
  ['0003', modeValues()],
  ['0004', modeProjects()],
  ['0005', modeProducts()],
  ['0006', modeLegal()],
]);

export function modeFor(code: PanelCode): GenMode {
  return registry.get(code) ?? classicMode(code);
}
