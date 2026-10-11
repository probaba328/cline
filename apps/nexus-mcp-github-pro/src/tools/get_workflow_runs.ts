import type { GitHubClient } from "../api/client.js"
import type { WorkflowRun } from "../types/github.js"

export const GET_WORKFLOW_RUNS_TOOL = {
	name: "get_workflow_runs",
	description: "GitHub Actions CI/CD çalışmalarını listeler. Workflow ID veya isim filtresi destekler.",
	inputSchema: {
		type: "object" as const,
		properties: {
			repo: {
				type: "string",
				description: "Repo adı: 'owner/repo' formatında",
			},
			workflow_id: {
				type: "string",
				description: "Workflow dosya adı veya ID (opsiyonel, ör. 'ci.yml' veya '12345')",
			},
			branch: {
				type: "string",
				description: "Branch adı filtresi (opsiyonel)",
			},
			status: {
				type: "string",
				description: "Durum filtresi: completed | in_progress | queued | waiting",
				enum: ["completed", "in_progress", "queued", "waiting"],
			},
			limit: {
				type: "number",
				description: "Maksimum sonuç sayısı (varsayılan: 10, max: 50)",
			},
		},
		required: ["repo"],
	},
}

interface WorkflowRunsResponse {
	total_count: number
	workflow_runs: WorkflowRun[]
}

const CONCLUSION_ICON: Record<string, string> = {
	success: "✅",
	failure: "❌",
	cancelled: "⛔",
	skipped: "⏭️",
	timed_out: "⏰",
	action_required: "⚠️",
	neutral: "➖",
}

export async function handleGetWorkflowRuns(
	client: GitHubClient,
	args: { repo: string; workflow_id?: string; branch?: string; status?: string; limit?: number },
): Promise<string> {
	const { owner, repo } = client.parseRepo(args.repo)
	const limit = Math.min(args.limit ?? 10, 50)

	const params = new URLSearchParams({ per_page: String(limit) })
	if (args.branch) params.append("branch", args.branch)
	if (args.status) params.append("status", args.status)

	const basePath = args.workflow_id
		? `/repos/${owner}/${repo}/actions/workflows/${encodeURIComponent(args.workflow_id)}/runs`
		: `/repos/${owner}/${repo}/actions/runs`

	const data = await client.get<WorkflowRunsResponse>(`${basePath}?${params.toString()}`)
	const runs = data.workflow_runs

	if (runs.length === 0) {
		return `${owner}/${repo} için workflow çalışması bulunamadı.`
	}

	const lines = [
		`${owner}/${repo} — ${runs.length} workflow run (toplam: ${data.total_count})`,
		"",
	]

	for (const run of runs) {
		const icon = run.conclusion ? (CONCLUSION_ICON[run.conclusion] ?? "❓") : "🔄"
		const duration = run.conclusion
			? ""
			: ` | çalışıyor`
		lines.push(
			`${icon} #${run.run_number} ${run.name}`,
			`  Branch: ${run.head_branch} | Event: ${run.event}${duration}`,
			`  Durum: ${run.status}${run.conclusion ? ` → ${run.conclusion}` : ""}`,
			`  Tarih: ${run.created_at.slice(0, 16).replace("T", " ")}`,
			`  🔗 ${run.html_url}`,
			"",
		)
	}

	return lines.join("\n").trimEnd()
}
