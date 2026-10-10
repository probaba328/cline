import { Empty, StringRequest } from "@shared/proto/nexus/common"
import * as vscode from "vscode"

const NEXUS_OUTPUT_CHANNEL = vscode.window.createOutputChannel("Nexus")

// Appends a log message to all Nexus output channels.
export async function debugLog(request: StringRequest): Promise<Empty> {
	NEXUS_OUTPUT_CHANNEL.appendLine(request.value)
	return Empty.create({})
}

// Register the Nexus output channel within the VSCode extension context.
export function registerNexusOutputChannel(context: vscode.ExtensionContext): vscode.OutputChannel {
	context.subscriptions.push(NEXUS_OUTPUT_CHANNEL)
	return NEXUS_OUTPUT_CHANNEL
}
