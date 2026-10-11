import type { GitHubClient } from "../api/client.js"
import type { WorkflowRun, WorkflowJob } from "../types/github.js"

export const GET_FAILED_WORKFLOWS_TOOL = {
	name: "get_failed_workflows",
	description: "Başarısız GitHub Actions CI/CD çalışmalarını ve hangi adımların hata verdiğini gösterir.",
	inputSchema: {
		type: "object" as const,
		properties: {
			repo: {
				type: "string",
				description: "Repo adı: 'owner/repo' formatında",
			},
			branch: {
				type: "string",
				description: "Branch adı filtresi (opsiyonel, varsayılan: tüm branch'ler)",
			},
			limit: {
				type: "number",
				description: "Kontrol edilecek başarısız run sayısı (varsayılan: 5, max: 20)",
			},
		},
		required: ["repo"],
	},
}

interface WorkflowRunsResponse {
	workflow_runs: WorkflowRun[]
}

interface JobsResponse {
	jobs: WorkflowJob[]
}

export async function handleGetFailedWorkflows(
	client: GitHubClient,
	args: { repo: string; branch?: string; limit?: number },
): Promise<string> {
	const { owner, repo } = client.parseRepo(args.repo)
	const limit = Math.min(args.limit ?? 5, 20)

	const params = new URLSearchParams({
		status: "failure",
		per_page: String(limit),
	})
	if (args.branch) params.append("branch", args.branch)

	const data = await client.get<WorkflowRunsResponse>(
		`/repos/${owner}/${repo}/actions/runs?${params.toString()}`,
	)
	const failedRuns = data.workflow_runs

	if (failedRuns.length === 0) {
		return `✅ ${owner}/${repo} — başarısız workflow çalışması yok.`
	}

	const lines = [`❌ ${owner}/${repo} — ${failedRuns.length} başarısız run`, ""]

	for (const run of failedRuns) {
		lines.push(
			`#${run.run_number} ${run.name} (${run.head_branch})`,
			`  Tarih: ${run.created_at.slice(0, 16).replace("T", " ")}`,
			`  🔗 ${run.html_url}`,
		)

		// Bu run'ın job'larını getir ve başarısız step'leri bul
		try {
			const jobsData = await client.get<JobsResponse>(
				`/repos/${owner}/${repo}/actions/runs/${run.id}/jobs`,
			)
			const failedJobs = jobsData.jobs.filter(
				(j) => j.conclusion === "failure" || j.conclusion === "timed_out",
			)

			if (failedJobs.length > 0) {
				for (const job of failedJobs) {
					lines.push(`  ❌ Job: ${job.name}`)
					const failedSteps = job.steps.filter(
						(s) => s.conclusion === "failure" || s.conclusion === "timed_out",
					)
					for (const step of failedSteps) {
						lines.push(`     └─ Step ${step.number}: ${step.name} → ${step.conclusion}`)
					}
				}
			}
		} catch {
			lines.push("  (Job detayları alınamadı)")
		}

		lines.push("")
	}

	return lines.join("\n").trimEnd()
}
