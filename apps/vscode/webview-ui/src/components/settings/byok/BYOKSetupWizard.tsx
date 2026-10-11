import { useState, useCallback } from "react"
import { VSCodeButton, VSCodeTextField } from "@vscode/webview-ui-toolkit/react"
import { BYOK_PROVIDER_CATALOG } from "@shared/byok/catalog"
import type { BYOKProviderId, WizardState, BYOKValidationResult } from "@shared/byok/types"
import { ByokServiceClient } from "@/services/grpc-client"
import { StepIndicator } from "./StepIndicator"
import { ProviderCard } from "./ProviderCard"

interface BYOKSetupWizardProps {
	existingProviders: Set<string>
	onSaved: () => void
	onCancel: () => void
}

const STEP_LABELS = ["Sağlayıcı", "API Key", "Doğrula", "Model", "Tamam"]

const initialState: WizardState = {
	step: 1,
	selectedProvider: null,
	apiKey: "",
	customEndpoint: "",
	validationResult: null,
	isValidating: false,
	selectedModelId: null,
}

export function BYOKSetupWizard({ existingProviders, onSaved, onCancel }: BYOKSetupWizardProps) {
	const [state, setState] = useState<WizardState>(initialState)

	const update = useCallback((partial: Partial<WizardState>) => {
		setState((prev) => ({ ...prev, ...partial }))
	}, [])

	const selectedProvider = BYOK_PROVIDER_CATALOG.find((p) => p.id === state.selectedProvider)

	// Step 1 → 2
	const handleSelectProvider = (id: BYOKProviderId) => {
		update({ selectedProvider: id, apiKey: "", customEndpoint: "", validationResult: null, step: 2 })
	}

	// Step 2 → 3 (format validation only, no network)
	const handleFormatValidate = async () => {
		if (!state.selectedProvider) return
		update({ isValidating: true, validationResult: null })
		try {
			const res = await ByokServiceClient.validateKeyFormat({
				providerId: state.selectedProvider,
				apiKey: state.apiKey,
			})
			update({ isValidating: false, validationResult: res as BYOKValidationResult })
			if (res.ok) update({ step: 3 })
		} catch {
			update({ isValidating: false, validationResult: { ok: false, message: "Doğrulama başarısız oldu" } })
		}
	}

	// Step 3 → 4 (network test)
	const handleNetworkTest = async () => {
		if (!state.selectedProvider) return
		update({ isValidating: true, validationResult: null })
		try {
			const res = await ByokServiceClient.testKey({
				providerId: state.selectedProvider,
				apiKey: state.apiKey,
				customEndpoint: state.customEndpoint,
			})
			update({ isValidating: false, validationResult: res as BYOKValidationResult })
			if (res.ok) {
				const defaultModel = selectedProvider?.defaultModelId ?? null
				update({ step: 4, selectedModelId: defaultModel })
			}
		} catch {
			update({ isValidating: false, validationResult: { ok: false, message: "Bağlantı hatası" } })
		}
	}

	// Step 4 → 5 (save)
	const handleSave = async () => {
		if (!state.selectedProvider) return
		try {
			await ByokServiceClient.saveKey({
				providerId: state.selectedProvider,
				apiKey: state.apiKey,
				customEndpoint: state.customEndpoint,
			})
			update({ step: 5 })
		} catch {
			update({ validationResult: { ok: false, message: "Kayıt sırasında bir hata oluştu" } })
		}
	}

	return (
		<div className="flex flex-col gap-4">
			<StepIndicator currentStep={state.step} totalSteps={5} labels={STEP_LABELS} />

			{/* Step 1: Provider Selection */}
			{state.step === 1 && (
				<div className="flex flex-col gap-3">
					<p className="text-sm text-description">Hangi sağlayıcı için API key eklemek istiyorsunuz?</p>
					<div className="grid grid-cols-2 gap-2">
						{BYOK_PROVIDER_CATALOG.map((p) => (
							<ProviderCard
								key={p.id}
								provider={p}
								isSelected={state.selectedProvider === p.id}
								hasKey={existingProviders.has(p.id)}
								onClick={() => handleSelectProvider(p.id)}
							/>
						))}
					</div>
				</div>
			)}

			{/* Step 2: API Key Input */}
			{state.step === 2 && selectedProvider && (
				<div className="flex flex-col gap-4">
					<div className="flex flex-col gap-1">
						<p className="text-sm font-medium">{selectedProvider.name} — API Key</p>
						{!selectedProvider.isLocal && (
							<p className="text-xs text-description">
								Key sadece cihazınızda şifreli saklanır. Hiçbir sunucuya gönderilmez.
							</p>
						)}
					</div>

					{!selectedProvider.isLocal && (
						<div className="flex flex-col gap-1">
							<label className="text-xs text-description">API Key</label>
							<VSCodeTextField
								type="password"
								placeholder={selectedProvider.keyPlaceholder}
								value={state.apiKey}
								onInput={(e) => update({ apiKey: (e.target as HTMLInputElement).value })}
								style={{ width: "100%" }}
							/>
						</div>
					)}

					{selectedProvider.supportsCustomEndpoint && (
						<div className="flex flex-col gap-1">
							<label className="text-xs text-description">
								Endpoint URL{selectedProvider.isLocal ? "" : " (opsiyonel)"}
							</label>
							<VSCodeTextField
								placeholder={selectedProvider.localEndpoint ?? "https://..."}
								value={state.customEndpoint}
								onInput={(e) => update({ customEndpoint: (e.target as HTMLInputElement).value })}
								style={{ width: "100%" }}
							/>
						</div>
					)}

					{selectedProvider.signupUrl && (
						<p className="text-xs text-description">
							Key almak için:{" "}
							<a href={selectedProvider.signupUrl} className="text-(--vscode-textLink-foreground)">
								{selectedProvider.signupUrl}
							</a>
						</p>
					)}

					<div className="flex gap-2">
						<VSCodeButton onClick={() => update({ step: 1 })} appearance="secondary">
							Geri
						</VSCodeButton>
						<VSCodeButton
							onClick={handleFormatValidate}
							disabled={state.isValidating || (!selectedProvider.isLocal && !state.apiKey.trim())}>
							{state.isValidating ? "Kontrol ediliyor..." : "Devam"}
						</VSCodeButton>
					</div>

					{state.validationResult && !state.validationResult.ok && (
						<ValidationBanner result={state.validationResult} />
					)}
				</div>
			)}

			{/* Step 3: Network Test */}
			{state.step === 3 && selectedProvider && (
				<div className="flex flex-col gap-4">
					<div className="flex flex-col gap-1">
						<p className="text-sm font-medium">API Key Doğrulama</p>
						<p className="text-xs text-description">
							{selectedProvider.isLocal
								? "Yerel servise bağlantı test ediliyor..."
								: "API key'in çalıştığını doğrulamak için kısa bir test isteği yapılacak."}
						</p>
					</div>
					<div className="flex gap-2">
						<VSCodeButton onClick={() => update({ step: 2 })} appearance="secondary">
							Geri
						</VSCodeButton>
						<VSCodeButton onClick={handleNetworkTest} disabled={state.isValidating}>
							{state.isValidating ? "Test ediliyor..." : "Test Et"}
						</VSCodeButton>
					</div>
					{state.validationResult && <ValidationBanner result={state.validationResult} />}
				</div>
			)}

			{/* Step 4: Model Selection */}
			{state.step === 4 && selectedProvider && (
				<div className="flex flex-col gap-4">
					<div className="flex flex-col gap-1">
						<p className="text-sm font-medium">Varsayılan Model Seç</p>
						<p className="text-xs text-description">Bu sağlayıcı için kullanılacak varsayılan model.</p>
					</div>
					<div className="flex flex-col gap-2">
						{selectedProvider.models.map((model) => (
							<button
								key={model.id}
								type="button"
								onClick={() => update({ selectedModelId: model.id })}
								className={`flex flex-col gap-0.5 p-2 rounded border text-left cursor-pointer transition-colors ${
									state.selectedModelId === model.id
										? "border-(--vscode-focusBorder) bg-(--vscode-list-activeSelectionBackground)"
										: "border-(--vscode-panel-border) hover:border-(--vscode-focusBorder)"
								}`}>
								<div className="flex items-center gap-2">
									<span className="text-sm font-medium">{model.name}</span>
									{model.recommended && (
										<span className="text-xs bg-(--vscode-badge-background) text-(--vscode-badge-foreground) px-1 rounded">
											Önerilen
										</span>
									)}
									<span className="ml-auto text-xs text-description">{model.speed.label}</span>
								</div>
								{model.description && (
									<span className="text-xs text-description">{model.description}</span>
								)}
							</button>
						))}
					</div>
					<div className="flex gap-2">
						<VSCodeButton onClick={() => update({ step: 3 })} appearance="secondary">
							Geri
						</VSCodeButton>
						<VSCodeButton onClick={handleSave} disabled={!state.selectedModelId}>
							Kaydet
						</VSCodeButton>
					</div>
				</div>
			)}

			{/* Step 5: Done */}
			{state.step === 5 && selectedProvider && (
				<div className="flex flex-col gap-4 items-center py-4">
					<div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
						<i className="codicon codicon-check text-green-400" style={{ fontSize: 24 }} />
					</div>
					<div className="text-center">
						<p className="text-sm font-medium">{selectedProvider.name} API key kaydedildi</p>
						<p className="text-xs text-description mt-1">
							Key şifreli olarak cihazınızda saklandı. Nexus sunucularına gönderilmez.
						</p>
					</div>
					<VSCodeButton onClick={onSaved}>Tamam</VSCodeButton>
				</div>
			)}

			{state.step !== 5 && (
				<div className="mt-2">
					<VSCodeButton onClick={onCancel} appearance="secondary">
						İptal
					</VSCodeButton>
				</div>
			)}
		</div>
	)
}

function ValidationBanner({ result }: { result: BYOKValidationResult }) {
	return (
		<div
			className={`flex items-start gap-2 p-2 rounded text-xs ${
				result.ok
					? "bg-green-500/10 text-green-400 border border-green-500/20"
					: "bg-red-500/10 text-(--vscode-inputValidation-errorForeground) border border-red-500/20"
			}`}>
			<i
				className={`codicon ${result.ok ? "codicon-pass" : "codicon-error"} mt-0.5`}
				style={{ fontSize: 13 }}
			/>
			<span>{result.message}</span>
		</div>
	)
}
