import { Agent } from "@nexus/sdk";

const agent = new Agent({
	providerId: "nexus",
	modelId: "anthropic/claude-sonnet-4.6",
	apiKey: process.env.NEXUS_API_KEY,
	maxIterations: 1,
});

agent.subscribe((event) => {
	if (event.type === "assistant-text-delta") {
		process.stdout.write(event.text);
	}
});

const result = await agent.run("Explain what an SDK is in two sentences.");
console.log(
	`\n\nDone (${result.iterations} iteration, ${result.usage.outputTokens} output tokens)`,
);
