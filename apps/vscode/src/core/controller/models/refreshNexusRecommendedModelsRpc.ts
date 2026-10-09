import { EmptyRequest } from "@shared/proto/nexus/common"
import { NexusRecommendedModel, NexusRecommendedModelsResponse } from "@shared/proto/nexus/models"
import type { Controller } from "../index"
import { refreshNexusRecommendedModels } from "./refreshNexusRecommendedModels"

export async function refreshNexusRecommendedModelsRpc(
	_controller: Controller,
	_request: EmptyRequest,
): Promise<NexusRecommendedModelsResponse> {
	const models = await refreshNexusRecommendedModels()
	return NexusRecommendedModelsResponse.create({
		recommended: models.recommended.map((model) =>
			NexusRecommendedModel.create({
				id: model.id,
				name: model.name,
				description: model.description,
				tags: model.tags,
			}),
		),
		free: models.free.map((model) =>
			NexusRecommendedModel.create({
				id: model.id,
				name: model.name,
				description: model.description,
				tags: model.tags,
			}),
		),
		nexusPass: (models.nexusPass ?? []).map((model) =>
			NexusRecommendedModel.create({
				id: model.id,
				name: model.name,
				description: model.description,
				tags: model.tags,
			}),
		),
	})
}
