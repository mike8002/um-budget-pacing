# UM Budget Pacing

Automated budget pacing dashboard for multi-client media campaign tracking.

## Features

- **Multi-client support** — switch between clients (EK, Modon, Kenvue, etc.)
- **Media plan upload** — upload your plan via Excel, columns matched flexibly
- **Weekly actuals upload** — each upload creates a WoW snapshot
- **Auto-matching** — matches platform actuals to plan by campaign name + platform
- **Pacing calculations** — % Time, % Budget, % Hired, Expected Daily Spend
- **WoW sparklines** — visual spend trajectory across weeks
- **Taxonomy config** — per-client campaign naming convention definition
- **Manual campaign mapper** — override mismatched platform → plan names
- **Excel export** — download filtered pacing report as .xlsx
- **Persistent storage** — data saved in localStorage across sessions

## Setup

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Deploy to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import the GitHub repo
4. Vercel auto-detects Vite — click Deploy
5. Done

## How to use

1. Select a client (or click **Try Sample** to load demo data)
2. Go to **Upload** tab → upload your media plan Excel
3. Upload platform actuals each week (each upload = 1 weekly snapshot)
4. Switch to **Pacing** tab to see budget tracking with WoW trends
5. Use **Taxonomy** tab to configure campaign naming rules and manual mappings
6. **Export** button downloads filtered view as .xlsx

## Media Plan columns (flexible matching)

| Field | Accepted column names |
|-------|----------------------|
| Campaign | campaign, campaign name, ga campaign name |
| Country | country, market |
| Platform | platform, channel |
| Start Date | start date, flight start |
| End Date | end date, flight end |
| Budget | budget, media cost, net cost |
| Hired Units | hired units, hired, booked units |
| Lead | lead, owner |

## Platform Actuals columns

| Field | Accepted column names |
|-------|----------------------|
| Campaign | campaign, ga_campaignname |
| Platform | platform, channel, source |
| Cost | cost, spend, spends to date |
| Delivered | delivered, impressions |
