import type { ExtensionMessage } from "@shared/ExtensionMessage"
import { isNexusInternalTester } from "@shared/internal/account"
import { ResetStateRequest } from "@shared/proto/nexus/state"
import type { UserOrganization } from "@shared/proto/index.nexus"
import {
	Bot,
	CheckCheck,
	EyeOff,
	FlaskConical,
	Globe,
	HardDriveDownload,
	Info,
	type LucideIcon,
	Lock,
	SquareTerminal,
	Wrench,
} from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useEvent } from "react-use"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { type NexusUser, useNexusAuth } from "@/context/NexusAuthContext"
import { useExtensionState } from "@/context/ExtensionStateContext"
import { cn } from "@/lib/utils"
import { StateServiceClient } from "@/services/grpc-client"
import { isAdminOrOwner } from "../account/helpers"
import { Tab, TabContent, TabList, TabTrigger } from "../common/Tab"
import ViewHeader from "../common/ViewHeader"
import SectionHeader from "./SectionHeader"
import AboutSection from "./sections/AboutSection"
import ApiConfigurationSection from "./sections/ApiConfigurationSection"
import DebugSection from "./sections/DebugSection"
import FeatureSettingsSection from "./sections/FeatureSettingsSection"
import GeneralSettingsSection from "./sections/GeneralSettingsSection"
import PrivacySection from "./sections/PrivacySection"
import SecuritySection from "./sections/SecuritySection"
import { RemoteConfigSection } from "./sections/RemoteConfigSection"
import TerminalSettingsSection from "./sections/TerminalSettingsSection"

const IS_DEV = process.env.IS_DEV

// Tab definitions
type SettingsTabID =
	| "general"
	| "ai-model"
	| "privacy"
	| "security"
	| "about"
	| "features"
	| "terminal"
	| "remote-config"
	| "debug"

interface SettingsTab {
	id: SettingsTabID
	name: string
	tooltipText: string
	headerText: string
	icon: LucideIcon
	dividerBefore?: boolean // render a thin divider above this tab
	hidden?: (params?: { user: NexusUser | null; activeOrganization: UserOrganization | null }) => boolean
}

function buildSettingsTabs(t: (key: string) => string): SettingsTab[] {
	return [
		{
			id: "general",
			name: t("settings.general"),
			tooltipText: t("settings.generalSettings"),
			headerText: t("settings.general"),
			icon: Globe,
		},
		{
			id: "ai-model",
			name: t("settings.aiModel"),
			tooltipText: t("settings.aiModelTooltip"),
			headerText: t("settings.aiModel"),
			icon: Bot,
		},
		{
			id: "privacy",
			name: t("settings.privacy"),
			tooltipText: t("settings.privacyTooltip"),
			headerText: t("settings.privacy"),
			icon: EyeOff,
		},
		{
			id: "security",
			name: t("settings.security"),
			tooltipText: t("settings.securityTooltip"),
			headerText: t("settings.security"),
			icon: Lock,
		},
		{
			id: "about",
			name: t("settings.about"),
			tooltipText: t("settings.aboutTooltip"),
			headerText: t("settings.about"),
			icon: Info,
		},
		{
			id: "features",
			name: t("settings.features"),
			tooltipText: t("settings.featuresTooltip"),
			headerText: t("settings.features"),
			icon: CheckCheck,
			dividerBefore: true,
		},
		{
			id: "terminal",
			name: t("settings.terminal"),
			tooltipText: t("settings.terminalTooltip"),
			headerText: t("settings.terminal"),
			icon: SquareTerminal,
		},
		{
			id: "remote-config",
			name: t("settings.remoteConfig"),
			tooltipText: t("settings.remoteConfigTooltip"),
			headerText: t("settings.remoteConfig"),
			icon: HardDriveDownload,
			hidden: ({ activeOrganization } = { user: null, activeOrganization: null }) =>
				!activeOrganization || !isAdminOrOwner(activeOrganization),
		},
		{
			id: "debug",
			name: t("settings.debug"),
			tooltipText: t("settings.debugTooltip"),
			headerText: t("settings.debug"),
			icon: FlaskConical,
			hidden: ({ user } = { user: null, activeOrganization: null }) =>
				!IS_DEV && !isNexusInternalTester(user?.email || ""),
		},
	]
}

type SettingsViewProps = {
	onDone: () => void
	targetSection?: string
}

const buildRenderSectionHeader = (tabs: SettingsTab[]) => (tabId: string) => {
	const tab = tabs.find((t) => t.id === tabId)
	if (!tab) {
		return null
	}

	return (
		<SectionHeader>
			<div className="flex items-center gap-2">
				<tab.icon className="w-4" />
				<div>{tab.headerText}</div>
			</div>
		</SectionHeader>
	)
}

