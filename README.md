# Famili

Family tree builder and family history book creator. Pure HTML/CSS/JS (pages: `index.html` home, `create.html` studio, `about.html`), no build step, no backend.

## Deploy on GitHub Pages
1. Create a repo and push these files (`index.html`, `styles.css`, `app.js`, `.github/`).
2. Repo **Settings → Pages → Source: GitHub Actions** (or "Deploy from branch" → `main` / root).
3. Push to `main`. The site appears at `https://<username>.github.io/<repo-name>/`.

All paths are relative (`./`), so any subpath works.

## Data
- Auto-saves 500 ms after each change: tree/book JSON in `localStorage`, photos (resized to max 1400px JPEG) in `IndexedDB`.
- **Export JSON** downloads a portable `.famili.json` with embedded images; **Import JSON** restores it on any device.
- Clearing browser data erases the local copy, so export backups regularly.

## Printing
Book & Album Studio → **Print / PDF** → choose "Save as PDF". Enable "Background graphics" if your browser asks.

## Accounts, cloud save, sharing & groups
Without setup, Famili runs in **Local mode**: sign-up/log-in, per-account saved projects, sharing and groups work, but only inside one browser (passwords are PBKDF2-hashed; not a substitute for a server).

For **real cloud accounts that work across devices and users** (still static hosting):
1. Create a free project at supabase.com.
2. SQL Editor → paste and run `supabase.sql` (tables + Row Level Security).
3. Authentication → Providers → Email (turn off "Confirm email" for instant sign-up if you like).
4. Project Settings → API → copy the URL and `anon` key into `config.js`. Authentication → URL Configuration → add your GitHub Pages URL.
5. Push. Sign up, **Save to cloud**, then **Share…** with an email (view/edit) or with a group. Edits autosave to the cloud ~2.5 s after each change; the last save wins.
