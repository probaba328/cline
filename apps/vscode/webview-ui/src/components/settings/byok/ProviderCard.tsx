import { cn } from "@/lib/utils"
import type { BYOKProviderCatalogEntry } from "@shared/byok/types"

interface ProviderCardProps {
	provider: BYOKProviderCatalogEntry
	isSelected: boolean
	hasKey: boolean
	onClick: () => void
}

export function ProviderCard({ provider, isSelected, hasKey, onClick }: ProviderCardProps) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				"relative flex flex-col gap-1 p-3 rounded border text-left transition-colors w-full cursor-pointer",
				isSelected
					? "border-(--vscode-focusBorder) bg-(--vscode-list-activeSelectionBackground)"
					: "border-(--vscode-panel-border) bg-(--vscode-editor-background) hover:border-(--vscode-focusBorder) hover:bg-(--vscode-list-hoverBackground)",
			)}>
			<div className="flex items-center justify-between gap-2">
				<span className="font-medium text-sm text-(--vscode-foreground)">{provider.name}</span>
				{hasKey && (
					<span className="flex items-center gap-1 text-xs text-green-400">
						<i className="codicon codicon-pass-filled" style={{ fontSize: 12 }} />
						Aktif
					</span>
				)}
				{provider.isLocal && (
					<span className="text-xs text-description border border-(--vscode-panel-border) rounded px-1">
						Yerel
					</span>
				)}
			</div>
			<span className="text-xs text-description">{provider.tagline}</span>
		</button>
	)
}
