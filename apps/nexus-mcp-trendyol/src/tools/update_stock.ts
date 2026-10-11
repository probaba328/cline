import type { TrendyolClient } from "../api/client.js"
import type { BatchRequestResult } from "../types/trendyol.js"

export const UPDATE_STOCK_TOOL = {
	name: "update_stock",
	description: "Ürün stoğunu güncelle. Barcode ve yeni stok miktarı gerekli.",
	inputSchema: {
		type: "object" as const,
		properties: {
			barcode: {
				type: "string",
				description: "Güncellenecek ürünün barkodu",
			},
			quantity: {
				type: "number",
				description: "Yeni stok miktarı (0 veya pozitif tam sayı)",
				minimum: 0,
			},
		},
		required: ["barcode", "quantity"],
	},
}

export async function updateStock(
	client: TrendyolClient,
	args: { barcode: string; quantity: number },
): Promise<string> {
	if (!args.barcode?.trim()) {
		throw new Error("Barcode boş olamaz")
	}
	if (typeof args.quantity !== "number" || args.quantity < 0 || !Number.isInteger(args.quantity)) {
		throw new Error("Stok miktarı 0 veya pozitif tam sayı olmalı")
	}

	const result = await client.post<BatchRequestResult>("/products/price-and-inventory-v2", {
		items: [{ barcode: args.barcode, quantity: args.quantity }],
	})

	return JSON.stringify(
		{
			success: true,
			batchRequestId: result.batchRequestId,
			message: `${args.barcode} barkodlu ürünün stoğu ${args.quantity} olarak güncellendi`,
		},
		null,
		2,
	)
}
