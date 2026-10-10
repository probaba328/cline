import type { Anthropic } from "@anthropic-ai/sdk"
import type { NexusMessageMetricsInfo, NexusMessageModelInfo } from "./metrics"

export type NexusPromptInputContent = string

export type NexusMessageRole = "user" | "assistant"

export interface NexusReasoningDetailParam {
	type: "reasoning.text" | string
	text: string
	signature: string
	format: "anthropic-claude-v1" | string
	index: number
}

interface NexusSharedMessageParam {
	// The id of the response that the block belongs to
	call_id?: string
}

export const REASONING_DETAILS_PROVIDERS = ["nexus", "openrouter"]

/**
 * An extension of Anthropic.MessageParam that includes Nexus-specific fields: reasoning_details.
 * This ensures backward compatibility where the messages were stored in Anthropic format with additional
 * fields unknown to Anthropic SDK.
 */
export interface NexusTextContentBlock extends Anthropic.TextBlockParam, NexusSharedMessageParam {
	// reasoning_details only exists for providers listed in REASONING_DETAILS_PROVIDERS
	reasoning_details?: NexusReasoningDetailParam[]
	// Thought Signature associates with Gemini
	signature?: string
}

export interface NexusImageContentBlock extends Anthropic.ImageBlockParam, NexusSharedMessageParam {}

export interface NexusDocumentContentBlock extends Anthropic.DocumentBlockParam, NexusSharedMessageParam {}

export interface NexusUserToolResultContentBlock extends Anthropic.ToolResultBlockParam, NexusSharedMessageParam {}

/**
 * Assistant only content types
 */
export interface NexusAssistantToolUseBlock extends Anthropic.ToolUseBlockParam, NexusSharedMessageParam {
	// reasoning_details only exists for providers listed in REASONING_DETAILS_PROVIDERS
	reasoning_details?: unknown[] | NexusReasoningDetailParam[]
	// Thought Signature associates with Gemini
	signature?: string
}

export interface NexusAssistantThinkingBlock extends Anthropic.ThinkingBlock, NexusSharedMessageParam {
	// The summary items returned by OpenAI response API
	// The reasoning details that will be moved to the text block when finalized
	summary?: unknown[] | NexusReasoningDetailParam[]
}

export interface NexusAssistantRedactedThinkingBlock extends Anthropic.RedactedThinkingBlockParam, NexusSharedMessageParam {}

export type NexusToolResponseContent = NexusPromptInputContent | Array<NexusTextContentBlock | NexusImageContentBlock>

export type NexusUserContent =
	| NexusTextContentBlock
	| NexusImageContentBlock
	| NexusDocumentContentBlock
	| NexusUserToolResultContentBlock

export type NexusAssistantContent =
	| NexusTextContentBlock
	| NexusImageContentBlock
	| NexusDocumentContentBlock
	| NexusAssistantToolUseBlock
	| NexusAssistantThinkingBlock
	| NexusAssistantRedactedThinkingBlock

export type NexusContent = NexusUserContent | NexusAssistantContent

/**
 * An extension of Anthropic.MessageParam that includes Nexus-specific fields.
 * This ensures backward compatibility where the messages were stored in Anthropic format,
 * while allowing for additional metadata specific to Nexus to avoid unknown fields in Anthropic SDK
 * added by ignoring the type checking for those fields.
 */
export interface NexusStorageMessage extends Anthropic.MessageParam {
	/**
	 * Response ID associated with this message
	 */
	id?: string
	role: NexusMessageRole
	content: NexusPromptInputContent | NexusContent[]
	/**
	 * NOTE: model information used when generating this message.
	 * Internal use for message conversion only.
	 * MUST be removed before sending message to any LLM provider.
	 */
	modelInfo?: NexusMessageModelInfo
	/**
	 * LLM operational and performance metrics for this message
	 * Includes token counts, costs.
	 */
	metrics?: NexusMessageMetricsInfo
	/**
	 * Timestamp of when the message was created
	 */
	ts?: number
}

/**
 * Converts NexusStorageMessage to Anthropic.MessageParam by removing Nexus-specific fields
 * Nexus-specific fields (like modelInfo, reasoning_details) are properly omitted.
 */
export function convertNexusStorageToAnthropicMessage(
	nexusMessage: NexusStorageMessage,
	provider = "anthropic",
): Anthropic.MessageParam {
	const { role, content } = nexusMessage

	// Handle string content - fast path
	if (typeof content === "string") {
		return { role, content }
	}

	// Removes thinking block that has no signature (invalid thinking block that's incompatible with Anthropic API)
	const filteredContent = content.filter((b) => b.type !== "thinking" || !!b.signature)

	// Handle array content - strip Nexus-specific fields for non-reasoning_details providers
	const shouldCleanContent = !REASONING_DETAILS_PROVIDERS.includes(provider)
	const cleanedContent = shouldCleanContent
		? filteredContent.map(cleanContentBlock)
		: (filteredContent as Anthropic.MessageParam["content"])

	return { role, content: cleanedContent }
}

/**
 * Nexus stores images as base64, so an image block's source is always a base64 source.
 * The Anthropic SDK types the source as a Base64ImageSource | URLImageSource union, so this
 * narrows to the base64 variant for the transform layer. URL sources are not produced by Nexus,
 * so they degrade to empty values rather than throwing.
 */
export function getBase64ImageSource(source: Anthropic.ImageBlockParam["source"]): { mediaType: string; data: string } {
	if (source.type === "base64") {
		return { mediaType: source.media_type, data: source.data }
	}
	return { mediaType: "", data: "" }
}

/**
 * Builds a base64 data URL from an image block's source. See getBase64ImageSource.
 */
export function getImageDataUrl(source: Anthropic.ImageBlockParam["source"]): string {
	const { mediaType, data } = getBase64ImageSource(source)
	return `data:${mediaType};base64,${data}`
}

/**
 * Clean a content block by removing Nexus-specific fields and returning only Anthropic-compatible fields
 */
export function cleanContentBlock(block: NexusContent): Anthropic.ContentBlock {
	// Fast path: if no Nexus-specific fields exist, return as-is
	const hasNexusFields =
		"reasoning_details" in block ||
		"call_id" in block ||
		"summary" in block ||
		(block.type !== "thinking" && "signature" in block)

	if (!hasNexusFields) {
		return block as Anthropic.ContentBlock
	}

	// Removes Nexus-specific fields & the signature field that's added for Gemini.
	const { reasoning_details, call_id, summary, ...rest } = block as any

	// Remove signature from non-thinking blocks that were added for Gemini
	if (block.type !== "thinking" && rest.signature) {
		rest.signature = undefined
	}

	return rest satisfies Anthropic.ContentBlock
}
