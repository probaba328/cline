import { NexusAsk as AppNexusAsk, NexusMessage as AppNexusMessage, NexusSay as AppNexusSay } from "@shared/ExtensionMessage"
import { NexusAsk, NexusMessageType, NexusSay, NexusMessage as ProtoNexusMessage } from "@shared/proto/nexus/ui"

// Helper function to convert NexusAsk string to enum
function convertNexusAskToProtoEnum(ask: AppNexusAsk | undefined): NexusAsk | undefined {
	if (!ask) {
		return undefined
	}

	const mapping: Record<AppNexusAsk, NexusAsk> = {
		followup: NexusAsk.FOLLOWUP,
		plan_mode_respond: NexusAsk.PLAN_MODE_RESPOND,
		act_mode_respond: NexusAsk.ACT_MODE_RESPOND,
		command: NexusAsk.COMMAND,
		command_output: NexusAsk.COMMAND_OUTPUT,
		completion_result: NexusAsk.COMPLETION_RESULT,
		tool: NexusAsk.TOOL,
		api_req_failed: NexusAsk.API_REQ_FAILED,
		resume_task: NexusAsk.RESUME_TASK,
		resume_completed_task: NexusAsk.RESUME_COMPLETED_TASK,
		mistake_limit_reached: NexusAsk.MISTAKE_LIMIT_REACHED,
		browser_action_launch: NexusAsk.BROWSER_ACTION_LAUNCH,
		use_mcp_server: NexusAsk.USE_MCP_SERVER,
		new_task: NexusAsk.NEW_TASK,
		condense: NexusAsk.CONDENSE,
		summarize_task: NexusAsk.SUMMARIZE_TASK,
		report_bug: NexusAsk.REPORT_BUG,
		use_subagents: NexusAsk.USE_SUBAGENTS,
	}

	const result = mapping[ask]
	if (result === undefined) {
	}
	return result
}

// Helper function to convert NexusAsk enum to string
function convertProtoEnumToNexusAsk(ask: NexusAsk): AppNexusAsk | undefined {
	if (ask === NexusAsk.UNRECOGNIZED) {
		return undefined
	}

	const mapping: Record<Exclude<NexusAsk, NexusAsk.UNRECOGNIZED>, AppNexusAsk> = {
		[NexusAsk.FOLLOWUP]: "followup",
		[NexusAsk.PLAN_MODE_RESPOND]: "plan_mode_respond",
		[NexusAsk.ACT_MODE_RESPOND]: "act_mode_respond",
		[NexusAsk.COMMAND]: "command",
		[NexusAsk.COMMAND_OUTPUT]: "command_output",
		[NexusAsk.COMPLETION_RESULT]: "completion_result",
		[NexusAsk.TOOL]: "tool",
		[NexusAsk.API_REQ_FAILED]: "api_req_failed",
		[NexusAsk.RESUME_TASK]: "resume_task",
		[NexusAsk.RESUME_COMPLETED_TASK]: "resume_completed_task",
		[NexusAsk.MISTAKE_LIMIT_REACHED]: "mistake_limit_reached",
		[NexusAsk.BROWSER_ACTION_LAUNCH]: "browser_action_launch",
		[NexusAsk.USE_MCP_SERVER]: "use_mcp_server",
		[NexusAsk.NEW_TASK]: "new_task",
		[NexusAsk.CONDENSE]: "condense",
		[NexusAsk.SUMMARIZE_TASK]: "summarize_task",
		[NexusAsk.REPORT_BUG]: "report_bug",
		[NexusAsk.USE_SUBAGENTS]: "use_subagents",
	}

	return mapping[ask as Exclude<NexusAsk, NexusAsk.UNRECOGNIZED>]
}

