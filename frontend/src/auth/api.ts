import type { Language } from '../i18n/language'
import type { Measurement, MeasurementChange, NewMeasurements, Parameter } from '../tanks/measurements'
import type { Maintenance, MaintenanceDetails, MaintenanceType } from '../tanks/maintenance'
import type { Photo, PhotoChange, PhotoSummary, PhotoUsage } from '../tanks/photos'
import type { Tank, TankDetails } from '../tanks/types'

export type Account = { email: string; language: Language }

/** An error answer from the API: a stable code, and for validation a code per field. */
export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly fields: Record<string, string>

  constructor(status: number, code: string, fields: Record<string, string> = {}) {
    super(code)
    this.status = status
    this.code = code
    this.fields = fields
  }
}

const csrfCookie = 'XSRF-TOKEN'

/** Finds one cookie in the string `document.cookie` returns. */
export function readCookie(cookies: string, name: string): string | null {
  for (const part of cookies.split(';')) {
    const [key, ...value] = part.trim().split('=')
    if (key === name) return decodeURIComponent(value.join('='))
  }
  return null
}

// The server sets this cookie on any response; writes must send it back in a header, which a page on
// another site cannot do because it cannot read our cookie.
async function csrfToken(): Promise<string> {
  const existing = readCookie(document.cookie, csrfCookie)
  if (existing) return existing
  await fetch('/api/me')
  return readCookie(document.cookie, csrfCookie) ?? ''
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {}
  if (method !== 'GET') {
    headers['X-XSRF-TOKEN'] = await csrfToken()
    // A form is sent as it is: the browser writes its Content-Type, with the boundary between the parts.
    if (!(body instanceof FormData)) headers['Content-Type'] = 'application/json'
  }
  const response = await fetch(path, {
    method,
    headers,
    body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
  })
  const isJson = response.headers.get('content-type')?.includes('json') ?? false
  const data = isJson ? await response.json() : null
  if (!response.ok) throw new ApiError(response.status, data?.code ?? 'unknown', data?.fields ?? {})
  return data as T
}

export const api = {
  /** The logged-in account, or null when there is no session. */
  async me(): Promise<Account | null> {
    try {
      return await request<Account>('GET', '/api/me')
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) return null
      throw error
    }
  },
  signUp: (email: string, password: string, language: Language) =>
    request<void>('POST', '/api/auth/signup', { email, password, language }),
  confirm: (token: string) => request<void>('POST', '/api/auth/confirm', { token }),
  resendConfirmation: (email: string) => request<void>('POST', '/api/auth/resend-confirmation', { email }),
  forgotPassword: (email: string) => request<void>('POST', '/api/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) =>
    request<void>('POST', '/api/auth/reset-password', { token, password }),
  /** `remember` false makes the session end when the browser closes, instead of lasting 30 days. */
  logIn: (email: string, password: string, remember: boolean) =>
    request<Account>('POST', '/api/auth/login', { email, password, remember }),
  logOut: () => request<void>('POST', '/api/auth/logout'),
  tanks: () => request<Tank[]>('GET', '/api/tanks'),
  tank: (id: string) => request<Tank>('GET', `/api/tanks/${id}`),
  createTank: (details: TankDetails) => request<Tank>('POST', '/api/tanks', details),
  editTank: (id: string, details: TankDetails) => request<Tank>('PUT', `/api/tanks/${id}`, details),
  parameters: () => request<Parameter[]>('GET', '/api/parameters'),
  measurements: (tankId: string, limit: number) =>
    request<Measurement[]>('GET', `/api/tanks/${tankId}/measurements?limit=${limit}`),
  latestMeasurements: (tankId: string) => request<Measurement[]>('GET', `/api/tanks/${tankId}/measurements/latest`),
  measurement: (tankId: string, id: string) =>
    request<Measurement>('GET', `/api/tanks/${tankId}/measurements/${id}`),
  recordMeasurements: (tankId: string, measurements: NewMeasurements) =>
    request<Measurement[]>('POST', `/api/tanks/${tankId}/measurements`, measurements),
  editMeasurement: (tankId: string, id: string, change: MeasurementChange) =>
    request<Measurement>('PUT', `/api/tanks/${tankId}/measurements/${id}`, change),
  deleteMeasurement: (tankId: string, id: string) =>
    request<void>('DELETE', `/api/tanks/${tankId}/measurements/${id}`),
  /** The tank's Maintenance, newest first; `type` keeps only that kind. */
  maintenance: (tankId: string, { type, limit }: { type?: MaintenanceType; limit?: number } = {}) => {
    const query = new URLSearchParams()
    if (type) query.set('type', type)
    if (limit) query.set('limit', String(limit))
    return request<Maintenance[]>('GET', `/api/tanks/${tankId}/maintenance?${query}`)
  },
  maintenanceEntry: (tankId: string, id: string) =>
    request<Maintenance>('GET', `/api/tanks/${tankId}/maintenance/${id}`),
  recordMaintenance: (tankId: string, details: MaintenanceDetails) =>
    request<Maintenance>('POST', `/api/tanks/${tankId}/maintenance`, details),
  editMaintenance: (tankId: string, id: string, details: MaintenanceDetails) =>
    request<Maintenance>('PUT', `/api/tanks/${tankId}/maintenance/${id}`, details),
  deleteMaintenance: (tankId: string, id: string) => request<void>('DELETE', `/api/tanks/${tankId}/maintenance/${id}`),
  /** The tank's Tank Photos, newest (by their date) first. */
  photos: (tankId: string, { limit }: { limit?: number } = {}) =>
    request<Photo[]>('GET', `/api/tanks/${tankId}/photos${limit ? `?limit=${limit}` : ''}`),
  photoSummary: (tankId: string) => request<PhotoSummary>('GET', `/api/tanks/${tankId}/photos/summary`),
  photo: (tankId: string, id: string) => request<Photo>('GET', `/api/tanks/${tankId}/photos/${id}`),
  /** `takenAt` null means now, by the server's clock. */
  uploadPhoto: (tankId: string, file: File, takenAt: string | null, note: string | null) => {
    const form = new FormData()
    form.append('file', file)
    if (takenAt) form.append('takenAt', takenAt)
    if (note) form.append('note', note)
    return request<Photo>('POST', `/api/tanks/${tankId}/photos`, form)
  },
  editPhoto: (tankId: string, id: string, change: PhotoChange) =>
    request<Photo>('PUT', `/api/tanks/${tankId}/photos/${id}`, change),
  deletePhoto: (tankId: string, id: string) => request<void>('DELETE', `/api/tanks/${tankId}/photos/${id}`),
  photoUsage: () => request<PhotoUsage>('GET', '/api/photo-usage'),
  saveLanguage: (language: Language) => request<void>('PUT', '/api/me/language', { language }),
}
