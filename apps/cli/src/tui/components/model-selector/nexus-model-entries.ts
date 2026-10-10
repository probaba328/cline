import type {
	NexusRecommendedModel,
	NexusRecommendedModelsData,
} from "@nexus/core";

export type NexusModelPickerTier = "recommended" | "subscribed" | "free";

export interface NexusModelPickerItem {
	kind: "model";
	model: NexusRecommendedModel;
	tier: NexusModelPickerTier;
}

export interface NexusModelPickerBrowse {
	kind: "browse";
}

export type NexusModelPickerEntry =
	| NexusModelPickerItem
	| NexusModelPickerBrowse;

export const NEXUS_MODEL_PICKER_TIER_LABELS: Record<
	NexusModelPickerTier,
	string
> = {
	recommended: "Recommended",
	subscribed: "Subscribed",
	free: "Free",
};

// Featured entries for the sectioned picker, keyed by provider: nexus gets
// Recommended/Free with a browse-all escape into the full catalog; nexus-pass
// gets Subscribed/Free (see buildNexusPassModelEntries for why no browse-all).
export function buildFeaturedModelEntries(
	providerId: string,
	data: NexusRecommendedModelsData,
): NexusModelPickerEntry[] {
	return providerId === "nexus-pass"
		? buildNexusPassModelEntries(data)
		: buildNexusModelEntries(data);
}

function buildNexusModelEntries(
	data: NexusRecommendedModelsData,
): NexusModelPickerEntry[] {
	const entries: NexusModelPickerEntry[] = [];
	for (const m of data.recommended) {
		entries.push({ kind: "model", model: m, tier: "recommended" });
	}
	for (const m of data.free) {
		entries.push({ kind: "model", model: m, tier: "free" });
	}
	entries.push({ kind: "browse" });
	return entries;
}

// Shown under the Free section header when picking a model for NexusPass
export const NEXUS_PASS_FREE_SECTION_DESCRIPTION =
	"Try with limited usage, separate from NexusPass quota.";

// NexusPass shows the subscription's models plus the Nexus free models — both
// providers hit the same Nexus API, so free models are selectable in place
// (they ride usage billing at $0 instead of the subscription quota).
// No "browse all" entry when the nexusPass bucket is populated: unlike nexus,
// the NexusPass catalog contains exactly these two buckets, so the sections
// already list every selectable model. An empty nexusPass bucket means the
// fetch fell back to the bundled list (which has no pass models) — without an
// escape into the full catalog a subscriber could only pick free models, so
// browse-all comes back in that degraded mode.
function buildNexusPassModelEntries(
	data: NexusRecommendedModelsData,
): NexusModelPickerEntry[] {
	const entries: NexusModelPickerEntry[] = [];
	for (const m of data.nexusPass) {
		entries.push({ kind: "model", model: m, tier: "subscribed" });
	}
	for (const m of data.free) {
		entries.push({ kind: "model", model: m, tier: "free" });
	}
	if (data.nexusPass.length === 0) {
		entries.push({ kind: "browse" });
	}
	return entries;
}

// The quota explainer only makes sense in the NexusPass picker, which is the
// only picker that has a "subscribed" section
export function freeTierDescriptionFor(
	entries: NexusModelPickerEntry[],
): string | undefined {
	const isNexusPassPicker = entries.some(
		(entry) => entry.kind === "model" && entry.tier === "subscribed",
	);
	return isNexusPassPicker ? NEXUS_PASS_FREE_SECTION_DESCRIPTION : undefined;
}
