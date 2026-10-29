"""Reads the hand-made history CSV into records ready to send to the API.

Only what the CSV itself gets wrong is judged here (a date that is not a date, a value that is not a number).
Everything the API has rules for, such as which parameters exist or whether a water change needs a percent, is
left to the API so there is one source of truth.
"""

import csv
import io
from dataclasses import dataclass
from datetime import datetime, time, timezone, tzinfo
from decimal import Decimal, InvalidOperation

COLUMNS = ("kind", "when", "parameter", "value", "unit", "type", "percent", "note")

# One degree of German hardness (dH) is 17.848 mg/L of calcium carbonate, the "ppm" most test kits print.
PPM_PER_DEGREE_DH = Decimal("17.848")


@dataclass(frozen=True)
class Measurement:
    line: int
    parameter: str
    value: str
    measured_at: datetime
    note: str | None


@dataclass(frozen=True)
class Maintenance:
    line: int
    type: str
    percent: str | None
    performed_at: datetime
    note: str | None


@dataclass(frozen=True)
class Problem:
    line: int
    reason: str


def parse_history(text: str, local_zone: tzinfo) -> tuple[list[Measurement | Maintenance], list[Problem]]:
    """Records in file order, plus a problem for every row that could not be read. Line 1 is the header."""
    reader = csv.DictReader(io.StringIO(text))
    missing = [column for column in COLUMNS if column not in (reader.fieldnames or [])]
    if missing:
        raise ValueError(f"missing column(s): {', '.join(missing)}")
    records: list[Measurement | Maintenance] = []
    problems: list[Problem] = []
    for row in reader:
        line = reader.line_num
        try:
            records.append(_record(line, {key: (value or "").strip() for key, value in row.items()}, local_zone))
        except ValueError as problem:
            problems.append(Problem(line, str(problem)))
    return records, problems


def _record(line: int, row: dict[str, str], local_zone: tzinfo) -> Measurement | Maintenance:
    kind = row["kind"]
    if kind not in ("measurement", "maintenance"):
        raise ValueError(f"'kind' must be measurement or maintenance, not '{kind}'")
    moment = _moment(row["when"], local_zone)
    note = row["note"] or None
    if kind == "maintenance":
        return Maintenance(line, row["type"], row["percent"] or None, moment, note)
    parameter, value = row["parameter"], _number(row["value"], "value")
    return Measurement(line, parameter, _text(_canonical(parameter, value, row["unit"])), moment, note)


def _moment(text: str, local_zone: tzinfo) -> datetime:
    try:
        moment = datetime.fromisoformat(text)
    except ValueError:
        raise ValueError(f"'when' is not a date: '{text}'") from None
    if len(text) == 10:
        # A date alone has no time of day; midday keeps it on the same day whatever the timezone.
        moment = datetime.combine(moment.date(), time(12, 0))
    if moment.tzinfo is None:
        moment = moment.replace(tzinfo=local_zone)
    return moment.astimezone(timezone.utc)


def _number(text: str, column: str) -> Decimal:
    try:
        number = Decimal(text.replace(",", "."))
    except InvalidOperation:
        raise ValueError(f"'{column}' is not a number: '{text}'") from None
    if not number.is_finite():
        raise ValueError(f"'{column}' is not a number: '{text}'")
    return number


def _canonical(parameter: str, value: Decimal, unit: str) -> Decimal:
    """The value in the unit the platform stores. An empty unit means it already is."""
    unit = unit.lower()
    if unit == "f" and parameter == "temperature":
        return (value - 32) * 5 / 9
    if unit == "ppm" and parameter in ("gh", "kh"):
        return value / PPM_PER_DEGREE_DH
    if unit:
        raise ValueError(f"cannot convert '{unit}' for {parameter}")
    return value


def _text(value: Decimal) -> str:
    """Four decimals at most (what the API keeps), without trailing zeros, in plain notation."""
    rounded = value.quantize(Decimal("0.0001")).normalize()
    return format(rounded, "f")
