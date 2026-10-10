export function isNexusManagedProvider(provider: string | undefined) {
	return provider === "nexus" || provider === "nexus-pass"
}
