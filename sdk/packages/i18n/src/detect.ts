/**
 * Supported locale codes.
 * Add new locales here as translations are added.
 */
export type SupportedLocale = "en" | "tr";

const SUPPORTED: ReadonlySet<string> = new Set<SupportedLocale>(["en", "tr"]);

/**
 * Normalises a BCP-47 language tag to a supported locale code.
 * "tr-TR" → "tr", "en-US" → "en", "de" → "en" (fallback).
 */
function normalise(tag: string): SupportedLocale {
	const base = tag.split(/[-_]/)[0]?.toLowerCase() ?? "";
	return SUPPORTED.has(base) ? (base as SupportedLocale) : "en";
}

/**
 * Detects the user's preferred locale.
 *
 * Priority order:
 *   1. NEXUS_LOCALE env var (explicit override)
 *   2. Browser: navigator.language
 *   3. Node.js: LANG / LC_ALL / LC_MESSAGES env vars
 *   4. Node.js: Intl.DateTimeFormat resolved locale
 *   5. Fallback: "en"
 */
export function detectLocale(): SupportedLocale {
	// 1. Explicit override
	const envOverride =
		(typeof process !== "undefined" && process.env?.NEXUS_LOCALE) || "";
	if (envOverride) {
		return normalise(envOverride);
	}

	// 2. Browser navigator.language
	if (typeof navigator !== "undefined" && navigator.language) {
		return normalise(navigator.language);
	}

	// 3. Node.js LANG / LC_ALL / LC_MESSAGES
	if (typeof process !== "undefined") {
		const langEnv =
			process.env?.LC_ALL ||
			process.env?.LC_MESSAGES ||
			process.env?.LANG ||
			process.env?.LANGUAGE ||
			"";
		if (langEnv) {
			// Strip encoding suffix: "tr_TR.UTF-8" → "tr_TR"
			const tag = langEnv.split(".")[0] ?? langEnv;
			if (tag && tag.toLowerCase() !== "c" && tag.toLowerCase() !== "posix") {
				return normalise(tag);
			}
		}
	}

	// 4. Intl API (works in both environments)
	try {
		const resolved = Intl.DateTimeFormat().resolvedOptions().locale;
		if (resolved) {
			return normalise(resolved);
		}
	} catch {
		// Intl not available — ignore
	}

	// 5. Fallback
	return "en";
}
