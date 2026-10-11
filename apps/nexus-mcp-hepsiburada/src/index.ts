#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js"

import { HepsiburadaClient } from "./api/client.js"
import { HepsiburadaApiError } from "./types/hepsiburada.js"
import { assertLicense } from "./license/index.js"

import { GET_LISTINGS_TOOL, handleGetListings } from "./tools/get_listings.js"
import { UPDATE_INVENTORY_TOOL, handleUpdateInventory } from "./tools/update_inventory.js"
import { GET_ORDERS_TOOL, handleGetOrders } from "./tools/get_orders.js"
import { UPDATE_TRACKING_TOOL, handleUpdateTracking } from "./tools/update_tracking.js"
import { GET_CANCELLATIONS_TOOL, handleGetCancellations } from "./tools/get_cancellations.js"
import { APPROVE_CANCELLATION_TOOL, handleApproveCancellation } from "./tools/approve_cancellation.js"
import { GET_SETTLEMENTS_TOOL, handleGetSettlements } from "./tools/get_settlements.js"

// ── Lisans Doğrulama ──────────────────────────────────────────────────────────
await assertLicense("hepsiburada")

// ── Credentials Validation ─────────────────────────────────────────────────────

const username = process.env.HB_USERNAME
const password = process.env.HB_PASSWORD
const merchantId = process.env.HB_MERCHANT_ID
const baseUrl = process.env.HB_BASE_URL

if (!username || !password || !merchantId) {
	console.error(
		"Hata: HB_USERNAME, HB_PASSWORD ve HB_MERCHANT_ID ortam değişkenleri zorunludur.\n" +
		"HMS Paneli → Entegrasyon → API Yönetimi sayfasından alabilirsiniz.",
	)
	process.exit(1)
}

// ── Client ─────────────────────────────────────────────────────────────────────

const client = new HepsiburadaClient({ username, password, merchantId, baseUrl })

// ── Tools Registry ─────────────────────────────────────────────────────────────

const TOOLS = [
	GET_LISTINGS_TOOL,
	UPDATE_INVENTORY_TOOL,
	GET_ORDERS_TOOL,
	UPDATE_TRACKING_TOOL,
	GET_CANCELLATIONS_TOOL,
	APPROVE_CANCELLATION_TOOL,
	GET_SETTLEMENTS_TOOL,
]

type ToolArgs = Record<string, unknown>

const TOOL_HANDLERS: Record<string, (args: ToolArgs) => Promise<string>> = {
	get_listings: (a) =>
		handleGetListings(client, a as Parameters<typeof handleGetListings>[1]),
	update_inventory: (a) =>
		handleUpdateInventory(client, a as Parameters<typeof handleUpdateInventory>[1]),
	get_orders: (a) =>
		handleGetOrders(client, a as Parameters<typeof handleGetOrders>[1]),
	update_tracking: (a) =>
		handleUpdateTracking(client, a as Parameters<typeof handleUpdateTracking>[1]),
	get_cancellations: (a) =>
		handleGetCancellations(client, a as Parameters<typeof handleGetCancellations>[1]),
	approve_cancellation: (a) =>
		handleApproveCancellation(client, a as Parameters<typeof handleApproveCancellation>[1]),
	get_settlements: (a) =>
		handleGetSettlements(client, a as Parameters<typeof handleGetSettlements>[1]),
}

// ── Error Formatting ───────────────────────────────────────────────────────────

function formatError(err: unknown): string {
	if (err instanceof HepsiburadaApiError) {
		// Stack trace ve credentials asla gösterilmez
		return `Hata (${err.code}): ${err.message}`
	}
	if (err instanceof Error) {
		return `Hata: ${err.message}`
	}
	return "Beklenmedik bir hata oluştu."
}

// ── MCP Server ─────────────────────────────────────────────────────────────────

const server = new Server(
	{ name: "nexus-mcp-hepsiburada", version: "1.0.0" },
	{ capabilities: { tools: {} } },
)

server.setRequestHandler(ListToolsRequestSchema, async () => ({
	tools: TOOLS,
}))

server.setRequestHandler(CallToolRequestSchema, async (req) => {
	const name = req.params.name
	const args = (req.params.arguments ?? {}) as ToolArgs

	const handler = TOOL_HANDLERS[name]
	if (!handler) {
		return {
			content: [{ type: "text" as const, text: `Bilinmeyen araç: ${name}` }],
			isError: true,
		}
	}

	try {
		const result = await handler(args)
		return { content: [{ type: "text" as const, text: result }] }
	} catch (err) {
		return {
			content: [{ type: "text" as const, text: formatError(err) }],
			isError: true,
		}
	}
})

// ── Start ──────────────────────────────────────────────────────────────────────

const transport = new StdioServerTransport()
await server.connect(transport)
