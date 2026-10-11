import type { HepsiburadaClient } from "../api/client.js"
import type { InventoryUpdateItem, InventoryUpdateResponse } from "../types/hepsiburada.js"

export const UPDATE_INVENTORY_TOOL = {
	name: "update_inventory",
	description: "Hepsiburada ürünlerinin stok miktarını ve fiyatını toplu günceller.",
	inputSchema: {
		type: "object" as const,
		properties: {
			items: {
				type: "array",
				description: "Güncellenecek ürün listesi",
				items: {
					type: "object",
					properties: {
						merchantSku: {
							type: "string",
							description: "Satıcı SKU'su",
						},
						quantity: {
							type: "number",
							description: "Yeni stok miktarı (0 veya üzeri)",
						},
						price: {
							type: "number",
							description: "Yeni satış fiyatı (TL)",
						},
					},
					required: ["merchantSku", "quantity", "price"],
				},
			},
		},
		required: ["items"],
	},
}

export async function handleUpdateInventory(
	client: HepsiburadaClient,
	args: { items: InventoryUpdateItem[] },
): Promise<string> {
	if (!args.items || args.items.length === 0) {
		return "Hata: En az bir ürün belirtilmeli."
	}

	const payload = {
		merchantId: client.mid,
		stockAndPriceUpdateRequestList: args.items.map((item) => ({
			merchantSku: item.merchantSku,
			quantity: item.quantity,
			price: item.price,
		})),
	}

	const data = await client.post<InventoryUpdateResponse>(
		`/product/api/products/stocks-and-prices`,
		payload,
	)

	const lines = [
		`Stok/Fiyat Güncellendi: ${args.items.length} ürün`,
		`Mesaj: ${data.message}`,
	]
	if (data.trackingId) {
		lines.push(`Takip ID: ${data.trackingId}`)
	}

	return lines.join("\n")
}
