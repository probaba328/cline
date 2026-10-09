import { VSCodeLink } from "@vscode/webview-ui-toolkit/react"
import Section from "../Section"

interface AboutSectionProps {
	version: string
	extensionVariant?: "legacy" | "next"
	renderSectionHeader: (tabId: string) => JSX.Element | null
}

const VARIANT_LABELS: Record<"legacy" | "next", string> = {
	legacy: "Legacy",
	next: "Next",
}

const AboutSection = ({ version, extensionVariant, renderSectionHeader }: AboutSectionProps) => {
	return (
		<div>
			{renderSectionHeader("about")}
			<Section>
				{/* Version */}
				<div
					className="flex items-center gap-3 p-3 rounded-md"
					style={{ border: "1px solid var(--vscode-widget-border)", background: "var(--vscode-editor-background)" }}>
					<i className="codicon codicon-extensions" style={{ fontSize: 20, color: "var(--vscode-descriptionForeground)" }} />
					<div>
						<p className="m-0 text-base font-bold">
							Nexus v{version}
							{extensionVariant && (
								<span className="ml-2 text-sm font-normal text-description">
									({VARIANT_LABELS[extensionVariant]})
								</span>
							)}
						</p>
						<p className="m-0 text-xs text-description">
							Dünyanın her dilinden geliştiriciler için yapay zeka kodlama asistanı
						</p>
					</div>
				</div>

				{/* License */}
				<div>
					<p className="text-sm font-semibold mb-1">Lisans</p>
					<p className="text-sm text-description">
						Nexus,{" "}
						<VSCodeLink
							href="https://github.com/probaba328/cline/blob/main/LICENSE"
							className="text-inherit"
							style={{ fontSize: "inherit" }}>
							Apache License 2.0
						</VSCodeLink>{" "}
						altında lisanslanmış açık kaynak bir yazılımdır.{" "}
						<VSCodeLink
							href="https://github.com/cline/cline"
							className="text-inherit"
							style={{ fontSize: "inherit" }}>
							Cline
						</VSCodeLink>{" "}
						projesinin bir çatalsıdır.
					</p>
				</div>

				{/* GitHub */}
				<div>
					<p className="text-sm font-semibold mb-1">Geliştirme</p>
					<div className="flex flex-col gap-1">
						<p className="text-sm text-description m-0">
							<VSCodeLink href="https://github.com/probaba328/cline" style={{ fontSize: "inherit" }}>
								GitHub — probaba328/cline
							</VSCodeLink>
							{" · "}
							<VSCodeLink href="https://github.com/probaba328/cline/issues" style={{ fontSize: "inherit" }}>
								Issues
							</VSCodeLink>
							{" · "}
							<VSCodeLink
								href="https://github.com/probaba328/cline/pulls"
								style={{ fontSize: "inherit" }}>
								Pull Requests
							</VSCodeLink>
						</p>
					</div>
				</div>

				{/* Translation contribution */}
				<div
					className="flex items-start gap-3 p-3 rounded-md"
					style={{ border: "1px solid var(--vscode-widget-border)", background: "var(--vscode-editor-background)" }}>
					<i
						className="codicon codicon-globe mt-0.5 flex-shrink-0"
						style={{ fontSize: 16, color: "var(--vscode-descriptionForeground)" }}
					/>
					<div>
						<p className="m-0 text-sm font-semibold">Çeviri Katkısı</p>
						<p className="m-0 text-xs text-description mt-1">
							Nexus şu an 13 dili destekliyor. Kendi diline çeviri eklemek veya var olan çevirileri
							iyileştirmek için katkıda bulunabilirsin.
						</p>
						<p className="m-0 mt-2">
							<VSCodeLink
								href="https://github.com/probaba328/cline/blob/main/CONTRIBUTING_TRANSLATION.md"
								style={{ fontSize: 12 }}>
								Çeviri Katkı Rehberi →
							</VSCodeLink>
						</p>
					</div>
				</div>

				{/* Credits */}
				<p className="text-xs text-description">
					Nexus is built on top of{" "}
					<VSCodeLink href="https://github.com/cline/cline" style={{ fontSize: "inherit" }}>
						Cline
					</VSCodeLink>{" "}
					by the Cline team. Thank you for the open-source foundation.
				</p>
			</Section>
		</div>
	)
}

export default AboutSection
