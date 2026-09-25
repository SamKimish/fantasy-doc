# Fantasy Doc

A mobile-friendly web app that shows which of your starting fantasy NFL players are injured, styled as a
physio room. Enter your Sleeper username and it checks every non-best-ball NFL league you're in.

No backend and no build step: `index.html` calls the public Sleeper and ESPN APIs from the browser.

## What's in here

| File | Purpose |
| --- | --- |
| `index.html` | The whole app |
| `practice.js` | Reads practice status (full / limited / DNP) out of ESPN's injury commentary. Shared by the page and the snapshot job |
| `scripts/snapshot.js` | Records each player's practice days into `practice.json` |
| `.github/workflows/practice-snapshot.yml` | Runs the snapshot every 2 hours |
| `manifest.webmanifest`, `sw.js`, `*.png` | Installable app (home-screen icon, offline shell) |

## Practice trail

ESPN only keeps each player's latest news item, so Wednesday's report is overwritten once Thursday's arrives.
The `Practice snapshot` GitHub Action runs every 2 hours, merges the days it sees into `practice.json` on the
**`data` branch**, and the page reads that file. A new NFL week starts a fresh trail. Days the page can't find
show as dashed grey dots ("not reported"), never as red.

Run it by hand from the Actions tab (`Practice snapshot` > `Run workflow`), or locally:

```bash
node scripts/snapshot.js practice.json
```

GitHub pauses scheduled workflows in a repo with no activity for 60 days; re-enable it from the Actions tab if that happens.

## Run locally

Serve the folder with any static server, e.g. `python -m http.server 8765`.

## Deploy

GitHub Pages serves `main`. The `data` branch is only read by the site, never deployed.
