export interface TranslationKeys {
	tools: {
		wantsToEdit: string;
		isCreatingPatches: string;
		wantsToViewDir: string;
		viewedDir: string;
		wantsToViewDirRecursive: string;
		viewedDirRecursive: string;
		wantsToViewSourceDefs: string;
		viewedSourceDefs: string;
		wantsToFetch: string;
		fetchedUrl: string;
		wantsToSearch: string;
		searchedWeb: string;
	};
	browser: {
		isUsing: string;
		wantsToUse: string;
	};
	checkpoints: {
		tip: string;
	};
	subagent: {
		wantsToUse: string;
		wantsToUseMultiple: string;
	};
	toolGroup: {
		prefix: string;
	};
	auth: {
		needsPermission: string;
		askingQuestion: string;
		accountRequired: string;
		noAccountToken: string;
		switchAccount: string;
		userLabel: string;
	};
	cli: {
		howToContinue: string;
		hubUpdated: string;
		accountRefreshFailed: string;
		connectorCommands: string;
		discordUserAgent: string;
		zenDisplayName: string;
		sessionDisplayName: string;
		viewAccount: string;
		mistakePromptSuffix: string;
	};
	themes: {
		darkLabel: string;
		darkDescription: string;
		lightLabel: string;
	};
	onboarding: {
		providerLabel: string;
	};
	mcp: {
		clientName: string;
		hubName: string;
	};
}

export const en: TranslationKeys = {
	tools: {
		wantsToEdit: "Nexus wants to edit this file:",
		isCreatingPatches: "Nexus is creating patches to edit this file:",
		wantsToViewDir: "Nexus wants to view the top level files in this directory:",
		viewedDir: "Nexus viewed the top level files in this directory:",
		wantsToViewDirRecursive: "Nexus wants to recursively view all files in this directory:",
		viewedDirRecursive: "Nexus recursively viewed all files in this directory:",
		wantsToViewSourceDefs:
			"Nexus wants to view source code definition names used in this directory:",
		viewedSourceDefs: "Nexus viewed source code definition names used in this directory:",
		wantsToFetch: "Nexus wants to fetch content from this URL:",
		fetchedUrl: "Nexus fetched content from this URL:",
		wantsToSearch: "Nexus wants to search the web for:",
		searchedWeb: "Nexus searched the web for:",
	},
	browser: {
		isUsing: "Nexus is using the browser:",
		wantsToUse: "Nexus wants to use the browser:",
	},
	checkpoints: {
		tip: "Nexus creates checkpoints after changes — you can always restore to a previous state.",
	},
	subagent: {
		wantsToUse: "Nexus wants to use a subagent:",
		wantsToUseMultiple: "Nexus wants to use subagents:",
	},
	toolGroup: {
		prefix: "Nexus",
	},
	auth: {
		needsPermission: "Nexus needs permission",
		askingQuestion: "Nexus is asking a question",
		accountRequired: "Nexus account requires re-authentication. Run nexus auth nexus.",
		noAccountToken: "No Nexus account auth token found",
		switchAccount: "View or switch your Nexus account",
		userLabel: "Nexus user",
	},
	cli: {
		howToContinue: "How should Nexus continue?",
		hubUpdated:
			"The shared Nexus Hub was updated by another Nexus installation. Updating this CLI…",
		accountRefreshFailed: "Nexus account refresh after account change failed",
		connectorCommands: "Nexus connector commands:",
		discordUserAgent: "Nexus Discord Connector",
		zenDisplayName: "Nexus CLI (zen)",
		sessionDisplayName: "Nexus CLI",
		viewAccount: "View Nexus account",
		mistakePromptSuffix: "How should Nexus continue?",
	},
	themes: {
		darkLabel: "Nexus Dark",
		darkDescription: "Nexus's accents on deep charcoal",
		lightLabel: "Nexus Light",
	},
	onboarding: {
		providerLabel: "Nexus",
	},
	mcp: {
		clientName: "Nexus",
		hubName: "Nexus",
	},
};
