import { type LanguageKey, languageOptions } from "@shared/Languages"
import { useCallback, useEffect, useState } from "react"
import NexusLogoWhite from "@/assets/NexusLogoWhite"
import { StateServiceClient } from "@/services/grpc-client"
import { updateSetting } from "../settings/utils/settingsHandlers"
import { useApiConfigurationHandlers } from "../settings/utils/useApiConfigurationHandlers"

// ---------- Types ----------

type WizardStep = 0 | 1 | 2 | 3 | 4 | 5

interface Provider {
	id: string
	name: string
	sub: string
	badge: string
	badgeColor: string
	needsKey: boolean
	keyField: keyof ApiKeyMap
	keyPlaceholder: string
	keyLabel: string
}

type ApiKeyMap = {
	anthropicApiKey: string
	openAiApiKey: string
	openRouterApiKey: string
	_none: string
}

// ---------- Data ----------

const PROVIDERS: Provider[] = [
	{
		id: "anthropic",
		name: "Claude",
		sub: "Anthropic",
		badge: "En güçlü",
		badgeColor: "#b45309",
		needsKey: true,
		keyField: "anthropicApiKey",
		keyPlaceholder: "sk-ant-api03-...",
		keyLabel: "Anthropic API Key",
	},
	{
		id: "openai-native",
		name: "GPT-4o",
		sub: "OpenAI",
		badge: "Popüler",
		badgeColor: "#047857",
		needsKey: true,
		keyField: "openAiApiKey",
		keyPlaceholder: "sk-proj-...",
		keyLabel: "OpenAI API Key",
	},
	{
		id: "openrouter",
		name: "OpenRouter",
		sub: "200+ model",
		badge: "Esnek",
		badgeColor: "#4f46e5",
		needsKey: true,
		keyField: "openRouterApiKey",
		keyPlaceholder: "sk-or-v1-...",
		keyLabel: "OpenRouter API Key",
	},
	{
		id: "ollama",
		name: "Ollama",
		sub: "Yerel çalışır",
		badge: "Ücretsiz & çevrimdışı",
		badgeColor: "#0369a1",
		needsKey: false,
		keyField: "_none",
		keyPlaceholder: "",
		keyLabel: "",
	},
]

// Simplified language list shown in the wizard
const WIZARD_LANGUAGES: { key: LanguageKey; native: string }[] = [
	{ key: "tr", native: "Türkçe" },
	{ key: "en", native: "English" },
	{ key: "de", native: "Deutsch" },
	{ key: "fr", native: "Français" },
	{ key: "es", native: "Español" },
	{ key: "pt-BR", native: "Português" },
	{ key: "ja", native: "日本語" },
	{ key: "ko", native: "한국어" },
	{ key: "zh-CN", native: "简体中文" },
	{ key: "zh-TW", native: "繁體中文" },
	{ key: "ar", native: "العربية" },
	{ key: "ru", native: "Русский" },
	{ key: "hi", native: "हिन्दी" },
	{ key: "it", native: "Italiano" },
]

const STEP_COUNT = 6

// Detect the best-match LanguageKey from navigator.language
function detectLanguageKey(): LanguageKey {
	const raw = (typeof navigator !== "undefined" ? navigator.language : "en").toLowerCase()
	const region: Partial<Record<string, LanguageKey>> = {
		"zh-tw": "zh-TW",
		"zh-hk": "zh-TW",
		"pt-br": "pt-BR",
	}
	if (region[raw]) return region[raw]!
	const lang = raw.split("-")[0]
	const langMap: Partial<Record<string, LanguageKey>> = {
		tr: "tr", en: "en", de: "de", fr: "fr", es: "es",
		pt: "pt-BR", ja: "ja", ko: "ko", zh: "zh-CN",
		ar: "ar", ru: "ru", hi: "hi", it: "it",
	}
	return langMap[lang] ?? "en"
}

// Map LanguageKey → LanguageDisplay string expected by updateSetting
function toDisplayString(key: LanguageKey): string {
	return languageOptions.find((o) => o.key === key)?.display ?? "English"
}

