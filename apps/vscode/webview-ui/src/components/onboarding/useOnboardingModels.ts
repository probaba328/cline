import { buildModelInfoNameMap, type ModelInfo, resolveNexusPassModelInfo } from "@shared/api"
import { NEXUS_ONBOARDING_MODELS } from "@shared/nexus/onboarding"
import { EmptyRequest } from "@shared/proto/nexus/common"
import type { NexusRecommendedModel } from "@shared/proto/nexus/models"
import type { OnboardingModel, OnboardingModelGroup } from "@shared/proto/nexus/state"
import { useEffect, useMemo, useState } from "react"
import { useExtensionState } from "@/context/ExtensionStateContext"
import { useProviderModels } from "@/hooks/useProviderModels"
import { ModelsServiceClient } from "@/services/grpc-client"
import { CLINEPASS_GROUP, getRecommendedModelsData, type RecommendedModelsData } from "./data-models"

type OnboardingModelsStatus = "loading" | "success" | "empty"

export interface UseOnboardingModelsResult {
	status: OnboardingModelsStatus
	models: OnboardingModelGroup
}

function toOnboardingModel(
	rec: NexusRecommendedModel,
	group: string,
	fallbackBadge: string,
	modelCatalog: Record<string, ModelInfo>,
): OnboardingModel {
	const catalogInfo = modelCatalog[rec.id]
	const tag = rec.tags?.[0] ?? ""
	const badge = tag || fallbackBadge

	return {
		id: rec.id,
		// Names arrive display-ready from the recommended-models RPC
		name: rec.name || rec.id,
		group,
		badge,
		score: 0,
		latency: 0,
		info: catalogInfo
			? {
					contextWindow: catalogInfo.contextWindow ?? 0,
					supportsImages: catalogInfo.supportsImages ?? false,
					supportsPromptCache: catalogInfo.supportsPromptCache ?? false,
					inputPrice: catalogInfo.inputPrice ?? 0,
					outputPrice: catalogInfo.outputPrice ?? 0,
					tiers: catalogInfo.tiers ?? [],
				}
			: undefined,
	}
}

type FetchState = { status: "loading" } | { status: "success"; data: RecommendedModelsData } | { status: "empty" }

export function useOnboardingModels(): UseOnboardingModelsResult {
	const { openRouterModels } = useExtensionState()
	const { models: nexusModels } = useProviderModels("nexus")
	const [fetchState, setFetchState] = useState<FetchState>({ status: "loading" })

	useEffect(() => {
		let cancelled = false

		const refreshRecommendedModels = async () => {
			try {
				const response = await ModelsServiceClient.refreshNexusRecommendedModelsRpc(EmptyRequest.create({}))
				if (!cancelled) {
					const data = getRecommendedModelsData(response)
					if (!data) {
						setFetchState({ status: "empty" })
					} else {
						setFetchState({ status: "success", data })
					}
				}
			} catch {
				if (!cancelled) {
					setFetchState({ status: "empty" })
				}
			}
		}

		refreshRecommendedModels()

		return () => {
			cancelled = true
		}
	}, [])

	// Merge openRouter and nexus models into a single catalog for lookups
	const modelCatalog = useMemo<Record<string, ModelInfo>>(() => {
		return { ...openRouterModels, ...(nexusModels ?? {}) }
	}, [openRouterModels, nexusModels])

	// NexusPass model IDs omit the upstream lab (e.g. "nexus-pass/glm-5.2"), so look up
	// capabilities via the model slug against the OpenRouter catalog, falling back to
	// conservative NexusPass defaults. Mirrors NexusPassProvider's resolution.
	const openRouterModelsByName = useMemo(() => buildModelInfoNameMap(openRouterModels), [openRouterModels])

	return useMemo<UseOnboardingModelsResult>(() => {
		if (fetchState.status !== "success") {
			return { status: fetchState.status, models: { models: NEXUS_ONBOARDING_MODELS } }
		}

		const { data } = fetchState
		const freeModels = data.free.map((rec) => toOnboardingModel(rec, "free", "Free", modelCatalog))
		const frontierModels = data.recommended.map((rec) => toOnboardingModel(rec, "frontier", "", modelCatalog))
		const nexusPassCatalog = Object.fromEntries(
			data.nexusPass.map((rec) => [rec.id, resolveNexusPassModelInfo(rec.id, openRouterModelsByName)]),
		)
		const nexusPassModels = data.nexusPass.map((rec) => toOnboardingModel(rec, CLINEPASS_GROUP, "", nexusPassCatalog))

		return { status: "success", models: { models: [...nexusPassModels, ...freeModels, ...frontierModels] } }
	}, [fetchState, modelCatalog, openRouterModelsByName])
}
