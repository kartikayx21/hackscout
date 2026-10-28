"""Validated schema for normalized hackathon records."""

from __future__ import annotations

from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict


class Hackathon(BaseModel):
    """A normalized hackathon record used by the scraper and frontend."""

    model_config = ConfigDict(extra="forbid")

    id: str
    title: str
    organizer: str | None = None
    source: str
    url: str | None = None
    mode: Literal["Online", "Offline", "Hybrid"] | None = None
    location: str | None = None
    city: str | None = None
    state: str | None = None
    country: str | None = None
    startDate: date | None = None
    endDate: date | None = None
    registrationDeadline: date | None = None
    prizeText: str | None = None
    prizeAmountINR: float | None = None
    teamSize: str | None = None
    techStack: list[str]
    hasInternship: bool | None = None
    perks: list[str]
    isFree: bool | None = None
    scrapedAt: datetime | None = None
