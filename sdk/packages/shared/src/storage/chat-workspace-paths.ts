export const NEXUS_WORKSPACES_DIRECTORY_NAME = "workspaces";
export const NEXUS_CHAT_WORKSPACE_DIRECTORY_NAME = "chat";

// Default data-dir anchors for the structural check below. The Node resolver
// derives the real location from resolveNexusDataDir(), which defaults to
// `~/.nexus/data`.
const NEXUS_CONFIG_DIRECTORY_NAME = ".nexus";
const NEXUS_DATA_DIRECTORY_NAME = "data";

/**
 * Browser-safe structural check for the shared chat workspace that hosts
 * sessions started without a project: `.nexus/data/workspaces/chat`. Matches
 * the directory itself only — project folders created inside it are regular
 * workspaces. Matches the default data-dir layout; explicit `NEXUS_DATA_DIR`
 * overrides are not detectable from a bare path string.
 */
export function isChatWorkspacePath(path: string): boolean {
	const normalizedPath = path.trim();
	const isWindowsAbsolute =
		/^[A-Za-z]:[\\/]/.test(normalizedPath) || normalizedPath.startsWith("\\\\");
	const isPosixAbsolute = normalizedPath.startsWith("/");
	if (!isWindowsAbsolute && !isPosixAbsolute) {
		return false;
	}
	const segments = normalizedPath
		.split(isWindowsAbsolute ? /[\\/]+/ : /\/+/)
		.filter(Boolean);
	const chatDirectory = segments.at(-1) ?? "";
	const workspacesDirectory = segments.at(-2) ?? "";
	const dataDirectory = segments.at(-3) ?? "";
	const configDirectory = segments.at(-4) ?? "";
	return (
		configDirectory === NEXUS_CONFIG_DIRECTORY_NAME &&
		dataDirectory === NEXUS_DATA_DIRECTORY_NAME &&
		workspacesDirectory === NEXUS_WORKSPACES_DIRECTORY_NAME &&
		chatDirectory === NEXUS_CHAT_WORKSPACE_DIRECTORY_NAME
	);
}
