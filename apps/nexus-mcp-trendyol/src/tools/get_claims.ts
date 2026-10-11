import type { TrendyolClient } from "../api/client.js"
import type { ClaimListResponse } from "../types/trendyol.js"

export const GET_CLAIMS_TOOL = {
	name: "get_claims",
	description: "İade taleplerini listele. Tarih aralığı ile filtrele.",
	inputSchema: {
		type: "object" as const,
		properties: {
			startDate: {
				type: "string",
				description: "Başlangıç tarihi (ISO 8601: 2024-01-01)",
			},
			endDate: {
				type: "string",
				description: "Bitiş tarihi (ISO 8601: 2024-01-31)",
			},
			page: {
				type: "number",
				description: "Sayfa numarası (0'dan başlar)",
				default: 0,
			},
			size: {
				type: "number",
				description: "Sayfa başına kayıt sayısı (maks 100)",
				default: 50,
			},
		},
		required: [],
	},
}

export async function getClaims(
	client: TrendyolClient,
	args: { startDate?: string; endDate?: string; page?: number; size?: number },
): Promise<string> {
	const page = args.page ?? 0
	const size = Math.min(args.size ?? 50, 100)

	const params = new URLSearchParams({
		page: String(page),
		size: String(size),
	})

	if (args.startDate) params.set("startDate", String(toEpochMs(args.startDate)))
	if (args.endDate) params.set("endDate", String(toEpochMs(args.endDate)))

	const data = await client.get<ClaimListResponse>(`/claims?${params}`)

	return JSON.stringify(
		{
			totalElements: data.totalElements,
			claims: data.content.map((c) => ({
				id: c.id,
				orderNumber: c.orderNumber,
				claimType: c.claimType,
				status: c.status,
				createdDate: new Date(c.createdDate).toISOString(),
				items: c.lines.map((l) => ({
					barcode: l.barcode,
					productName: l.productName,
					quantity: l.quantity,
				})),
			})),
		},
		null,
		2,
	)
}

function toEpochMs(dateStr: string): number {
	const d = new Date(dateStr)
	if (isNaN(d.getTime())) {
		throw new Error(`Geçersiz tarih formatı: ${dateStr}. ISO 8601 kullan (örn: 2024-01-01)`)
	}
	return d.getTime()
}
