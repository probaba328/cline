const LOCAL_PROVIDERS = new Set(["ollama", "lmstudio"])

interface OfflineModeIndicatorProps {
	provider: string
}

export const OfflineModeIndicator = ({ provider }: OfflineModeIndicatorProps) => {
	if (!LOCAL_PROVIDERS.has(provider)) return null

	return (
		<div
			style={{
				display: "flex",
				alignItems: "center",
				gap: 6,
				padding: "6px 10px",
				borderRadius: 4,
				backgroundColor: "rgba(78, 201, 176, 0.1)",
				border: "1px solid rgba(78, 201, 176, 0.35)",
				fontSize: 12,
			}}>
			<i className="codicon codicon-vm-connect" style={{ color: "#4ec9b0", fontSize: 13, flexShrink: 0 }} />
			<span style={{ color: "#4ec9b0", fontWeight: 600, flexShrink: 0 }}>Offline mode active</span>
			<span style={{ color: "var(--vscode-descriptionForeground)" }}>
				&mdash; No internet required. Inference runs entirely on your machine.
			</span>
		</div>
	)
}
