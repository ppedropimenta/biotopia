import { describe, expect, it } from 'vitest'
import { ApiError } from '../auth/api'
import { checkFile, describePhotoError, formatBytes, photoUrl } from './photos'

const file = (type: string, size: number) => ({ type, size }) as File
const tenMb = 10 * 1024 * 1024

describe('checkFile', () => {
  it('asks for a file when there is none', () => {
    expect(checkFile(null, tenMb)).toBe('photos.errors.file_required')
  })

  it('accepts JPEG, PNG and WebP up to the limit', () => {
    for (const type of ['image/jpeg', 'image/png', 'image/webp']) expect(checkFile(file(type, tenMb), tenMb)).toBeNull()
  })

  it('refuses another kind of file, and one over the limit, before sending it', () => {
    expect(checkFile(file('image/gif', 100), tenMb)).toBe('photos.errors.unsupported_type')
    expect(checkFile(file('application/pdf', 100), tenMb)).toBe('photos.errors.unsupported_type')
    expect(checkFile(file('image/jpeg', tenMb + 1), tenMb)).toBe('photos.errors.too_large')
  })
})

describe('describePhotoError', () => {
  const invalid = (fields: Record<string, string>, status = 400) => new ApiError(status, 'validation_failed', fields)

  it('turns the field codes into messages for the right field', () => {
    expect(describePhotoError(invalid({ file: 'unsupported_type' }))).toEqual({ file: 'photos.errors.unsupported_type' })
    expect(describePhotoError(invalid({ file: 'too_large' }, 413))).toEqual({ file: 'photos.errors.too_large' })
    expect(describePhotoError(invalid({ file: 'too_many_pixels' }))).toEqual({ file: 'photos.errors.too_many_pixels' })
    expect(describePhotoError(invalid({ takenAt: 'in_future' }))).toEqual({ moment: 'photos.errors.in_future' })
    expect(describePhotoError(invalid({ takenAt: 'invalid' }))).toEqual({ moment: 'photos.errors.moment_invalid' })
    expect(describePhotoError(invalid({ note: 'too_long' }))).toEqual({ note: 'photos.errors.note_too_long' })
  })

  it('tells that the quota is full, and that the tank or photo is gone', () => {
    expect(describePhotoError(new ApiError(413, 'photo_quota_exceeded'))).toEqual({ general: 'photos.errors.quota' })
    expect(describePhotoError(new ApiError(404, 'photo_not_found'))).toEqual({ general: 'photos.errors.not_found' })
    expect(describePhotoError(new ApiError(404, 'tank_not_found'))).toEqual({ general: 'photos.errors.not_found' })
  })

  it('tells that the server is busy with other photos', () => {
    expect(describePhotoError(new ApiError(503, 'photo_busy'))).toEqual({ general: 'photos.errors.busy' })
  })

  it('falls back to a generic message for anything else', () => {
    expect(describePhotoError(new Error('network'))).toEqual({ general: 'photos.errors.generic' })
    expect(describePhotoError(new ApiError(500, 'unknown'))).toEqual({ general: 'photos.errors.generic' })
  })
})

describe('formatBytes', () => {
  it('writes sizes in the language, in KB below a megabyte and in MB above', () => {
    expect(formatBytes(0, 'en')).toBe('0 KB')
    expect(formatBytes(512 * 1024, 'en')).toBe('512 KB')
    expect(formatBytes(1536 * 1024, 'en')).toBe('1.5 MB')
    expect(formatBytes(1536 * 1024, 'pt-BR')).toBe('1,5 MB')
    expect(formatBytes(200 * 1024 * 1024, 'en')).toBe('200 MB')
  })
})

describe('photoUrl', () => {
  it('points at the stored picture of a photo', () => {
    expect(photoUrl('t1', 'p1')).toBe('/api/tanks/t1/photos/p1/file')
  })
})
