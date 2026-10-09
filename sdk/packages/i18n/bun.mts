/// <reference types="@types/bun" />
export {};

type BuildMode = "package" | "bundle" | "dev";
const rawMode = Bun.env.BUILD_MODE ?? "bundle";
const buildMode: BuildMode =
	rawMode === "bundle" || rawMode === "dev" ? rawMode : "package";

const shouldEmitTypes = buildMode === "package";
const sourcemap = Bun.env.CLINE_SOURCEMAPS === "1" ? "linked" : "none";
const minify = Bun.env.CLINE_SOURCEMAPS !== "1";

const runBuild = async (
	name: string,
	options: Parameters<typeof Bun.build>[0],
) => {
	const result = await Bun.build({
		...options,
		throw: false,
	});

	if (!result.success) {
		throw new Error(`Failed ${name} build`);
	}

	if (result.logs.length > 0) {
		console.warn(`${name} build emitted logs:`);
		for (const log of result.logs) {
			console.warn(log);
		}
	}
};

await runBuild("node", {
	entrypoints: ["./src/index.ts"],
	outdir: "./dist",
	target: "node",
	minify,
	sourcemap,
});

await runBuild("browser", {
	entrypoints: ["./src/index.ts"],
	outdir: "./dist",
	naming: "[dir]/[name].browser.[ext]",
	target: "browser",
	minify,
	sourcemap,
});

if (shouldEmitTypes) {
	const tsc = Bun.spawn(["bun", "tsc", "--emitDeclarationOnly", "--project", "tsconfig.json"], {
		stdout: "inherit",
		stderr: "inherit",
	});

	const exitCode = await tsc.exited;
	if (exitCode !== 0) {
		throw new Error(`Declaration build failed with exit code ${exitCode}`);
	}
}
