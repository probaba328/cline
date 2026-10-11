import type { Controller } from "@core/controller"
import type { ByokSaveKeyRequest } from "@/shared/proto/nexus/byok"
import { Empty } from "@/shared/proto/nexus/common"
import type { BYOKProviderId } from "@/shared/byok/types"
import { getByokService } from "./byokShared"

export async function saveKey(
	_controller: Controller,
	request: ByokSaveKeyRequest,
): Promise<Empty> {
	const svc = getByokService()
	await svc.saveKey(
		request.providerId as BYOKProviderId,
		request.apiKey,
		request.customEndpoint || undefined,
	)
	return {}
}
