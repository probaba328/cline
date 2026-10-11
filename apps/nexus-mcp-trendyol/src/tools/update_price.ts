import type { TrendyolClient } from "../api/client.js"
import type { BatchRequestResult } from "../types/trendyol.js"

export const UPDATE_PRICE_TOOL = {
	name: "update_price",
	description: "Ürün fiyatını güncelle. salePrice (satış fiyatı) ve listPrice (liste fiyatı) gerekli.",
	inputSchema: {
		type: "object" as const,
		properties: {
			barcode: {
				type: "string",
				description: "Güncellenecek ürünün barkodu",
			},
			salePrice: {
				type: "number",
				description: "Yeni satış fiyatı (TL, KDV dahil)",
				exclusiveMinimum: 0,
			},
			listPrice: {
				type: "number",
				description: "Yeni liste fiyatı (salePrice'dan büyük veya eşit olmalı)",
				exclusiveMinimum: 0,
			},
		},
		required: ["barcode", "salePrice", "listPrice"],
	},
}

export async function updatePrice(
	client: TrendyolClient,
	args: { barcode: string; salePrice: number; listPrice: number },
): Promise<string> {
	if (!args.barcode?.trim()) {
		throw new Error("Barcode boş olamaz")
	}
	if (args.salePrice <= 0 || args.listPrice <= 0) {
		throw new Error("Fiyatlar 0'dan büyük olmalı")
	}
	if (args.listPrice < args.salePrice) {
		throw new Error("Liste fiyatı satış fiyatından küçük olamaz")
	}

	const result = await client.post<BatchRequestResult>("/products/price-and-inventory-v2", {
		items: [
			{
				barcode: args.barcode,
				salePrice: args.salePrice,
				listPrice: args.listPrice,
			},
		],
	})

	return JSON.stringify(
		{
			success: true,
			batchRequestId: result.batchRequestId,
			message: `${args.barcode} barkodlu ürünün fiyatı güncellendi: ${args.salePrice} TL (liste: ${args.listPrice} TL)`,
		},
		null,
		2,
	)
}
