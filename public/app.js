/**
 * StadiumIQ frontend controller (vanilla ES module, no dependencies).
 *
 * Responsibilities:
 *  - load metadata (venues / roles / languages) and populate the UI,
 *  - keep the conversation history and talk to POST /api/chat,
 *  - manage accessibility preferences (contrast, text size, language/RTL),
 *  - render messages safely (textContent only — never innerHTML).
 */

const els = {
  log: document.getElementById('chat-log'),
  form: document.getElementById('chat-form'),
  input: document.getElementById('chat-input'),
  send: document.getElementById('send-btn'),
  role: document.getElementById('role-select'),
  venue: document.getElementById('venue-select'),
  language: document.getElementById('language-select'),
  mobility: document.getElementById('mobility-toggle'),
  contrast: document.getElementById('contrast-toggle'),
  textSize: document.getElementById('text-size-toggle'),
  aiMode: document.getElementById('ai-mode'),
  suggestions: document.getElementById('suggestions'),
};

/** In-memory conversation history sent with each request. */
const history = [];
let languages = [];

const SUGGESTIONS = {
  fan: [
    'How do I get to section 114?',
    "Where's the nearest halal food?",
    'How busy is it right now?',
    'Is there wheelchair access to my seat?',
    'Best way to get here by transit?',
  ],
  volunteer: [
    'A fan needs step-free access to section 210',
    'How busy is the main concourse?',
    'Where is the nearest first-aid station?',
  ],
  staff: [
    'Give me an operations brief',
    'Report a medical incident at section 130',
    'What are the crowd levels for egress?',
  ],
  organizer: [
    'Operations brief please',
    'Sustainability summary for this venue',
    'Crowd status 15 minutes before kickoff',
  ],
};

/* ---------------------------------------------------------------- helpers */

/** Build the request context from the current UI state. */
function currentContext() {
  return {
    role: els.role.value,
    venueId: els.venue.value,
    language: els.language.value,
    mobilityNeeds: els.mobility.checked,
  };
}

/** Append a chat bubble. `text` is inserted as textContent (XSS-safe). */
function addMessage(text, who) {
  const el = document.createElement('div');
  el.className = `msg ${who}`;
  const label = document.createElement('span');
  label.className = 'who';
  label.textContent = who === 'user' ? 'You' : 'StadiumIQ';
  const body = document.createElement('span');
  body.textContent = text;
  el.append(label, body);
  els.log.append(el);
  els.log.scrollTop = els.log.scrollHeight;
  return el;
}

function setBusy(busy) {
  els.send.disabled = busy;
  els.input.disabled = busy;
}

/* ------------------------------------------------------------- rendering  */

function renderSuggestions() {
  els.suggestions.replaceChildren();
  for (const q of SUGGESTIONS[els.role.value] ?? SUGGESTIONS.fan) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip';
    chip.textContent = q;
    chip.addEventListener('click', () => {
      els.input.value = q;
      els.input.focus();
    });
    els.suggestions.append(chip);
  }
}

function applyLanguage(code) {
  const lang = languages.find((l) => l.code === code);
  if (!lang) return;
  document.documentElement.lang = lang.code;
  document.documentElement.dir = lang.dir;
}

/* --------------------------------------------------------------- network  */

async function sendMessage(text) {
  addMessage(text, 'user');
  history.push({ role: 'user', content: text });

  const typing = document.createElement('div');
  typing.className = 'typing';
  typing.textContent = 'StadiumIQ is thinking…';
  els.log.append(typing);
  els.log.scrollTop = els.log.scrollHeight;
  setBusy(true);

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: history, context: currentContext() }),
    });
    typing.remove();

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      addMessage(err.message || 'Sorry, something went wrong. Please try again.', 'bot');
      return;
    }

    const data = await res.json();
    addMessage(data.reply, 'bot');
    history.push({ role: 'assistant', content: data.reply });
  } catch {
    typing.remove();
    addMessage('I could not reach the server. Please check your connection and try again.', 'bot');
  } finally {
    setBusy(false);
    els.input.focus();
  }
}

/* ----------------------------------------------------------------- init   */

async function loadMeta() {
  const res = await fetch('/api/meta');
  const meta = await res.json();
  languages = meta.languages;

  for (const r of meta.roles) {
    els.role.append(new Option(r.label, r.id));
  }
  for (const v of meta.venues) {
    els.venue.append(new Option(`${v.name} — ${v.city}`, v.id));
  }
  for (const l of meta.languages) {
    els.language.append(new Option(l.label, l.code));
  }

  els.aiMode.textContent =
    meta.aiMode === 'gemini' ? `AI: Gemini (${meta.model})` : 'AI: offline mode';
}

function restorePreferences() {
  if (localStorage.getItem('siq-contrast') === 'high') {
    document.documentElement.dataset.contrast = 'high';
    els.contrast.setAttribute('aria-pressed', 'true');
  }
  if (localStorage.getItem('siq-textsize') === 'large') {
    document.documentElement.dataset.textsize = 'large';
    els.textSize.setAttribute('aria-pressed', 'true');
  }
}

function wireEvents() {
  els.form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = els.input.value.trim();
    if (!text) return;
    els.input.value = '';
    els.input.style.height = 'auto';
    sendMessage(text);
  });

  // Enter to send, Shift+Enter for newline.
  els.input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      els.form.requestSubmit();
    }
  });

  // Auto-grow textarea.
  els.input.addEventListener('input', () => {
    els.input.style.height = 'auto';
    els.input.style.height = `${els.input.scrollHeight}px`;
  });

  els.role.addEventListener('change', renderSuggestions);
  els.language.addEventListener('change', () => applyLanguage(els.language.value));

  els.contrast.addEventListener('click', () => {
    const high = document.documentElement.dataset.contrast === 'high';
    document.documentElement.dataset.contrast = high ? '' : 'high';
    els.contrast.setAttribute('aria-pressed', String(!high));
    localStorage.setItem('siq-contrast', high ? 'normal' : 'high');
  });

  els.textSize.addEventListener('click', () => {
    const large = document.documentElement.dataset.textsize === 'large';
    document.documentElement.dataset.textsize = large ? '' : 'large';
    els.textSize.setAttribute('aria-pressed', String(!large));
    localStorage.setItem('siq-textsize', large ? 'normal' : 'large');
  });
}

async function init() {
  restorePreferences();
  wireEvents();
  try {
    await loadMeta();
  } catch {
    els.aiMode.textContent = 'AI: offline mode';
  }
  renderSuggestions();
  applyLanguage(els.language.value);
  addMessage(
    'Welcome to StadiumIQ! ⚽ Pick your role and venue above, then ask me anything about getting to your seat, transport, accessibility, food, crowds or staying green.',
    'bot',
  );
  els.input.focus();
}

init();