// ---------- Shared styles ----------

const CARD_BASE: React.CSSProperties = {
	padding: "10px 14px",
	borderRadius: 6,
	border: "1px solid var(--vscode-widget-border)",
	background: "var(--vscode-editor-background)",
	cursor: "pointer",
	transition: "border-color 0.15s",
	userSelect: "none",
}

const CARD_SELECTED: React.CSSProperties = {
	...CARD_BASE,
	border: "1px solid var(--vscode-focusBorder)",
	background: "var(--vscode-list-activeSelectionBackground)",
}

const BTN_PRIMARY: React.CSSProperties = {
	padding: "8px 20px",
	borderRadius: 4,
	border: "none",
	background: "var(--vscode-button-background)",
	color: "var(--vscode-button-foreground)",
	fontSize: 13,
	fontWeight: 600,
	cursor: "pointer",
}

const BTN_GHOST: React.CSSProperties = {
	padding: "8px 14px",
	borderRadius: 4,
	border: "1px solid var(--vscode-widget-border)",
	background: "transparent",
	color: "var(--vscode-foreground)",
	fontSize: 13,
	cursor: "pointer",
}

const BTN_SKIP: React.CSSProperties = {
	padding: "6px 10px",
	background: "none",
	border: "none",
	color: "var(--vscode-descriptionForeground)",
	fontSize: 12,
	cursor: "pointer",
	textDecoration: "underline",
}

// ---------- Step renderers ----------

function StepWelcome({ onNext }: { onNext: () => void }) {
	return (
		<div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24, textAlign: "center" }}>
			<NexusLogoWhite style={{ width: 72, height: 72, opacity: 0.92 }} />
			<div>
				<h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: "var(--vscode-foreground)" }}>
					Nexus'a Hoş Geldin
				</h1>
				<p style={{ margin: "10px 0 0", fontSize: 15, color: "var(--vscode-descriptionForeground)", lineHeight: 1.6 }}>
					Dilini bilen yapay zeka kodlama asistanı.
					<br />
					Hızlı kurulumu birlikte yapalım.
				</p>
			</div>
			<button onClick={onNext} style={{ ...BTN_PRIMARY, padding: "10px 32px", fontSize: 14 }}>
				Başlayalım →
			</button>
		</div>
	)
}

function StepLanguage({
	selected,
	onSelect,
}: {
	selected: LanguageKey
	onSelect: (key: LanguageKey) => void
}) {
	return (
		<div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
			<div>
				<h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "var(--vscode-foreground)" }}>
					Arayüz Dilini Seç
				</h2>
				<p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--vscode-descriptionForeground)" }}>
					Cihaz dilin önerildi. İstediğin zaman Ayarlar'dan değiştirebilirsin.
				</p>
			</div>
			<div
				style={{
					display: "grid",
					gridTemplateColumns: "repeat(2, 1fr)",
					gap: 7,
					maxHeight: 280,
					overflowY: "auto",
					paddingRight: 2,
				}}>
				{WIZARD_LANGUAGES.map((lang) => {
					const isSelected = selected === lang.key
					return (
						<button
							key={lang.key}
							onClick={() => onSelect(lang.key)}
							style={{
								...(isSelected ? CARD_SELECTED : CARD_BASE),
								display: "flex",
								alignItems: "center",
								gap: 8,
								textAlign: "left",
								fontSize: 13,
								fontWeight: isSelected ? 600 : 400,
								color: isSelected
									? "var(--vscode-list-activeSelectionForeground, var(--vscode-foreground))"
									: "var(--vscode-foreground)",
							}}>
							{isSelected && (
								<i className="codicon codicon-check" style={{ fontSize: 12, color: "var(--vscode-focusBorder)" }} />
							)}
							{lang.native}
						</button>
					)
				})}
			</div>
		</div>
	)
}

