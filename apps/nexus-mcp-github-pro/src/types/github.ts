// ── Config ────────────────────────────────────────────────────────────────────

export interface GitHubConfig {
	token: string
	defaultOwner?: string
}

// ── Common ────────────────────────────────────────────────────────────────────

export interface GitHubUser {
	login: string
	id: number
	avatar_url: string
	html_url: string
}

export interface GitHubLabel {
	id: number
	name: string
	color: string
	description?: string
}

// ── Pull Requests ─────────────────────────────────────────────────────────────

export type PRState = "open" | "closed" | "all"

export interface PullRequest {
	number: number
	title: string
	state: PRState
	html_url: string
	created_at: string
	updated_at: string
	draft: boolean
	user: GitHubUser
	head: { ref: string; sha: string }
	base: { ref: string }
	labels: GitHubLabel[]
	body: string | null
	comments: number
	review_comments: number
	commits: number
	additions: number
	deletions: number
	changed_files: number
	merged_at?: string | null
}

// ── Issues ────────────────────────────────────────────────────────────────────

export type IssueState = "open" | "closed" | "all"

export interface Issue {
	number: number
	title: string
	state: IssueState
	html_url: string
	created_at: string
	updated_at: string
	user: GitHubUser
	labels: GitHubLabel[]
	body: string | null
	comments: number
	assignees: GitHubUser[]
}

export interface CreatedIssue {
	number: number
	title: string
	html_url: string
	state: string
}

// ── Workflows ─────────────────────────────────────────────────────────────────

export type WorkflowRunStatus = "queued" | "in_progress" | "completed" | "waiting"
export type WorkflowRunConclusion =
	| "success"
	| "failure"
	| "neutral"
	| "cancelled"
	| "skipped"
	| "timed_out"
	| "action_required"
	| null

export interface WorkflowRun {
	id: number
	name: string
	head_branch: string
	head_sha: string
	event: string
	status: WorkflowRunStatus
	conclusion: WorkflowRunConclusion
	html_url: string
	created_at: string
	updated_at: string
	run_number: number
}

export interface WorkflowJob {
	id: number
	name: string
	status: WorkflowRunStatus
	conclusion: WorkflowRunConclusion
	started_at: string
	completed_at: string
	steps: WorkflowStep[]
	html_url: string
}

export interface WorkflowStep {
	name: string
	status: string
	conclusion: WorkflowRunConclusion
	number: number
}

// ── Repo Stats ────────────────────────────────────────────────────────────────

export interface RepoInfo {
	full_name: string
	description: string | null
	html_url: string
	stargazers_count: number
	forks_count: number
	open_issues_count: number
	watchers_count: number
	language: string | null
	default_branch: string
	created_at: string
	updated_at: string
	pushed_at: string
	topics: string[]
	visibility: string
	size: number
}

export interface Contributor {
	login: string
	contributions: number
	html_url: string
}

// ── Branch ────────────────────────────────────────────────────────────────────

export interface BranchRef {
	ref: string
	object: { sha: string; type: string; url: string }
}

export interface CreatedBranch {
	ref: string
	sha: string
}

// ── Error ─────────────────────────────────────────────────────────────────────

export class GitHubApiError extends Error {
	constructor(
		message: string,
		public readonly status: number,
		public readonly code: "unauthorized" | "forbidden" | "not_found" | "rate_limit" | "server_error" | "unknown",
	) {
		super(message)
		this.name = "GitHubApiError"
	}
}
