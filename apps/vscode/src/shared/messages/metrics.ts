import { Mode } from "../storage/types"

export interface NexusMessageModelInfo {
	modelId: string
	providerId: string
	mode: Mode
}

interface NexusTokensInfo {
	prompt: number // Total input tokens (includes cached + non-cached)
	completion: number // Total output tokens
	cached: number // Subset of prompt_tokens that were cache hits
}

export interface NexusMessageMetricsInfo {
	tokens?: NexusTokensInfo
	cost?: number // Monetary cost for this turn
}