function StepTelemetry({
	enabled,
	onToggle,
}: {
	enabled: boolean
	onToggle: (v: boolean) => void
}) {
	return (
		<div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
			<div>
				<h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "var(--vscode-foreground)" }}>
					Veri Kullanımı
				</h2>
				<p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--vscode-descriptionForeground)" }}>
					Anonim kullanım verileri göndererek Nexus'u geliştirmemize yardımcı ol.
				</p>
			</div>

			{/* What IS collected */}
			<div
				style={{
					padding: "12px 14px",
					borderRadius: 5,
					background: "var(--vscode-editor-background)",
					border: "1px solid var(--vscode-widget-border)",
					fontSize: 12,
				}}>
				<p style={{ margin: "0 0 8px", fontWeight: 600, color: "var(--vscode-foreground)" }}>
					✅ Toplanabilecekler (anonim):
				</p>
				<ul style={{ margin: 0, paddingLeft: 18, color: "var(--vscode-descriptionForeground)", lineHeight: 1.8 }}>
					<li>Kullanılan özellikler (ör. "ajan görevi başlatıldı")</li>
					<li>Hata mesajları ve çöküş raporları</li>
					<li>Uzantı sürümü ve VS Code sürümü</li>
				</ul>
			</div>

			{/* What is NEVER collected */}
			<div
				style={{
					padding: "12px 14px",
					borderRadius: 5,
					background: "var(--vscode-editor-background)",
					border: "1px solid var(--vscode-widget-border)",
					fontSize: 12,
				}}>
				<p style={{ margin: "0 0 8px", fontWeight: 600, color: "var(--vscode-foreground)" }}>
					🚫 Hiçbir zaman toplanmaz:
				</p>
				<ul style={{ margin: 0, paddingLeft: 18, color: "var(--vscode-descriptionForeground)", lineHeight: 1.8 }}>
					<li>API anahtarları veya kimlik bilgileri</li>
					<li>Kod içeriği, dosya adları veya proje yolları</li>
					<li>AI'a gönderilen istemler ve yanıtlar</li>
					<li>Kişisel kimlik bilgileri</li>
				</ul>
			</div>

			{/* Toggle */}
			<button
				onClick={() => onToggle(!enabled)}
				style={{
					display: "flex",
					alignItems: "center",
					gap: 10,
					padding: "10px 14px",
					borderRadius: 5,
					border: `1px solid ${enabled ? "var(--vscode-focusBorder)" : "var(--vscode-widget-border)"}`,
					background: enabled
						? "var(--vscode-list-activeSelectionBackground)"
						: "var(--vscode-editor-background)",
					cursor: "pointer",
					textAlign: "left",
				}}>
				<div
					style={{
						width: 36,
						height: 20,
						borderRadius: 10,
						background: enabled ? "var(--vscode-button-background)" : "var(--vscode-widget-border)",
						position: "relative",
						transition: "background 0.2s",
						flexShrink: 0,
					}}>
					<div
						style={{
							position: "absolute",
							top: 2,
							left: enabled ? 18 : 2,
							width: 16,
							height: 16,
							borderRadius: "50%",
							background: "white",
							transition: "left 0.15s",
						}}
					/>
				</div>
				<div>
					<span
						style={{
							fontSize: 13,
							fontWeight: 600,
							color: enabled
								? "var(--vscode-list-activeSelectionForeground, var(--vscode-foreground))"
								: "var(--vscode-foreground)",
						}}>
						{enabled ? "Telemetri etkin" : "Telemetri devre dışı"}
					</span>
					<p style={{ margin: 0, fontSize: 11, color: "var(--vscode-descriptionForeground)" }}>
						{enabled
							? "Nexus geliştirme ekibine anonim kullanım verisi gönderilir"
							: "Hiç veri gönderilmez — tamamen gizli"}
					</p>
				</div>
			</button>
		</div>
	)
}

