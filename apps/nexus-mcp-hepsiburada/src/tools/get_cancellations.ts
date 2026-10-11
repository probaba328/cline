import type { HepsiburadaClient } from "../api/client.js"
import type { CancellationListResponse } from "../types/hepsiburada.js"

export const GET_CANCELLATIONS_TOOL = {
	name: "get_cancellations",
	description: "Hepsiburada iptal ve iade taleplerini listeler.",
	inputSchema: {
		type: "object" as const,
		properties: {
			claimType: {
				type: "string",
				description: "Talep türü: Cancel (iptal) | Return (iade)",
				enum: ["Cancel", "Return"],
			},
			status: {
				type: "string",
				description: "Talep durumu filtresi (ör. WaitingForAction, Approved, Rejected)",
			},
			offset: {
				type: "number",
				description: "Sayfalama başlangıç noktası (varsayılan: 0)",
			},
			limit: {
				type: "number",
				description: "Sayfa başına sonuç sayısı (varsayılan: 20, max: 50)",
			},
		},
		required: [],
	},
}

export async function handleGetCancellations(
	client: HepsiburadaClient,
	args: {
		claimType?: "Cancel" | "Return"
		status?: string
		offset?: number
		limit?: number
	},
): Promise<string> {
	const offset = args.offset ?? 0
	const limit = Math.min(args.limit ?? 20, 50)

	const params = new URLSearchParams({
		merchantId: client.mid,
		offset: String(offset),
		limit: String(limit),
	})
	if (args.claimType) params.append("claimType", args.claimType)
	if (args.status) params.append("status", args.status)

	const data = await client.get<CancellationListResponse>(`/claim/api/claims?${params.toString()}`)

	const lines = [
		`Toplam: ${data.totalCount} talep | offset=${offset}, limit=${limit}`,
		"",
	]

	for (const claim of data.data) {
		const typeLabel = claim.claimType === "Cancel" ? "❌ İptal" : "↩️ İade"
		lines.push(
			`${typeLabel} | ID: ${claim.id}`,
			`  Sipariş: ${claim.orderNumber} | Paket: ${claim.packageNumber}`,
			`  Durum: ${claim.status} | Tarih: ${claim.requestDate}`,
			`  Neden: ${claim.reason}`,
			`  Ürünler:`,
		)
		for (const line of claim.lines) {
			lines.push(`    • ${line.productName} (SKU: ${line.sku}) x${line.quantity}`)
		}
		lines.push("")
	}

	return lines.join("\n").trimEnd()
}
