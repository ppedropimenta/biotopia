import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react'

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> & {
  id: string
  label: string
  hint?: string
  error?: string
}

/** A labelled input on a blackwater field. The error, when there is one, replaces the hint. */
export function Field({ id, label, hint, error, ...input }: Props) {
  const noteId = `${id}-note`
  return (
    <div>
      <label htmlFor={id} className="text-[15px] text-on-tannin-muted">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? noteId : undefined}
        className="mt-2 block h-12 w-full bg-tannin-3 px-4 text-[18px] text-on-tannin scheme-dark"
        {...input}
      />
      {error ? (
        <p id={noteId} role="alert" className="mt-2 text-[15px] text-neon-red">
          {error}
        </p>
      ) : (
        hint && (
          <p id={noteId} className="mt-2 text-[15px] text-on-tannin-muted">
            {hint}
          </p>
        )
      )}
    </div>
  )
}

type TextAreaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> & {
  id: string
  label: string
  error?: string
}

/** A labelled multi-line input, looking like Field. */
export function TextAreaField({ id, label, error, ...input }: TextAreaProps) {
  const noteId = `${id}-note`
  return (
    <div>
      <label htmlFor={id} className="text-[15px] text-on-tannin-muted">
        {label}
      </label>
      <textarea
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? noteId : undefined}
        className="mt-2 block min-h-32 w-full lg:min-h-64 bg-tannin-3 px-4 py-3 text-[18px] text-on-tannin"
        {...input}
      />
      {error && (
        <p id={noteId} role="alert" className="mt-2 text-[15px] text-neon-red">
          {error}
        </p>
      )}
    </div>
  )
}
