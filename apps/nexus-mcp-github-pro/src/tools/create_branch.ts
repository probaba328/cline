import type { GitHubClient } from "../api/client.js"
import type { BranchRef, CreatedBranch } from "../types/github.js"

export const CREATE_BRANCH_TOOL = {
	name: "create_branch",
	description: "GitHub repo'sunda yeni bir branch oluşturur. Varolan bir branch'ten dallanır.",
	inputSchema: {
		type: "object" as const,
		properties: {
			repo: {
				type: "string",
				description: "Repo adı: 'owner/repo' formatında",
			},
			branch_name: {
				type: "string",
				description: "Oluşturulacak branch adı (ör. feature/login, fix/bug-123)",
			},
			from: {
				type: "string",
				description: "Kaynak branch adı (varsayılan: repo'nun default branch'i)",
			},
		},
		required: ["repo", "branch_name"],
	},
}

interface RepoDefault {
	default_branch: string
}

export async function handleCreateBranch(
	client: GitHubClient,
	args: { repo: string; branch_name: string; from?: string },
): Promise<string> {
	const { owner, repo } = client.parseRepo(args.repo)

	// Kaynak branch belirlenmemişse default branch'i al
	let sourceBranch = args.from
	if (!sourceBranch) {
		const repoInfo = await client.get<RepoDefault>(`/repos/${owner}/${repo}`)
		sourceBranch = repoInfo.default_branch
	}

	// Kaynak branch'in SHA'sını al
	const sourceRef = await client.get<BranchRef>(
		`/repos/${owner}/${repo}/git/ref/heads/${encodeURIComponent(sourceBranch)}`,
	)
	const sha = sourceRef.object.sha

	// Yeni branch oluştur
	const created = await client.post<CreatedBranch>(
		`/repos/${owner}/${repo}/git/refs`,
		{
			ref: `refs/heads/${args.branch_name}`,
			sha,
		},
	)

	const shortSha = sha.slice(0, 7)

	return [
		`✅ Branch oluşturuldu`,
		`Repo: ${owner}/${repo}`,
		`Branch: ${args.branch_name}`,
		`Kaynak: ${sourceBranch} (${shortSha})`,
		`🔗 https://github.com/${owner}/${repo}/tree/${encodeURIComponent(args.branch_name)}`,
	].join("\n")
}
