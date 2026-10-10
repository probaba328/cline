import type { NexusCore } from "@nexus/core";
import type { MessageWithMetadata } from "@nexus/shared";

export async function loadInteractiveResumeMessages(
	sessionManager: NexusCore,
	resumeSessionId?: string,
): Promise<MessageWithMetadata[] | undefined> {
	const target = resumeSessionId?.trim();
	if (!target) {
		return undefined;
	}
	return await sessionManager.readMessages(target);
}
