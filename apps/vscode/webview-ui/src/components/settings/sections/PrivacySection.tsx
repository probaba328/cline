import { VSCodeCheckbox, VSCodeLink } from "@vscode/webview-ui-toolkit/react"
import { useTranslation } from "react-i18next"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useExtensionState } from "@/context/ExtensionStateContext"
import Section from "../Section"
import { updateSetting } from "../utils/settingsHandlers"

interface PrivacySectionProps {
	renderSectionHeader: (tabId: string) => JSX.Element | null
}

const PrivacySection = ({ renderSectionHeader }: PrivacySectionProps) => {
	const { t } = useTranslation()
	const { telemetrySetting, remoteConfigSettings } = useExtensionState()
	const telemetryEnabled = telemetrySetting !== "disabled"

	return (
		<div>
			{renderSectionHeader("privacy")}
			<Section>
				<div
					className="flex items-start gap-3 p-3 rounded-md"
					style={{ background: "rgba(78,201,176,0.08)", border: "1px solid rgba(78,201,176,0.3)" }}>
					<i
						className="codicon codicon-shield mt-0.5 flex-shrink-0"
						style={{ color: "#4ec9b0", fontSize: 16 }}
					/>
					<div>
						<p className="m-0 text-sm font-semibold" style={{ color: "#4ec9b0" }}>
							{t("settings.privacyNoCollection")}
						</p>
						<p className="m-0 text-xs mt-1 text-description">
							{t("settings.privacyNoCollectionDesc")}
						</p>
					</div>
				</div>

				<div>
					<p className="text-sm font-semibold mb-2">{t("settings.telemetry")}</p>
					<Tooltip>
						<TooltipContent hidden={remoteConfigSettings?.telemetrySetting === undefined}>
							{t("settings.privacyManagedByOrg")}
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
									{t("settings.privacySendAnonymous")}
								</VSCodeCheckbox>
								{!!remoteConfigSettings?.telemetrySetting && (
									<i className="codicon codicon-lock text-description text-sm" />
								)}
							</div>
						</TooltipTrigger>
					</Tooltip>
					<p className="text-xs text-description mt-1">
						{t("settings.privacyAnonymousDesc")}
					</p>
				</div>

				<div>
					<p className="text-xs font-semibold mb-1 text-description uppercase tracking-wide">
						{t("settings.privacyCollected")}
					</p>
					<ul className="text-xs text-description m-0 pl-4 space-y-1">
						<li>{t("settings.privacyCollectedFeatures")}</li>
						<li>{t("settings.privacyCollectedErrors")}</li>
						<li>{t("settings.privacyCollectedVersion")}</li>
					</ul>
				</div>

				<div>
					<p className="text-xs font-semibold mb-1 text-description uppercase tracking-wide">
						{t("settings.privacyNeverCollected")}
					</p>
					<ul className="text-xs text-description m-0 pl-4 space-y-1">
						<li>{t("settings.privacyNeverKeys")}</li>
						<li>{t("settings.privacyNeverCode")}</li>
						<li>{t("settings.privacyNeverPrompts")}</li>
						<li>{t("settings.privacyNeverPII")}</li>
					</ul>
				</div>

				<p className="text-xs text-description">
					{t("settings.privacyMoreInfo")}{" "}
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
