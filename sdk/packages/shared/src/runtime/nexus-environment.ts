export const NEXUS_ENVIRONMENT_ENV = "NEXUS_ENVIRONMENT";
export const NEXUS_ENVIRONMENT_OVERRIDE_ENV = "NEXUS_ENVIRONMENT_OVERRIDE";

export type NexusEnvironment = "production" | "staging" | "local";

export interface NexusEnvironmentConfig {
	readonly environment: NexusEnvironment;
	readonly appBaseUrl: string;
	readonly apiBaseUrl: string;
	readonly mcpBaseUrl: string;
	readonly workOsClientId: string;
}

export const NEXUS_ENVIRONMENTS: Readonly<
	Record<NexusEnvironment, NexusEnvironmentConfig>
> = {
	production: {
		environment: "production",
		appBaseUrl: "https://app.nexus.bot",
		apiBaseUrl: "https://api.nexus.bot",
		mcpBaseUrl: "https://api.nexus.bot/v1/mcp",
		workOsClientId: "client_01K3A541FN8TA3EPPHTD2325AR",
	},
	staging: {
		environment: "staging",
		appBaseUrl: "https://staging-app.nexus.bot",
		apiBaseUrl: "https://core-api.staging.int.nexus.bot",
		mcpBaseUrl: "https://core-api.staging.int.nexus.bot/v1/mcp",
		workOsClientId: "client_01K3A5415VF6QBQBG3XYCW91G6",
	},
	local: {
		environment: "local",
		appBaseUrl: "http://localhost:3000",
		apiBaseUrl: "http://localhost:7777",
		mcpBaseUrl: "http://localhost:7777/v1/mcp",
		workOsClientId: "client_01K6XQAY7JK6T5HXVSZW2S5VYK",
	},
};

export const DEFAULT_NEXUS_ENVIRONMENT: NexusEnvironment = "production";

export interface ResolveNexusEnvironmentOptions {
	env?: Partial<NodeJS.ProcessEnv>;
}

function normalizeNexusEnvironment(
	value: string | undefined,
): NexusEnvironment | undefined {
	const normalized = value?.trim().toLowerCase();
	if (
		normalized === "production" ||
		normalized === "staging" ||
		normalized === "local"
	) {
		return normalized;
	}
	return undefined;
}

function readProcessEnv(): NodeJS.ProcessEnv {
	// `process` may be absent in browser-style runtimes (this module ships
	// from the browser entry of `@nexus/shared`). Treat its absence as "no
	// env vars set" so callers always get a deterministic default.
	if (typeof process === "undefined" || !process?.env) {
		return {};
	}
	return process.env;
}

export function resolveNexusEnvironment(): NexusEnvironment {
	const env = readProcessEnv();
	return (
		normalizeNexusEnvironment(env[NEXUS_ENVIRONMENT_OVERRIDE_ENV]) ??
		normalizeNexusEnvironment(env[NEXUS_ENVIRONMENT_ENV]) ??
		DEFAULT_NEXUS_ENVIRONMENT
	);
}

function getEnvConfig(env?: NexusEnvironment) {
	if (typeof env === "string") {
		return NEXUS_ENVIRONMENTS[env];
	}
	return NEXUS_ENVIRONMENTS[resolveNexusEnvironment()];
}

function applyConfigOverrides(
	config: NexusEnvironmentConfig,
	env: NodeJS.ProcessEnv,
): NexusEnvironmentConfig {
	if (env.NEXUS_API_BASE_URL) {
		config = {
			...config,
			apiBaseUrl: env.NEXUS_API_BASE_URL,
			mcpBaseUrl: `${env.NEXUS_API_BASE_URL}/v1/mcp`,
		};
	}

	return config;
}

export function getNexusEnvironmentConfig(
	env?: NexusEnvironment,
): NexusEnvironmentConfig {
	const config = getEnvConfig(env);

	return applyConfigOverrides(config, readProcessEnv());
}
