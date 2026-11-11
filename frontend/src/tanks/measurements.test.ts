import { describe, expect, it } from 'vitest'
import { ApiError } from '../auth/api'
import {
  describeMeasurementError,
  formatMoment,
  groupByMoment,
  toChange,
  toLocalInput,
  toNewMeasurements,
  type Measurement,
  type Parameter,
  type RecordForm,
} from './measurements'

const parameters: Parameter[] = [
  { code: 'temperature', unit: '°C', min: 0, max: 45 },
  { code: 'ph', unit: '', min: 0, max: 14 },
  { code: 'nitrate', unit: 'mg/L', min: 0, max: 1000 },
]

const empty: RecordForm = { values: {}, moment: '2026-01-10T08:30', momentChanged: false, note: '' }

describe('toNewMeasurements', () => {
  it('sends only the parameters that were filled in, reading a decimal comma', () => {
    const result = toNewMeasurements({ ...empty, values: { ph: '6,8', nitrate: '20', temperature: '' } }, parameters)

    expect(result).toEqual({ request: { measuredAt: null, note: null, values: { ph: 6.8, nitrate: 20 } } })
  })

  it('keeps a reading of 0 as 0', () => {
    const result = toNewMeasurements({ ...empty, values: { nitrate: '0' } }, parameters)

    expect(result).toEqual({ request: { measuredAt: null, note: null, values: { nitrate: 0 } } })
  })

  it('leaves the moment out while it is still the prefilled "now", so the server’s clock decides', () => {
    const untouched = toNewMeasurements({ ...empty, values: { ph: '7' } }, parameters)
    const changed = toNewMeasurements(
      { ...empty, values: { ph: '7' }, moment: '2026-01-09T20:15', momentChanged: true },
      parameters,
    )

    expect(untouched).toMatchObject({ request: { measuredAt: null } })
    expect(changed).toEqual({
      request: { measuredAt: new Date(2026, 0, 9, 20, 15).toISOString(), note: null, values: { ph: 7 } },
    })
  })

  it('sends the note, or nothing when it is blank', () => {
    const noted = toNewMeasurements({ ...empty, values: { ph: '7' }, note: ' API kit ' }, parameters)
    const blank = toNewMeasurements({ ...empty, values: { ph: '7' }, note: '   ' }, parameters)

    expect(noted).toMatchObject({ request: { note: 'API kit' } })
    expect(blank).toMatchObject({ request: { note: null } })
  })

  it('refuses a submission with no value, without calling the API', () => {
    expect(toNewMeasurements({ ...empty, values: { ph: '  ' } }, parameters)).toEqual({
      errors: { general: 'measurements.errors.values_required' },
    })
  })

  it('reports a number written the wrong way, a value out of range and too many decimals, each under its own field', () => {
    const result = toNewMeasurements(
      { ...empty, values: { ph: '6,8,1', temperature: '46', nitrate: '1.23456' } },
      parameters,
    )

    expect(result).toEqual({
      errors: {
        ph: 'measurements.errors.number_invalid',
        temperature: 'measurements.errors.out_of_range',
        nitrate: 'measurements.errors.number_invalid',
      },
    })
  })

  it('keeps the decimals of a photometer reading, up to four', () => {
    const result = toNewMeasurements({ ...empty, values: { nitrate: '0.0251' } }, parameters)

    expect(result).toEqual({ request: { measuredAt: null, note: null, values: { nitrate: 0.0251 } } })
  })

  it('accepts the bounds themselves', () => {
    const result = toNewMeasurements({ ...empty, values: { ph: '14', temperature: '0' } }, parameters)

    expect(result).toEqual({ request: { measuredAt: null, note: null, values: { ph: 14, temperature: 0 } } })
  })

  it('refuses a moment that is not a date and time', () => {
    const result = toNewMeasurements(
      { ...empty, values: { ph: '7' }, moment: '', momentChanged: true },
      parameters,
    )

    expect(result).toEqual({ errors: { moment: 'measurements.errors.moment_invalid' } })
  })
})