const SettingsView = ({ onDone, targetSection }: SettingsViewProps) => {
	const { t } = useTranslation()
	const settingsTabs = useMemo(() => buildSettingsTabs(t), [t])

	// Memoize to avoid recreation
	const TAB_CONTENT_MAP: Record<SettingsTabID, React.FC<any>> = useMemo(
		() => ({
			general: GeneralSettingsSection,
			"ai-model": ApiConfigurationSection,
			privacy: PrivacySection,
			security: SecuritySection,
			about: AboutSection,
			features: FeatureSettingsSection,
			terminal: TerminalSettingsSection,
			"remote-config": RemoteConfigSection,
			debug: DebugSection,
		}),
		[],
	) // Empty deps - these imports never change

	const { version, extensionVariant, environment, settingsInitialModelTab } = useExtensionState()
	const { activeOrganization, nexusUser } = useNexusAuth()

	const renderSectionHeader = useMemo(() => buildRenderSectionHeader(settingsTabs), [settingsTabs])

	const [activeTab, setActiveTab] = useState<string>(targetSection || settingsTabs[0].id)

	// Optimized message handler with early returns
	const handleMessage = useCallback((event: MessageEvent) => {
		const message: ExtensionMessage = event.data
		if (message.type !== "grpc_response") {
			return
		}

		const grpcMessage = message.grpc_response?.message
		if (grpcMessage?.key !== "scrollToSettings") {
			return
		}

		const tabId = grpcMessage.value
		if (!tabId) {
			return
		}

		// Check if valid tab ID
		if (settingsTabs.some((tab) => tab.id === tabId)) {
			setActiveTab(tabId)
			return
		}

		// Fallback to element scrolling
		requestAnimationFrame(() => {
			const element = document.getElementById(tabId)
			if (!element) {
				return
			}

			element.scrollIntoView({ behavior: "smooth" })
			element.style.transition = "background-color 0.5s ease"
			element.style.backgroundColor = "var(--vscode-textPreformat-background)"

			setTimeout(() => {
				element.style.backgroundColor = "transparent"
			}, 1200)
		})
	}, [settingsTabs])

	useEvent("message", handleMessage)

	// Memoized reset state handler
	const handleResetState = useCallback(async (resetGlobalState?: boolean) => {
		try {
			await StateServiceClient.resetState(ResetStateRequest.create({ global: resetGlobalState }))
		} catch (error) {
			console.error("Failed to reset state:", error)
		}
	}, [])

	// Update active tab when targetSection changes
	useEffect(() => {
		if (targetSection) {
			setActiveTab(targetSection)
		}
	}, [targetSection])

	// Memoized tab item renderer
	const renderTabItem = useCallback(
		(tab: SettingsTab) => {
			return (
				<>
					{tab.dividerBefore && (
						<div
							key={`divider-${tab.id}`}
							className="mx-3 my-1"
							style={{ height: 1, background: "var(--vscode-panel-border)" }}
						/>
					)}
					<TabTrigger className="flex justify-baseline" data-testid={`tab-${tab.id}`} key={tab.id} value={tab.id}>
						<Tooltip key={tab.id}>
							<TooltipTrigger>
								<div
									className={cn(
										"whitespace-nowrap overflow-hidden h-12 sm:py-3 box-border flex items-center border-l-2 border-transparent text-foreground opacity-70 bg-transparent hover:bg-list-hover p-4 cursor-pointer gap-2",
										{
											"opacity-100 border-l-2 border-l-foreground border-t-0 border-r-0 border-b-0 bg-selection":
												activeTab === tab.id,
										},
									)}>
									<tab.icon className="w-4 h-4" />
									<span className="hidden sm:block">{tab.name}</span>
								</div>
							</TooltipTrigger>
							<TooltipContent side="right">{tab.tooltipText}</TooltipContent>
						</Tooltip>
					</TabTrigger>
				</>
			)
		},
		[activeTab],
	)

	// Memoized active content component
	const ActiveContent = useMemo(() => {
		const Component = TAB_CONTENT_MAP[activeTab as keyof typeof TAB_CONTENT_MAP]
		if (!Component) {
			return null
		}

		// Special props for specific components
		const props: any = { renderSectionHeader }
		if (activeTab === "debug") {
			props.onResetState = handleResetState
		} else if (activeTab === "about") {
			props.version = version
			props.extensionVariant = extensionVariant
		} else if (activeTab === "ai-model") {
			props.initialModelTab = settingsInitialModelTab
		}

		return <Component {...props} />
	}, [activeTab, handleResetState, settingsInitialModelTab, version, extensionVariant, TAB_CONTENT_MAP])

	return (
		<Tab>
			<ViewHeader environment={environment} onDone={onDone} title={t("settings.title")} />

			<div className="flex flex-1 overflow-hidden">
				<TabList
					className="shrink-0 flex flex-col overflow-y-auto border-r border-sidebar-background"
					onValueChange={setActiveTab}
					value={activeTab}>
					{settingsTabs.filter((tab) => !tab.hidden?.({ user: nexusUser, activeOrganization })).map(renderTabItem)}
				</TabList>

				<TabContent className="flex-1 overflow-auto">{ActiveContent}</TabContent>
			</div>
		</Tab>
	)
}

export default SettingsView
