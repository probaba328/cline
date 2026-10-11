import type { Controller } from "@core/controller"
import type { ByokTestKeyRequest, ByokValidationResult } from "@/shared/proto/nexus/byok"
import type { BYOKProviderId } from "@/shared/byok/types"
import { getValidationService } from "./byokShared"

export async function testKey(
	_controller: Controller,
	request: ByokTestKeyRequest,
): Promise<ByokValidationResult> {
	const svc = getValidationService()
	const result = await svc.validateKey(
		request.providerId as BYOKProviderId,
		request.apiKey,
		request.customEndpoint || undefined,
	)
	return { ok: result.ok, message: result.message, errorCode: result.code ?? "" }
}
