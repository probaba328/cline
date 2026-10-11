import { HeroUIProvider } from "@heroui/react"
import { type ReactNode } from "react"
import { I18nextProvider } from "react-i18next"
import { CustomPostHogProvider } from "./CustomPostHogProvider"
import { NexusAuthProvider } from "./context/NexusAuthContext"
import { ExtensionStateContextProvider } from "./context/ExtensionStateContext"
import { PlatformProvider } from "./context/PlatformContext"
import i18n from "./i18n"

export function Providers({ children }: { children: ReactNode }) {
	return (
		<I18nextProvider i18n={i18n}>
			<PlatformProvider>
				<ExtensionStateContextProvider>
					<CustomPostHogProvider>
						<NexusAuthProvider>
							<HeroUIProvider>{children}</HeroUIProvider>
						</NexusAuthProvider>
					</CustomPostHogProvider>
				</ExtensionStateContextProvider>
			</PlatformProvider>
		</I18nextProvider>
	)
}
