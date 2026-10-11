import { cn } from "@/lib/utils"
import type { WizardStep } from "@shared/byok/types"

interface StepIndicatorProps {
	currentStep: WizardStep
	totalSteps: number
	labels: string[]
}

export function StepIndicator({ currentStep, totalSteps, labels }: StepIndicatorProps) {
	return (
		<div className="flex items-center gap-0 w-full mb-6">
			{Array.from({ length: totalSteps }, (_, i) => {
				const step = (i + 1) as WizardStep
				const isCompleted = step < currentStep
				const isActive = step === currentStep
				return (
					<div key={step} className="flex items-center flex-1">
						<div className="flex flex-col items-center">
							<div
								className={cn(
									"w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-colors",
									isCompleted
										? "bg-(--vscode-button-background) border-(--vscode-button-background) text-(--vscode-button-foreground)"
										: isActive
											? "bg-transparent border-(--vscode-focusBorder) text-(--vscode-focusBorder)"
											: "bg-transparent border-(--vscode-panel-border) text-description",
								)}>
								{isCompleted ? <i className="codicon codicon-check text-xs" /> : step}
							</div>
							<span
								className={cn(
									"text-xs mt-1 whitespace-nowrap",
									isActive ? "text-(--vscode-foreground) font-medium" : "text-description",
								)}>
								{labels[i]}
							</span>
						</div>
						{step < totalSteps && (
							<div
								className={cn(
									"h-0.5 flex-1 mx-1 transition-colors",
									step < currentStep
										? "bg-(--vscode-button-background)"
										: "bg-(--vscode-panel-border)",
								)}
							/>
						)}
					</div>
				)
			})}
		</div>
	)
}
