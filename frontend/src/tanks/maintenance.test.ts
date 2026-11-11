import { describe, expect, it } from 'vitest'
import { ApiError } from '../auth/api'
import { describeMaintenanceError, litersOf, toDetails, type MaintenanceForm } from './maintenance'

const form = (over: Partial<MaintenanceForm> = {}): MaintenanceForm => ({
  types: ['pruning'],
  percent: '',
  moment: '2026-01-10T08:30',
  momentChanged: false,
  note: '',
  ...over,
})

describe('toDetails', () => {
  it('sends the type, no percentage and no moment for a plain record made now', () => {
    expect(toDetails(form(), null)).toEqual({
      details: [{ type: 'pruning', percent: null, performedAt: null, note: null }],
    })
  })

  it('reads the percentage of a water change with a comma or a point', () => {
    const typed = form({ types: ['water_change'], percent: '12,5' })
    expect(toDetails(typed, null)).toEqual({
      details: [{ type: 'water_change', percent: 12.5, performedAt: null, note: null }],
    })
    expect(toDetails({ ...typed, percent: '12.5' }, null)).toEqual({
      details: [{ type: 'water_change', percent: 12.5, performedAt: null, note: null }],
    })
  })

  it('needs a percentage above 0 and at most 100 for a water change', () => {
    const water = (percent: string) => toDetails(form({ types: ['water_change'], percent }), null)
    expect(water('')).toEqual({ errors: { percent: 'maintenance.errors.percent_required' } })
    expect(water('0')).toEqual({ errors: { percent: 'maintenance.errors.percent_out_of_range' } })
    expect(water('101')).toEqual({ errors: { percent: 'maintenance.errors.percent_out_of_range' } })
    expect(water('33.333')).toEqual({ errors: { percent: 'maintenance.errors.number_invalid' } })
    expect(water('100')).toHaveProperty('details')
    expect(water('0.5')).toHaveProperty('details')
  })

  it('leaves out the percentage of any other type, even if one was typed before switching', () => {
    expect(toDetails(form({ types: ['top_up'], percent: '30' }), null)).toEqual({
      details: [{ type: 'top_up', percent: null, performedAt: null, note: null }],
    })
  })

  it('needs a note for Other, and trims and drops a blank one for the rest', () => {
    expect(toDetails(form({ types: ['other'], note: '  ' }), null)).toEqual({
      errors: { note: 'maintenance.errors.note_required' },
    })
    expect(toDetails(form({ types: ['other'], note: ' moved the heater ' }), null)).toEqual({
      details: [{ type: 'other', percent: null, performedAt: null, note: 'moved the heater' }],
    })
    expect(toDetails(form({ note: '   ' }), null)).toHaveProperty('details.0.note', null)
  })

  it('sends the moment only when it was changed, and otherwise the one it already had', () => {
    const changed = toDetails(form({ momentChanged: true, moment: '2026-01-09T20:15' }), null)
    expect('details' in changed && changed.details[0].performedAt).toBe(new Date('2026-01-09T20:15').toISOString())
    expect(toDetails(form(), '2026-01-10T08:30:12Z')).toHaveProperty('details.0.performedAt', '2026-01-10T08:30:12Z')
    expect(toDetails(form({ momentChanged: true, moment: '' }), null)).toEqual({
      errors: { moment: 'maintenance.errors.moment_invalid' },
    })
  })
  it('makes one record for each type picked, all at the same moment', () => {
    const typed = form({
      types: ['water_change', 'substrate_cleaning', 'filter_cleaning'],
      percent: '30',
      momentChanged: true,
      moment: '2026-01-09T20:15',
    })
    const at = new Date('2026-01-09T20:15').toISOString()
    expect(toDetails(typed, null)).toEqual({
      details: [
        { type: 'water_change', percent: 30, performedAt: at, note: null },
        { type: 'filter_cleaning', percent: null, performedAt: at, note: null },
        { type: 'substrate_cleaning', percent: null, performedAt: at, note: null },
      ],
    })
  })

  it('puts the note on Other when it is picked, and otherwise on the first record', () => {
    const noteOf = (types: MaintenanceForm['types']) => {
      const checked = toDetails(form({ types, note: 'clogged', percent: '10' }), null)
      return 'details' in checked ? checked.details.map((d) => d.note) : null
    }
    expect(noteOf(['water_change', 'filter_cleaning'])).toEqual(['clogged', null])
    expect(noteOf(['filter_cleaning', 'other'])).toEqual([null, 'clogged'])
  })

  it('asks for the percentage only when a water change is among the types, and for a note only with Other', () => {
    expect(toDetails(form({ types: ['water_change', 'other'], percent: '', note: '' }), null)).toEqual({
      errors: { percent: 'maintenance.errors.percent_required', note: 'maintenance.errors.note_required' },
    })
    expect(toDetails(form({ types: ['filter_cleaning', 'pruning'], percent: 'abc' }), null)).toHaveProperty('details')
  })

  it('needs at least one type', () => {
    expect(toDetails(form({ types: [] }), null)).toEqual({ errors: { type: 'maintenance.errors.type_required' } })
  })
})

describe('describeMaintenanceError', () => {
  const refused = (fields: Record<string, string>) => new ApiError(400, 'validation_failed', fields)

  it('turns the codes of each field into messages', () => {
    expect(describeMaintenanceError(refused({ percent: 'out_of_range', performedAt: 'in_future', note: 'required' }))).toEqual({
      percent: 'maintenance.errors.percent_out_of_range',
      moment: 'maintenance.errors.in_future',
      note: 'maintenance.errors.note_required',
    })
    expect(describeMaintenanceError(refused({ note: 'too_long' }))).toEqual({ note: 'maintenance.errors.note_too_long' })
  })

  it('says not found for a missing tank or entry, and a generic message for anything else', () => {
    expect(describeMaintenanceError(new ApiError(404, 'maintenance_not_found'))).toEqual({
      general: 'maintenance.errors.not_found',
    })
    expect(describeMaintenanceError(new ApiError(404, 'tank_not_found'))).toEqual({ general: 'maintenance.errors.not_found' })
    expect(describeMaintenanceError(new Error('offline'))).toEqual({ general: 'maintenance.errors.generic' })
  })
})

describe('litersOf', () => {
  it('works out the water a percentage of the net volume is, rounded to whole liters', () => {
    expect(litersOf(30, 120)).toBe(36)
    expect(litersOf(12.5, 54)).toBe(7)
  })
})
