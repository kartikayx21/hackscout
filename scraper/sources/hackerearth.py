"""Fetch upcoming hackathons from HackerEarth's public events endpoint."""

from __future__ import annotations

import re
from datetime import date, datetime
from typing import Any
from urllib.parse import urljoin

import requests

from scraper.schema import Hackathon

API_URL = "https://www.hackerearth.com/chrome-extension/events/"
BASE_URL = "https://www.hackerearth.com"
HEADERS = {"Accept": "application/json", "User-Agent": "Mozilla/5.0"}


def _date(value: Any) -> date | None:
    if not isinstance(value, str):
        return None
    value = value.strip()
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00")).date()
    except ValueError:
        pass
    for pattern in ("%b %d, %Y", "%B %d, %Y", "%b %d, %Y %I:%M %p", "%B %d, %Y %I:%M %p"):
        match = re.search(r"[A-Za-z]{3,9} \d{1,2}, \d{4}(?: \d{1,2}:\d{2} [AP]M)?", value)
        if match:
            try:
                return datetime.strptime(match.group(0), pattern).date()
            except ValueError:
                continue
    return None


def _first(raw: dict[str, Any], keys: tuple[str, ...]) -> Any:
    for key in keys:
        if raw.get(key) is not None:
            return raw[key]
    return None


def _is_ended(raw: dict[str, Any], end_date: date | None) -> bool:
    status = _first(raw, ("status", "event_status"))
    if isinstance(status, str) and status.lower() in {"ended", "expired", "closed", "completed"}:
        return True
    return end_date is not None and end_date < date.today()


def _mode(value: Any) -> str | None:
    if not isinstance(value, str):
        return None
    normalized = value.lower()
    if "hybrid" in normalized:
        return "Hybrid"
    if "online" in normalized or "remote" in normalized:
        return "Online"
    if "offline" in normalized or "in-person" in normalized or "campus" in normalized:
        return "Offline"
    return None


def _https_url(value: Any) -> str | None:
    if not isinstance(value, str):
        return None
    candidate = urljoin(BASE_URL, value)
    return candidate if candidate.startswith("https://") else None


def normalize(raw: dict[str, Any]) -> Hackathon:
    """Convert one HackerEarth event into the shared schema."""
    location = _first(raw, ("location", "venue"))
    location = location.strip() if isinstance(location, str) and location.strip() else None
    start_date = _date(_first(raw, ("start", "start_date", "start_timestamp", "start_utc_tz")))
    end_date = _date(_first(raw, ("end", "end_date", "end_timestamp", "end_utc_tz")))
    event_url = _first(raw, ("url", "subscribe"))
    event_url = _https_url(event_url)
    return Hackathon(
        id=str(_first(raw, ("id", "event_id", "url")) or raw.get("title", "")),
        title=raw.get("title") if isinstance(raw.get("title"), str) else "",
        organizer=None,
        source="HackerEarth",
        url=event_url,
        mode=_mode(location) or _mode(_first(raw, ("type", "event_type"))),
        location=location,
        city=None,
        state=None,
        startDate=start_date,
        endDate=end_date,
        registrationDeadline=None,
        prizeText=None,
        prizeAmountINR=None,
        teamSize=None,
        techStack=[],
        hasInternship=None,
        perks=[],
        isFree=None,
    )


def fetch() -> list[dict[str, Any]]:
    """Return active HackerEarth hackathon events."""
    response = requests.get(API_URL, headers=HEADERS, timeout=30)
    response.raise_for_status()
    payload = response.json()
    events = payload.get("response", []) if isinstance(payload, dict) else []
    if not isinstance(events, list):
        raise ValueError("HackerEarth API returned an invalid response collection")
    records = [event for event in events if isinstance(event, dict)]
    if records:
        print(f"HackerEarth raw record keys: {sorted(records[0])}")
        print(
            "HackerEarth fields: start/end dates=start/start_date/start_timestamp and "
            "end/end_date/end_timestamp; status=status; location=location"
        )
    return [
        event
        for event in records
        if (
            "/hackathon/" in str(event.get("url", "")).lower()
            or str(_first(event, ("type", "event_type"))).lower() == "hackathon"
        )
        and not _is_ended(
            event,
            _date(_first(event, ("end", "end_date", "end_timestamp", "end_utc_tz"))),
        )
    ]


if __name__ == "__main__":
    print(len(fetch()))