function StepProvider({
	selected,
	onSelect,
}: {
	selected: string
	onSelect: (id: string) => void
}) {
	return (
		<div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
			<div>
				<h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "var(--vscode-foreground)" }}>
					AI Sağlayıcısı Seç
				</h2>
				<p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--vscode-descriptionForeground)" }}>
					Hangi yapay zekayı kullanacaksın? Sonradan Ayarlar'dan değiştirebilirsin.
				</p>
			</div>
			<div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
				{PROVIDERS.map((p) => {
					const isSelected = selected === p.id
					return (
						<button
							key={p.id}
							onClick={() => onSelect(p.id)}
							style={{
								...(isSelected ? CARD_SELECTED : CARD_BASE),
								display: "flex",
								alignItems: "center",
								gap: 12,
								textAlign: "left",
							}}>
							<div style={{ flex: 1 }}>
								<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
									<span
										style={{
											fontSize: 14,
											fontWeight: 700,
											color: isSelected
												? "var(--vscode-list-activeSelectionForeground, var(--vscode-foreground))"
												: "var(--vscode-foreground)",
										}}>
										{p.name}
									</span>
									<span
										style={{
											fontSize: 11,
											color: isSelected ? "rgba(255,255,255,0.7)" : p.badgeColor,
											fontWeight: 600,
											padding: "1px 6px",
											borderRadius: 3,
											background: isSelected ? "rgba(255,255,255,0.12)" : `${p.badgeColor}1a`,
										}}>
										{p.badge}
									</span>
								</div>
								<span
									style={{
										fontSize: 12,
										color: isSelected
											? "rgba(255,255,255,0.65)"
											: "var(--vscode-descriptionForeground)",
									}}>
									{p.sub}
								</span>
							</div>
							{isSelected && (
								<i
									className="codicon codicon-check"
									style={{ color: "var(--vscode-focusBorder)", fontSize: 14 }}
								/>
							)}
						</button>
					)
				})}
			</div>
		</div>
	)
}

function StepApiKey({
	provider,
	apiKey,
	onChange,
}: {
	provider: Provider | undefined
	apiKey: string
	onChange: (v: string) => void
}) {
	if (!provider || !provider.needsKey) {
		return (
			<div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
				<div>
					<h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "var(--vscode-foreground)" }}>
						API Anahtarı
					</h2>
				</div>
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: 10,
						padding: "14px 16px",
						borderRadius: 5,
						background: "rgba(78, 201, 176, 0.08)",
						border: "1px solid rgba(78, 201, 176, 0.35)",
					}}>
					<i className="codicon codicon-vm-connect" style={{ color: "#4ec9b0", fontSize: 18, flexShrink: 0 }} />
					<div>
						<p style={{ margin: 0, fontWeight: 600, color: "#4ec9b0", fontSize: 13 }}>
							Çevrimdışı mod — API anahtarı gerekmez
						</p>
						<p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--vscode-descriptionForeground)" }}>
							Ollama, modellerini yerel makinende çalıştırır. İnternet bağlantısı gerekmez.
						</p>
					</div>
				</div>
				<div
					style={{
						padding: "12px 14px",
						borderRadius: 5,
						background: "var(--vscode-editor-background)",
						border: "1px solid var(--vscode-widget-border)",
						fontSize: 12,
						lineHeight: 1.8,
					}}>
					<p style={{ margin: "0 0 6px", fontWeight: 600, color: "var(--vscode-foreground)" }}>
						Ollama kurulum adımları:
					</p>
					<ol style={{ margin: 0, paddingLeft: 18, color: "var(--vscode-descriptionForeground)" }}>
						<li>
							<a
								href="https://ollama.com"
								style={{ color: "var(--vscode-textLink-foreground)", textDecoration: "none" }}>
								ollama.com
							</a>
							'dan Ollama'yı indir ve kur
						</li>
						<li>
							Terminali aç ve bir model indir:{" "}
							<code
								style={{
									background: "var(--vscode-textCodeBlock-background)",
									padding: "1px 5px",
									borderRadius: 3,
									fontFamily: "monospace",
								}}>
								ollama run qwen2.5-coder:7b
							</code>
						</li>
						<li>Nexus açıldığında modelleriniz otomatik algılanır</li>
					</ol>
				</div>
			</div>
		)
	}

	return (
		<div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
			<div>
				<h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "var(--vscode-foreground)" }}>
					API Anahtarı Gir
				</h2>
				<p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--vscode-descriptionForeground)" }}>
					{provider.name} için API anahtarın. Güvenli OS şifrelemesiyle saklanır — asla düz metin olarak
					yazılmaz.
				</p>
			</div>
			<div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
				<label
					style={{ fontSize: 12, fontWeight: 600, color: "var(--vscode-foreground)" }}
					htmlFor="wizard-api-key">
					{provider.keyLabel}
				</label>
				<input
					id="wizard-api-key"
					type="password"
					autoComplete="off"
					value={apiKey}
					onChange={(e) => onChange(e.target.value)}
					placeholder={provider.keyPlaceholder}
					style={{
						width: "100%",
						padding: "8px 10px",
						borderRadius: 4,
						border: "1px solid var(--vscode-input-border, var(--vscode-widget-border))",
						background: "var(--vscode-input-background)",
						color: "var(--vscode-input-foreground)",
						fontSize: 13,
						fontFamily: "monospace",
						boxSizing: "border-box",
					}}
				/>
				<p style={{ margin: 0, fontSize: 11, color: "var(--vscode-descriptionForeground)" }}>
					API anahtarını sonradan Ayarlar &rarr; API Yapılandırması'ndan da girebilirsin.
				</p>
			</div>
		</div>
	)
}

