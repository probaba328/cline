import {
	listLocalProviders as internalListLocalProviders,
	type ProviderSettingsManager,
} from "@nexus/core";

export async function listLocalProviders(
	manager: ProviderSettingsManager,
): ReturnType<typeof internalListLocalProviders> {
	return await internalListLocalProviders(manager, {
		isNexusPassEnabled: true,
	});
}
