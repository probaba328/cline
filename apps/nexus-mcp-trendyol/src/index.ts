#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import {
	CallToolRequestSchema,
	ListToolsRequestSchema,
	type CallToolRequest,
} from "@modelcontextprotocol/sdk/types.js"

import { TrendyolClient } from "./api/client.js"
import { TrendyolApiError } from "./types/trendyol.js"

import { GET_PRODUCTS_TOOL, getProducts } from "./tools/get_products.js"
import { UPDATE_STOCK_TOOL, updateStock } from "./tools/update_stock.js"
import { UPDATE_PRICE_TOOL, updatePrice } from "./tools/update_price.js"
import { GET_ORDERS_TOOL, getOrders } from "./tools/get_orders.js"
import { UPDATE_ORDER_STATUS_TOOL, updateOrderStatus } from "./tools/update_order_status.js"
import { GET_QUESTIONS_TOOL, getQuestions } from "./tools/get_questions.js"
import { ANSWER_QUESTION_TOOL, answerQuestion } from "./tools/answer_question.js"
import { GET_CLAIMS_TOOL, getClaims } from "./tools/get_claims.js"
import { GET_SETTLEMENTS_TOOL, getSettlements } from "./tools/get_settlements.js"
import { assertLicense } from "./license/index.js"

// ── Lisans Doğrulama ──────────────────────────────────────────────────────────
await assertLicense("trendyol")

// ── Credentials ───────────────────────────────────────────────────────────────

const supplierId = process.env.TRENDYOL_SUPPLIER_ID
const apiKey = process.env.TRENDYOL_API_KEY
const apiSecret = process.env.TRENDYOL_API_SECRET

if (!supplierId || !apiKey || !apiSecret) {
	process.stderr.write(
		"[nexus-mcp-trendyol] Hata: TRENDYOL_SUPPLIER_ID, TRENDYOL_API_KEY ve TRENDYOL_API_SECRET env değişkenleri gerekli.\n",
	)
	process.exit(1)
}

const client = new TrendyolClient({
	supplierId,
	apiKey,
	apiSecret,
	baseUrl: process.env.TRENDYOL_BASE_URL,
})

// ── Tool registry ─────────────────────────────────────────────────────────────

const TOOLS = [
	GET_PRODUCTS_TOOL,
	UPDATE_STOCK_TOOL,
	UPDATE_PRICE_TOOL,
	GET_ORDERS_TOOL,
	UPDATE_ORDER_STATUS_TOOL,
	GET_QUESTIONS_TOOL,
	ANSWER_QUESTION_TOOL,
	GET_CLAIMS_TOOL,
	GET_SETTLEMENTS_TOOL,
]

type ToolArgs = Record<string, unknown>

const TOOL_HANDLERS: Record<string, (client: TrendyolClient, args: ToolArgs) => Promise<string>> = {
	get_products: (c, a) => getProducts(c, a as Parameters<typeof getProducts>[1]),
	update_stock: (c, a) => updateStock(c, a as Parameters<typeof updateStock>[1]),
	update_price: (c, a) => updatePrice(c, a as Parameters<typeof updatePrice>[1]),
	get_orders: (c, a) => getOrders(c, a as Parameters<typeof getOrders>[1]),
	update_order_status: (c, a) => updateOrderStatus(c, a as Parameters<typeof updateOrderStatus>[1]),
	get_questions: (c, a) => getQuestions(c, a as Parameters<typeof getQuestions>[1]),
	answer_question: (c, a) => answerQuestion(c, a as Parameters<typeof answerQuestion>[1]),
	get_claims: (c, a) => getClaims(c, a as Parameters<typeof getClaims>[1]),
	get_settlements: (c, a) => getSettlements(c, a as Parameters<typeof getSettlements>[1]),
}

// ── MCP Server ────────────────────────────────────────────────────────────────

const server = new Server(
	{
		name: "nexus-mcp-trendyol",
		version: "1.0.0",
	},
	{
		capabilities: { tools: {} },
	},
)

server.setRequestHandler(ListToolsRequestSchema, async () => ({
	tools: TOOLS,
}))

server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
	const { name, arguments: args = {} } = request.params

	const handler = TOOL_HANDLERS[name]
	if (!handler) {
		return {
			content: [{ type: "text" as const, text: `Bilinmeyen araç: ${name}` }],
			isError: true,
		}
	}

	try {
		const result = await handler(client, args as ToolArgs)
		return {
			content: [{ type: "text" as const, text: result }],
		}
	} catch (err) {
		const message = formatError(err)
		return {
			content: [{ type: "text" as const, text: message }],
			isError: true,
		}
	}
})

// ── Start ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
	const transport = new StdioServerTransport()
	await server.connect(transport)
	process.stderr.write("[nexus-mcp-trendyol] MCP server başlatıldı (stdio)\n")
}

main().catch((err) => {
	process.stderr.write(`[nexus-mcp-trendyol] Başlatma hatası: ${String(err)}\n`)
	process.exit(1)
})

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatError(err: unknown): string {
	if (err instanceof TrendyolApiError) {
		return err.message
	}
	if (err instanceof Error) {
		// Stack trace'i kullanıcıya gösterme
		return err.message
	}
	return "Beklenmedik bir hata oluştu."
}
