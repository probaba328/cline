import * as vscode from "vscode"
import { ExtensionRegistryInfo } from "@/registry"
import { OpenNexusSidebarPanelRequest, OpenNexusSidebarPanelResponse } from "@/shared/proto/index.host"

export async function openNexusSidebarPanel(_: OpenNexusSidebarPanelRequest): Promise<OpenNexusSidebarPanelResponse> {
	await vscode.commands.executeCommand(`${ExtensionRegistryInfo.views.Sidebar}.focus`)
	return {}
}
