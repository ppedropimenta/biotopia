import { useEffect } from 'react'

/**
 * Fades in and lifts each `[data-reveal]` element the first time it scrolls into view. The value of the
 * attribute is a delay in milliseconds, to stagger the parts of one block. Everything starts visible: the
 * hidden state is added here, only to elements below the fold, so a page without script or without
 * IntersectionObserver (or with reduced motion) shows all its content.
 */
export function useReveal() {
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.classList.add('reveal-in')
          observer.unobserve(entry.target)
        }
      },
      { rootMargin: '0px 0px -10% 0px' },
    )
    for (const element of document.querySelectorAll<HTMLElement>('[data-reveal]')) {
      if (element.getBoundingClientRect().top < window.innerHeight * 0.9) continue
      element.style.setProperty('--rise-delay', `${element.dataset.reveal || 0}ms`)
      element.classList.add('reveal-hidden')
      observer.observe(element)
    }
    return () => observer.disconnect()
  }, [])
}
