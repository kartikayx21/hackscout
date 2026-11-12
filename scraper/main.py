"""Run all available sources and write the combined public dataset."""

from __future__ import annotations

import importlib
import json
import logging
import pkgutil
import re
import argparse
import time
from datetime import datetime, timezone
from pathlib import Path
from types import ModuleType
from urllib.parse import urlparse

from scraper.schema import Hackathon
from scraper.enrich import EnrichmentReport, enrich_records
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


def _validated_url(value: str | None) -> str | None:
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


def run(limit: int | None = None) -> tuple[list[Hackathon], EnrichmentReport]:
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
            source_records = [normalize(raw) for raw in fetch()]
            records.extend(source_records)
            LOGGER.info("%s: %d records", source.__name__.rsplit(".", 1)[-1], len(source_records))
        except Exception:
            LOGGER.exception("Source failed: %s", source.__name__)

    unique: dict[tuple[str, str | None], Hackathon] = {}
    for record in records:
        unique.setdefault(_dedupe_key(record), record.model_copy(update={"scrapedAt": scraped_at}))

    normalized_records = list(unique.values())
    if limit is not None:
        normalized_records = normalized_records[:limit]
    enrichment = enrich_records(normalized_records)
    LOGGER.info("Enrichment complete: %d enriched, %d failed", enrichment.enriched, enrichment.failed)
    for before, after in enrichment.examples:
        LOGGER.info(
            "Enrichment example %s: techStack %s -> %s; city/state/country %s/%s/%s -> %s/%s/%s",
            before.id,
            before.techStack,
            after.techStack,
            before.city,
            before.state,
            before.country,
            after.city,
            after.state,
            after.country,
        )
    normalized = sorted(
        enrichment.records,
        key=lambda record: (record.registrationDeadline is None, record.registrationDeadline or record.endDate or record.startDate or datetime.max.date()),
    )
    repaired_urls = 0
    invalid_urls = 0
    validated_records: list[Hackathon] = []
    for record in normalized:
        validated_url = _validated_url(record.url)
        if validated_url is None:
            invalid_urls += 1
        elif validated_url != record.url:
            repaired_urls += 1
        validated_records.append(record.model_copy(update={"url": validated_url}))
    normalized = validated_records
    print(f"URLs repaired: {repaired_urls}")
    print(f"URLs still invalid: {invalid_urls}")
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(
        json.dumps([record.model_dump(mode="json") for record in normalized], indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    return normalized, enrichment


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=None)
    args = parser.parse_args()
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
    started_at = time.monotonic()
    results, enrichment = run(limit=args.limit)
    print(json.dumps([record.model_dump(mode="json") for record in results[:3]], indent=2, ensure_ascii=True))
    print(f"Total count: {len(results)}")
    print(f"Total after dedupe: {len(results)}")
    print(f"Records with null dates: {sum(record.startDate is None or record.endDate is None for record in results)}")
    for source_name in sorted({record.source for record in results}):
        print(f"Source {source_name}: {sum(record.source == source_name for record in results)}")
    print(f"Enriched: {enrichment.enriched}")
    print(f"Failed: {enrichment.failed}")
    print(f"Elapsed seconds: {time.monotonic() - started_at:.1f}")
    for before, after in enrichment.examples:
        print(json.dumps({"before": before.model_dump(mode="json"), "after": after.model_dump(mode="json")}, ensure_ascii=True))
