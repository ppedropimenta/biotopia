import { describe, expect, it } from 'vitest'
import { ApiError } from '../auth/api'
import { describeTankError, emptyForm, formFromTank, toDetails } from './form'

const filled = { ...emptyForm, name: 'Blackwater 120', startDate: '2025-03-01' }

describe('toDetails', () => {
  it('turns what was typed into the request, reading numbers in the language of the person', () => {
    const result = toDetails(
      { ...filled, lengthCm: '80,5', widthCm: '35', heightCm: '45', netVolumeLiters: '98,5', note: 'Peat filter' },
      'pt-BR',
    )

    expect(result).toEqual({
      details: {
        name: 'Blackwater 120',
        startDate: '2025-03-01',
        lengthCm: 80.5,
        widthCm: 35,
        heightCm: 45,
        netVolumeLiters: 98.5,
        note: 'Peat filter',
      },
    })
  })

  it('sends empty optional fields as no value, so Net Volume stays empty', () => {
    expect(toDetails(filled, 'en')).toEqual({
      details: {
        name: 'Blackwater 120',
        startDate: '2025-03-01',
        lengthCm: null,
        widthCm: null,
        heightCm: null,
        netVolumeLiters: null,
        note: null,
      },
    })
  })

  it('reports a number written the wrong way under its own field, without calling the API', () => {
    const result = toDetails({ ...filled, lengthCm: '80,5', heightCm: 'tall' }, 'en')

    expect(result).toEqual({
      errors: { lengthCm: 'tanks.errors.number_invalid', heightCm: 'tanks.errors.number_invalid' },
    })
  })

  it('applies the same limits as the API, so a number it would refuse never leaves the form', () => {
    const result = toDetails(
      { ...filled, lengthCm: '0', widthCm: '10,123', heightCm: '10001', netVolumeLiters: '1000001' },
      'pt-BR',
    )

    expect(result).toEqual({
      errors: {
        lengthCm: 'tanks.errors.number_invalid',
        widthCm: 'tanks.errors.number_invalid',
        heightCm: 'tanks.errors.number_invalid',
        netVolumeLiters: 'tanks.errors.number_invalid',
      },
    })
  })

  it('accepts the limits themselves', () => {
    const result = toDetails({ ...filled, lengthCm: '10000', netVolumeLiters: '1000000' }, 'pt-BR')

    expect(result).toMatchObject({ details: { lengthCm: 10000, netVolumeLiters: 1000000 } })
  })

  it('reports a missing name or start date before asking the API', () => {
    expect(toDetails({ ...emptyForm }, 'en')).toEqual({
      errors: { name: 'tanks.errors.required', startDate: 'tanks.errors.required' },
    })
  })
})

describe('formFromTank', () => {
  it('fills the form with the numbers written in the language of the person, without thousands separators', () => {
    const form = formFromTank(
      {
        id: 'abc',
        name: 'Blackwater 120',
        startDate: '2025-03-01',
        lengthCm: 1200.5,
        widthCm: null,
        heightCm: null,
        netVolumeLiters: 98.5,
        note: null,
        archivedAt: null,
      },
      'pt-BR',
    )

    expect(form).toEqual({
      name: 'Blackwater 120',
      startDate: '2025-03-01',
      lengthCm: '1200,5',
      widthCm: '',
      heightCm: '',
      netVolumeLiters: '98,5',
      note: '',
    })
  })
})

describe('describeTankError', () => {
  it('puts the API’s field codes under their fields', () => {
    const error = new ApiError(400, 'validation_failed', {
      name: 'too_long',
      startDate: 'required',
      netVolumeLiters: 'invalid',
      note: 'too_long',
    })

    expect(describeTankError(error)).toEqual({
      name: 'tanks.errors.name_too_long',
      startDate: 'tanks.errors.required',
      netVolumeLiters: 'tanks.errors.number_invalid',
      note: 'tanks.errors.note_too_long',
    })
  })

  it('says the tank is gone when the API does not find it', () => {
    expect(describeTankError(new ApiError(404, 'tank_not_found'))).toEqual({ general: 'tanks.errors.not_found' })
  })

  it('falls back to a general message for anything else', () => {
    expect(describeTankError(new ApiError(500, 'unknown'))).toEqual({ general: 'tanks.errors.generic' })
    expect(describeTankError(new Error('network'))).toEqual({ general: 'tanks.errors.generic' })
  })
})
