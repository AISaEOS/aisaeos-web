export type PanelCode = '0001' | '0002' | '0003' | '0004' | '0005' | '0006';
export type Zone = 'tag' | 'title' | 'body' | 'projects' | 'meta';

export interface Segment {
  zone: Zone;
  text: string;
  el: HTMLElement;
}

export interface PanelRenderData {
  code: PanelCode;
  // order: tag, title, body[], projects[], meta
  segments: Segment[];
  // parallel texts of the two other languages (about panel only)
  altSegments?: string[][];
}

export interface ModeContext {
  data: PanelRenderData;
  // replace the text content of the element
  write(el: HTMLElement, text: string): void;
  // 0..1 over the total character count
  progress(): number;
  // Math.random wrapper, injectable for tests
  rng(): number;
}

export interface GenMode {
  id: PanelCode;
  init(ctx: ModeContext): void;
  // returns true when finished
  tick(ctx: ModeContext): boolean;
}
