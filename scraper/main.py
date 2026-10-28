"""Run all available sources and write the combined public dataset."""

from __future__ import annotations

import importlib
import json
import logging
import pkgutil
import re
from datetime import datetime, timezone
from pathlib import Path
from types import ModuleType

from scraper.schema import Hackathon
import scraper.sources

LOGGER = logging.getLogger("hackscout.scraper")
OUTPUT_PATH = Path(__file__).resolve().parent.parent / "public" / "hackathons.json"


def _source_modules() -> list[ModuleType]:
    modules: list[ModuleType] = []
    for module_info in pkgutil.iter_modules(scraper.sources.__path__):
        if module_info.name.startswith("_"):
            continue
        try:
            modules.append(importlib.import_module(f"scraper.sources.{module_info.name}"))
        except Exception:
            LOGGER.exception("Source failed during import: scraper.sources.%s", module_info.name)
    return modules


def _dedupe_key(hackathon: Hackathon) -> tuple[str, str | None]:
    title = re.sub(r"\s+", " ", hackathon.title).strip().casefold()
    return title, hackathon.startDate.isoformat() if hackathon.startDate else None


def run() -> list[Hackathon]:
    """Fetch, normalize, deduplicate, sort, and persist all source records."""
    records: list[Hackathon] = []
    scraped_at = datetime.now(timezone.utc)

    for source in _source_modules():
        fetch = getattr(source, "fetch", None)
        normalize = getattr(source, "normalize", None)
        if not callable(fetch) or not callable(normalize):
            LOGGER.warning("Skipping %s: fetch() or normalize() is missing", source.__name__)
            continue
        try:
            records.extend(normalize(raw) for raw in fetch())
        except Exception:
            LOGGER.exception("Source failed: %s", source.__name__)

    unique: dict[tuple[str, str | None], Hackathon] = {}
    for record in records:
        unique.setdefault(_dedupe_key(record), record.model_copy(update={"scrapedAt": scraped_at}))

    normalized = sorted(
        unique.values(),
        key=lambda record: (record.registrationDeadline is None, record.registrationDeadline or record.endDate or record.startDate or datetime.max.date()),
    )
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(
        json.dumps([record.model_dump(mode="json") for record in normalized], indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    return normalized


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
    results = run()
    print(json.dumps([record.model_dump(mode="json") for record in results[:3]], indent=2, ensure_ascii=True))
    print(f"Total count: {len(results)}")
