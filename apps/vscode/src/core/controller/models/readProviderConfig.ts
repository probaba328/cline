import { StringRequest } from "@/shared/proto/nexus/common"
import { ProviderConfigResponse } from "@/shared/proto/nexus/models"
import { type ProviderCatalogController, parseProviderIdRequest, toRedactedProviderConfigResponse } from "./providerCatalogShared"

export async function readProviderConfig(
	controller: ProviderCatalogController,
	request: StringRequest,
): Promise<ProviderConfigResponse> {
	const providerId = parseProviderIdRequest(request.value, "value")
	const store = controller.getProviderConfigStore()
	return toRedactedProviderConfigResponse(store.read(providerId), store)
}
