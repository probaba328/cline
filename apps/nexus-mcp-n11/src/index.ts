#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js"

import { N11Client } from "./api/client.js"
import { N11ApiError } from "./types/n11.js"
import { assertLicense } from "./license/index.js"

import { GET_PRODUCTS_TOOL, handleGetProducts } from "./tools/get_products.js"
import { UPDATE_STOCK_TOOL, handleUpdateStock } from "./tools/update_stock.js"
import { UPDATE_PRICE_TOOL, handleUpdatePrice } from "./tools/update_price.js"
import { GET_ORDERS_TOOL, handleGetOrders } from "./tools/get_orders.js"
import { UPDATE_ORDER_STATUS_TOOL, handleUpdateOrderStatus } from "./tools/update_order_status.js"
import { GET_QUESTIONS_TOOL, handleGetQuestions } from "./tools/get_questions.js"
import { ANSWER_QUESTION_TOOL, handleAnswerQuestion } from "./tools/answer_question.js"

// ── Lisans Doğrulama ──────────────────────────────────────────────────────────
await assertLicense("n11")

// ── Credentials Validation ─────────────────────────────────────────────────────

const apiKey = process.env.N11_API_KEY
const apiSecret = process.env.N11_API_SECRET

if (!apiKey || !apiSecret) {
	console.error(
		"Hata: N11_API_KEY ve N11_API_SECRET ortam değişkenleri zorunludur.\n" +
		"n11.com → Mağazam → API Bilgileri sayfasından alabilirsiniz.",
	)
	process.exit(1)
}

// ── Client ─────────────────────────────────────────────────────────────────────

const client = new N11Client({
	apiKey,
	apiSecret,
	baseUrl: process.env.N11_BASE_URL,
})

// ── Tools Registry ─────────────────────────────────────────────────────────────

const TOOLS = [
	GET_PRODUCTS_TOOL,
	UPDATE_STOCK_TOOL,
	UPDATE_PRICE_TOOL,
	GET_ORDERS_TOOL,
	UPDATE_ORDER_STATUS_TOOL,
	GET_QUESTIONS_TOOL,
	ANSWER_QUESTION_TOOL,
]

type ToolArgs = Record<string, unknown>

const TOOL_HANDLERS: Record<string, (args: ToolArgs) => Promise<string>> = {
	get_products: (a) =>
		handleGetProducts(client, a as Parameters<typeof handleGetProducts>[1]),
	update_stock: (a) =>
		handleUpdateStock(client, a as Parameters<typeof handleUpdateStock>[1]),
	update_price: (a) =>
		handleUpdatePrice(client, a as Parameters<typeof handleUpdatePrice>[1]),
	get_orders: (a) =>
		handleGetOrders(client, a as Parameters<typeof handleGetOrders>[1]),
	update_order_status: (a) =>
		handleUpdateOrderStatus(client, a as Parameters<typeof handleUpdateOrderStatus>[1]),
	get_questions: (a) =>
		handleGetQuestions(client, a as Parameters<typeof handleGetQuestions>[1]),
	answer_question: (a) =>
		handleAnswerQuestion(client, a as Parameters<typeof handleAnswerQuestion>[1]),
}

// ── Error Formatting ───────────────────────────────────────────────────────────

function formatError(err: unknown): string {
	if (err instanceof N11ApiError) {
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
	{ name: "nexus-mcp-n11", version: "1.0.0" },
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
