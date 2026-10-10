import { VSCodeLink } from "@vscode/webview-ui-toolkit/react"
import PreferredLanguageSetting from "../PreferredLanguageSetting"
import Section from "../Section"

interface GeneralSettingsSectionProps {
	renderSectionHeader: (tabId: string) => JSX.Element | null
}

const GeneralSettingsSection = ({ renderSectionHeader }: GeneralSettingsSectionProps) => {
	return (
		<div>
			{renderSectionHeader("general")}
			<Section>
				{/* Language */}
				<PreferredLanguageSetting />

				{/* Theme */}
				<div>
					<p className="text-base font-medium mb-1">Tema</p>
					<p className="text-sm text-description mt-0 mb-2">
						Nexus, VS Code'un aktif renk temasını kullanır. Temayı değiştirmek için VS Code'un tema
						ayarlarını aç.
					</p>
					<VSCodeLink
						href="command:workbench.action.selectTheme"
						className="text-inherit"
						style={{ fontSize: 13 }}>
						Renk Teması Seç →
					</VSCodeLink>
				</div>
			</Section>
		</div>
	)
}

export default GeneralSettingsSection
