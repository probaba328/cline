import type { Controller } from "@core/controller"
import type { ByokValidateFormatRequest, ByokValidationResult } from "@/shared/proto/nexus/byok"
import { validateKeyFormat as validateFormat } from "@/shared/byok/validation"
import type { BYOKProviderId } from "@/shared/byok/types"

export async function validateKeyFormat(
	_controller: Controller,
	request: ByokValidateFormatRequest,
): Promise<ByokValidationResult> {
	const result = validateFormat(request.providerId as BYOKProviderId, request.apiKey)
	return { ok: result.ok, message: result.message, errorCode: result.code ?? "" }
}
