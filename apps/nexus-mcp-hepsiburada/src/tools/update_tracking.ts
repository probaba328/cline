import type { HepsiburadaClient } from "../api/client.js"
import type { TrackingUpdateResponse } from "../types/hepsiburada.js"

export const UPDATE_TRACKING_TOOL = {
	name: "update_tracking",
	description: "Hepsiburada paketine kargo takip numarası ekler veya günceller.",
	inputSchema: {
		type: "object" as const,
		properties: {
			packageNumber: {
				type: "string",
				description: "Güncellenmek istenen paket numarası",
			},
			trackingNumber: {
				type: "string",
				description: "Kargo takip numarası",
			},
			cargoCompany: {
				type: "string",
				description: "Kargo firması adı (ör. Yurtiçi, Aras, MNG, PTT)",
			},
		},
		required: ["packageNumber", "trackingNumber", "cargoCompany"],
	},
}

export async function handleUpdateTracking(
	client: HepsiburadaClient,
	args: {
		packageNumber: string
		trackingNumber: string
		cargoCompany: string
	},
): Promise<string> {
	const payload = {
		trackingNumber: args.trackingNumber,
		cargoCompanyName: args.cargoCompany,
	}

	const data = await client.post<TrackingUpdateResponse>(
		`/order/api/packages/${encodeURIComponent(args.packageNumber)}/tracking-number`,
		payload,
	)

	if (data.success) {
		return `✅ Takip numarası güncellendi\nPaket: ${args.packageNumber}\nTakip: ${args.trackingNumber} (${args.cargoCompany})`
	}

	return `❌ Güncelleme başarısız: ${data.message}`
}
