import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"

// detectLocale reads navigator.language at call time, so we mock the property
// before importing the module.  Each test overrides the mock value.
function withNavigatorLanguage(lang: string, fn: () => void): void {
	const original = navigator.language
	Object.defineProperty(navigator, "language", { value: lang, configurable: true, writable: true })
	fn()
	Object.defineProperty(navigator, "language", { value: original, configurable: true, writable: true })
}

// Import after mocking so the module re-reads navigator.language each call.
// detectLocale is a pure function — we can call it directly.
describe("detectLocale", () => {
	it("maps 'tr-TR' to Turkish", async () => {
		const { detectLocale } = await import("../index")
		withNavigatorLanguage("tr-TR", () => {
			expect(detectLocale()).toBe("tr")
		})
	})

	it("maps 'tr' (bare tag) to Turkish", async () => {
		const { detectLocale } = await import("../index")
		withNavigatorLanguage("tr", () => {
			expect(detectLocale()).toBe("tr")
		})
	})

	it("maps 'zh-TW' to Traditional Chinese", async () => {
		const { detectLocale } = await import("../index")
		withNavigatorLanguage("zh-TW", () => {
			expect(detectLocale()).toBe("zh-TW")
		})
	})

	it("maps 'zh-HK' to Traditional Chinese (Hong Kong)", async () => {
		const { detectLocale } = await import("../index")
		withNavigatorLanguage("zh-HK", () => {
			expect(detectLocale()).toBe("zh-TW")
		})
	})

	it("maps 'zh-CN' to Simplified Chinese via region map", async () => {
		const { detectLocale } = await import("../index")
		// 'zh-CN' is NOT in REGION_LOCALE_MAP; falls through to lang prefix 'zh' → 'zh-CN'
		withNavigatorLanguage("zh-CN", () => {
			expect(detectLocale()).toBe("zh-CN")
		})
	})

	it("maps 'pt-BR' to Brazilian Portuguese", async () => {
		const { detectLocale } = await import("../index")
		withNavigatorLanguage("pt-BR", () => {
			expect(detectLocale()).toBe("pt-BR")
		})
	})

	it("maps 'pt-PT' to Brazilian Portuguese (fallback via 'pt' prefix)", async () => {
		const { detectLocale } = await import("../index")
		withNavigatorLanguage("pt-PT", () => {
			expect(detectLocale()).toBe("pt-BR")
		})
	})

	it("maps 'de-DE' to German", async () => {
		const { detectLocale } = await import("../index")
		withNavigatorLanguage("de-DE", () => {
			expect(detectLocale()).toBe("de")
		})
	})

	it("maps 'fr-FR' to French", async () => {
		const { detectLocale } = await import("../index")
		withNavigatorLanguage("fr-FR", () => {
			expect(detectLocale()).toBe("fr")
		})
	})

	it("maps 'ja' to Japanese", async () => {
		const { detectLocale } = await import("../index")
		withNavigatorLanguage("ja", () => {
			expect(detectLocale()).toBe("ja")
		})
	})

	it("maps 'ko' to Korean", async () => {
		const { detectLocale } = await import("../index")
		withNavigatorLanguage("ko", () => {
			expect(detectLocale()).toBe("ko")
		})
	})

	it("maps 'ar' to Arabic", async () => {
		const { detectLocale } = await import("../index")
		withNavigatorLanguage("ar", () => {
			expect(detectLocale()).toBe("ar")
		})
	})

	it("maps 'ru' to Russian", async () => {
		const { detectLocale } = await import("../index")
		withNavigatorLanguage("ru", () => {
			expect(detectLocale()).toBe("ru")
		})
	})

	it("maps 'hi' to Hindi", async () => {
		const { detectLocale } = await import("../index")
		withNavigatorLanguage("hi", () => {
			expect(detectLocale()).toBe("hi")
		})
	})

	it("falls back to English for unsupported languages", async () => {
		const { detectLocale } = await import("../index")
		withNavigatorLanguage("xyz-XY", () => {
			expect(detectLocale()).toBe("en")
		})
	})

	it("falls back to English for empty string", async () => {
		const { detectLocale } = await import("../index")
		withNavigatorLanguage("", () => {
			expect(detectLocale()).toBe("en")
		})
	})

	it("is case-insensitive ('TR' uppercase falls through to lowercase match)", async () => {
		const { detectLocale } = await import("../index")
		// detectLocale lowercases the raw value before comparing
		withNavigatorLanguage("TR", () => {
			expect(detectLocale()).toBe("tr")
		})
	})
})
