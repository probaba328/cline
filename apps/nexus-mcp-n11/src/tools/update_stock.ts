import type { N11Client } from "../api/client.js"

export const UPDATE_STOCK_TOOL = {
	name: "update_stock",
	description: "N11 ürününün stok miktarını günceller.",
	inputSchema: {
		type: "object" as const,
		properties: {
			productId: {
				type: "string",
				description: "N11 ürün ID'si (get_products ile alınır)",
			},
			quantity: {
				type: "number",
				description: "Yeni stok miktarı (0 veya üzeri)",
			},
			sellerStockCode: {
				type: "string",
				description: "Satıcı stok kodu (productId yerine kullanılabilir)",
			},
		},
		required: ["quantity"],
	},
}

interface UpdateStockResponse {
	result: { status: string; errorCode?: string; errorMessage?: string }
}

export async function handleUpdateStock(
	client: N11Client,
	args: { productId?: string; quantity: number; sellerStockCode?: string },
): Promise<string> {
	if (!args.productId && !args.sellerStockCode) {
		return "Hata: productId veya sellerStockCode belirtilmeli."
	}

	if (args.quantity < 0) {
		return "Hata: Stok miktarı 0 veya daha büyük olmalıdır."
	}

	const stockItem: Record<string, unknown> = {
		quantity: args.quantity,
	}
	if (args.sellerStockCode) stockItem.sellerStockCode = args.sellerStockCode

	const body: Record<string, unknown> = {
		productId: args.productId,
		stockItems: { stockItem: [stockItem] },
	}

	await client.post<UpdateStockResponse>("/ProductService/UpdateProductStock", body)

	const identifier = args.sellerStockCode ?? args.productId
	return [
		`✅ Stok güncellendi`,
		`Ürün: ${identifier}`,
		`Yeni stok: ${args.quantity} adet`,
	].join("\n")
}
