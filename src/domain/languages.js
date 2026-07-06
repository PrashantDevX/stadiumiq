/**
 * Languages StadiumIQ speaks. The World Cup 2026 draws a global crowd, so
 * multilingual assistance is first-class: the UI ships localized strings and
 * the assistant is instructed to reply in the user's chosen language.
 *
 * `dir: 'rtl'` drives right-to-left layout (e.g. Arabic) in the frontend.
 */
export const LANGUAGES = Object.freeze([
  { code: 'en', label: 'English', name: 'English', dir: 'ltr' },
  { code: 'es', label: 'Español', name: 'Spanish', dir: 'ltr' },
  { code: 'fr', label: 'Français', name: 'French', dir: 'ltr' },
  { code: 'pt', label: 'Português', name: 'Portuguese', dir: 'ltr' },
  { code: 'de', label: 'Deutsch', name: 'German', dir: 'ltr' },
  { code: 'ar', label: 'العربية', name: 'Arabic', dir: 'rtl' },
]);

export const DEFAULT_LANGUAGE = 'en';

export const LANGUAGES_BY_CODE = Object.freeze(
  Object.fromEntries(LANGUAGES.map((l) => [l.code, l])),
);

/** Resolve a language, defaulting to English for unknown codes. */
export function resolveLanguage(code) {
  return LANGUAGES_BY_CODE[code] ?? LANGUAGES_BY_CODE[DEFAULT_LANGUAGE];
}
