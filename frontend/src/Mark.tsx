// The app's mark: a stem plant rooted in the substrate, in blackwater and neon blue.
export function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <rect width="32" height="32" fill="var(--color-tannin)" />
      <path d="M16 24.5V11" stroke="var(--color-neon)" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M16 18c-4 0-6.2-2-6.6-5.2 3.6 0 6.1 1.6 6.6 5.2zM16 14.6c3.7 0 5.8-2 6.2-5.1-3.5 0-5.7 1.5-6.2 5.1z"
        fill="var(--color-neon)"
      />
      <path d="M9 24.5h14" stroke="var(--color-neon)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
