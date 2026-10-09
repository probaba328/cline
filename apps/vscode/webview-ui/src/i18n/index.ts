import i18n from "i18next"
import { initReactI18next } from "react-i18next"

import en from "./locales/en.json"
import tr from "./locales/tr.json"

const SUPPORTED_LOCALES = ["en", "tr"] as const
type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]

function detectLocale(): SupportedLocale {
	// navigator.language in VS Code's Electron webview reflects vscode.env.language
	const raw = (typeof navigator !== "undefined" ? navigator.language : "en").toLowerCase()
	const lang = raw.split("-")[0] as SupportedLocale
	return SUPPORTED_LOCALES.includes(lang) ? lang : "en"
}

i18n.use(initReactI18next).init({
	resources: {
		en: { translation: en },
		tr: { translation: tr },
	},
	lng: detectLocale(),
	fallbackLng: "en",
	interpolation: {
		escapeValue: false,
	},
})

export default i18n
