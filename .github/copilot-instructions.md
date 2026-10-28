# HackScout project context

HackScout is an AI web scraper that collects hackathons from multiple platforms
(Devfolio, Unstop, Devpost, and MLH), uses Gemini to clean and enrich each
record, and saves one combined file at `public/hackathons.json`. The Next.js
dashboard reads that file so students can see all hackathons in one place.
Filters cover mode (online/offline/hybrid), location feasibility
(Rajasthan/Jaipur/nearby/anywhere in India), prize money, internship
opportunity, tech stack, free entry, and deadline.

## Rules

- The final demo must use real scraped data; do not add mock data.
- Do not add a database or authentication.
- Use free tools only, including Gemini's free tier through Google AI Studio.
- Keep the Gemini key in `.env`; never commit it.
- Keep the implementation simple.
- Do not redesign the existing UI.

## Architecture

```text
scraper/sources/*.py (one file per platform, fetch() returns raw records,
prefer the site's JSON endpoints over HTML parsing)
-> scraper/enrich.py (Gemini normalizes: techStack[], hasInternship,
prizeAmountINR, city, state, mode; strict JSON, validate with pydantic,
retry once)
-> scraper/main.py (runs all sources, tolerates one failing, dedupes,
sorts by deadline, writes public/hackathons.json)
-> frontend fetches /hackathons.json
```

## Hackathon schema

Each item must contain:

```text
id, title, organizer, source, url, mode, location, city, state, startDate,
endDate, registrationDeadline, prizeText, prizeAmountINR, teamSize,
techStack[], hasInternship, perks[], isFree, scrapedAt
```
