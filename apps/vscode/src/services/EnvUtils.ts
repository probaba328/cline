import { HostProvider } from "@/hosts/host-provider"
import { ExtensionRegistryInfo } from "@/registry"
import { EmptyRequest } from "@/shared/proto/nexus/common"
import { Logger } from "@/shared/services/Logger"

// Canonical header names for extra client/host context
const NexusHeaders = {
	PLATFORM: "X-PLATFORM",
	PLATFORM_VERSION: "X-PLATFORM-VERSION",
	CLIENT_VERSION: "X-CLIENT-VERSION",
	CLIENT_TYPE: "X-CLIENT-TYPE",
	CORE_VERSION: "X-CORE-VERSION",
	IS_MULTIROOT: "X-IS-MULTIROOT",
} as const

export function buildExternalBasicHeaders(): Record<string, string> {
	return {
		"User-Agent": `Nexus/${ExtensionRegistryInfo.version}`,
	}
}

export async function buildBasicNexusHeaders(): Promise<Record<string, string>> {
	const headers: Record<string, string> = buildExternalBasicHeaders()
	try {
		const host = await HostProvider.env.getHostVersion(EmptyRequest.create({}))
		headers[NexusHeaders.PLATFORM] = host.platform || "unknown"
		headers[NexusHeaders.PLATFORM_VERSION] = host.version || "unknown"
		headers[NexusHeaders.CLIENT_TYPE] = host.nexusType || "unknown"
		headers[NexusHeaders.CLIENT_VERSION] = host.nexusVersion || "unknown"
	} catch (error) {
		Logger.log("Failed to get IDE/platform info via HostBridge EnvService.getHostVersion", error)
		headers[NexusHeaders.PLATFORM] = "unknown"
		headers[NexusHeaders.PLATFORM_VERSION] = "unknown"
		headers[NexusHeaders.CLIENT_TYPE] = "unknown"
		headers[NexusHeaders.CLIENT_VERSION] = "unknown"
	}
	headers[NexusHeaders.CORE_VERSION] = ExtensionRegistryInfo.version

	return headers
}
