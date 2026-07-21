import { classicMode, FADE_MS, start, stop } from './engine/generator';
import type { GenMode, PanelCode, PanelRenderData, Segment } from './engine/types';
import { reducedMotion } from './motion';

type ModeResolver = (code: PanelCode) => GenMode;

export type { PanelCode } from './engine/types';

type Lang = 'en' | 'de' | 'fi';
type ContentCode = Exclude<PanelCode, '0006'>;

interface ProjectEntry {
  name: string;
  status: string;
  display: string;
}

interface PanelEntry {
  tag: string;
  tagNight: string;
  title: string;
  body: string[];
  meta: string[];
  projects?: ProjectEntry[];
}

interface LangData {
  panels: Record<ContentCode, PanelEntry>;
  legal: { lines: string[]; email: string };
}

type EmbeddedData = Record<Lang, LangData>;

interface PageState {
  view: 'ground' | 'panel';
  active: PanelCode | null;
  busy: boolean;
}

const state: PageState = { view: 'ground', active: null, busy: false };

let dataCache: EmbeddedData | null = null;
let fadeTimer: number | null = null;

function embeddedData(): EmbeddedData {
  if (dataCache === null) {
    const raw = document.getElementById('aisaeos-data')?.textContent;
    if (!raw) throw new Error('embedded language data missing');
    dataCache = JSON.parse(raw) as EmbeddedData;
  }
  return dataCache;
}

function stageRoot(): HTMLElement {
  const el = document.querySelector<HTMLElement>('.stage');
  if (!el) throw new Error('stage missing');
  return el;
}

function stageZone(name: 'tag' | 'title' | 'body' | 'meta'): HTMLElement {
  const el = document.querySelector<HTMLElement>(`.stage-${name}`);
  if (!el) throw new Error(`stage zone ${name} missing`);
  return el;
}

function appendLine(parent: HTMLElement): HTMLElement {
  return parent.appendChild(document.createElement('p'));
}

function clearStage(): void {
  stageZone('tag').textContent = '';
  stageZone('title').textContent = '';
  stageZone('body').replaceChildren();
  stageZone('meta').textContent = '';
  document.querySelectorAll('main > section.is-shown').forEach((section) => {
    section.classList.remove('is-shown');
  });
}

// Builds the display segments for a panel from the embedded JSON
// (parsed once, cached). Display order: tag, title, body paragraphs,
// project entries, meta. Legal (0006): the five lines plus the email.
export function buildRenderData(code: PanelCode, lang: Lang): PanelRenderData {
  const data = embeddedData()[lang];
  const segments: Segment[] = [];
  const body = stageZone('body');
  if (code === '0006') {
    for (const line of data.legal.lines) {
      segments.push({ zone: 'body', text: line, el: appendLine(body) });
    }
    segments.push({ zone: 'body', text: data.legal.email, el: appendLine(body) });
  } else {
    const panel = data.panels[code];
    segments.push({ zone: 'tag', text: panel.tag, el: stageZone('tag') });
    segments.push({ zone: 'title', text: panel.title, el: stageZone('title') });
    for (const paragraph of panel.body) {
      segments.push({ zone: 'body', text: paragraph, el: appendLine(body) });
    }
    if (panel.projects) {
      for (const project of panel.projects) {
        const text = project.display === '' ? `${project.name} — ${project.status}` : project.display;
        segments.push({ zone: 'projects', text, el: appendLine(body) });
      }
    }
    segments.push({ zone: 'meta', text: panel.meta.join(' · '), el: stageZone('meta') });
  }
  return { code, segments };
}

function sectionFor(code: PanelCode): HTMLElement | null {
  return document.querySelector<HTMLElement>(`main > section[data-code="${code}"]`);
}

function focusSection(code: PanelCode): void {
  sectionFor(code)?.focus({ preventScroll: true });
}

function applyPanelClasses(code: PanelCode): void {
  document.body.classList.remove('is-ground');
  document.body.classList.add('is-panel');
  document.body.dataset.activePanel = code;
}

function applyGroundClasses(): void {
  document.body.classList.remove('is-panel');
  document.body.classList.add('is-ground');
  delete document.body.dataset.activePanel;
}

// Injected by the composition root; defaults to classic growth.
let resolveMode: ModeResolver = classicMode;

function beginGeneration(code: PanelCode): void {
  start(resolveMode(code), buildRenderData(code, 'en'));
}

export function getState(): Readonly<PageState> {
  return state;
}

export function initState(resolver?: ModeResolver): void {
  if (resolver) resolveMode = resolver;
  embeddedData();
}

// Opens a panel. Returns false while the fade transition is locking input.
export function openPanel(code: PanelCode): boolean {
  if (state.busy) return false;
  stop();
  if (reducedMotion()) {
    // The active section itself is shown; text is complete at once, no caret.
    clearStage();
    applyPanelClasses(code);
    state.view = 'panel';
    state.active = code;
    sectionFor(code)?.classList.add('is-shown');
    focusSection(code);
    return true;
  }
  if (state.view === 'ground') {
    clearStage();
    applyPanelClasses(code);
    state.view = 'panel';
    state.active = code;
    beginGeneration(code);
    focusSection(code);
    return true;
  }
  // Panel to panel: fade the stage out, then rebuild and regenerate.
  state.busy = true;
  stageRoot().classList.add('is-fading');
  fadeTimer = setTimeout(() => {
    fadeTimer = null;
    clearStage();
    stageRoot().classList.remove('is-fading');
    applyPanelClasses(code);
    state.active = code;
    state.busy = false;
    beginGeneration(code);
    focusSection(code);
  }, FADE_MS);
  return true;
}

// Returns to the ground state without a fade; the rebuild is the transition.
export function toGround(): boolean {
  if (state.busy || state.view === 'ground') return false;
  stop();
  clearStage();
  applyGroundClasses();
  state.view = 'ground';
  state.active = null;
  return true;
}
