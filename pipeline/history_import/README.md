# History import

A one-off script that loads a hand-made CSV of an owner's past Measurements and Maintenance into one Tank. It
calls the public API while logged in as the owner, so every row goes through the same validation as the app.
Tank Photos are not imported: upload them by hand in the app.

## The CSV

One row per Measurement or Maintenance, with this header (the columns can be in any order):

```
kind,when,parameter,value,unit,type,percent,note
measurement,2025-03-01 18:30,ph,6.2,,,,after the water change
measurement,2025-03-01 18:30,temperature,78.8,F,,,
maintenance,2025-03-02 10:00,,,,water_change,30,
maintenance,2025-03-03,,,,other,,Replaced the lid
```

- `kind` is `measurement` or `maintenance`.
- `when` is a date (`2025-03-01`, taken as midday) or a date and time (`2025-03-01 18:30`), in the timezone
  below. A time with its own offset (`2025-03-03T09:15:00-03:00`) keeps that offset.
- Measurements use `parameter` (an API code such as `ph`, `temperature`, `nitrate`) and `value`. `unit` can be
  left empty when the value is already in the platform's unit. The script converts `F` for temperature and
  `ppm` for `gh` and `kh`; any other unit is refused.
- Maintenance uses `type` (an API code such as `water_change`, `other`) and `percent` (water changes only).
- `note` is optional, except that `other` maintenance needs one. The API decides this and reports it.

## Running it

The settings are read from the environment, so the password never lands in a file:

```bash
export IMPORT_EMAIL=you@example.com IMPORT_PASSWORD=... IMPORT_TANK_ID=<tank id from the /tanks/<id> address>
export API_URL=http://localhost:8080          # optional, this is the default
export IMPORT_TIMEZONE=America/Sao_Paulo      # optional; needs `pip install tzdata` on Windows
python -m history_import history.csv --dry-run   # read and check only
python -m history_import history.csv
```

Run it from `pipeline/`. It prints one line for every row it could not read or the API refused, with the line
number and the reason, and ends with a count. The exit code is 1 if any row was left out.

Running it twice is safe: it lists what the Tank already has and skips rows with the same parameter (or type),
value and moment. If you fix a refused row, run the same file again and only that row is sent.

## Tests

```bash
python -m unittest discover -s tests -t .
```
