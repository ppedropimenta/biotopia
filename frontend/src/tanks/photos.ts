import { ApiError } from '../auth/api'
import type { Language } from '../i18n/language'
import { formatNumber } from './numbers'

/** A Tank Photo as the API lists it. The picture is at `photoUrl`. */
export type Photo = {
  id: string
  takenAt: string
  note: string | null
  width: number
  height: number
}

/** How many Tank Photos a tank has and the id of the one with the latest date. */
export type PhotoSummary = { count: number; latestId: string | null }

/** The storage a user has used and may use, and the biggest file they may send, in bytes. */
export type PhotoUsage = { usedBytes: number; quotaBytes: number; maxFileBytes: number }

/** What the API takes to change a Tank Photo. */
export type PhotoChange = { takenAt: string; note: string | null }

/** The stored picture of a Tank Photo. It needs the session, so it is a plain `src` on the same site. */
export const photoUrl = (tankId: string, photoId: string) => `/api/tanks/${tankId}/photos/${photoId}/file`

/** The kinds of file the server accepts: JPEG, PNG and WebP. */
export const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'] as const

export type ErrorKey =
  | 'photos.errors.file_required'
  | 'photos.errors.unsupported_type'
  | 'photos.errors.too_large'
  | 'photos.errors.too_many_pixels'
  | 'photos.errors.moment_invalid'
  | 'photos.errors.in_future'
  | 'photos.errors.note_too_long'
  | 'photos.errors.quota'
  | 'photos.errors.not_found'
  | 'photos.errors.generic'

export type FormErrors = Partial<Record<'file' | 'moment' | 'note' | 'general', ErrorKey>>

/** The problem with a file before it is sent, or null. The server checks again; this only saves the wait. */
export function checkFile(file: File | null, maxBytes: number): ErrorKey | null {
  if (file === null) return 'photos.errors.file_required'
  if (!(acceptedTypes as readonly string[]).includes(file.type)) return 'photos.errors.unsupported_type'
  return file.size > maxBytes ? 'photos.errors.too_large' : null
}

const fileCodes: Record<string, ErrorKey> = {
  required: 'photos.errors.file_required',
  unsupported_type: 'photos.errors.unsupported_type',
  too_large: 'photos.errors.too_large',
  too_many_pixels: 'photos.errors.too_many_pixels',
}

/** Turns the API's stable codes into message keys, so every message is in the language the person chose. */
export function describePhotoError(error: unknown): FormErrors {
  if (!(error instanceof ApiError)) return { general: 'photos.errors.generic' }
  if (error.code === 'photo_quota_exceeded') return { general: 'photos.errors.quota' }
  if (error.code === 'tank_not_found' || error.code === 'photo_not_found') return { general: 'photos.errors.not_found' }

  if (error.code === 'validation_failed') {
    const errors: FormErrors = {}
    const { file, takenAt, note } = error.fields
    if (file) errors.file = fileCodes[file] ?? 'photos.errors.generic'
    if (takenAt) errors.moment = takenAt === 'in_future' ? 'photos.errors.in_future' : 'photos.errors.moment_invalid'
    if (note) errors.note = 'photos.errors.note_too_long'
    if (Object.keys(errors).length > 0) return errors
  }
  return { general: 'photos.errors.generic' }
}

const kilobyte = 1024
const megabyte = 1024 * 1024

/** A size for people: kilobytes below a megabyte, megabytes above, written the way the language writes numbers. */
export function formatBytes(bytes: number, language: Language): string {
  if (bytes < megabyte) return `${formatNumber(Math.round(bytes / kilobyte), language)} KB`
  return `${formatNumber(Math.round((bytes / megabyte) * 10) / 10, language)} MB`
}
