import { getData, refreshView, type ContentCode, type Lang, type LangData } from './state';

// Language-facing data accessor for modules that follow the active language.
export { getData } from './state';

const STORAGE_KEY = 'aisaeos.lang';

const CONTENT_CODES: readonly ContentCode[] = ['0001', '0002', '0003', '0004', '0005'];

// Time zone fallback of the detection cascade.
const TZ_LANG: Record<string, Lang> = {
  'Europe/Berlin': 'de',
  'Europe/Vienna': 'de',
  'Europe/Zurich': 'de',
  'Europe/Helsinki': 'fi',
};

let active: Lang = 'en';

function isLang(value: string | null | undefined): value is Lang {
  return value === 'en' || value === 'de' || value === 'fi';
}

function isContentCode(value: string | undefined): value is ContentCode {
  return value === '0001' || value === '0002' || value === '0003'
    || value === '0004' || value === '0005';
}

function storedLang(): Lang | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return isLang(value) ? value : null;
  } catch {
    return null;
  }
}

function domainLang(): Lang | null {
  const host = location.hostname;
  if (host.endsWith('aisaeos.de')) return 'de';
  if (host.endsWith('aisaeos.fi')) return 'fi';
  return null;
}

// Full navigator.languages scan in list order. Entries signal de or fi;
// English is the terminal fallback of the cascade, not a capture — analogous
// to the domain step, where .com carries no language either.
function navigatorLang(): Lang | null {
  for (const entry of navigator.languages) {
    const tag = entry.toLowerCase();
    if (tag === 'de' || tag.startsWith('de-')) return 'de';
    if (tag === 'fi' || tag.startsWith('fi-')) return 'fi';
  }
  return null;
}

function timeZoneLang(): Lang | null {
  return TZ_LANG[Intl.DateTimeFormat().resolvedOptions().timeZone] ?? null;
}

// Detection cascade, first hit wins: stored choice, domain, browser
// languages, time zone, English.
export function detectLang(): Lang {
  return storedLang() ?? domainLang() ?? navigatorLang() ?? timeZoneLang() ?? 'en';
}

export function getLang(): Lang {
  return active;
}

function setText(el: Element | null, text: string): void {
  if (el) el.textContent = text;
}

function markSwitcher(lang: Lang): void {
  document.querySelectorAll<HTMLElement>('[data-lang]').forEach((button) => {
    button.setAttribute('aria-pressed', button.dataset.lang === lang ? 'true' : 'false');
  });
}

// Updates existing aria-labels; the static document decides which controls
// carry one.
function updateLabels(data: LangData): void {
  document.querySelectorAll<HTMLElement>('[data-panel][aria-label]').forEach((button) => {
    const code = button.dataset.panel;
    if (isContentCode(code)) button.setAttribute('aria-label', data.a11y[code]);
  });
  document.querySelectorAll<HTMLElement>('[data-action="legal"][aria-label]').forEach((button) => {
    button.setAttribute('aria-label', data.a11y.legal);
  });
  document.querySelectorAll<HTMLElement>('[data-action="home"][aria-label]').forEach((button) => {
    button.setAttribute('aria-label', data.a11y.home);
  });
}

function sectionEl(code: string): HTMLElement | null {
  return document.querySelector<HTMLElement>(`main > section[data-code="${code}"]`);
}

// Replaces the text contents of the six semantic sections. The language files
// are schema-identical (build-time check), so every text maps 1:1 onto the
// structure built from the static English version; no node is created or
// removed.
function updateSections(data: LangData): void {
  for (const code of CONTENT_CODES) {
    const section = sectionEl(code);
    if (!section) continue;
    const panel = data.panels[code];
    setText(section.querySelector('.panel-tag'), panel.tag);
    setText(section.querySelector('.panel-title'), panel.title);
    section.querySelectorAll(':scope > p:not(.panel-tag)').forEach((p, i) => {
      setText(p, panel.body[i]);
    });
    section.querySelectorAll('.panel-projects > li').forEach((li, i) => {
      const project = panel.projects?.[i];
      if (!project) return;
      setText(li.querySelector('.project-name'), project.name);
      setText(li.querySelector('.project-status'), project.status);
    });
    section.querySelectorAll('.panel-meta > li').forEach((li, i) => {
      setText(li, panel.meta[i]);
    });
  }
  const legal = sectionEl('0006');
  if (!legal) return;
  setText(legal.querySelector('.panel-title'), data.a11y.legal);
  const lines = Array.from(legal.querySelectorAll('address > p')).concat(
    Array.from(legal.querySelectorAll(':scope > p')).filter((p) => p.querySelector('a') === null),
  );
  lines.forEach((line, i) => setText(line, data.legal.lines[i]));
  const mail = legal.querySelector<HTMLAnchorElement>('a[href^="mailto:"]');
  if (mail) {
    mail.textContent = data.legal.email;
    mail.setAttribute('href', `mailto:${data.legal.email}`);
  }
}

function applyLang(lang: Lang): void {
  active = lang;
  document.documentElement.lang = lang;
  const data = getData(lang);
  markSwitcher(lang);
  updateLabels(data);
  updateSections(data);
  refreshView();
}

// Manual switch: stores the choice; detection alone never writes.
export function setLang(lang: Lang): void {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // storage unavailable; the choice still applies to this visit
  }
  applyLang(lang);
}

export function initLang(): void {
  document.querySelectorAll<HTMLElement>('[data-lang]').forEach((button) => {
    button.addEventListener('click', () => {
      const lang = button.dataset.lang;
      if (isLang(lang)) setLang(lang);
    });
  });
  applyLang(detectLang());
}
