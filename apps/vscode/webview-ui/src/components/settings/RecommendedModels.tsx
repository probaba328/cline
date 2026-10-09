interface RecommendedModelsProps {
	selectedProvider: string
	onSelectProvider: (provider: string) => void
}

interface ProviderChip {
	id: string
	label: string
	badge: string
	badgeColor: string
}

const PROVIDERS: ProviderChip[] = [
	{ id: "anthropic", label: "Claude", badge: "Most capable", badgeColor: "#c97b00" },
	{ id: "openai-native", label: "GPT-4o", badge: "Popular", badgeColor: "#0e7a3a" },
	{ id: "openrouter", label: "OpenRouter", badge: "200+ models", badgeColor: "#6040c0" },
	{ id: "ollama", label: "Ollama", badge: "Free & offline", badgeColor: "#007a99" },
]

export const RecommendedModels = ({ selectedProvider, onSelectProvider }: RecommendedModelsProps) => {
	return (
		<div style={{ marginBottom: 2 }}>
			<span
				style={{
					fontSize: 11,
					color: "var(--vscode-descriptionForeground)",
					textTransform: "uppercase",
					letterSpacing: "0.06em",
					display: "block",
					marginBottom: 5,
				}}>
				Quick start
			</span>
			<div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
				{PROVIDERS.map((p) => {
					const isSelected = selectedProvider === p.id
					return (
						<button
							key={p.id}
							onClick={() => onSelectProvider(p.id)}
							style={{
								display: "flex",
								flexDirection: "column",
								alignItems: "flex-start",
								padding: "6px 10px",
								borderRadius: 5,
								border: isSelected
									? "1px solid var(--vscode-focusBorder)"
									: "1px solid var(--vscode-widget-border)",
								background: isSelected
									? "var(--vscode-list-activeSelectionBackground)"
									: "var(--vscode-editor-background)",
								cursor: "pointer",
								minWidth: 90,
								transition: "border-color 0.1s",
							}}>
							<span
								style={{
									fontSize: 12,
									fontWeight: 600,
									color: isSelected
										? "var(--vscode-list-activeSelectionForeground, var(--vscode-foreground))"
										: "var(--vscode-foreground)",
								}}>
								{p.label}
							</span>
							<span
								style={{
									fontSize: 10,
									marginTop: 2,
									color: isSelected ? "rgba(255,255,255,0.75)" : p.badgeColor,
									fontWeight: 500,
								}}>
								{p.badge}
							</span>
						</button>
					)
				})}
			</div>
		</div>
	)
}
