import { AccountServiceClient } from "@nexus-grpc/account"
import { BrowserServiceClient } from "@nexus-grpc/browser"
import { CheckpointsServiceClient } from "@nexus-grpc/checkpoints"
import { CommandsServiceClient } from "@nexus-grpc/commands"
import { FileServiceClient } from "@nexus-grpc/file"
import { McpServiceClient } from "@nexus-grpc/mcp"
import { ModelsServiceClient } from "@nexus-grpc/models"
import { SlashServiceClient } from "@nexus-grpc/slash"
import { StateServiceClient } from "@nexus-grpc/state"
import { TaskServiceClient } from "@nexus-grpc/task"
import { UiServiceClient } from "@nexus-grpc/ui"
import { WebServiceClient } from "@nexus-grpc/web"
import { credentials } from "@grpc/grpc-js"
import { promisify } from "util"

const serviceRegistry = {
	"nexus.AccountService": AccountServiceClient,
	"nexus.BrowserService": BrowserServiceClient,
	"nexus.CheckpointsService": CheckpointsServiceClient,
	"nexus.CommandsService": CommandsServiceClient,
	"nexus.FileService": FileServiceClient,
	"nexus.McpService": McpServiceClient,
	"nexus.ModelsService": ModelsServiceClient,
	"nexus.SlashService": SlashServiceClient,
	"nexus.StateService": StateServiceClient,
	"nexus.TaskService": TaskServiceClient,
	"nexus.UiService": UiServiceClient,
	"nexus.WebService": WebServiceClient,
} as const

export type ServiceClients = {
	-readonly [K in keyof typeof serviceRegistry]: InstanceType<(typeof serviceRegistry)[K]>
}

export class GrpcAdapter {
	private clients: Partial<ServiceClients> = {}

	constructor(address: string) {
		for (const [name, Client] of Object.entries(serviceRegistry)) {
			this.clients[name as keyof ServiceClients] = new (Client as any)(address, credentials.createInsecure())
		}
	}

	async call(service: keyof ServiceClients, method: string, request: any): Promise<any> {
		const client = this.clients[service]
		if (!client) {
			throw new Error(`No gRPC client registered for service: ${String(service)}`)
		}

		const fn = (client as any)[method]
		if (typeof fn !== "function") {
			throw new Error(`Method ${method} not found on service ${String(service)}`)
		}

		try {
			const fnAsync = promisify(fn).bind(client)
			const response = await fnAsync(request.message)
			return response?.toObject ? response.toObject() : response
		} catch (error) {
			console.error(`[GrpcAdapter] ${service}.${method} failed:`, error)
			throw error
		}
	}

	close(): void {
		for (const client of Object.values(this.clients)) {
			if (client && typeof (client as any).close === "function") {
				;(client as any).close()
			}
		}
	}
}
