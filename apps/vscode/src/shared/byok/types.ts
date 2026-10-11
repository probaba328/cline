// BYOK (Bring Your Own Key) — shared types used by both the extension host
// and the webview. Keep this file free of Node / VS Code / DOM imports.

export type BYOKProviderId =
	| "anthropic"
	| "openai"
	| "google"
	| "groq"
	| "openrouter"
	| "ollama"
	| "lmstudio"
	| "openai-compatible"

// ── Provider catalog ────────────────────────────────────────────────────────

export interface BYOKModelSpeed {
	/** Tokens per second, approximate */
	tokensPerSecond: number
	label: "fast" | "balanced" | "slow"
}

export interface BYOKModel {
	id: string
	name: string
	description?: string
	contextWindow?: number
	/** USD per million input tokens */
	inputPricePerMillion?: number
	/** USD per million output tokens */
	outputPricePerMillion?: number
	quality: "best" | "balanced" | "fast"
	speed: BYOKModelSpeed
	recommended?: boolean
}

export interface BYOKProviderCatalogEntry {
	id: BYOKProviderId
	name: string
	tagline: string
	/** null = no key required (local providers) */
	keyPrefix: string | null
	keyRegex: string | null // serialised RegExp source (no flags); null = no validation
	keyPlaceholder: string
	signupUrl: string | null
	docsUrl: string
	models: BYOKModel[]
	defaultModelId: string
	isLocal: boolean
	/** For local providers: default base URL */
	localEndpoint?: string
	/** Accepts a custom base URL (openai-compatible, lmstudio, ollama) */
	supportsCustomEndpoint: boolean
}

// ── Stored key entries ───────────────────────────────────────────────────────

export interface BYOKKeyEntry {
	providerId: BYOKProviderId
	addedAt: number
	lastUsedAt?: number
	/** e.g. sk-ant-...xxxx — never the full key */
	maskedKey: string
	/** Only relevant for openai-compatible and local providers */
	customEndpoint?: string
}

// ── Validation ───────────────────────────────────────────────────────────────

export type BYOKErrorCode =
	| "invalid_key"
	| "rate_limit"
	| "insufficient_credits"
	| "network_error"
	| "model_not_found"
	| "unknown"

export interface BYOKValidationResult {
	ok: boolean
	message: string
	code?: BYOKErrorCode
}

// ── Wizard ───────────────────────────────────────────────────────────────────

export type WizardStep = 1 | 2 | 3 | 4 | 5

export interface WizardState {
	step: WizardStep
	selectedProvider: BYOKProviderId | null
	apiKey: string
	customEndpoint: string
	validationResult: BYOKValidationResult | null
	isValidating: boolean
	selectedModelId: string | null
}

// ── Messages (webview ↔ extension) ───────────────────────────────────────────

export type BYOKWebviewMessage =
	| { type: "byok/validateKey"; providerId: BYOKProviderId; apiKey: string; customEndpoint?: string }
	| { type: "byok/saveKey";     providerId: BYOKProviderId; apiKey: string; customEndpoint?: string }
	| { type: "byok/deleteKey";   providerId: BYOKProviderId }
	| { type: "byok/listKeys" }
	| { type: "byok/testKey";     providerId: BYOKProviderId }

export type BYOKExtensionMessage =
	| { type: "byok/validationResult"; result: BYOKValidationResult }
	| { type: "byok/keysSaved";        providerId: BYOKProviderId }
	| { type: "byok/keyDeleted";       providerId: BYOKProviderId }
	| { type: "byok/keysList";         entries: BYOKKeyEntry[] }
