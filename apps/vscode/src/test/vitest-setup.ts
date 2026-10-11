// Under vitest, `@nexus/core` is aliased to src/test/nexus-core-vitest-stub.ts
// (see vitest.config.ts), which holds models.json state in memory and exposes
// the stub-only `resetModelsFileState` — hence the cast below.
import * as NexusCore from "@nexus/core"
import { resetRegistry } from "@nexus/llms"
import { beforeEach } from "vitest"

const { resetModelsFileState } = NexusCore as typeof NexusCore & { resetModelsFileState(): void }

beforeEach(() => {
	resetModelsFileState()
	// The stub's syncStoredProviderRegistration mutates the real shared
	// @nexus/llms registry; reset it so registrations never leak across tests.
	resetRegistry()
})
