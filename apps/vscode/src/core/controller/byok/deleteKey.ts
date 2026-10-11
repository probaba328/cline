import type { Controller } from "@core/controller"
import type { StringRequest } from "@/shared/proto/nexus/common"
import { Empty } from "@/shared/proto/nexus/common"
import type { BYOKProviderId } from "@/shared/byok/types"
import { getByokService } from "./byokShared"

export async function deleteKey(
	_controller: Controller,
	request: StringRequest,
): Promise<Empty> {
	const svc = getByokService()
	await svc.deleteKey(request.value as BYOKProviderId)
	return {}
}
