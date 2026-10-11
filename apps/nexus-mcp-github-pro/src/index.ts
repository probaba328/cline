#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js"

import { GitHubClient } from "./api/client.js"
import { GitHubApiError } from "./types/github.js"
import { assertLicense } from "./license/index.js"

import { GET_PULL_REQUESTS_TOOL, handleGetPullRequests } from "./tools/get_pull_requests.js"
import { REVIEW_PULL_REQUEST_TOOL, handleReviewPullRequest } from "./tools/review_pull_request.js"
import { GET_ISSUES_TOOL, handleGetIssues } from "./tools/get_issues.js"
import { CREATE_ISSUE_TOOL, handleCreateIssue } from "./tools/create_issue.js"
import { GET_WORKFLOW_RUNS_TOOL, handleGetWorkflowRuns } from "./tools/get_workflow_runs.js"
import { GET_FAILED_WORKFLOWS_TOOL, handleGetFailedWorkflows } from "./tools/get_failed_workflows.js"
import { GET_REPO_STATS_TOOL, handleGetRepoStats } from "./tools/get_repo_stats.js"
import { CREATE_BRANCH_TOOL, handleCreateBranch } from "./tools/create_branch.js"

// ── Lisans Doğrulama ──────────────────────────────────────────────────────────
await assertLicense("github-pro")

// ── Credentials Validation ─────────────────────────────────────────────────────

const token = process.env.GITHUB_TOKEN
const defaultOwner = process.env.GITHUB_DEFAULT_OWNER

if (!token) {
	console.error(
		"Hata: GITHUB_TOKEN ortam değişkeni zorunludur.\n" +
		"github.com → Settings → Developer Settings → Personal Access Tokens → Generate new token",
	)
	process.exit(1)
}

// ── Client ─────────────────────────────────────────────────────────────────────

const client = new GitHubClient(token, defaultOwner)

// ── Tools Registry ─────────────────────────────────────────────────────────────

const TOOLS = [
	GET_PULL_REQUESTS_TOOL,
	REVIEW_PULL_REQUEST_TOOL,
	GET_ISSUES_TOOL,
	CREATE_ISSUE_TOOL,
	GET_WORKFLOW_RUNS_TOOL,
	GET_FAILED_WORKFLOWS_TOOL,
	GET_REPO_STATS_TOOL,
	CREATE_BRANCH_TOOL,
]

type ToolArgs = Record<string, unknown>

const TOOL_HANDLERS: Record<string, (args: ToolArgs) => Promise<string>> = {
	get_pull_requests: (a) =>
		handleGetPullRequests(client, a as Parameters<typeof handleGetPullRequests>[1]),
	review_pull_request: (a) =>
		handleReviewPullRequest(client, a as Parameters<typeof handleReviewPullRequest>[1]),
	get_issues: (a) =>
		handleGetIssues(client, a as Parameters<typeof handleGetIssues>[1]),
	create_issue: (a) =>
		handleCreateIssue(client, a as Parameters<typeof handleCreateIssue>[1]),
	get_workflow_runs: (a) =>
		handleGetWorkflowRuns(client, a as Parameters<typeof handleGetWorkflowRuns>[1]),
	get_failed_workflows: (a) =>
		handleGetFailedWorkflows(client, a as Parameters<typeof handleGetFailedWorkflows>[1]),
	get_repo_stats: (a) =>
		handleGetRepoStats(client, a as Parameters<typeof handleGetRepoStats>[1]),
	create_branch: (a) =>
		handleCreateBranch(client, a as Parameters<typeof handleCreateBranch>[1]),
}

// ── Error Formatting ───────────────────────────────────────────────────────────

function formatError(err: unknown): string {
	if (err instanceof GitHubApiError) {
		// Stack trace ve token asla gösterilmez
		return `Hata (${err.code}): ${err.message}`
	}
	if (err instanceof Error) {
		return `Hata: ${err.message}`
	}
	return "Beklenmedik bir hata oluştu."
}

// ── MCP Server ─────────────────────────────────────────────────────────────────

const server = new Server(
	{ name: "nexus-mcp-github-pro", version: "1.0.0" },
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
