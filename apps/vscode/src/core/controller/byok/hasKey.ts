import type { Controller } from "@core/controller"
import type { StringRequest } from "@/shared/proto/nexus/common"
import type { BoolResponse } from "@/shared/proto/nexus/byok"
import type { BYOKProviderId } from "@/shared/byok/types"
import { getByokService } from "./byokShared"

export async function hasKey(
	_controller: Controller,
	request: StringRequest,
): Promise<BoolResponse> {
	const svc = getByokService()
	return { value: svc.hasKey(request.value as BYOKProviderId) }
}
