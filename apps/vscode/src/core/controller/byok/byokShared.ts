import path from "node:path"
import { NexusFileStorage } from "@/shared/storage/NexusFileStorage"
import { resolveDataDirFromEnv } from "@/shared/storage/storage-context"
import { BYOKService } from "@/services/byok/BYOKService"
import { BYOKValidationService } from "@/services/byok/BYOKValidationService"

let _byokService: BYOKService | undefined
let _validationService: BYOKValidationService | undefined

export function getByokService(): BYOKService {
	if (!_byokService) {
		const dataDir = resolveDataDirFromEnv()
		const secretsPath = path.join(dataDir, "byok-secrets.json")
		const storage = new NexusFileStorage<string>(secretsPath, "BYOKSecrets", { fileMode: 0o600 })
		_byokService = new BYOKService(storage)
	}
	return _byokService
}

export function getValidationService(): BYOKValidationService {
	if (!_validationService) {
		_validationService = new BYOKValidationService()
	}
	return _validationService
}
