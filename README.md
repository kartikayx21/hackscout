# HackScout

A hackathon aggregator. Scripts collect public events from multiple platforms, Gemini cleans and
enriches them, and a Next.js dashboard lets students filter everything in one place.

## How it works
1. `scraper/sources/*` fetch hackathons from each platform's public data.
2. `scraper/enrich.py` uses Gemini to extract tech stacks, internship mentions and clean city/country.
3. `scraper/main.py` merges, dedupes and writes `public/hackathons.json`.
4. The Next.js app reads that file and offers filters: mode, location (India/Rajasthan/Jaipur),
   prize, internship, tech stack, free entry, and sorting.
5. A GitHub Action refreshes the public data daily.

## Run it
```
# scraper
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r scraper/requirements.txt
# create .env with GEMINI_API_KEY and GEMINI_MODEL
python -m scraper.main

# website
corepack pnpm install
corepack pnpm dev
```

## Limits
Data is a snapshot from the last scraper run. Prize values can include non-cash perks.
Organizer names are missing on some platforms.