import { describe, it, expect, beforeEach, afterEach } from "bun:test"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { NexusFileStorage } from "../NexusFileStorage"

let tmpDir: string
let secretsPath: string
let storage: NexusFileStorage<string>

beforeEach(() => {
	tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "nexus-secrets-test-"))
	secretsPath = path.join(tmpDir, "secrets.json")
	storage = new NexusFileStorage<string>(secretsPath, "secrets", { fileMode: 0o600 })
})

afterEach(() => {
	fs.rmSync(tmpDir, { recursive: true, force: true })
})

describe("API key storage (NexusFileStorage secrets)", () => {
	describe("set and get", () => {
		it("stores and retrieves an API key", () => {
			storage.set("anthropicApiKey", "sk-ant-api03-test-key")
			expect(storage.get("anthropicApiKey") as string).toBe("sk-ant-api03-test-key")
		})

		it("stores and retrieves an OpenAI key", () => {
			storage.set("openAiApiKey", "sk-proj-test-key")
			expect(storage.get("openAiApiKey") as string).toBe("sk-proj-test-key")
		})

		it("stores and retrieves an OpenRouter key", () => {
			storage.set("openRouterApiKey", "sk-or-v1-test-key")
			expect(storage.get("openRouterApiKey") as string).toBe("sk-or-v1-test-key")
		})

		it("returns undefined for a key that was never set", () => {
			expect(storage.get("nonexistentKey")).toBeUndefined()
		})

		it("overwrites an existing key with a new value", () => {
			storage.set("anthropicApiKey", "sk-ant-old")
			storage.set("anthropicApiKey", "sk-ant-new")
			expect(storage.get("anthropicApiKey") as string).toBe("sk-ant-new")
		})

		it("stores multiple keys independently", () => {
			storage.set("anthropicApiKey", "sk-ant-value")
			storage.set("openAiApiKey", "sk-openai-value")
			expect(storage.get("anthropicApiKey") as string).toBe("sk-ant-value")
			expect(storage.get("openAiApiKey") as string).toBe("sk-openai-value")
		})
	})

	describe("delete", () => {
		it("removes a stored key", () => {
			storage.set("anthropicApiKey", "sk-ant-test")
			storage.delete("anthropicApiKey")
			expect(storage.get("anthropicApiKey")).toBeUndefined()
		})

		it("does not throw when deleting a non-existent key", () => {
			expect(() => storage.delete("neverSetKey")).not.toThrow()
		})

		it("does not affect other keys when one is deleted", () => {
			storage.set("anthropicApiKey", "sk-ant-keep")
			storage.set("openAiApiKey", "sk-openai-keep")
			storage.delete("anthropicApiKey")
			expect(storage.get("openAiApiKey") as string).toBe("sk-openai-keep")
		})
	})

	describe("persistence", () => {
		it("persists data across storage instances (simulates restart)", () => {
			storage.set("anthropicApiKey", "sk-ant-persist")
			// Create a new instance reading the same file
			const storage2 = new NexusFileStorage<string>(secretsPath, "secrets2")
			expect(storage2.get("anthropicApiKey") as string).toBe("sk-ant-persist")
		})

		it("starts empty when file does not exist", () => {
			const newPath = path.join(tmpDir, "fresh-secrets.json")
			const fresh = new NexusFileStorage<string>(newPath, "fresh")
			expect(fresh.get("anyKey")).toBeUndefined()
		})
	})

	describe("file permissions", () => {
		it("creates the secrets file with 0o600 permissions", () => {
			storage.set("anthropicApiKey", "sk-ant-test")
			const stat = fs.statSync(secretsPath)
			// On Linux/macOS, check that only owner has read/write (mode & 0o777)
			if (process.platform !== "win32") {
				expect(stat.mode & 0o777).toBe(0o600)
			}
		})
	})

	describe("security: API keys must not leak into logs", () => {
		it("stored value is the exact key — no serialization noise", () => {
			const key = "sk-ant-api03-supersecret123"
			storage.set("anthropicApiKey", key)
			// Reading back must return the exact value, not a transformed/encoded form
			expect(storage.get("anthropicApiKey") as string).toBe(key)
		})

		it("keys() does not expose secret values, only key names", () => {
			storage.set("anthropicApiKey", "sk-ant-secret")
			storage.set("openAiApiKey", "sk-openai-secret")
			const keys = storage.keys()
			expect(keys).toContain("anthropicApiKey")
			expect(keys).toContain("openAiApiKey")
			// Values must not appear in key names
			expect(keys.join(",")).not.toContain("sk-ant-secret")
			expect(keys.join(",")).not.toContain("sk-openai-secret")
		})
	})
})
