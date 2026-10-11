import { Mode } from "@shared/storage/types"
import { NexusAccountInfoCard } from "../NexusAccountInfoCard"
import NexusModelPicker from "../NexusModelPicker"

/**
 * Props for the NexusProvider component
 */
interface NexusProviderProps {
	showModelOptions: boolean
	isPopup?: boolean
	currentMode: Mode
	initialModelTab?: "recommended" | "free"
}

/**
 * The Nexus provider configuration component
 */
export const NexusProvider = ({ showModelOptions, isPopup, currentMode, initialModelTab }: NexusProviderProps) => {
	return (
		<div>
			{/* Nexus Account Info Card */}
			<div style={{ marginBottom: 14, marginTop: 4 }}>
				<NexusAccountInfoCard />
			</div>

			{showModelOptions && (
				<NexusModelPicker
					currentMode={currentMode}
					initialTab={initialModelTab}
					isPopup={isPopup}
					showProviderRouting={true}
				/>
			)}
		</div>
	)
}
