import { useTranslation } from 'react-i18next'
import type { ErrorKey, Parameter } from './measurements'
import { formatNumber } from './numbers'
import { useLanguage } from './useLanguage'

/** Writes a Measurement error in the app's language; a value out of range names the bounds of its Parameter. */
export function useMeasurementMessage() {
  const { t } = useTranslation()
  const language = useLanguage()
  return (key: ErrorKey | undefined, parameter?: Parameter) =>
    key &&
    t(key, {
      example: formatNumber(6.8, language),
      min: parameter ? formatNumber(parameter.min, language) : '',
      max: parameter ? formatNumber(parameter.max, language) : '',
      unit: parameter?.unit ? ` ${parameter.unit}` : '',
    })
}