// Helper function to convert NexusSay string to enum
function convertNexusSayToProtoEnum(say: AppNexusSay | undefined): NexusSay | undefined {
	if (!say) {
		return undefined
	}

	const mapping: Record<AppNexusSay, NexusSay> = {
		task: NexusSay.TASK,
		error: NexusSay.ERROR,
		api_req_started: NexusSay.API_REQ_STARTED,
		api_req_finished: NexusSay.API_REQ_FINISHED,
		text: NexusSay.TEXT,
		reasoning: NexusSay.REASONING,
		completion_result: NexusSay.COMPLETION_RESULT_SAY,
		plan_completion_result: NexusSay.PLAN_COMPLETION_RESULT,
		user_feedback: NexusSay.USER_FEEDBACK,
		user_feedback_diff: NexusSay.USER_FEEDBACK_DIFF,
		command: NexusSay.COMMAND_SAY,
		command_output: NexusSay.COMMAND_OUTPUT_SAY,
		tool: NexusSay.TOOL_SAY,
		shell_integration_warning: NexusSay.SHELL_INTEGRATION_WARNING,
		shell_integration_warning_with_suggestion: NexusSay.SHELL_INTEGRATION_WARNING,
		browser_action_launch: NexusSay.BROWSER_ACTION_LAUNCH_SAY,
		browser_action: NexusSay.BROWSER_ACTION,
		browser_action_result: NexusSay.BROWSER_ACTION_RESULT,
		mcp_server_request_started: NexusSay.MCP_SERVER_REQUEST_STARTED,
		mcp_server_response: NexusSay.MCP_SERVER_RESPONSE,
		mcp_notification: NexusSay.MCP_NOTIFICATION,
		use_mcp_server: NexusSay.USE_MCP_SERVER_SAY,
		diff_error: NexusSay.DIFF_ERROR,
		deleted_api_reqs: NexusSay.DELETED_API_REQS,
		nexusignore_error: NexusSay.CLINEIGNORE_ERROR,
		command_permission_denied: NexusSay.COMMAND_PERMISSION_DENIED,
		checkpoint_created: NexusSay.CHECKPOINT_CREATED,
		load_mcp_documentation: NexusSay.LOAD_MCP_DOCUMENTATION,
		info: NexusSay.INFO,
		task_progress: NexusSay.TASK_PROGRESS,
		hook_status: NexusSay.HOOK_STATUS,
		hook_output_stream: NexusSay.HOOK_OUTPUT_STREAM,
		conditional_rules_applied: NexusSay.CONDITIONAL_RULES_APPLIED,
		subagent: NexusSay.SUBAGENT_STATUS,
		use_subagents: NexusSay.USE_SUBAGENTS_SAY,
		subagent_usage: NexusSay.SUBAGENT_USAGE,
		compaction: NexusSay.COMPACTION,
	}

	const result = mapping[say]

	return result
}

// Helper function to convert NexusSay enum to string
function convertProtoEnumToNexusSay(say: NexusSay): AppNexusSay | undefined {
	if (say === NexusSay.UNRECOGNIZED) {
		return undefined
	}

	const mapping: Record<Exclude<NexusSay, NexusSay.UNRECOGNIZED>, AppNexusSay> = {
		[NexusSay.TASK]: "task",
		[NexusSay.ERROR]: "error",
		[NexusSay.API_REQ_STARTED]: "api_req_started",
		[NexusSay.API_REQ_FINISHED]: "api_req_finished",
		[NexusSay.TEXT]: "text",
		[NexusSay.REASONING]: "reasoning",
		[NexusSay.COMPLETION_RESULT_SAY]: "completion_result",
		[NexusSay.PLAN_COMPLETION_RESULT]: "plan_completion_result",
		[NexusSay.USER_FEEDBACK]: "user_feedback",
		[NexusSay.USER_FEEDBACK_DIFF]: "user_feedback_diff",
		[NexusSay.COMMAND_SAY]: "command",
		[NexusSay.COMMAND_OUTPUT_SAY]: "command_output",
		[NexusSay.TOOL_SAY]: "tool",
		[NexusSay.SHELL_INTEGRATION_WARNING]: "shell_integration_warning",
		[NexusSay.BROWSER_ACTION_LAUNCH_SAY]: "browser_action_launch",
		[NexusSay.BROWSER_ACTION]: "browser_action",
		[NexusSay.BROWSER_ACTION_RESULT]: "browser_action_result",
		[NexusSay.MCP_SERVER_REQUEST_STARTED]: "mcp_server_request_started",
		[NexusSay.MCP_SERVER_RESPONSE]: "mcp_server_response",
		[NexusSay.MCP_NOTIFICATION]: "mcp_notification",
		[NexusSay.USE_MCP_SERVER_SAY]: "use_mcp_server",
		[NexusSay.DIFF_ERROR]: "diff_error",
		[NexusSay.DELETED_API_REQS]: "deleted_api_reqs",
		[NexusSay.CLINEIGNORE_ERROR]: "nexusignore_error",
		[NexusSay.COMMAND_PERMISSION_DENIED]: "command_permission_denied",
		[NexusSay.CHECKPOINT_CREATED]: "checkpoint_created",
		[NexusSay.LOAD_MCP_DOCUMENTATION]: "load_mcp_documentation",
		[NexusSay.INFO]: "info",
		[NexusSay.TASK_PROGRESS]: "task_progress",
		[NexusSay.HOOK_STATUS]: "hook_status",
		[NexusSay.HOOK_OUTPUT_STREAM]: "hook_output_stream",
		[NexusSay.CONDITIONAL_RULES_APPLIED]: "conditional_rules_applied",
		[NexusSay.SUBAGENT_STATUS]: "subagent",
		[NexusSay.USE_SUBAGENTS_SAY]: "use_subagents",
		[NexusSay.SUBAGENT_USAGE]: "subagent_usage",
		[NexusSay.COMPACTION]: "compaction",
	}

	return mapping[say as Exclude<NexusSay, NexusSay.UNRECOGNIZED>]
}

/**
 * Convert application NexusMessage to proto NexusMessage
 */
