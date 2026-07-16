/**
 * StadiumIQ frontend entry point.
 *
 * A tiny hash-based router (#home, #assistant, #map, #venues, #ops) switches
 * the five views; shared context (role/venue/language) lives in the header so
 * every view sees the same selection. No framework, no build step.
 */
import { api } from './js/api.js';
import { state, on, emit } from './js/state.js';
import { initChat, askAssistant, renderSuggestions } from './js/views/chat.js';
import { initHome } from './js/views/home.js';
import { initMap } from './js/views/map.js';
import { initVenues } from './js/views/venues.js';
import { initOps } from './js/views/ops.js';
import {
  restoreSoundPreference,
  setSoundEnabled,
  isSoundEnabled,
  playWhistle,
} from './js/sound.js';

const VIEWS = ['home', 'assistant', 'map', 'venues', 'ops'];
const initialized = new Set();

const INIT = {
  home: initHome,
  assistant: initChat,
  map: initMap,
  venues: initVenues,
  ops: initOps,
};

/* ------------------------------------------------------------- routing --- */

function currentRoute() {
  const hash = window.location.hash.replace('#', '');
  return VIEWS.includes(hash) ? hash : 'home';
}

function showView(name) {
  for (const view of VIEWS) {
    document.getElementById(`view-${view}`).hidden = view !== name;
  }
  for (const link of document.querySelectorAll('.main-nav a')) {
    if (link.dataset.nav === name) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
  // Views that need data initialise on first visit; venues re-checks selection.
  if (!initialized.has(name) || name === 'venues' || name === 'ops') {
    INIT[name]?.();
    initialized.add(name);
  }
  document.getElementById('main').focus({ preventScroll: true });
}

/* --------------------------------------------------------- header setup --- */

function populateSelectors(meta) {
  const role = document.getElementById('role-select');
  const venue = document.getElementById('venue-select');
  const language = document.getElementById('language-select');

  for (const r of meta.roles) role.append(new Option(r.label, r.id));
  for (const v of meta.venues) venue.append(new Option(`${v.name} — ${v.city}`, v.id));
  for (const l of meta.languages) language.append(new Option(l.label, l.code));

  document.getElementById('ai-mode').textContent =
    meta.aiMode === 'gemini' ? `AI: Gemini (${meta.model})` : 'AI: offline mode';

  language.addEventListener('change', () => {
    const lang = meta.languages.find((l) => l.code === language.value);
    if (lang) {
      document.documentElement.lang = lang.code;
      document.documentElement.dir = lang.dir;
    }
  });
}

function initToggles() {
  const contrast = document.getElementById('contrast-toggle');
  const textSize = document.getElementById('text-size-toggle');
  const sound = document.getElementById('sound-toggle');

  if (localStorage.getItem('siq-contrast') === 'high') {
    document.documentElement.dataset.contrast = 'high';
    contrast.setAttribute('aria-pressed', 'true');
  }
  if (localStorage.getItem('siq-textsize') === 'large') {
    document.documentElement.dataset.textsize = 'large';
    textSize.setAttribute('aria-pressed', 'true');
  }
  sound.setAttribute('aria-pressed', String(restoreSoundPreference()));
  sound.textContent = isSoundEnabled() ? '🔊' : '🔇';

  contrast.addEventListener('click', () => {
    const high = document.documentElement.dataset.contrast === 'high';
    document.documentElement.dataset.contrast = high ? '' : 'high';
    contrast.setAttribute('aria-pressed', String(!high));
    localStorage.setItem('siq-contrast', high ? 'normal' : 'high');
  });

  textSize.addEventListener('click', () => {
    const large = document.documentElement.dataset.textsize === 'large';
    document.documentElement.dataset.textsize = large ? '' : 'large';
    textSize.setAttribute('aria-pressed', String(!large));
    localStorage.setItem('siq-textsize', large ? 'normal' : 'large');
  });

  sound.addEventListener('click', () => {
    const enabled = setSoundEnabled(!isSoundEnabled());
    sound.setAttribute('aria-pressed', String(enabled));
    sound.textContent = enabled ? '🔊' : '🔇';
    if (enabled) playWhistle();
  });
}

/* ----------------------------------------------------------------- boot --- */

async function boot() {
  initToggles();

  try {
    state.meta = await api.meta();
    populateSelectors(state.meta);
  } catch {
    document.getElementById('ai-mode').textContent = 'AI: offline mode';
    state.meta = { venues: [], roles: [], languages: [] };
  }

  // Cross-view intents raised by map/venue cards.
  on('navigate', (view) => {
    window.location.hash = `#${view}`;
  });
  on('ask', (question) => {
    // Ensure the chat view is live before sending.
    if (!initialized.has('assistant')) {
      INIT.assistant();
      initialized.add('assistant');
    }
    askAssistant(question);
  });

  window.addEventListener('hashchange', () => showView(currentRoute()));
  showView(currentRoute());

  // Role changes refresh the suggestion chips even if chat isn't open yet.
  document.getElementById('role-select').addEventListener('change', () => {
    if (initialized.has('assistant')) renderSuggestions();
  });
}

boot();
export { emit };
