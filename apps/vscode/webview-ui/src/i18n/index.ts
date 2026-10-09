import i18n from "i18next"
import { initReactI18next } from "react-i18next"

import en from "./locales/en.json"
import tr from "./locales/tr.json"
import de from "./locales/de.json"
import fr from "./locales/fr.json"
import es from "./locales/es.json"
import ptBR from "./locales/pt-BR.json"
import ja from "./locales/ja.json"
import ko from "./locales/ko.json"
import zhCN from "./locales/zh-CN.json"
import zhTW from "./locales/zh-TW.json"
import ar from "./locales/ar.json"
import ru from "./locales/ru.json"
import hi from "./locales/hi.json"

// Maps BCP 47 language tags (from navigator.language / vscode.env.language) to bundle keys.
// Entries with empty translations fall back to English via i18next fallbackLng.
const LOCALE_MAP: Record<string, string> = {
	en: "en",
	tr: "tr",
	de: "de",
	fr: "fr",
	es: "es",
	pt: "pt-BR",
	ja: "ja",
	ko: "ko",
	zh: "zh-CN",
	ar: "ar",
	ru: "ru",
	hi: "hi",
}

const REGION_LOCALE_MAP: Record<string, string> = {
	"zh-tw": "zh-TW",
	"zh-hk": "zh-TW",
	"zh-mo": "zh-TW",
	"pt-br": "pt-BR",
}

function detectLocale(): string {
	// navigator.language in VS Code's Electron webview reflects vscode.env.language
	const raw = (typeof navigator !== "undefined" ? navigator.language : "en").toLowerCase()

	// Check full tag first (e.g. "zh-TW", "pt-BR")
	if (REGION_LOCALE_MAP[raw]) {
		return REGION_LOCALE_MAP[raw]
	}

	// Fall back to language-only prefix (e.g. "zh" → "zh-CN")
	const lang = raw.split("-")[0]
	return LOCALE_MAP[lang] ?? "en"
}

i18n.use(initReactI18next).init({
	resources: {
		en: { translation: en },
		tr: { translation: tr },
		de: { translation: de },
		fr: { translation: fr },
		es: { translation: es },
		"pt-BR": { translation: ptBR },
		ja: { translation: ja },
		ko: { translation: ko },
		"zh-CN": { translation: zhCN },
		"zh-TW": { translation: zhTW },
		ar: { translation: ar },
		ru: { translation: ru },
		hi: { translation: hi },
	},
	lng: detectLocale(),
	fallbackLng: "en",
	interpolation: {
		escapeValue: false,
	},
})

export default i18n
