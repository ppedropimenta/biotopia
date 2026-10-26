import type { Language } from '../i18n/language'

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
    headers['Content-Type'] = 'application/json'
  }
  const response = await fetch(path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
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
  logIn: (email: string, password: string) => request<Account>('POST', '/api/auth/login', { email, password }),
  logOut: () => request<void>('POST', '/api/auth/logout'),
  saveLanguage: (language: Language) => request<void>('PUT', '/api/me/language', { language }),
}
