# ⚽ StadiumIQ — GenAI Smart Stadium & Tournament Operations Assistant

> A role-aware, multilingual **Generative-AI assistant** for the **FIFA World Cup 2026** that helps fans, volunteers, venue staff and organizers with navigation, crowd management, accessibility, transport, sustainability and real-time operational decisions — powered by **Google Gemini** function-calling.

![Node](https://img.shields.io/badge/Node.js-%E2%89%A518.17-339933?logo=node.js&logoColor=white)
![Gemini](https://img.shields.io/badge/AI-Google%20Gemini-4285F4?logo=google&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow)
![Tests](https://img.shields.io/badge/tests-37%20passing-brightgreen)

---

## 1. Challenge & chosen vertical

**Challenge 4 – Smart Stadiums & Tournament Operations.** Build a GenAI solution that improves the stadium and tournament experience across navigation, crowd management, accessibility, transportation, sustainability, multilingual assistance, operational intelligence and real-time decision support.

**Primary persona (my chosen vertical): the Fan — a match-day companion.** A first-time visitor arriving at an unfamiliar stadium in one of 16 cities across three countries, possibly speaking another language, possibly with accessibility needs, needing calm, correct answers *fast*.

**The insight that shapes the design:** the hardest problems for fans, volunteers, staff and organizers are the *same underlying questions* asked from different viewpoints (“where is X”, “how busy is Y”, “what should I do about Z”). So StadiumIQ uses **one GenAI brain that adapts to the user’s role** — the Fan is the flagship, and the very same engine serves volunteers, venue staff and organizers by changing its tone, priorities and, crucially, its **permissions**. That role-adaptation *is* the “logical decision making based on user context” the brief asks for, and it lets a single, clean solution cover **all eight verticals** instead of one.

---

## 2. Approach & logic

StadiumIQ is a **tool-using AI agent**, not a chatbot that guesses.

1. The user asks a question in natural language. The frontend sends it with **context**: role, venue, language, mobility needs.
2. Gemini receives a **role-specific system prompt** and a set of **function declarations** (the only tools that role is allowed to use).
3. Gemini decides *which* tool(s) to call and with *what* arguments — e.g. `plan_route_to_seat({ section: "114", mobilityNeeds: true })`.
4. The server executes those tools. **All real logic and data live in deterministic, unit-tested functions** — so gate numbers, transit lines and crowd advice are *computed*, never hallucinated.
5. Gemini turns the structured results into a short, friendly answer **in the user’s language**.

```
 User (role, venue, language, needs)
        │  "How do I get to section 114? I use a wheelchair"
        ▼
┌─────────────────────────────────────────────────────────┐
│  Express API  → validate → build role-aware system prompt │
└─────────────────────────────────────────────────────────┘
        │  contents + allowed tool declarations
        ▼
┌───────────────┐  functionCall: plan_route_to_seat(...)   ┌──────────────────────┐
│  Google Gemini │ ───────────────────────────────────────▶ │  Tool decision engine │
│  (2.5 Flash)   │ ◀─────────────────────────────────────── │  (authorized, tested) │
└───────────────┘  functionResponse: { gate, steps, crowd } └──────────────────────┘
        │  final natural-language answer (localized)
        ▼
     Accessible chat UI
```

<p align="center"><img src="docs/architecture.svg" alt="StadiumIQ architecture: user and web UI talk to the Express API, which runs a Gemini function-calling loop against a deterministic, role-authorized decision engine" width="760"></p>

**No API key? It still works.** If `GEMINI_API_KEY` is absent (or a live call fails), StadiumIQ falls back to an **offline rule-based engine** that classifies intent and calls the *same* tools. The project is therefore always runnable and testable — Gemini upgrades the experience (free-form reasoning + full multilingual), it isn’t a hard dependency.

---

## 3. What it does — every vertical, mapped

| # | Vertical (from the brief) | Feature in StadiumIQ | Tool(s) |
|---|---|---|---|
| 1 | **Navigation** | Best gate + step-by-step route to any seat section | `get_venue_guide`, `plan_route_to_seat` |
| 2 | **Crowd management** | Live crowd density, queue estimates, quieter-gate advice | `get_crowd_status` |
| 3 | **Accessibility** | Step-free routing, wheelchair/sensory/hearing/vision services | `get_accessibility_services` (+ accessibility-first routing) |
| 4 | **Transportation** | Rail / shuttle / rideshare / parking comparison, arrive & depart | `plan_transport` |
| 5 | **Sustainability** | Recycling, reusable cups, water refill, low-emission travel nudges | `get_sustainability_tips` (+ transport nudge) |
| 6 | **Multilingual assistance** | Replies in English, Spanish, French, Portuguese, German, Arabic (RTL) | Gemini + language context |
| 7 | **Operational intelligence** | Report incidents (routed to the right team) + live ops brief | `report_incident`, `get_operations_brief` |
| 8 | **Real-time decision support** | Crowd- and time-aware recommendations; calm safety guidance | `get_crowd_status`, `get_safety_guidance` |

**16 host venues** across the USA, Canada and Mexico are included (MetLife, SoFi, Mercedes-Benz, AT&T, NRG, Arrowhead, Gillette, Hard Rock, Lincoln Financial, Levi’s, Lumen, plus BMO Field, BC Place, Estadio Azteca, Estadio Akron and Estadio BBVA).

### Role-based logic & permissions
| Role | Priorities | Extra powers |
|---|---|---|
| **Fan** | navigation, accessibility, transport, amenities | — |
| **Volunteer** | + crowd, safety | can `report_incident` |
| **Venue staff** | crowd, operations, safety | `report_incident`, `get_operations_brief` |
| **Organizer** | operations, sustainability | `report_incident`, `get_operations_brief` |

Authorization is enforced **server-side in the tool dispatcher** — even a prompt-injected message can’t make a Fan log incidents.

---

## 4. Tech stack

- **Runtime:** Node.js (ESM), Express 4
- **GenAI:** Google Gemini via the official [`@google/genai`](https://www.npmjs.com/package/@google/genai) SDK, with **function calling**
- **Frontend:** dependency-free vanilla HTML/CSS/JS (keeps the repo tiny and the UI fast)
- **Security:** helmet, CORS allow-list, express-rate-limit, strict input validation
- **Testing:** Node’s built-in `node:test` (zero test dependencies)

---

## 5. Project structure

```
stadiumiq/
├── public/                 # Accessible, multilingual vanilla frontend
│   ├── index.html          #   Semantic markup, ARIA, skip-link
│   ├── styles.css          #   Light/dark, high-contrast, larger-text, RTL, reduced-motion
│   └── app.js              #   Chat controller (XSS-safe rendering)
├── src/
│   ├── server.js           # Executable entry point (npm start)
│   ├── app.js              # Express app factory + security middleware
│   ├── config.js           # Single validated config from env
│   ├── data/venues.js      # 16 venues + DRY shared operations profile
│   ├── domain/
│   │   ├── roles.js        # Personas + per-role tool authorization
│   │   └── languages.js    # Supported languages (with RTL flag)
│   ├── middleware/         # errorHandler, validateChat
│   ├── routes/             # chat.js (/api/chat), meta.js (/api/meta, /api/health)
│   ├── services/
│   │   ├── assistant.js    # Orchestrator: Gemini function-call loop + fallback
│   │   ├── geminiClient.js # Thin, mockable SDK wrapper
│   │   ├── offlineEngine.js# Deterministic no-key reasoning
│   │   ├── prompt.js       # Context-aware system prompt + guardrails
│   │   ├── venueService.js # Merges venue overrides onto the base profile
│   │   ├── crowdModel.js   # Pure crowd-density model
│   │   ├── incidentStore.js# In-memory incident log
│   │   └── tools/          # The decision engine (8 modules + registry)
│   └── utils/              # logger.js, validation.js
├── test/                   # 37 tests: tools, crowd, validation, offline, assistant, API
├── .env.example            # Copy to .env
├── .gitignore              # Ignores node_modules & .env (repo stays < 10 MB)
├── LICENSE                 # MIT
└── README.md
```

---

## 6. Getting started

### Prerequisites
- Node.js **≥ 18.17** (works on Node 24)
- *(Optional)* a free Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey)

### Install & run
```bash
git clone https://github.com/<your-username>/stadiumiq.git
cd stadiumiq
npm install

cp .env.example .env        # then paste your GEMINI_API_KEY (optional)

npm start                   # http://localhost:3000
```
Open **http://localhost:3000**, choose a role and venue, and start asking. With no key you’re in **offline mode**; add a key for full Gemini reasoning and multilingual replies.

### Configuration (`.env`)
| Variable | Default | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | *(empty)* | Enables Gemini. Empty → offline mode. |
| `GEMINI_MODEL` | `gemini-2.5-flash` | Free-tier model. Swap for `gemini-3-flash` etc. |
| `PORT` | `3000` | HTTP port |
| `NODE_ENV` | `development` | `production` hides error detail |
| `CORS_ORIGIN` | `*` | Comma-separated allow-list |
| `RATE_LIMIT_WINDOW_MINUTES` / `RATE_LIMIT_MAX_REQUESTS` | `15` / `60` | API rate limiting |

---

## 7. API

| Method & path | Description |
|---|---|
| `GET /api/health` | Liveness + active AI mode |
| `GET /api/meta` | Venues, roles and languages for the UI |
| `POST /api/chat` | Body `{ messages: [{role, content}], context: { role, venueId, language, mobilityNeeds } }` → `{ reply, toolsUsed, mode }` |

---

## 8. Testing

```bash
npm test
```
37 tests, no external dependencies, covering:
- **Decision engine** — routing, accessibility-first logic, dietary options, transport nudges, graceful errors.
- **Authorization** — fans cannot call staff-only tools; staff can and incidents are routed.
- **Crowd model** — arrival/egress curve, express-gate relief, bounds.
- **Validation** — shape/limit enforcement, defaults, clamping.
- **Offline engine** — intent classification.
- **Assistant** — the full Gemini function-call loop driven by a **mocked** client, plus the offline fallback path.
- **API** — health, meta and chat over real HTTP (in-process, offline).

---

## 9. Evaluation-criteria checklist

- **Problem-statement alignment** — one persona-led design covering *all eight* verticals across all 16 venues; features mapped in §3.
- **Code quality** — small single-responsibility ESM modules, JSDoc, injectable dependencies, DRY data, consistent style.
- **Security** — see §10.
- **Efficiency** — lean dependency set, in-memory data (no DB), capped tool-loop & trimmed history, stateless server, offline mode avoids needless API calls.
- **Testing** — see §8.
- **Accessibility** — see §11.

## 10. Security measures
- Secrets only via `.env` (gitignored); `.env.example` documents them.
- `helmet` security headers + strict **Content-Security-Policy**.
- **Server-side role authorization** on every tool call (never trusted to the model).
- Strict input validation & length caps; 128 kB body limit; API rate limiting; CORS allow-list.
- **Prompt-injection guardrails** in the system prompt; permissions fixed by the system, not the conversation.
- Errors are logged server-side and **never leak stack traces** to clients in production.
- Frontend renders replies with `textContent` only (no `innerHTML`) — no XSS.
- `npm audit`: **0 vulnerabilities**.

## 11. Accessibility features
- Semantic HTML, a **skip link**, labelled controls, and an `aria-live` conversation log that announces replies to screen readers.
- Full **keyboard** operation; visible `:focus-visible` outlines; focus returns to the input after each reply.
- **High-contrast** and **larger-text** toggles (persisted), plus automatic light/dark and **reduced-motion** support.
- **RTL** layout for Arabic and multilingual replies.
- Accessibility is also a *product feature*: “Step-free routes” context makes every answer prioritise accessible options.

---

## 12. Assumptions
- **Stadium *metadata* is real** (names, cities, capacities, coordinates). Fine-grained **operational data** (gate compass positions, shuttle names, live crowd numbers, incidents) is **realistic but illustrative** — a production build would stream these from each venue’s operations, transit and CCTV/turnstile APIs. This is isolated in `src/data/` and the tool layer so real feeds can be dropped in without touching the AI logic.
- Crowd density is modelled from the well-known match-day arrival/egress curve rather than live sensors.
- Incidents are stored in memory for the demo (a production build would use Firestore).
- In **offline mode** replies are English-only; full multilingual needs a Gemini key.

## 13. Roadmap
- Live data feeds (transit GTFS-RT, turnstile counts, incident systems).
- Deploy on **Google Cloud Run** + **Firebase Hosting** (static frontend); persist incidents in **Firestore**.
- Streaming responses and voice input for hands-free, eyes-free help.

## License
[MIT](LICENSE)
