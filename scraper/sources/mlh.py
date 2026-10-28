"""Fetch upcoming MLH events from the season page's embedded JSON payload."""

from __future__ import annotations

import json
from datetime import date, datetime
from typing import Any

import requests
from bs4 import BeautifulSoup

from scraper.schema import Hackathon

SEASON_URL = "https://www.mlh.com/seasons/2027/events"
SITE_URL = "https://www.mlh.com"
HEADERS = {"Accept": "text/html", "User-Agent": "Mozilla/5.0"}


def fetch() -> list[dict[str, Any]]:
    """Return upcoming MLH event records from the embedded application JSON."""
    response = requests.get(SEASON_URL, headers=HEADERS, timeout=30)
    response.raise_for_status()
    soup = BeautifulSoup(response.text, "html.parser")
    page_script = soup.find("script", attrs={"data-page": "app"})
    if page_script is None or not page_script.string:
        raise ValueError("MLH page did not contain its application data script")
    payload = json.loads(page_script.string)
    events = payload.get("props", {}).get("upcomingEvents", [])
    if not isinstance(events, list):
        raise ValueError("MLH application data contains an invalid events collection")
    return [event for event in events if isinstance(event, dict)]


def _date(value: Any) -> date | None:
    if not isinstance(value, str):
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00")).date()
    except ValueError:
        return None


def _mode(value: Any) -> str | None:
    if not isinstance(value, str):
        return None
    normalized = value.lower()
    if "hybrid" in normalized:
        return "Hybrid"
    if "digital" in normalized or "online" in normalized:
        return "Online"
    if "physical" in normalized or "in_person" in normalized or "in person" in normalized:
        return "Offline"
    return None


def _location(raw: dict[str, Any]) -> tuple[str | None, str | None, str | None]:
    venue = raw.get("venueAddress")
    venue = venue if isinstance(venue, dict) else {}
    location = raw.get("location")
    location = location.strip() if isinstance(location, str) and location.strip() else None
    city = venue.get("city") if isinstance(venue.get("city"), str) else None
    state = venue.get("state") if isinstance(venue.get("state"), str) else None
    return location, city, state


def normalize(raw: dict[str, Any]) -> Hackathon:
    """Convert one MLH event record into the shared schema."""
    location, city, state = _location(raw)
    event_url = raw.get("url")
    if isinstance(event_url, str) and event_url.startswith("/"):
        event_url = f"{SITE_URL}{event_url}"
    elif not isinstance(event_url, str):
        event_url = raw.get("websiteUrl") if isinstance(raw.get("websiteUrl"), str) else None

    custom_fields = raw.get("customFields")
    custom_fields = custom_fields if isinstance(custom_fields, dict) else {}
    focus = custom_fields.get("hackathon_focus")
    tech_stack = [item for item in focus if isinstance(item, str)] if isinstance(focus, list) else []

    return Hackathon(
        id=str(raw["id"]),
        title=raw.get("name") if isinstance(raw.get("name"), str) else "",
        organizer=None,
        source="MLH",
        url=event_url,
        mode=_mode(raw.get("formatType")),
        location=location,
        city=city,
        state=state,
        startDate=_date(raw.get("startsAt")),
        endDate=_date(raw.get("endsAt")),
        registrationDeadline=None,
        prizeText=None,
        prizeAmountINR=None,
        teamSize=None,
        techStack=tech_stack,
        hasInternship=None,
        perks=[],
        isFree=None,
    )

