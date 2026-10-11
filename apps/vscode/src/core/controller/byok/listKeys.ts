import type { Controller } from "@core/controller"
import type { EmptyRequest } from "@/shared/proto/nexus/common"
import type { ByokKeyList } from "@/shared/proto/nexus/byok"
import { getByokService } from "./byokShared"

export async function listKeys(
	_controller: Controller,
	_request: EmptyRequest,
): Promise<ByokKeyList> {
	const svc = getByokService()
	const entries = svc.listKeys().map((e) => ({
		providerId: e.providerId,
		addedAt: e.addedAt,
		lastUsedAt: e.lastUsedAt ?? 0,
		maskedKey: e.maskedKey,
		customEndpoint: e.customEndpoint ?? "",
	}))
	return { entries }
}