function StepReady({ providerName }: { providerName: string }) {
	return (
		<div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24, textAlign: "center" }}>
			<div
				style={{
					width: 72,
					height: 72,
					borderRadius: "50%",
					background: "rgba(78, 201, 176, 0.15)",
					border: "2px solid rgba(78, 201, 176, 0.5)",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
				}}>
				<i className="codicon codicon-check" style={{ fontSize: 32, color: "#4ec9b0" }} />
			</div>
			<div>
				<h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "var(--vscode-foreground)" }}>
					Hazırsın! 🚀
				</h2>
				<p style={{ margin: "10px 0 0", fontSize: 14, color: "var(--vscode-descriptionForeground)", lineHeight: 1.7 }}>
					Nexus {providerName} ile çalışmaya hazır.
					<br />
					İlk görevini başlatmak için chat panelini aç.
				</p>
			</div>
			<div
				style={{
					display: "flex",
					gap: 10,
					flexWrap: "wrap",
					justifyContent: "center",
					fontSize: 12,
					color: "var(--vscode-descriptionForeground)",
				}}>
				{[
					"Kod yaz ve düzenle",
					"Terminal komutları çalıştır",
					"Web'de araştırma yap",
					"Dosyaları analiz et",
				].map((item) => (
					<span
						key={item}
						style={{
							padding: "4px 10px",
							borderRadius: 12,
							border: "1px solid var(--vscode-widget-border)",
							background: "var(--vscode-editor-background)",
						}}>
						{item}
					</span>
				))}
			</div>
		</div>
	)
}

// ---------- Progress dots ----------

function ProgressDots({ current, total }: { current: number; total: number }) {
	return (
		<div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
			{Array.from({ length: total }).map((_, i) => (
				<div
					key={i}
					style={{
						width: i === current ? 20 : 7,
						height: 7,
						borderRadius: 4,
						background:
							i === current
								? "var(--vscode-button-background)"
								: i < current
									? "var(--vscode-focusBorder)"
									: "var(--vscode-widget-border)",
						transition: "width 0.2s, background 0.2s",
					}}
				/>
			))}
		</div>
	)
}

// ---------- Main wizard ----------

