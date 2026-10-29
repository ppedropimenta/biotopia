"""Decides which records still have to be sent, so running the import twice creates nothing twice."""

from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal

from .parse import Maintenance, Measurement


@dataclass(frozen=True)
class Plan:
    to_send: list[Measurement | Maintenance]
    already_there: list[Measurement | Maintenance]


def plan_import(records: list[Measurement | Maintenance], existing: list[dict]) -> Plan:
    """Splits the records into new ones and ones the tank already has (the same thing at the same moment).

    `existing` is what the API listed for the tank, Measurements and Maintenance together.
    """
    known = {_api_key(entry) for entry in existing}
    to_send: list[Measurement | Maintenance] = []
    already_there: list[Measurement | Maintenance] = []
    for record in records:
        key = _record_key(record)
        if key in known:
            already_there.append(record)
        else:
            known.add(key)
            to_send.append(record)
    return Plan(to_send, already_there)


def _record_key(record: Measurement | Maintenance) -> tuple:
    if isinstance(record, Measurement):
        return ("measurement", record.parameter, _number(record.value), record.measured_at)
    return ("maintenance", record.type, _number(record.percent), record.performed_at)


def _api_key(entry: dict) -> tuple:
    if "parameter" in entry:
        return ("measurement", entry["parameter"], _number(entry["value"]), _moment(entry["measuredAt"]))
    return ("maintenance", entry["type"], _number(entry.get("percent")), _moment(entry["performedAt"]))


def _number(value) -> Decimal | None:
    return None if value is None else Decimal(str(value)).normalize()


def _moment(text: str) -> datetime:
    return datetime.fromisoformat(text)
