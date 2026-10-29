"""One-off import of the owner's history into one Tank, through the public API.

    python -m history_import history.csv [--dry-run]

Settings come from the environment, so the password never lands in a file or the shell history:
IMPORT_EMAIL, IMPORT_PASSWORD, IMPORT_TANK_ID, and optionally API_URL (default http://localhost:8080) and
IMPORT_TIMEZONE (an IANA name such as America/Sao_Paulo; default is this computer's current offset).
Running it again is safe: records the tank already has are skipped. See README.md for the CSV layout.
"""

import argparse
import os
import sys
from datetime import datetime, tzinfo
from pathlib import Path
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from .api import Api, ApiRefused
from .parse import Maintenance, Measurement, parse_history
from .plan import plan_import

LIST_LIMIT = 1000  # the most the API lists at once


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(prog="history_import", description=__doc__.split("\n")[0])
    parser.add_argument("csv", type=Path)
    parser.add_argument("--dry-run", action="store_true", help="read and check the file, send nothing")
    args = parser.parse_args(argv)

    try:
        records, problems = parse_history(args.csv.read_text(encoding="utf-8-sig"), _local_zone())
    except (OSError, ValueError) as error:
        print(f"Cannot read {args.csv}: {error}", file=sys.stderr)
        return 2
    for problem in problems:
        print(f"line {problem.line}: not read: {problem.reason}")

    refused = 0
    if records and not args.dry_run:
        try:
            refused = _send(records)
        except (ApiRefused, OSError) as error:
            reason = getattr(error, "reason", error)
            print(f"Stopped: {reason}. Run it again to carry on; rows already sent are skipped.", file=sys.stderr)
            return 2
    elif args.dry_run:
        print(f"Dry run: {len(records)} row(s) read, nothing sent.")
    return 1 if problems or refused else 0


def _send(records: list[Measurement | Maintenance]) -> int:
    tank = _required("IMPORT_TANK_ID")
    api = Api(os.environ.get("API_URL", "http://localhost:8080"))
    api.log_in(_required("IMPORT_EMAIL"), _required("IMPORT_PASSWORD"))

    base = f"/api/tanks/{tank}"
    measurements = api.send("GET", f"{base}/measurements?limit={LIST_LIMIT}")
    maintenance = api.send("GET", f"{base}/maintenance?limit={LIST_LIMIT}")
    existing = measurements + maintenance
    plan = plan_import(records, existing)
    refused = 0
    sent = 0
    for record in plan.to_send:
        try:
            if isinstance(record, Measurement):
                api.send(
                    "POST",
                    f"{base}/measurements",
                    {"measuredAt": _iso(record.measured_at), "note": record.note, "values": {record.parameter: record.value}},
                )
            else:
                api.send(
                    "POST",
                    f"{base}/maintenance",
                    {
                        "type": record.type,
                        "percent": record.percent,
                        "performedAt": _iso(record.performed_at),
                        "note": record.note,
                    },
                )
            sent += 1
        except ApiRefused as error:
            refused += 1
            print(f"line {record.line}: refused by the API: {error.reason}")
    print(f"Created {sent}, already there {len(plan.already_there)}, refused {refused}.")
    if LIST_LIMIT in (len(measurements), len(maintenance)):
        print("Warning: the tank has more records than the API lists at once, so older duplicates may not be seen.")
    return refused


def _iso(moment: datetime) -> str:
    return moment.isoformat().replace("+00:00", "Z")


def _local_zone() -> tzinfo:
    name = os.environ.get("IMPORT_TIMEZONE")
    if not name:
        return datetime.now().astimezone().tzinfo
    try:
        return ZoneInfo(name)
    except ZoneInfoNotFoundError:
        # Windows ships no timezone database; `pip install tzdata` adds one.
        sys.exit(f"No timezone data for '{name}'. Run `pip install tzdata`, or unset IMPORT_TIMEZONE.")


def _required(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        sys.exit(f"Set {name} first (see the top of history_import/__main__.py).")
    return value


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
