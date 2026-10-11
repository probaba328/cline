import { useState, useEffect, useCallback } from "react"
import { VSCodeButton } from "@vscode/webview-ui-toolkit/react"
import { BYOK_PROVIDER_MAP } from "@shared/byok/catalog"
import type { BYOKKeyEntry, BYOKValidationResult } from "@shared/byok/types"
import { ByokServiceClient } from "@/services/grpc-client"
import { BYOKSetupWizard } from "./BYOKSetupWizard"

interface BYOKKeyManagerProps {
	renderSectionHeader: (tabId: string) => JSX.Element | null
}

export function BYOKKeyManager({ renderSectionHeader }: BYOKKeyManagerProps) {
	const [keys, setKeys] = useState<BYOKKeyEntry[]>([])
	const [showWizard, setShowWizard] = useState(false)
	const [testResults, setTestResults] = useState<Record<string, BYOKValidationResult>>({})
	const [testing, setTesting] = useState<string | null>(null)
	const [deleting, setDeleting] = useState<string | null>(null)

	const loadKeys = useCallback(async () => {
		try {
			const res = await ByokServiceClient.listKeys({})
			setKeys((res.entries as BYOKKeyEntry[]) ?? [])
		} catch {
			// ignore
		}
	}, [])

	useEffect(() => {
		void loadKeys()
	}, [loadKeys])

	const handleDelete = async (providerId: string) => {
		setDeleting(providerId)
		try {
			await ByokServiceClient.deleteKey({ value: providerId })
			await loadKeys()
		} finally {
			setDeleting(null)
		}
	}

	const handleTest = async (entry: BYOKKeyEntry) => {
		setTesting(entry.providerId)
		try {
			const res = await ByokServiceClient.testKey({
				providerId: entry.providerId,
				apiKey: "",
				customEndpoint: entry.customEndpoint ?? "",
			})
			setTestResults((prev) => ({ ...prev, [entry.providerId]: res as BYOKValidationResult }))
		} finally {
			setTesting(null)
		}
	}

	const existingProviders = new Set(keys.map((k) => k.providerId))

	return (
		<div className="flex flex-col min-h-0">
			{renderSectionHeader("api-keys")}

			<div className="flex flex-col gap-4 pl-4 pr-3 py-2">
				{!showWizard && (
					<>
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium">API Anahtarları</p>
								<p className="text-xs text-description mt-0.5">
									Kendi API key'lerinizi yönetin. Hiçbir key sunuculara gönderilmez.
								</p>
							</div>
							<VSCodeButton onClick={() => setShowWizard(true)}>
								<i className="codicon codicon-add mr-1" />
								Ekle
							</VSCodeButton>
						</div>

						{keys.length === 0 ? (
							<EmptyState onAdd={() => setShowWizard(true)} />
						) : (
							<div className="flex flex-col gap-2">
								{keys.map((entry) => (
									<KeyRow
										key={entry.providerId}
										entry={entry}
										testResult={testResults[entry.providerId]}
										isTesting={testing === entry.providerId}
										isDeleting={deleting === entry.providerId}
										onTest={() => handleTest(entry)}
										onDelete={() => handleDelete(entry.providerId)}
									/>
								))}
							</div>
						)}

						<SecurityNote />
					</>
				)}

				{showWizard && (
					<div className="flex flex-col gap-3">
						<div className="flex items-center gap-2">
							<button
								type="button"
								onClick={() => setShowWizard(false)}
								className="text-description hover:text-(--vscode-foreground) transition-colors">
								<i className="codicon codicon-arrow-left" />
							</button>
							<span className="text-sm font-medium">Yeni API Key Ekle</span>
						</div>
						<BYOKSetupWizard
							existingProviders={existingProviders}
							onSaved={() => {
								setShowWizard(false)
								void loadKeys()
							}}
							onCancel={() => setShowWizard(false)}
						/>
					</div>
				)}
			</div>
		</div>
	)
}