export function convertNexusMessageToProto(message: AppNexusMessage): ProtoNexusMessage {
	// For sending messages, we need to provide values for required proto fields
	const askEnum = message.ask ? convertNexusAskToProtoEnum(message.ask) : undefined
	const sayEnum = message.say ? convertNexusSayToProtoEnum(message.say) : undefined

	// Determine appropriate enum values based on message type
	let finalAskEnum: NexusAsk = NexusAsk.FOLLOWUP // Proto default
	let finalSayEnum: NexusSay = NexusSay.TEXT // Proto default

	if (message.type === "ask") {
		finalAskEnum = askEnum ?? NexusAsk.FOLLOWUP // Use FOLLOWUP as default for ask messages
	} else if (message.type === "say") {
		finalSayEnum = sayEnum ?? NexusSay.TEXT // Use TEXT as default for say messages
	}

	const protoMessage: ProtoNexusMessage = {
		ts: message.ts,
		type: message.type === "ask" ? NexusMessageType.ASK : NexusMessageType.SAY,
		ask: finalAskEnum,
		say: finalSayEnum,
		text: message.text ?? "",
		reasoning: message.reasoning ?? "",
		images: message.images ?? [],
		files: message.files ?? [],
		partial: message.partial ?? false,
		// Convergent-replica fields (default 0 = unstamped, e.g. classic/legacy path).
		seq: message.seq ?? 0,
		epoch: message.epoch ?? 0,
		lastCheckpointHash: message.lastCheckpointHash ?? "",
		isCheckpointCheckedOut: message.isCheckpointCheckedOut ?? false,
		isOperationOutsideWorkspace: message.isOperationOutsideWorkspace ?? false,
		conversationHistoryIndex: message.conversationHistoryIndex ?? 0,
		conversationHistoryDeletedRange: message.conversationHistoryDeletedRange
			? {
					startIndex: message.conversationHistoryDeletedRange[0],
					endIndex: message.conversationHistoryDeletedRange[1],
				}
			: undefined,
		// Additional optional fields for specific ask/say types
		sayTool: undefined,
		sayBrowserAction: undefined,
		browserActionResult: undefined,
		askUseMcpServer: undefined,
		planModeResponse: undefined,
		askQuestion: undefined,
		askNewTask: undefined,
		apiReqInfo: undefined,
		modelInfo: message.modelInfo ?? undefined,
	}

	return protoMessage
}

/**
 * Convert proto NexusMessage to application NexusMessage
 */
export function convertProtoToNexusMessage(protoMessage: ProtoNexusMessage): AppNexusMessage {
	const message: AppNexusMessage = {
		ts: protoMessage.ts,
		type: protoMessage.type === NexusMessageType.ASK ? "ask" : "say",
	}

	// Convert ask enum to string
	if (protoMessage.type === NexusMessageType.ASK) {
		const ask = convertProtoEnumToNexusAsk(protoMessage.ask)
		if (ask !== undefined) {
			message.ask = ask
		}
	}

	// Convert say enum to string
	if (protoMessage.type === NexusMessageType.SAY) {
		const say = convertProtoEnumToNexusSay(protoMessage.say)
		if (say !== undefined) {
			message.say = say
		}
	}

	// Convert other fields - preserve empty strings as they may be intentional
	if (protoMessage.text !== "") {
		message.text = protoMessage.text
	}
	if (protoMessage.reasoning !== "") {
		message.reasoning = protoMessage.reasoning
	}
	if (protoMessage.images.length > 0) {
		message.images = protoMessage.images
	}
	if (protoMessage.files.length > 0) {
		message.files = protoMessage.files
	}
	if (protoMessage.partial) {
		message.partial = protoMessage.partial
	}
	if (protoMessage.lastCheckpointHash !== "") {
		message.lastCheckpointHash = protoMessage.lastCheckpointHash
	}
	if (protoMessage.isCheckpointCheckedOut) {
		message.isCheckpointCheckedOut = protoMessage.isCheckpointCheckedOut
	}
	if (protoMessage.isOperationOutsideWorkspace) {
		message.isOperationOutsideWorkspace = protoMessage.isOperationOutsideWorkspace
	}
	if (protoMessage.conversationHistoryIndex !== 0) {
		message.conversationHistoryIndex = protoMessage.conversationHistoryIndex
	}

	// Convert conversationHistoryDeletedRange from object to tuple
	if (protoMessage.conversationHistoryDeletedRange) {
		message.conversationHistoryDeletedRange = [
			protoMessage.conversationHistoryDeletedRange.startIndex,
			protoMessage.conversationHistoryDeletedRange.endIndex,
		]
	}

	// Convergent-replica fields. 0 means unstamped (classic/legacy path) — leave undefined so
	// the webview reducer treats such messages as always-applicable rather than epoch 0.
	if (protoMessage.seq && protoMessage.seq !== 0) {
		message.seq = protoMessage.seq
	}
	if (protoMessage.epoch && protoMessage.epoch !== 0) {
		message.epoch = protoMessage.epoch
	}

	return message
}
