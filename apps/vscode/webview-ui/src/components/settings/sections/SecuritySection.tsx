import { VSCodeLink } from "@vscode/webview-ui-toolkit/react"
import Section from "../Section"

interface SecuritySectionProps {
	renderSectionHeader: (tabId: string) => JSX.Element | null
}

interface InfoRowProps {
	icon: string
	label: string
	value: string
	valueColor?: string
}

const InfoRow = ({ icon, label, value, valueColor }: InfoRowProps) => (
	<div className="flex items-center justify-between py-2 border-b border-solid border-(--vscode-panel-border) last:border-0">
		<div className="flex items-center gap-2">
			<i className={`codicon codicon-${icon} text-description`} style={{ fontSize: 14 }} />
			<span className="text-sm text-description">{label}</span>
		</div>
		<span className="text-sm font-medium" style={{ color: valueColor || "var(--vscode-foreground)" }}>
			{value}
		</span>
	</div>
)

const SecuritySection = ({ renderSectionHeader }: SecuritySectionProps) => {
	return (
		<div>
			{renderSectionHeader("security")}
			<Section>
				{/* Key storage guarantee */}
				<div
					className="flex items-start gap-3 p-3 rounded-md"
					style={{ background: "rgba(78,201,176,0.08)", border: "1px solid rgba(78,201,176,0.3)" }}>
					<i
						className="codicon codicon-lock mt-0.5 flex-shrink-0"
						style={{ color: "#4ec9b0", fontSize: 16 }}
					/>
					<div>
						<p className="m-0 text-sm font-semibold" style={{ color: "#4ec9b0" }}>
							API anahtarları OS keychain'de şifreli saklanır
						</p>
						<p className="m-0 text-xs mt-1 text-description">
							VS Code SecretStorage API üzerinden macOS Keychain, Windows Credential Manager veya Linux
							libsecret'e yazılır. Nexus sunucularına asla iletilmez.
						</p>
					</div>
				</div>

				{/* Status table */}
				<div>
					<p className="text-xs font-semibold mb-2 text-description uppercase tracking-wide">
						Şifreleme Durumu
					</p>
					<div
						className="rounded-md px-3"
						style={{ border: "1px solid var(--vscode-widget-border)", background: "var(--vscode-editor-background)" }}>
						<InfoRow icon="key" label="API Anahtarı Depolama" value="SecretStorage (şifreli)" valueColor="#4ec9b0" />
						<InfoRow icon="shield" label="Düz metin yazma" value="Hiçbir zaman" valueColor="#4ec9b0" />
						<InfoRow icon="server" label="Nexus sunucularına iletim" value="Hiçbir zaman" valueColor="#4ec9b0" />
						<InfoRow icon="file-binary" label="Loglara yazma" value="Hiçbir zaman" valueColor="#4ec9b0" />
					</div>
				</div>

				{/* VS Code SecretStorage explanation */}
				<div>
					<p className="text-xs font-semibold mb-2 text-description uppercase tracking-wide">
						SecretStorage Nedir?
					</p>
					<p className="text-sm text-description">
						VS Code SecretStorage, uzantıların hassas verileri işletim sistemi şifreleme altyapısına güvenli
						şekilde yazmasını sağlayan resmi bir API'dir. Veriler VS Code'un kendi dahili mağazasından ayrı
						tutulur.
					</p>
					<ul className="text-sm text-description mt-2 pl-4 space-y-1">
						<li>
							<strong className="text-foreground">macOS:</strong> Keychain Access
						</li>
						<li>
							<strong className="text-foreground">Windows:</strong> Windows Credential Manager
						</li>
						<li>
							<strong className="text-foreground">Linux:</strong> libsecret / GNOME Keyring
						</li>
					</ul>
				</div>

				{/* Vulnerability disclosure */}
				<div
					className="p-3 rounded-md"
					style={{ border: "1px solid var(--vscode-widget-border)", background: "var(--vscode-editor-background)" }}>
					<p className="text-xs font-semibold mb-1">Güvenlik Açığı Bildirimi</p>
					<p className="text-xs text-description m-0">
						Bir güvenlik açığı keşfettiysen lütfen herkese açık bir Issue oluşturmadan önce bizimle iletişime
						geç:{" "}
						<VSCodeLink
							href="https://github.com/probaba328/cline/blob/main/SECURITY.md"
							className="text-inherit"
							style={{ fontSize: "inherit" }}>
							SECURITY.md → Sorumlu Açıklama
						</VSCodeLink>
					</p>
				</div>
			</Section>
		</div>
	)
}

export default SecuritySection
