import { detectLocale, type SupportedLocale } from "./detect";
import { en, type TranslationKeys } from "./locales/en";
import { tr } from "./locales/tr";

export type { SupportedLocale, TranslationKeys };
export { detectLocale };

const LOCALES: Record<SupportedLocale, TranslationKeys> = { en, tr };

let _locale: SupportedLocale = detectLocale();

/** Override the active locale at runtime. */
export function setLocale(locale: SupportedLocale): void {
	_locale = locale;
}

/** Returns the currently active locale code. */
export function getLocale(): SupportedLocale {
	return _locale;
}

type PathsOf<T, Prefix extends string = ""> = T extends object
	? {
			[K in keyof T & string]: T[K] extends string
				? `${Prefix}${K}`
				: PathsOf<T[K], `${Prefix}${K}.`>;
		}[keyof T & string]
	: never;

export type TranslationKey = PathsOf<TranslationKeys>;

/**
 * Resolves a dot-separated key against the active locale,
 * falling back to English when the key is missing.
 *
 * @example
 *   t("tools.wantsToEdit")     // "Nexus wants to edit this file:"
 *   t("browser.isUsing")       // "Nexus is using the browser:"
 */
export function t(key: TranslationKey): string {
	const parts = (key as string).split(".");
	let node: unknown = LOCALES[_locale];
	for (const part of parts) {
		if (node == null || typeof node !== "object") {
			node = undefined;
			break;
		}
		node = (node as Record<string, unknown>)[part];
	}
	if (typeof node === "string") {
		return node;
	}

	// Fallback to English
	let fallback: unknown = en;
	for (const part of parts) {
		if (fallback == null || typeof fallback !== "object") {
			fallback = undefined;
			break;
		}
		fallback = (fallback as Record<string, unknown>)[part];
	}
	if (typeof fallback === "string") {
		return fallback;
	}

	// Return key as last resort
	return key as string;
}