describe('toChange', () => {
  const ph = parameters[1]

  it('always sends the moment, because an edit replaces the Measurement', () => {
    const result = toChange({ value: '6,9', moment: '2026-01-10T08:30', note: '' }, ph)

    expect(result).toEqual({
      change: { value: 6.9, measuredAt: new Date(2026, 0, 10, 8, 30).toISOString(), note: null },
    })
  })

  it('checks the value against the bounds of its own parameter', () => {
    expect(toChange({ value: '72', moment: '2026-01-10T08:30', note: '' }, ph)).toEqual({
      errors: { value: 'measurements.errors.out_of_range' },
    })
    expect(toChange({ value: '', moment: '2026-01-10T08:30', note: '' }, ph)).toEqual({
      errors: { value: 'measurements.errors.number_invalid' },
    })
  })
})

describe('toLocalInput', () => {
  it('writes an instant the way a date and time field wants it, in the browser’s own time zone', () => {
    expect(toLocalInput(new Date(2026, 0, 10, 8, 30, 45).toISOString())).toBe('2026-01-10T08:30')
    expect(toLocalInput(new Date(2026, 11, 31, 23, 59).toISOString())).toBe('2026-12-31T23:59')
  })
})

describe('formatMoment', () => {
  it('shows the day and time in the time zone and language of the person', () => {
    const evening = '2026-01-10T22:30:00Z'

    expect(formatMoment(evening, 'en', 'America/Sao_Paulo')).toBe('Jan 10, 2026, 7:30 PM')
    expect(formatMoment(evening, 'pt-BR', 'America/Sao_Paulo')).toBe('10 de jan. de 2026, 19:30')
  })
})

describe('groupByMoment', () => {
  const at = (id: string, parameter: Measurement['parameter'], measuredAt: string, note: string | null = null): Measurement => ({
    id,
    parameter,
    value: 1,
    measuredAt,
    note,
  })

  it('puts the values recorded together under one moment and keeps the newest first', () => {
    const groups = groupByMoment([
      at('a', 'nitrate', '2026-01-12T08:00:00Z'),
      at('b', 'ph', '2026-01-10T08:00:00Z', 'API kit'),
      at('c', 'nitrate', '2026-01-10T08:00:00Z', 'API kit'),
    ])

    expect(groups.map((group) => [group.measuredAt, group.note, group.items.map((item) => item.id)])).toEqual([
      ['2026-01-12T08:00:00Z', null, ['a']],
      ['2026-01-10T08:00:00Z', 'API kit', ['b', 'c']],
    ])
  })
})

describe('describeMeasurementError', () => {
  it('turns the API’s codes into message keys, per field', () => {
    const error = new ApiError(400, 'validation_failed', {
      'values.ph': 'out_of_range',
      'values.nitrate': 'invalid',
      measuredAt: 'in_future',
      note: 'too_long',
    })

    expect(describeMeasurementError(error)).toEqual({
      ph: 'measurements.errors.out_of_range',
      nitrate: 'measurements.errors.number_invalid',
      moment: 'measurements.errors.in_future',
      note: 'measurements.errors.note_too_long',
    })
  })

  it('maps the single value of an edit to the value field', () => {
    const error = new ApiError(400, 'validation_failed', { value: 'out_of_range' })

    expect(describeMeasurementError(error)).toEqual({ value: 'measurements.errors.out_of_range' })
  })

  it('says the tank or the measurement does not exist, and falls back to a general message', () => {
    expect(describeMeasurementError(new ApiError(404, 'tank_not_found'))).toEqual({
      general: 'measurements.errors.not_found',
    })
    expect(describeMeasurementError(new ApiError(404, 'measurement_not_found'))).toEqual({
      general: 'measurements.errors.not_found',
    })
    expect(describeMeasurementError(new Error('network'))).toEqual({ general: 'measurements.errors.generic' })
  })
})
