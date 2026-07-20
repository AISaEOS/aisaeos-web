import { openPanel, toGround, type PanelCode } from './state';

const KEY_TO_PANEL: Record<string, PanelCode> = {
  '1': '0001',
  '2': '0002',
  '3': '0003',
  '4': '0004',
  '5': '0005',
};

let lastTrigger: HTMLElement | null = null;

function iconButtons(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>('.icon-nav button[data-panel]'));
}

function isPanelCode(value: string | undefined): value is PanelCode {
  return value === '0001' || value === '0002' || value === '0003'
    || value === '0004' || value === '0005' || value === '0006';
}

function markActive(code: PanelCode | null): void {
  for (const button of iconButtons()) {
    const active = code !== null && button.dataset.panel === code;
    button.classList.toggle('is-active', active);
    if (active) {
      button.setAttribute('aria-current', 'true');
    } else {
      button.removeAttribute('aria-current');
    }
  }
}

function open(code: PanelCode, trigger: HTMLElement | null): void {
  if (openPanel(code)) {
    lastTrigger = trigger;
    markActive(code);
  }
}

function home(): void {
  if (toGround()) {
    markActive(null);
    lastTrigger?.focus();
  }
}

export function initNav(): void {
  for (const button of iconButtons()) {
    button.addEventListener('click', () => {
      const code = button.dataset.panel;
      if (isPanelCode(code)) open(code, button);
    });
  }
  document.querySelectorAll<HTMLElement>('[data-action="legal"]').forEach((button) => {
    button.addEventListener('click', () => open('0006', button));
  });
  document.querySelectorAll<HTMLElement>('[data-action="home"]').forEach((button) => {
    button.addEventListener('click', home);
  });
  document.addEventListener('keydown', (event) => {
    if (event.ctrlKey || event.altKey || event.metaKey) return;
    if (event.key === 'Escape') {
      home();
      return;
    }
    const code = KEY_TO_PANEL[event.key];
    if (code) {
      open(code, iconButtons().find((button) => button.dataset.panel === code) ?? null);
    }
  });
}
