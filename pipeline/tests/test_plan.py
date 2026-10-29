import unittest
from datetime import datetime, timezone

from history_import.parse import Maintenance, Measurement
from history_import.plan import plan_import

MOMENT = datetime(2025, 3, 1, 21, 30, tzinfo=timezone.utc)
PH = Measurement(line=2, parameter="ph", value="6.2", measured_at=MOMENT, note=None)
WATER_CHANGE = Maintenance(line=3, type="water_change", percent="30", performed_at=MOMENT, note=None)


class PlanImportTest(unittest.TestCase):
    def test_everything_is_new_in_an_empty_tank(self):
        plan = plan_import([PH, WATER_CHANGE], existing=[])
        self.assertEqual(plan.to_send, [PH, WATER_CHANGE])
        self.assertEqual(plan.already_there, [])

    def test_a_record_the_tank_already_has_is_skipped(self):
        existing = [
            {"parameter": "ph", "value": 6.20, "measuredAt": "2025-03-01T21:30:00Z"},
            {"type": "water_change", "percent": 30.0, "performedAt": "2025-03-01T21:30:00Z"},
        ]
        plan = plan_import([PH, WATER_CHANGE], existing)
        self.assertEqual(plan.to_send, [])
        self.assertEqual(plan.already_there, [PH, WATER_CHANGE])

    def test_the_same_parameter_at_another_moment_or_value_is_new(self):
        existing = [
            {"parameter": "ph", "value": 6.3, "measuredAt": "2025-03-01T21:30:00Z"},
            {"parameter": "ph", "value": 6.2, "measuredAt": "2025-03-01T21:31:00Z"},
        ]
        self.assertEqual(plan_import([PH], existing).to_send, [PH])

    def test_the_same_row_twice_in_the_file_is_sent_once(self):
        plan = plan_import([PH, PH], existing=[])
        self.assertEqual(plan.to_send, [PH])
        self.assertEqual(plan.already_there, [PH])


if __name__ == "__main__":
    unittest.main()
