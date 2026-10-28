"""Batch Gemini enrichment for normalized hackathon records."""

from __future__ import annotations

import json
import logging
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from google import genai
from google.genai import types
from pydantic import BaseModel, ConfigDict, Field, ValidationError

from scraper.schema import Hackathon

LOGGER = logging.getLogger("hackscout.enrich")
CACHE_PATH = Path(__file__).resolve().parent / ".enrich_cache.json"
BATCH_SIZE = 10
BATCH_DELAY_SECONDS = 2


class Enrichment(BaseModel):
    """The only fields Gemini is allowed to change."""

    model_config = ConfigDict(extra="forbid")

    id: str
    techStack: list[str] = Field(max_length=6)
    hasInternship: bool | None = None
    city: str | None = None
    state: str | None = None
    country: str | None = None


@dataclass
class EnrichmentReport:
    records: list[Hackathon]
    enriched: int
    failed: int
    examples: list[tuple[Hackathon, Hackathon]]


def _load_cache() -> dict[str, dict[str, Any]]:
    if not CACHE_PATH.exists():
        return {}
    try:
        value = json.loads(CACHE_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        LOGGER.warning("Ignoring invalid enrichment cache")
        return {}
    return value if isinstance(value, dict) else {}


def _save_cache(cache: dict[str, dict[str, Any]]) -> None:
    CACHE_PATH.write_text(json.dumps(cache, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def _record_input(record: Hackathon) -> dict[str, Any]:
    return {
        "id": record.id,
        "title": record.title,
        "organizer": record.organizer,
        "location": record.location,
        "city": record.city,
        "state": record.state,
        "country": record.country,
        "themes": record.techStack,
        "prizeText": record.prizeText,
        "description": None,
    }


def _prompt(records: list[Hackathon]) -> str:
    payload = json.dumps([_record_input(record) for record in records], ensure_ascii=False)
    return f"""Normalize these hackathon records. Return ONLY a JSON array with one object per input record.
Each object must contain exactly:
- id: the input id
- techStack: a list of real technologies or domains, maximum 6
- hasInternship: true only when the text mentions an internship, job, hiring, or employment opportunity; otherwise false or null
- city, state, country: cleaned values, or null when unknown
Never invent facts. Use null when unsure.

Records:
{payload}"""


def _parse_response(text: str, expected_ids: set[str]) -> list[Enrichment]:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.split("\n", 1)[1].rsplit("```", 1)[0].strip()
    parsed = json.loads(cleaned)
    if not isinstance(parsed, list):
        raise ValueError("Gemini response was not a JSON array")
    results = [Enrichment.model_validate(item) for item in parsed]
    if {item.id for item in results} != expected_ids:
        raise ValueError("Gemini response did not contain exactly the requested record IDs")
    return results


def _is_rate_limited(error: Exception) -> bool:
    text = str(error).lower()
    return "429" in text or "rate limit" in text or "resource exhausted" in text


def _call_batch(client: genai.Client, model: str, records: list[Hackathon]) -> list[Enrichment]:
    response = client.models.generate_content(
        model=model,
        contents=_prompt(records),
        config={"response_mime_type": "application/json"},
    )
    text = getattr(response, "text", None)
    if not isinstance(text, str) or not text.strip():
        raise ValueError("Gemini returned an empty response")
    return _parse_response(text, {record.id for record in records})


def enrich_records(records: list[Hackathon]) -> EnrichmentReport:
    """Enrich records in batches, using validated disk-cached results."""
    load_dotenv()
    import os

    api_key = os.getenv("GEMINI_API_KEY")
    model = os.getenv("GEMINI_MODEL")
    if not api_key or not model:
        LOGGER.warning("GEMINI_API_KEY or GEMINI_MODEL is missing; skipping enrichment")
        return EnrichmentReport(records, 0, 0, [])

    cache = _load_cache()
    output = list(records)
    pending: list[Hackathon] = []
    enriched_count = 0
    failed_count = 0
    examples: list[tuple[Hackathon, Hackathon]] = []

    for index, record in enumerate(records):
        cached = cache.get(record.id)
        if cached is None:
            pending.append(record)
            continue
        try:
            result = Enrichment.model_validate(cached)
        except ValidationError:
            pending.append(record)
            continue
        updated = record.model_copy(update=result.model_dump(exclude={"id"}))
        output[index] = updated
        enriched_count += 1
        if len(examples) < 3:
            examples.append((record, updated))

    try:
        client = genai.Client(api_key=api_key, http_options=types.HttpOptions(timeout=30_000))
    except Exception:
        LOGGER.exception("Could not initialize Gemini client; skipping enrichment")
        return EnrichmentReport(output, enriched_count, len(pending), examples)

    total_batches = (len(pending) + BATCH_SIZE - 1) // BATCH_SIZE
    for batch_number, start in enumerate(range(0, len(pending), BATCH_SIZE), start=1):
        batch = pending[start:start + BATCH_SIZE]
        result: list[Enrichment] | None = None
        for attempt in range(2):
            try:
                result = _call_batch(client, model, batch)
                break
            except Exception as error:
                if attempt == 1:
                    LOGGER.warning("Gemini batch failed after retry: %s", error)
                else:
                    LOGGER.warning("Gemini batch failed; retrying once in 5 seconds: %s", error)
                    time.sleep(5)
        if result is None:
            failed_count += len(batch)
            print(f"batch {batch_number}/{total_batches} skipped", flush=True)
            continue

        by_id = {item.id: item for item in result}
        for index, record in enumerate(records):
            item = by_id.get(record.id)
            if item is None:
                continue
            updated = record.model_copy(update=item.model_dump(exclude={"id"}))
            output[index] = updated
            cache[record.id] = item.model_dump(mode="json")
            enriched_count += 1
            if len(examples) < 3:
                examples.append((record, updated))
        _save_cache(cache)
        print(f"batch {batch_number}/{total_batches} done", flush=True)
        if start + BATCH_SIZE < len(pending):
            time.sleep(BATCH_DELAY_SECONDS)

    return EnrichmentReport(output, enriched_count, failed_count, examples)
