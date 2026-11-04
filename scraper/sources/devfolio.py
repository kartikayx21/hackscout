"""Fetch application-open hackathons from Devfolio's public search API."""

from __future__ import annotations

import html
import re
from datetime import date, datetime
from typing import Any
from urllib.parse import urlparse

import requests

from scraper.schema import Hackathon

API_URL = "https://api.devfolio.co/api/search/hackathons"
PAGE_SIZE = 12
HEADERS = {"Accept": "application/json", "User-Agent": "Mozilla/5.0"}
DEBUG_FALLBACK_TITLES = {
    "Hack Nexus 2027",
    "Lean In Hacks 8.0",
    "THE BIG HACK 2.0",
    "haxfinity",
}


def fetch() -> list[dict[str, Any]]:
    """Fetch every application-open Devfolio record using offset pagination."""
    records: list[dict[str, Any]] = []
    offset = 0
    total: int | None = None

    while total is None or offset < total:
        response = requests.post(
            API_URL,
            json={"type": "application_open", "from": offset, "size": PAGE_SIZE},
            headers=HEADERS,
            timeout=30,
        )
        response.raise_for_status()
        payload = response.json()
        hits = payload.get("hits", {})
        page = hits.get("hits", [])
        total_value = hits.get("total", {}).get("value")
        if not isinstance(page, list) or not isinstance(total_value, int):
            raise ValueError("Devfolio API returned an invalid search response")
        records.extend(
            source
            for hit in page
            if isinstance(hit, dict)
            and isinstance((source := hit.get("_source")), dict)
        )
        total = total_value
        if not page:
            break
        offset += len(page)

    return records


def _date(value: Any) -> date | None:
    if not isinstance(value, str):
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00")).date()
    except ValueError:
        return None


def _themes(raw: dict[str, Any]) -> list[str]:
    themes = raw.get("themes")
    if not isinstance(themes, list):
        return []
    return [
        theme.get("name")
        if isinstance(theme, dict)
        else theme
        for theme in themes
        if (isinstance(theme, dict) and isinstance(theme.get("name"), str))
        or isinstance(theme, str)
    ]


def _prize(raw: dict[str, Any]) -> tuple[str | None, float | None]:
    prizes = raw.get("prizes")
    if not isinstance(prizes, list) or not prizes:
        return None, None
    descriptions = []
    amounts: list[float] = []
    for prize in prizes:
        if not isinstance(prize, dict):
            continue
        text = " - ".join(
            str(prize[key]).strip()
            for key in ("name", "desc")
            if isinstance(prize.get(key), str) and prize[key].strip()
        )
        if text:
            descriptions.append(text)
            for match in re.finditer(r"([$€£])\s?([0-9][0-9,]*(?:\.[0-9]+)?)", text):
                amount = float(match.group(2).replace(",", ""))
                amounts.append(amount * {"$": 83, "€": 90, "£": 105}[match.group(1)])
    return ("; ".join(descriptions) or None, sum(amounts) if amounts else None)


def _team_size(raw: dict[str, Any]) -> str | None:
    minimum = raw.get("team_min")
    maximum = raw.get("team_size")
    if isinstance(minimum, int) and isinstance(maximum, int):
        return str(minimum) if minimum == maximum else f"{minimum}-{maximum}"
    if isinstance(maximum, int):
        return str(maximum)
    if isinstance(minimum, int):
        return str(minimum)
    return None


def _organizer(raw: dict[str, Any]) -> str | None:
    for key in ("hosted_by", "organizer", "organizer_name", "org_name", "team_name"):
        value = raw.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    return None


def _http_url(value: Any) -> str | None:
    if not isinstance(value, str) or not value.strip():
        return None
    candidate = value.strip()
    parsed = urlparse(candidate)
    if parsed.scheme in {"http", "https"} and parsed.netloc:
        return candidate
    if not parsed.scheme and "." in candidate and " " not in candidate:
        candidate = f"https://{candidate}"
        parsed = urlparse(candidate)
        if parsed.netloc:
            return candidate
    return None


def _website(raw: dict[str, Any], setting: dict[str, Any]) -> str | None:
    title = raw.get("name")
    candidate = _http_url(setting.get("site")) or _http_url(setting.get("external_apply_url"))
    if candidate is not None:
        return candidate

    slug = raw.get("slug")
    if not isinstance(slug, str) or not slug.strip():
        return None
    fallback = f"https://{slug.strip()}.devfolio.co"
    if title in DEBUG_FALLBACK_TITLES:
        try:
            response = requests.get(fallback, headers=HEADERS, timeout=15)
            print(f"Devfolio fallback: slug={slug.strip()} url={fallback} status={response.status_code}")
        except requests.RequestException as exc:
            print(f"Devfolio fallback: slug={slug.strip()} url={fallback} status=error ({exc})")
    return fallback


def normalize(raw: dict[str, Any]) -> Hackathon:
    """Convert one Devfolio search result into the shared schema."""
    setting = raw.get("hackathon_setting")
    setting = setting if isinstance(setting, dict) else {}
    location = raw.get("location")
    if not isinstance(location, str):
        location_parts = [raw.get("city"), raw.get("state"), raw.get("country")]
        location = ", ".join(part for part in location_parts if isinstance(part, str)) or None
    is_online = raw.get("is_online")
    mode = {"online": "Online", "offline": "Offline", "hybrid": "Hybrid"}.get(
        str(raw.get("mode", "")).lower()
    )
    if mode is None and isinstance(is_online, bool):
        mode = "Online" if is_online else "Offline"
    prize_text, prize_amount = _prize(raw)
    url = _website(raw, setting)

    return Hackathon(
        id=str(raw["uuid"]),
        title=raw.get("name") if isinstance(raw.get("name"), str) else "",
        organizer=_organizer(raw),
        source="Devfolio",
        url=url,
        mode=mode,
        location=location,
        city=raw.get("city") if isinstance(raw.get("city"), str) else None,
        state=raw.get("state") if isinstance(raw.get("state"), str) else None,
        startDate=_date(raw.get("starts_at")),
        endDate=_date(raw.get("ends_at")),
        registrationDeadline=_date(setting.get("reg_ends_at")),
        prizeText=prize_text,
        prizeAmountINR=prize_amount,
        teamSize=_team_size(raw),
        techStack=_themes(raw),
        hasInternship=None,
        perks=[],
        isFree=None,
    )
