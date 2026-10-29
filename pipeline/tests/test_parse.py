import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path

from history_import.parse import Maintenance, Measurement, parse_history

FIXTURE = Path(__file__).parent / "fixtures" / "history.csv"
SAO_PAULO = timezone(timedelta(hours=-3))


class ParseHistoryTest(unittest.TestCase):
    def setUp(self):
        self.records, self.problems = parse_history(FIXTURE.read_text(encoding="utf-8"), SAO_PAULO)

    def test_a_measurement_row_becomes_a_measurement_in_the_given_timezone(self):
        first = self.records[0]
        self.assertEqual(
            first,
            Measurement(
                line=2,
                parameter="ph",
                value="6.2",
                measured_at=datetime(2025, 3, 1, 21, 30, tzinfo=timezone.utc),
                note="after the water change",
            ),
        )

    def test_fahrenheit_is_converted_to_celsius(self):
        temperature = self.records[1]
        self.assertEqual((temperature.parameter, temperature.value), ("temperature", "26"))

    def test_ppm_of_hardness_is_converted_to_german_degrees(self):
        gh = self.records[2]
        self.assertEqual((gh.parameter, gh.value), ("gh", "2.0002"))

    def test_a_date_without_a_time_means_midday(self):
        self.assertEqual(self.records[2].measured_at, datetime(2025, 3, 1, 15, 0, tzinfo=timezone.utc))

    def test_a_maintenance_row_keeps_its_percent_and_note(self):
        water_change, other = self.records[3], self.records[4]
        self.assertEqual(
            water_change,
            Maintenance(
                line=5,
                type="water_change",
                percent="30",
                performed_at=datetime(2025, 3, 2, 13, 0, tzinfo=timezone.utc),
                note=None,
            ),
        )
        self.assertEqual((other.type, other.percent, other.note), ("other", None, "Replaced the lid"))

    def test_a_date_with_its_own_offset_ignores_the_given_timezone(self):
        self.assertEqual(self.records[4].performed_at, datetime(2025, 3, 3, 12, 15, tzinfo=timezone.utc))

    def test_rows_that_cannot_be_read_are_reported_with_their_line_and_reason(self):
        self.assertEqual(len(self.records), 7)
        self.assertEqual(
            [(problem.line, problem.reason) for problem in self.problems],
            [
                (8, "'when' is not a date: 'not a date'"),
                (10, "'value' is not a number: 'abc'"),
                (11, "'kind' must be measurement or maintenance, not 'dive'"),
            ],
        )

    def test_what_the_api_can_judge_is_left_to_the_api(self):
        # An unknown parameter, or a water change without a percent, goes through so the API refuses it by its rules.
        self.assertEqual(self.records[5].parameter, "salinity")
        self.assertIsNone(self.records[6].percent)

    def test_a_value_is_not_rounded_beyond_what_the_api_keeps(self):
        csv_text = "kind,when,parameter,value,unit,type,percent,note\nmeasurement,2025-03-01,iron,0.005,,,,\n"
        records, _ = parse_history(csv_text, SAO_PAULO)
        self.assertEqual(records[0].value, "0.005")

    def test_a_missing_column_is_refused_up_front(self):
        with self.assertRaisesRegex(ValueError, "missing column"):
            parse_history("kind,when\nmeasurement,2025-03-01\n", SAO_PAULO)


if __name__ == "__main__":
    unittest.main()
