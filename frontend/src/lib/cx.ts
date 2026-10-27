/** Joins class names and skips falsy values: cx('a', condition && 'b') */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}
