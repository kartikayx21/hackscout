"""Fetch upcoming hackathons from Devpost's public JSON endpoint."""

from __future__ import annotations

import html
import re
from datetime import date, datetime
from typing import Any

import requests

from scraper.schema import Hackathon

API_URL = "https://devpost.com/api/hackathons"
DEFAULT_HEADERS = {
    "Accept": "application/json",
    "User-Agent": "HackScout/0.1 (hackathon discovery project)",
}


def _clean_html(value: Any) -> str | None:
    if not isinstance(value, str):
        return None
    cleaned = re.sub(r"<[^>]+>", "", value)
    cleaned = html.unescape(cleaned).strip()
    return cleaned or None


def _parse_prize(value: Any) -> tuple[str | None, float | None]:
    prize_text = _clean_html(value)
    if prize_text is None:
        return None, None

    number_match = re.search(r"([0-9][0-9,]*(?:\.[0-9]+)?)", prize_text)
    if number_match is None:
        return prize_text, None
    amount = float(number_match.group(1).replace(",", ""))
    if "$" in prize_text or "USD" in prize_text.upper():
        amount *= 83
    elif "€" in prize_text or "EUR" in prize_text.upper():
        amount *= 90
    elif "£" in prize_text or "GBP" in prize_text.upper():
        amount *= 105
    else:
        return prize_text, None
    return prize_text, amount


def _is_free(raw: dict[str, Any]) -> bool:
    found_fee = False
    for key in ("registration_fee", "entry_fee", "fee", "fee_amount", "cost"):
        value = raw.get(key)
        if value is None:
            continue
        found_fee = True
        if value == "":
            continue
        if isinstance(value, (int, float)):
            return value <= 0
        text = _clean_html(value)
        if text and text.lower() not in {"free", "$0", "0", "₹0"}:
            return False
    return True if found_fee else None


def _parse_period(value: Any) -> tuple[date | None, date | None]:
    if not isinstance(value, str):
        return None, None
    match = re.fullmatch(
        r"\s*([A-Za-z]{3,9})\s+(\d{1,2})\s*-\s*"
        r"([A-Za-z]{3,9})?\s*(\d{1,2}),\s*(\d{4})\s*",
        value,
    )
    if match is None:
        return None, None

    start_month, start_day, end_month, end_day, year = match.groups()
    end_month = end_month or start_month
    end_year = int(year)
    start_month_number = datetime.strptime(start_month, "%b" if len(start_month) == 3 else "%B").month
    end_month_number = datetime.strptime(end_month, "%b" if len(end_month) == 3 else "%B").month
    if end_month_number < start_month_number:
        start_year = end_year - 1
    else:
        start_year = end_year
    return (
        date(start_year, start_month_number, int(start_day)),
        date(end_year, end_month_number, int(end_day)),
    )


def _location_fields(raw: dict[str, Any]) -> tuple[str | None, str | None, str | None, str | None]:
    displayed = raw.get("displayed_location")
    location = displayed.get("location") if isinstance(displayed, dict) else None
    if not isinstance(location, str):
        location = raw.get("location") if isinstance(raw.get("location"), str) else None
    if location is None:
        return None, None, None, None

    parts = [part.strip() for part in location.split(",") if part.strip()]
    online = "online" in location.lower() or (isinstance(displayed, dict) and displayed.get("icon") == "globe")
    mode = "Online" if online else "Offline"
    city = None if online else (parts[0] if parts else None)
    state = parts[1] if len(parts) > 2 else None
    return location, city, state, mode


def normalize(raw: dict[str, Any]) -> Hackathon:
    """Convert one raw Devpost API record into the shared schema."""
    location, city, state, mode = _location_fields(raw)
    prize_text, prize_amount = _parse_prize(raw.get("prize_amount"))
    start_date, end_date = _parse_period(raw.get("submission_period_dates"))
    themes = raw.get("themes", [])
    tech_stack = [
        theme["name"]
        for theme in themes
        if isinstance(theme, dict) and isinstance(theme.get("name"), str)
    ] if isinstance(themes, list) else []

    return Hackathon(
        id=str(raw["id"]),
        title=str(raw["title"]).strip(),
        organizer=raw.get("organization_name"),
        source="Devpost",
        url=raw.get("url"),
        mode=mode,
        location=location,
        city=city,
        state=state,
        startDate=start_date,
        endDate=end_date,
        prizeText=prize_text,
        prizeAmountINR=prize_amount,
        techStack=tech_stack,
        perks=[],
        isFree=_is_free(raw),
    )


def fetch(pages: int = 2) -> list[dict[str, Any]]:
    """Return raw upcoming Devpost records from the public API."""
    records: list[dict[str, Any]] = []

    for page in range(1, pages + 1):
        response = requests.get(
            API_URL,
            params={"status[]": "upcoming", "page": page},
            headers=DEFAULT_HEADERS,
            timeout=30,
        )
        response.raise_for_status()
        payload = response.json()
        page_records = payload.get("hackathons", [])
        if not isinstance(page_records, list):
            raise ValueError("Devpost API returned an invalid hackathons collection")
        records.extend(record for record in page_records if isinstance(record, dict))
        if len(page_records) == 0:
            break

    return records


if __name__ == "__main__":
    import json

    print(json.dumps([normalize(record).model_dump(mode="json") for record in fetch()[:5]], indent=2, ensure_ascii=False))
