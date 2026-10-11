import type { N11Client } from "../api/client.js"

export const UPDATE_ORDER_STATUS_TOOL = {
	name: "update_order_status",
	description: "N11 sipariş durumunu günceller. Kargo takip numarası da eklenebilir.",
	inputSchema: {
		type: "object" as const,
		properties: {
			orderId: {
				type: "string",
				description: "Güncellenecek sipariş ID'si",
			},
			status: {
				type: "string",
				description: "Yeni durum: Approved | ReadyToShip | Completed | Cancelled | Rejected",
				enum: ["Approved", "ReadyToShip", "Completed", "Cancelled", "Rejected"],
			},
			trackingNumber: {
				type: "string",
				description: "Kargo takip numarası (ReadyToShip durumunda zorunlu)",
			},
			cargoCompany: {
				type: "string",
				description: "Kargo firması (ör. Yurtiçi, Aras, MNG, PTT)",
			},
			rejectionReason: {
				type: "string",
				description: "Reddetme nedeni (Rejected veya Cancelled durumunda)",
			},
		},
		required: ["orderId", "status"],
	},
}

interface UpdateStatusResponse {
	result: { status: string; errorCode?: string; errorMessage?: string }
}

export async function handleUpdateOrderStatus(
	client: N11Client,
	args: {
		orderId: string
		status: string
		trackingNumber?: string
		cargoCompany?: string
		rejectionReason?: string
	},
): Promise<string> {
	if (args.status === "ReadyToShip" && !args.trackingNumber) {
		return "Hata: ReadyToShip durumu için trackingNumber zorunludur."
	}

	const body: Record<string, unknown> = {
		orderId: args.orderId,
		status: args.status,
	}

	if (args.trackingNumber) body.trackingNumber = args.trackingNumber
	if (args.cargoCompany) body.cargoCompany = args.cargoCompany
	if (args.rejectionReason) body.rejectionReason = args.rejectionReason

	await client.post<UpdateStatusResponse>("/OrderService/UpdateOrderStatus", body)

	const lines = [
		`✅ Sipariş durumu güncellendi`,
		`Sipariş ID: ${args.orderId}`,
		`Yeni durum: ${args.status}`,
	]
	if (args.trackingNumber) lines.push(`Takip: ${args.trackingNumber} (${args.cargoCompany ?? "belirtilmedi"})`)
	if (args.rejectionReason) lines.push(`Neden: ${args.rejectionReason}`)

	return lines.join("\n")
}
