/**
 * AI Assistant view — chat with markdown-rendered replies.
 */
import { api } from '../api.js';
import { state } from '../state.js';
import { renderMarkdownNodes } from '../markdown.js';
import { playWhistle, playCrowd } from '../sound.js';

const els = {
  log: document.getElementById('chat-log'),
  form: document.getElementById('chat-form'),
  input: document.getElementById('chat-input'),
  send: document.getElementById('send-btn'),
  role: document.getElementById('role-select'),
  venue: document.getElementById('venue-select'),
  language: document.getElementById('language-select'),
  mobility: document.getElementById('mobility-toggle'),
  suggestions: document.getElementById('suggestions'),
};

const SUGGESTIONS = {
  fan: [
    'How do I get to section 114?',
    "Where's the nearest halal food?",
    'When is the final?',
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
    'Which matches are left this week?',
  ],
};

function currentContext() {
  return {
    role: els.role.value,
    venueId: els.venue.value,
    language: els.language.value,
    minutesToKickoff: state.minutesToKickoff,
    isEgress: state.isEgress,
    mobilityNeeds: els.mobility.checked,
  };
}

/**
 * Append a chat bubble. User text stays plain text; bot replies are rendered
 * through the sanitising markdown renderer (escapes everything first).
 */
function addMessage(text, who) {
  const el = document.createElement('div');
  el.className = `msg ${who}`;
  const label = document.createElement('span');
  label.className = 'who';
  label.textContent = who === 'user' ? 'You' : 'StadiumIQ';
  el.append(label);

  if (who === 'bot') {
    const body = document.createElement('div');
    body.append(renderMarkdownNodes(text));
    el.append(body);
  } else {
    const body = document.createElement('span');
    body.textContent = text;
    el.append(body);
  }

  els.log.append(el);
  els.log.scrollTop = els.log.scrollHeight;
  return el;
}

function setBusy(busy) {
  els.send.disabled = busy;
  els.input.disabled = busy;
}

export function renderSuggestions() {
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

async function sendMessage(text) {
  addMessage(text, 'user');
  state.history.push({ role: 'user', content: text });
  playWhistle();

  const typing = document.createElement('div');
  typing.className = 'typing';
  typing.textContent = 'StadiumIQ is thinking…';
  els.log.append(typing);
  els.log.scrollTop = els.log.scrollHeight;
  setBusy(true);

  try {
    const data = await api.chat(state.history, currentContext());
    typing.remove();
    addMessage(data.reply, 'bot');
    state.history.push({ role: 'assistant', content: data.reply });
    playCrowd();
  } catch (err) {
    typing.remove();
    addMessage(err.message || 'I could not reach the server. Please try again.', 'bot');
  } finally {
    setBusy(false);
    els.input.focus();
  }
}

/** Pre-fill and send a question programmatically (used by other views). */
export function askAssistant(question) {
  els.input.value = '';
  sendMessage(question);
}

export function initChat() {
  els.form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = els.input.value.trim();
    if (!text) return;
    els.input.value = '';
    els.input.style.height = 'auto';
    sendMessage(text);
  });

  els.input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      els.form.requestSubmit();
    }
  });

  els.input.addEventListener('input', () => {
    els.input.style.height = 'auto';
    els.input.style.height = `${els.input.scrollHeight}px`;
  });

  els.role.addEventListener('change', renderSuggestions);
  renderSuggestions();

  addMessage(
    'Welcome to StadiumIQ! ⚽ Pick your **role** and **venue** above, then ask me anything — routes to your seat, transport, accessibility, food, crowds, the match schedule or staying green.',
    'bot',
  );
}