export const NexusSetupWizard = () => {
	const { handleFieldsChange } = useApiConfigurationHandlers()

	const [step, setStep] = useState<WizardStep>(0)
	const [language, setLanguage] = useState<LanguageKey>(detectLanguageKey)
	const [telemetry, setTelemetry] = useState<boolean>(false)
	const [providerId, setProviderId] = useState<string>("anthropic")
	const [apiKey, setApiKey] = useState<string>("")
	const [finishing, setFinishing] = useState(false)

	const provider = PROVIDERS.find((p) => p.id === providerId)

	// Apply language choice immediately so the rest of VS Code reflects it
	useEffect(() => {
		updateSetting("preferredLanguage", toDisplayString(language))
	}, [language])

	const completeWizard = useCallback(async () => {
		if (finishing) return
		setFinishing(true)
		try {
			// Save telemetry choice
			updateSetting("telemetrySetting", telemetry ? "enabled" : "disabled")

			// Save provider selection (both modes)
			await handleFieldsChange({
				actModeApiProvider: providerId as any,
				planModeApiProvider: providerId as any,
			})

			// Save API key if one was entered and provider needs it
			if (provider?.needsKey && apiKey.trim()) {
				await handleFieldsChange({ [provider.keyField]: apiKey.trim() } as any)
			}

			// Mark onboarding as complete
			await StateServiceClient.setWelcomeViewCompleted({ value: true })
		} catch (err) {
			console.error("NexusSetupWizard: failed to save settings", err)
			// Complete anyway so user isn't stuck
			StateServiceClient.setWelcomeViewCompleted({ value: true }).catch(() => {})
		} finally {
			setFinishing(false)
		}
	}, [finishing, telemetry, providerId, provider, apiKey, handleFieldsChange])

	const goNext = useCallback(() => {
		if (step < STEP_COUNT - 1) {
			setStep((s) => (s + 1) as WizardStep)
		} else {
			completeWizard()
		}
	}, [step, completeWizard])

	const goBack = useCallback(() => {
		if (step > 0) setStep((s) => (s - 1) as WizardStep)
	}, [step])

	const skipAll = useCallback(() => {
		completeWizard()
	}, [completeWizard])

	const isLastStep = step === STEP_COUNT - 1

	return (
		<div
			style={{
				width: "100%",
				height: "100vh",
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				background: "var(--vscode-sideBar-background, var(--vscode-editor-background))",
				padding: "24px 16px",
				boxSizing: "border-box",
				overflowY: "auto",
			}}>
			<div
				style={{
					width: "100%",
					maxWidth: 420,
					display: "flex",
					flexDirection: "column",
					gap: 24,
				}}>
				{/* Header: progress + skip */}
				{step > 0 && (
					<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
						<ProgressDots current={step - 1} total={STEP_COUNT - 2} />
						{!isLastStep && (
							<button onClick={skipAll} style={BTN_SKIP}>
								Tümünü atla
							</button>
						)}
					</div>
				)}

				{/* Step content */}
				<div>
					{step === 0 && <StepWelcome onNext={goNext} />}
					{step === 1 && <StepLanguage selected={language} onSelect={setLanguage} />}
					{step === 2 && <StepTelemetry enabled={telemetry} onToggle={setTelemetry} />}
					{step === 3 && <StepProvider selected={providerId} onSelect={setProviderId} />}
					{step === 4 && <StepApiKey provider={provider} apiKey={apiKey} onChange={setApiKey} />}
					{step === 5 && <StepReady providerName={provider?.name ?? "AI"} />}
				</div>

				{/* Navigation */}
				{step > 0 && (
					<div
						style={{
							display: "flex",
							alignItems: "center",
							justifyContent: step === 1 ? "flex-end" : "space-between",
							gap: 8,
						}}>
						{step > 1 && (
							<button onClick={goBack} style={BTN_GHOST} disabled={finishing}>
								← Geri
							</button>
						)}

						<div style={{ display: "flex", gap: 8, alignItems: "center" }}>
							{/* Skip current step (not on last step) */}
							{!isLastStep && step !== 1 && (
								<button onClick={goNext} style={BTN_SKIP}>
									Bu adımı atla
								</button>
							)}

							<button onClick={goNext} style={BTN_PRIMARY} disabled={finishing}>
								{finishing
									? "Kaydediliyor..."
									: isLastStep
										? "Nexus'u Aç"
										: step === STEP_COUNT - 2
											? "Bitir →"
											: "Sonraki →"}
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}

export default NexusSetupWizard
