"""Fetch open hackathons from Unstop's public search API."""

from __future__ import annotations

import html
import re
import time
from datetime import date, datetime
from typing import Any
from urllib.parse import urljoin

import requests

from scraper.schema import Hackathon

API_URL = "https://unstop.com/api/public/opportunity/search-result"
BASE_URL = "https://unstop.com/"
HEADERS = {"Accept": "application/json", "User-Agent": "Mozilla/5.0"}
MAX_PAGES = 10
PAGE_SIZE = 18
PAGE_DELAY_SECONDS = 0.3


def _date(value: Any) -> date | None:
    if not isinstance(value, str):
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00")).date()
    except ValueError:
        return None


def _text(value: Any) -> str | None:
    if not isinstance(value, str):
        return None
    cleaned = html.unescape(re.sub(r"<[^>]+>", "", value)).strip()
    return cleaned or None


def _mode(value: Any) -> str | None:
    if not isinstance(value, str):
        return None
    normalized = value.lower()
    if "hybrid" in normalized:
        return "Hybrid"
    if "online" in normalized:
        return "Online"
    if "offline" in normalized or "physical" in normalized:
        return "Offline"
    return None


def _https_url(value: Any) -> str | None:
    if not isinstance(value, str):
        return None
    candidate = urljoin(BASE_URL, value)
    return candidate if candidate.startswith("https://") else None


def _team_size(requirements: dict[str, Any]) -> str | None:
    minimum = requirements.get("min_team_size")
    maximum = requirements.get("max_team_size")
    if isinstance(minimum, int) and isinstance(maximum, int):
        return str(minimum) if minimum == maximum else f"{minimum}-{maximum}"
    if isinstance(maximum, int):
        return str(maximum)
    if isinstance(minimum, int):
        return str(minimum)
    return None


def _prize(raw: dict[str, Any]) -> tuple[str | None, float | None]:
    prizes = raw.get("prizes")
    if not isinstance(prizes, list):
        return None, None
    descriptions: list[str] = []
    amounts: list[float] = []
    for prize in prizes:
        if not isinstance(prize, dict):
            continue
        cash = prize.get("cash")
        others = _text(prize.get("others"))
        if isinstance(cash, (int, float)) and cash > 0:
            currency = prize.get("currencyCode")
            descriptions.append(f"{cash:g} {currency}" if isinstance(currency, str) else f"{cash:g}")
            if currency == "INR":
                amounts.append(float(cash))
        if others:
            descriptions.append(others)
    return "; ".join(descriptions) or None, sum(amounts) if amounts else None


def _location(raw: dict[str, Any]) -> tuple[str | None, str | None, str | None, str | None]:
    address = raw.get("address_with_country_logo")
    address = address if isinstance(address, dict) else {}
    parts = [
        address.get("address"),
        address.get("city"),
        address.get("state"),
        address.get("country", {}).get("name") if isinstance(address.get("country"), dict) else None,
    ]
    location = ", ".join(part.strip() for part in parts if isinstance(part, str) and part.strip()) or None
    region = raw.get("region")
    mode = _mode(region) or _mode(location)
    return location or (region if isinstance(region, str) else None), (
        address.get("city") if isinstance(address.get("city"), str) else None
    ), (
        address.get("state") if isinstance(address.get("state"), str) else None
    ), mode


def normalize(raw: dict[str, Any]) -> Hackathon:
    """Convert one Unstop record into the shared schema."""
    requirements = raw.get("regnRequirements")
    requirements = requirements if isinstance(requirements, dict) else {}
    location, city, state, mode = _location(raw)
    prize_text, prize_amount = _prize(raw)
    organization = raw.get("organisation")
    organizer = organization.get("name") if isinstance(organization, dict) else None
    skills = raw.get("required_skills")
    tech_stack = [
        skill.get("skill_name") or skill.get("skill")
        for skill in skills
        if isinstance(skill, dict) and isinstance(skill.get("skill_name") or skill.get("skill"), str)
    ] if isinstance(skills, list) else []
    public_url = raw.get("public_url")
    url = _https_url(public_url)

    return Hackathon(
        id=str(raw["id"]),
        title=raw.get("title") if isinstance(raw.get("title"), str) else "",
        organizer=organizer if isinstance(organizer, str) else None,
        source="Unstop",
        url=url,
        mode=mode,
        location=location,
        city=city,
        state=state,
        startDate=None,
        endDate=_date(raw.get("end_date")),
        registrationDeadline=_date(requirements.get("end_regn_dt")),
        prizeText=prize_text,
        prizeAmountINR=prize_amount,
        teamSize=_team_size(requirements),
        techStack=tech_stack,
        hasInternship=None,
        perks=[],
        isFree=raw.get("isPaid") is False if isinstance(raw.get("isPaid"), bool) else None,
    )


def fetch() -> list[dict[str, Any]]:
    """Return open Unstop hackathons, stopping after ten pages or an empty page."""
    records: list[dict[str, Any]] = []
    for page in range(1, MAX_PAGES + 1):
        response = requests.get(
            API_URL,
            params={"opportunity": "hackathons", "per_page": PAGE_SIZE, "oppstatus": "open", "page": page},
            headers=HEADERS,
            timeout=30,
        )
        response.raise_for_status()
        payload = response.json()
        data = payload.get("data", {}) if isinstance(payload, dict) else {}
        page_records = data.get("data", []) if isinstance(data, dict) else []
        if not isinstance(page_records, list):
            raise ValueError("Unstop API returned an invalid data collection")
        valid_records = [record for record in page_records if isinstance(record, dict)]
        if page == 1 and valid_records:
            print(f"Unstop raw record keys: {sorted(valid_records[0])}")
            print(
                "Unstop fields: dates=end_date; registration deadline=regnRequirements.end_regn_dt; "
                "prize=prizes; organizer=organisation.name; team size=regnRequirements.min_team_size/"
                "max_team_size; location=region/address_with_country_logo"
            )
        records.extend(valid_records)
        if not page_records:
            break
        if page < MAX_PAGES:
            time.sleep(PAGE_DELAY_SECONDS)
    return records


if __name__ == "__main__":
    print(len(fetch()))
