import { classicMode, start } from './engine/generator';
import type { PanelRenderData, Segment } from './engine/types';
import { onMotionChange, reducedMotion } from './motion';

// Runtime entry point. Reflects the reduced-motion preference on the document
// root as a single source and keeps it in sync with the OS setting.
function applyMotionPreference(reduced: boolean): void {
  document.documentElement.classList.toggle('reduce-motion', reduced);
}

// Dev-only preview of the generation engine on panel 0001; removed once
// navigation drives generation.
function previewGeneration(): void {
  const raw = document.getElementById('aisaeos-data')?.textContent;
  const stage = document.querySelector('.stage');
  if (!raw || !stage) return;
  const parsed = JSON.parse(raw) as {
    en: { panels: Record<string, { tag: string; title: string; body: string[]; meta: string[] }> };
  };
  const panel = parsed.en.panels['0001'];
  const tagEl = stage.querySelector<HTMLElement>('.stage-tag');
  const titleEl = stage.querySelector<HTMLElement>('.stage-title');
  const bodyEl = stage.querySelector<HTMLElement>('.stage-body');
  const metaEl = stage.querySelector<HTMLElement>('.stage-meta');
  if (!panel || !tagEl || !titleEl || !bodyEl || !metaEl) return;
  const segments: Segment[] = [
    { zone: 'tag', text: panel.tag, el: tagEl },
    { zone: 'title', text: panel.title, el: titleEl },
    { zone: 'body', text: panel.body.join('\n\n'), el: bodyEl },
    { zone: 'meta', text: panel.meta.join('   '), el: metaEl },
  ];
  const data: PanelRenderData = { code: '0001', segments };
  document.body.classList.replace('is-ground', 'is-panel');
  start(classicMode('0001'), data);
}

applyMotionPreference(reducedMotion());
onMotionChange(applyMotionPreference);

if (import.meta.env.DEV && !reducedMotion()) {
  previewGeneration();
}
