# 🧭 StadiumIQ — Your Step-by-Step Guide

This guide lists **everything you need to do yourself** — from running the app locally, to turning on Google Gemini + Firebase, to deploying on Google Cloud, to submitting the hackathon.

Follow the level that matches how far you want to go. **Level 1 alone is enough for a valid, working submission.**

- [Level 0 — Prerequisites](#level-0--prerequisites-one-time)
- [Level 1 — Run it locally (5 min, $0)](#level-1--run-it-locally-5-min-0)
- [Level 2 — Turn on Google Gemini AI (5 min, free)](#level-2--turn-on-google-gemini-ai-5-min-free)
- [Level 3 — Turn on Cloud Firestore (10 min, free tier)](#level-3--turn-on-cloud-firestore-10-min-free-tier)
- [Level 4 — Deploy to Google Cloud Run (optional, live URL)](#level-4--deploy-to-google-cloud-run-optional-live-url)
- [Level 5 — Firebase Hosting for the frontend (optional)](#level-5--firebase-hosting-for-the-frontend-optional)
- [Final — Submit the hackathon](#final--submit-the-hackathon)
- [Troubleshooting](#troubleshooting)

---

## Level 0 — Prerequisites (one-time)

You already have most of this. Confirm:

- [ ] **Node.js ≥ 18.17** installed → check with `node --version`
- [ ] **Git** installed → `git --version`
- [ ] A **Google account** (for Gemini + Firebase — you have the Firebase Spark plan)
- [ ] The repo is on GitHub and **public**: https://github.com/PrashantDevX/stadiumiq

> ⚠️ **Confirm the account.** The repo was pushed under **PrashantDevX**. If you must submit from a different GitHub account, tell me before you submit — the challenge allows only **1 attempt**.

---

## Level 1 — Run it locally (5 min, $0)

This proves the project works. No keys, no cloud — it uses the built-in offline engine.

```bash
# 1. Clone (or just open the folder you already have)
git clone https://github.com/PrashantDevX/stadiumiq.git
cd stadiumiq

# 2. Install dependencies
npm install

# 3. Start the server
npm start
```

- [ ] Open **http://localhost:3000** in your browser.
- [ ] Pick a **role** (Fan / Volunteer / Staff / Organizer) and a **venue**.
- [ ] Try the suggested questions or type your own (e.g. *“How do I get to section 114 and is it accessible?”*).
- [ ] Run the tests to show functionality is validated:
  ```bash
  npm test
  ```
  You should see **43 tests passing**.

✅ At this point you have a fully working submission.

---

## Level 2 — Turn on Google Gemini AI (5 min, free)

This upgrades the assistant from the offline engine to **real Generative AI** with free-form reasoning and true multilingual replies. Uses your Google account (free tier).

1. Go to **https://aistudio.google.com/apikey** and sign in.
2. Click **Create API key** → **Create API key in new project** (or pick your existing Google Cloud project).
3. Copy the key (it looks like `AIza...`).
4. In the project folder, create your env file:
   ```bash
   # Windows (PowerShell/CMD):  copy .env.example .env
   # Mac/Linux/Git Bash:        cp .env.example .env
   ```
5. Open **`.env`** and paste your key:
   ```env
   GEMINI_API_KEY=AIzaXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   ```
6. Restart the server:
   ```bash
   npm start
   ```

- [ ] The badge at the top-right should now read **“AI: Gemini (gemini-2.5-flash)”**.
- [ ] Switch the language to **Español** or **العربية** and ask a question — replies now come back in that language (Arabic also flips the layout right-to-left).

> 🔒 **Never commit `.env`.** It is already in `.gitignore`, so you’re safe. If you ever paste a key into a tracked file by accident, delete the key in Google AI Studio and make a new one.

---

## Level 3 — Turn on Cloud Firestore (10 min, free tier)

This makes logged incidents **persist** in Google Cloud Firestore (your Firebase project) instead of memory — a real Firebase integration. Works on the **Spark (free) plan**.

### 3a. Create the Firestore database
1. Go to the **Firebase console**: https://console.firebase.google.com
2. Open your project (or **Add project** — you can reuse the Google Cloud project from Level 2).
3. In the left menu: **Build → Firestore Database → Create database**.
4. Choose **Production mode**, pick a location, and click **Enable**.

### 3b. Get a service-account key (for local use)
1. Firebase console → ⚙️ **Project settings → Service accounts**.
2. Click **Generate new private key** → confirm → a JSON file downloads.
3. Move that file somewhere **outside** the repo (or keep it in the folder — it’s gitignored as `serviceAccount*.json`). **Never commit it.**

### 3c. Point the app at Firestore
Add these to your **`.env`** (replace with your values):
```env
FIREBASE_PROJECT_ID=your-firebase-project-id
GOOGLE_APPLICATION_CREDENTIALS=C:/absolute/path/to/serviceAccount.json
```
Restart:
```bash
npm start
```

- [ ] The startup log should say `persistence: firestore` and `Cloud Firestore connected (REST)`.
- [ ] Visit **http://localhost:3000/api/health** — it should show `"persistence":"firestore"`.
- [ ] As **Staff**, ask *“Report a medical incident at section 130”*, then check the **Firestore Database** in the Firebase console — a new document appears in the **`incidents`** collection. 🎉

### 3d. (Recommended) Publish the security rules
Keeps the database locked to backend-only writes:
```bash
npm install -g firebase-tools     # if not already installed
firebase login
cp .firebaserc.example .firebaserc  # then edit it to your project id
firebase deploy --only firestore:rules
```

---

## Level 4 — Deploy to Google Cloud Run (optional, live URL)

Gives you a **public URL** running the full app. Cloud Run has a generous always-free tier, but **requires a billing account (Blaze plan)** to be attached — real cost at demo scale is effectively **$0**. If you’d rather not enable billing, skip this; local + screenshots are fine for the submission.

1. Install the **gcloud CLI**: https://cloud.google.com/sdk/docs/install
2. Log in and select your project:
   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```
3. Deploy straight from source (uses the included `Dockerfile`):
   ```bash
   gcloud run deploy stadiumiq \
     --source . \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars GEMINI_API_KEY=YOUR_KEY,FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
   ```
4. When it finishes, gcloud prints a **Service URL** like `https://stadiumiq-xxxx.run.app` — open it. Firestore works automatically here (no key file needed — Cloud Run supplies credentials).

- [ ] Put that URL in your README / submission as the live demo.

---

## Level 5 — Firebase Hosting for the frontend (optional)

Serves the UI on Google’s CDN and proxies `/api` to your Cloud Run service (needs Level 4 done and the Blaze plan).

```bash
firebase login
cp .firebaserc.example .firebaserc   # edit to your project id
firebase deploy --only hosting
```
`firebase.json` is already configured to serve `public/` and rewrite `/api/**` to the `stadiumiq` Cloud Run service.

---

## Final — Submit the hackathon

Double-check the **rules** (any of these failing means your entry may not be evaluated):

- [ ] Repository is **public** ✅ (already verified)
- [ ] Repository has **only one branch** (`main`) ✅
- [ ] Repository size **< 10 MB** ✅ (~260 KB)
- [ ] `.env` and service-account keys are **not** committed ✅ (gitignored)

Then:

1. Make sure your latest work is pushed:
   ```bash
   git add -A
   git commit -m "docs: final polish"
   git push origin main
   ```
2. Copy your repo link: **https://github.com/PrashantDevX/stadiumiq**
3. Paste it into the Hack2Skill submission form.
4. The README already contains the four required sections: **chosen vertical**, **approach & logic**, **how it works**, and **assumptions**.

> Remember: **1 attempt only.** Do a final read of the README on GitHub (check the images render) before you submit.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| Badge says “offline” after adding a key | Make sure the file is named exactly `.env` (not `.env.txt`), the line is `GEMINI_API_KEY=...` with no quotes, and you **restarted** `npm start`. |
| `429` / quota errors from Gemini | Free tier has per-minute limits — wait a minute, or switch `GEMINI_MODEL` in `.env` to `gemini-2.5-flash-lite`. |
| `persistence` stays `in-memory` | Check `FIREBASE_PROJECT_ID` is set and `GOOGLE_APPLICATION_CREDENTIALS` points to a real file path. Look at the startup warning line for the reason. |
| Port already in use | Set a different port: `PORT=3001 npm start`. |
| `npm test` fails | Ensure Node ≥ 18.17 (`node --version`) and run `npm install` first. |
| Accidentally committed a secret | Delete/rotate the key in Google AI Studio or Firebase, then remove the file and commit again. |

Need any of these steps done for you, or a live Cloud Run URL set up? Just ask.
