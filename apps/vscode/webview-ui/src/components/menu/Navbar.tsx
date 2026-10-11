import { IntentEvent } from "@shared/proto/nexus/ui"
import { HistoryIcon, PlusIcon, PuzzleIcon, SettingsIcon, UserCircleIcon } from "lucide-react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { TaskServiceClient, UiServiceClient } from "@/services/grpc-client"
import { useExtensionState } from "../../context/ExtensionStateContext"

export const Navbar = () => {
	const { t } = useTranslation()
	const { navigateToHistory, navigateToSettings, navigateToAccount, navigateToMarketplace, navigateToChat } =
		useExtensionState()

	const SETTINGS_TABS = useMemo(
		() => [
			{
				id: "chat",
				name: t("nav.chat"),
				tooltip: t("chat.newTask"),
				icon: PlusIcon,
				navigate: () => {
					UiServiceClient.trackIntent(
						IntentEvent.create({
							action: "new_task_clicked",
							source: "navbar",
						}),
					).catch((error) => console.error("Failed to track new task click:", error))
					// Close the current task, then navigate to the chat view
					TaskServiceClient.clearTask({})
						.catch((error) => {
							console.error("Failed to clear task:", error)
						})
						.finally(() => navigateToChat())
				},
			},
			{
				id: "customize",
				name: t("nav.customize"),
				tooltip: t("nav.customize"),
				icon: PuzzleIcon,
				navigate: navigateToMarketplace,
			},
			{
				id: "history",
				name: t("common.history"),
				tooltip: t("common.history"),
				icon: HistoryIcon,
				navigate: navigateToHistory,
			},
			{
				id: "account",
				name: t("nav.account"),
				tooltip: t("nav.account"),
				icon: UserCircleIcon,
				navigate: navigateToAccount,
			},
			{
				id: "settings",
				name: t("common.settings"),
				tooltip: t("common.settings"),
				icon: SettingsIcon,
				navigate: navigateToSettings,
			},
		],
		[t, navigateToAccount, navigateToChat, navigateToHistory, navigateToMarketplace, navigateToSettings],
	)

	return (
		<nav
			className="flex-none inline-flex justify-end bg-transparent gap-2 mb-1 z-10 border-none items-center mr-4!"
			id="nexus-navbar-container">
			{SETTINGS_TABS.map((tab) => (
				<Tooltip key={`navbar-tooltip-${tab.id}`}>
					<TooltipContent side="bottom">{tab.tooltip}</TooltipContent>
					<TooltipTrigger asChild>
						<Button
							aria-label={tab.tooltip}
							className="p-0 h-7"
							data-testid={`tab-${tab.id}`}
							key={`navbar-button-${tab.id}`}
							onClick={() => tab.navigate()}
							size="icon"
							variant="icon">
							<tab.icon className="stroke-1 [svg]:size-4" size={18} />
						</Button>
					</TooltipTrigger>
				</Tooltip>
			))}
		</nav>
	)
}
