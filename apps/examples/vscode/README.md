# `apps/examples/vscode` (`@nexus/vscode`)

VS Code extension that opens a chat webview and runs Nexus sessions over the RPC runtime.

## What it does

- Opens a webview panel via `Nexus: Open Chat in Editor`.
- Ensures a compatible owner-scoped RPC sidecar by running `nexus rpc ensure --json`.
- Starts/sends/aborts chat turns using RPC runtime methods (`StartRuntimeSession`, `SendRuntimeSession`, `AbortRuntimeSession`).
- Streams runtime events into the webview for incremental assistant output.

## Requirements

- `nexus` must already be installed and available on `PATH`.
- A provider/model should be configured in Nexus provider settings.

## Development

```bash
# Build extension bundle
bun -F @nexus/vscode build

# Typecheck
bun -F @nexus/vscode typecheck
```

To run locally in VS Code:

1. Build the extension: `bun -F @nexus/vscode build`.
2. Open `apps/examples/vscode` in VS Code.
3. Press `F5` to launch the Extension Development Host.
4. Run command `Nexus: Open Chat in Editor`.
