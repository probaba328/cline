import type { HepsiburadaClient } from "../api/client.js"

export const APPROVE_CANCELLATION_TOOL = {
	name: "approve_cancellation",
	description: "Hepsiburada'daki bir iptal veya iade talebini onaylar.",
	inputSchema: {
		type: "object" as const,
		properties: {
			claimId: {
				type: "string",
				description: "Onaylanacak talep ID'si (get_cancellations ile alınır)",
			},
		},
		required: ["claimId"],
	},
}

export async function handleApproveCancellation(
	client: HepsiburadaClient,
	args: { claimId: string },
): Promise<string> {
	await client.put<unknown>(
		`/claim/api/claims/${encodeURIComponent(args.claimId)}/approve`,
		{},
	)

	return `✅ Talep onaylandı\nTalep ID: ${args.claimId}`
}
