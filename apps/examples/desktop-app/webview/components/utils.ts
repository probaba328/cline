import { formatDisplayUserInput } from "@nexus/shared/browser";

export function normalizeTitle(title?: string): string {
	if (!title?.trim()) return "";
	return formatDisplayUserInput(title);
}
