import type { ToolApprovalRequest, ToolApprovalResult } from "@nexus/shared";
import type { ToolExecutors } from "../../extensions/tools";

export interface RuntimeCapabilities {
	toolExecutors?: Partial<ToolExecutors>;
	requestToolApproval?: (
		request: ToolApprovalRequest,
	) => Promise<ToolApprovalResult> | ToolApprovalResult;
}