function KeyRow({
	entry,
	testResult,
	isTesting,
	isDeleting,
	onTest,
	onDelete,
}: {
	entry: BYOKKeyEntry
	testResult?: BYOKValidationResult
	isTesting: boolean
	isDeleting: boolean
	onTest: () => void
	onDelete: () => void
}) {
	const provider = BYOK_PROVIDER_MAP.get(entry.providerId)
	const addedDate = new Date(entry.addedAt).toLocaleDateString("tr-TR")

	return (
		<div className="flex flex-col gap-1.5 p-3 rounded border border-(--vscode-panel-border) bg-(--vscode-editor-background)">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<span className="text-sm font-medium">{provider?.name ?? entry.providerId}</span>
					{provider?.isLocal && (
						<span className="text-xs text-description border border-(--vscode-panel-border) rounded px-1">
							Yerel
						</span>
					)}
				</div>
				<div className="flex items-center gap-1.5">
					<VSCodeButton appearance="icon" title="Test et" onClick={onTest} disabled={isTesting}>
						<i className={`codicon ${isTesting ? "codicon-loading codicon-modifier-spin" : "codicon-check"}`} />
					</VSCodeButton>
					<VSCodeButton
						appearance="icon"
						title="Sil"
						onClick={onDelete}
						disabled={isDeleting}
						style={{ color: "var(--vscode-errorForeground)" }}>
						<i className={`codicon ${isDeleting ? "codicon-loading codicon-modifier-spin" : "codicon-trash"}`} />
					</VSCodeButton>
				</div>
			</div>

			<div className="flex items-center gap-4">
				<span className="text-xs font-mono text-description">{entry.maskedKey || "(yerel — key gerekmez)"}</span>
				<span className="text-xs text-description">Eklendi: {addedDate}</span>
			</div>

			{entry.customEndpoint && (
				<span className="text-xs text-description">Endpoint: {entry.customEndpoint}</span>
			)}

			{testResult && (
				<div
					className={`flex items-center gap-1.5 text-xs mt-0.5 ${testResult.ok ? "text-green-400" : "text-(--vscode-errorForeground)"}`}>
					<i className={`codicon ${testResult.ok ? "codicon-pass-filled" : "codicon-error"}`} style={{ fontSize: 12 }} />
					{testResult.message}
				</div>
			)}
		</div>
	)
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
	return (
		<div className="flex flex-col items-center gap-3 py-8 text-center">
			<div className="w-10 h-10 rounded-full bg-(--vscode-editor-background) border border-(--vscode-panel-border) flex items-center justify-center">
				<i className="codicon codicon-key text-description" style={{ fontSize: 20 }} />
			</div>
			<div>
				<p className="text-sm text-description">Henüz API key eklenmedi</p>
				<p className="text-xs text-description mt-0.5">Kendi API key'lerinizle dilediğiniz sağlayıcıyı kullanın</p>
			</div>
			<VSCodeButton onClick={onAdd}>İlk Key'i Ekle</VSCodeButton>
		</div>
	)
}

function SecurityNote() {
	return (
		<div className="flex items-start gap-2 p-2 rounded bg-(--vscode-editor-background) border border-(--vscode-panel-border) text-xs text-description mt-2">
			<i className="codicon codicon-shield mt-0.5" style={{ fontSize: 13 }} />
			<div className="flex flex-col gap-0.5">
				<span className="font-medium text-(--vscode-foreground)">Güvenlik</span>
				<span>Tüm key'ler cihazınızda şifreli olarak saklanır (0o600 izinli dosya).</span>
				<span>Hiçbir key Nexus sunucularına gönderilmez — sadece seçtiğiniz sağlayıcıya gider.</span>
				<span>Key'ler hiçbir log'a yazılmaz ve ekranda tam gösterilmez.</span>
			</div>
		</div>
	)
}
