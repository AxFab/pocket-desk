import { createI18n } from 'vue-i18n'
import fr from './locales/fr.json'
import en from './locales/en.json'

export const SUPPORTED_LOCALES = ['en', 'fr']

/**
 * Initial locale resolution:
 *  1. persisted user preference (localStorage `pocket-desk-prefs`)
 *  2. system language (French → fr)
 *  3. English by default
 */
export function detectLocale() {
  try {
    const saved = JSON.parse(localStorage.getItem('pocket-desk-prefs') || '{}').locale
    if (SUPPORTED_LOCALES.includes(saved)) return saved
  } catch { /* ignore */ }

  const sys = (navigator.language || '').toLowerCase()
  if (sys.startsWith('fr')) return 'fr'
  return 'en'
}

const i18n = createI18n({
  legacy: false,          // use Composition API mode
  locale: detectLocale(),
  fallbackLocale: 'en',
  messages: { fr, en }
})

export default i18n
