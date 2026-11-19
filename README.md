[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/Kiowayyy2109/makefun-gta6-trophy-guide-01-v2/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/Kiowayyy2109/makefun-gta6-trophy-guide-01-v2/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

# Leonida Nights — GTA VI Trophy Guide & Tracker

A complete, fully offline trophy guide and progress tracker for all **55 Grand Theft Auto VI PlayStation 5 trophies** (1 platinum, 2 gold, 6 silver, 46 bronze). Open `app/index.html` in a browser — no build step, no server, no network. The app fetches nothing: no external fonts, scripts, images or artwork; the whole “Leonida night” look (harbour-navy gradients, neon pink/cyan, CSS-only patterns) is hand-drawn CSS.

## What’s inside

- **A real guide for every trophy.** Each of the 55 entries in `app/data/trophies.json` keeps its official name, description and grade exactly as published, and adds an original full-length guide, a category (`kind`), a missable flag with a reasoned missable note, practical tips, cited sources, and a structured progress target (`count`) wherever the official list implies one (250 stunts, 42 shooting-range golds, 100 WAiNK points, 500 choices, $250,000 laundered, …). The five teaser-description trophies (Challenging Tank, Personal Best, Actions Speak Louder, Bad Luck I Guess, The Truth Is Out There) are flagged `hidden`, and their guides say plainly what can and cannot be derived from the teaser instead of inventing steps.
- **Road to Platinum roadmap.** Five ordered phases derived from the official descriptions — (1) story playthrough with missable warnings in mission order, (2) stranger strands finished before the finale (the point of no return), (3) open-world activities & collectibles sweep, (4) crime/combat/money run as one economy, (5) cleanup to 100% and the platinum — each with its trophy list, estimated effort and warnings. Estimated total: 60–100 hours. A print stylesheet turns this view into a clean paper roadmap.
- **Missables view.** All 10 missable trophies (the five named stranger-strand finals, Bret’s unique hunt, the VCIA departure, the Rhino encounter, the 500-choices counter, and the fail-then-succeed trophy) with the window in which each can be earned and how it can be lost.
- **Tracker.** Earned toggles and per-trophy progress counters (with −/+ steppers and direct input; reaching a target auto-marks the trophy earned), all persisted in `localStorage`. Dashboard header shows overall completion %, per-grade progress (platinum/gold/silver/bronze) and trophy points (15/30/90/300).
- **Finding things.** Filters by grade, type, missable, earned/unearned and hidden, plus full text search. A spoiler setting blurs/hides hidden and story trophy names and descriptions until they are earned, with a per-trophy reveal in the detail panel.
- **Detail panel.** Per trophy: official description, the full guide, missable note and window, tips, and sources.
- **Portability.** Export progress as a JSON download and import it back on any machine; one-click reset. Keyboard-accessible controls throughout (real buttons/inputs, visible focus, skip link, ARIA labels).

## Data sources

Trophy names, descriptions and grades are the official PlayStation trophy list for Grand Theft Auto VI, as listed by **Exophase** and **PSNProfiles**. Guide text is original to this project; **PowerPyx**, **PlayStationTrophies.org** and **TrueTrophies** are cited per-trophy as further reading and were never copied. Where the official description gives no locations or steps, the guide says so and offers honest general strategy — no invented specifics.

## Running it

- Just open `app/index.html`, or serve it locally: `node serve.ts` → http://localhost:8080
- Hand-in build (what the competition runs): `mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts` — copies `app/` and `screenshots/` to the output directory and writes `dossier.json` via the vendored make.fun library (`vendor/makefun-frontend.ts`, left byte-identical as required).
- Handy URL states: `?view=roadmap`, `?view=missables`, `?detail=<trophy id>`, `?grade=silver`, `?q=<search>`, `?spoiler=off`, and `?demo=1` to preview the tracker with sample progress.

## Screenshots

Four real 1280×800 captures of this app (see `shots.json`): the dashboard + checklist with a trophy guide open in the detail panel, the Road to Platinum roadmap, the Missables view, and a filtered checklist with spoiler protection visibly applied and counted-trophy progress.

## License

MIT — see `LICENSE`. This is an unofficial fan guide; it is not affiliated with Rockstar Games or PlayStation, and contains no Rockstar logos or official artwork.
