import { VSCodeCheckbox, VSCodeLink } from "@vscode/webview-ui-toolkit/react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useExtensionState } from "@/context/ExtensionStateContext"
import Section from "../Section"
import { updateSetting } from "../utils/settingsHandlers"

interface PrivacySectionProps {
	renderSectionHeader: (tabId: string) => JSX.Element | null
}

const PrivacySection = ({ renderSectionHeader }: PrivacySectionProps) => {
	const { telemetrySetting, remoteConfigSettings } = useExtensionState()
	const telemetryEnabled = telemetrySetting !== "disabled"

	return (
		<div>
			{renderSectionHeader("privacy")}
			<Section>
				{/* Key privacy guarantee */}
				<div
					className="flex items-start gap-3 p-3 rounded-md"
					style={{ background: "rgba(78,201,176,0.08)", border: "1px solid rgba(78,201,176,0.3)" }}>
					<i
						className="codicon codicon-shield mt-0.5 flex-shrink-0"
						style={{ color: "#4ec9b0", fontSize: 16 }}
					/>
					<div>
						<p className="m-0 text-sm font-semibold" style={{ color: "#4ec9b0" }}>
							Nexus kod veya prompt toplamaz
						</p>
						<p className="m-0 text-xs mt-1 text-description">
							Yazdığın kod, AI'a gönderilen istemler, dosya yolları veya proje içerikleri hiçbir zaman Nexus
							sunucularına iletilmez.
						</p>
					</div>
				</div>

				{/* Telemetry toggle */}
				<div>
					<p className="text-sm font-semibold mb-2">Kullanım ve Hata Raporlama</p>
					<Tooltip>
						<TooltipContent hidden={remoteConfigSettings?.telemetrySetting === undefined}>
							Bu ayar organizasyonunun uzak yapılandırması tarafından yönetilmektedir
						</TooltipContent>
						<TooltipTrigger asChild>
							<div className="flex items-center gap-2 mb-1">
								<VSCodeCheckbox
									checked={telemetryEnabled}
									disabled={remoteConfigSettings?.telemetrySetting === "disabled"}
									onChange={(e: any) => {
										const checked = e.target.checked === true
										updateSetting("telemetrySetting", checked ? "enabled" : "disabled")
									}}>
									Anonim kullanım verisi gönder
								</VSCodeCheckbox>
								{!!remoteConfigSettings?.telemetrySetting && (
									<i className="codicon codicon-lock text-description text-sm" />
								)}
							</div>
						</TooltipTrigger>
					</Tooltip>
					<p className="text-xs text-description mt-1">
						Nexus'u geliştirmemize yardımcı olan anonim kullanım istatistikleri ve hata raporları gönderilir.
					</p>
				</div>

				{/* What IS collected */}
				<div>
					<p className="text-xs font-semibold mb-1 text-description uppercase tracking-wide">
						Toplanabilecekler (anonim)
					</p>
					<ul className="text-xs text-description m-0 pl-4 space-y-1">
						<li>Kullanılan özellikler (ör. "ajan görevi başlatıldı")</li>
						<li>Hata mesajları ve çöküş raporları</li>
						<li>Uzantı sürümü ve VS Code sürümü</li>
					</ul>
				</div>

				{/* What is NEVER collected */}
				<div>
					<p className="text-xs font-semibold mb-1 text-description uppercase tracking-wide">
						Hiçbir zaman toplanmaz
					</p>
					<ul className="text-xs text-description m-0 pl-4 space-y-1">
						<li>API anahtarları veya kimlik bilgileri</li>
						<li>Kod içeriği, dosya adları veya proje yolları</li>
						<li>AI'a gönderilen istemler ve yanıtlar</li>
						<li>Kişisel kimlik bilgileri</li>
					</ul>
				</div>

				{/* Link */}
				<p className="text-xs text-description">
					Daha fazla bilgi:{" "}
					<VSCodeLink
						href="https://github.com/probaba328/cline/blob/main/SECURITY.md"
						className="text-inherit"
						style={{ fontSize: "inherit" }}>
						SECURITY.md
					</VSCodeLink>
				</p>
			</Section>
		</div>
	)
}

export default PrivacySection
