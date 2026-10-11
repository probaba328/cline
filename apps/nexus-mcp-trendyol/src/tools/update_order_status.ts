import type { TrendyolClient } from "../api/client.js"

export const UPDATE_ORDER_STATUS_TOOL = {
	name: "update_order_status",
	description: "Sipariş durumunu güncelle. Kargo takip numarası ve kargo şirketi gerekebilir.",
	inputSchema: {
		type: "object" as const,
		properties: {
			shipmentPackageId: {
				type: "number",
				description: "Güncellenecek sipariş paketi ID'si",
			},
			status: {
				type: "string",
				enum: ["Picking", "Invoiced", "Shipped", "Cancelled"],
				description: "Yeni sipariş durumu",
			},
			trackingNumber: {
				type: "string",
				description: "Kargo takip numarası (Shipped durumu için gerekli)",
			},
			cargoProviderName: {
				type: "string",
				description: "Kargo şirketi adı (Shipped durumu için)",
			},
		},
		required: ["shipmentPackageId", "status"],
	},
}

export async function updateOrderStatus(
	client: TrendyolClient,
	args: {
		shipmentPackageId: number
		status: string
		trackingNumber?: string
		cargoProviderName?: string
	},
): Promise<string> {
	if (!args.shipmentPackageId) {
		throw new Error("shipmentPackageId gerekli")
	}

	const allowedStatuses = ["Picking", "Invoiced", "Shipped", "Cancelled"]
	if (!allowedStatuses.includes(args.status)) {
		throw new Error(`Geçersiz durum. İzin verilenler: ${allowedStatuses.join(", ")}`)
	}

	if (args.status === "Shipped" && !args.trackingNumber) {
		throw new Error("Kargoya verilmiş durumu için trackingNumber gerekli")
	}

	const body: Record<string, unknown> = {
		lines: [{ shipmentPackageId: args.shipmentPackageId, status: args.status }],
	}

	if (args.trackingNumber) {
		body["trackingNumber"] = args.trackingNumber
	}
	if (args.cargoProviderName) {
		body["cargoProviderName"] = args.cargoProviderName
	}

	await client.put<unknown>(`/shipment-packages/${args.shipmentPackageId}`, body)

	return JSON.stringify(
		{
			success: true,
			message: `${args.shipmentPackageId} ID'li sipariş durumu "${args.status}" olarak güncellendi`,
		},
		null,
		2,
	)
}
