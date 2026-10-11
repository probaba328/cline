import { VSCodeLink } from "@vscode/webview-ui-toolkit/react"
import { useState } from "react"

const CODE_STYLE: React.CSSProperties = {
	background: "var(--vscode-textCodeBlock-background)",
	padding: "1px 5px",
	borderRadius: 3,
	fontFamily: "monospace",
	fontSize: 11,
}

export const OllamaSetupGuide = () => {
	const [open, setOpen] = useState(false)

	return (
		<div style={{ marginTop: 4 }}>
			<button
				onClick={() => setOpen((v) => !v)}
				style={{
					background: "none",
					border: "none",
					cursor: "pointer",
					color: "var(--vscode-textLink-foreground)",
					fontSize: 12,
					padding: 0,
					display: "flex",
					alignItems: "center",
					gap: 4,
				}}>
				<i
					className={`codicon ${open ? "codicon-chevron-down" : "codicon-chevron-right"}`}
					style={{ fontSize: 11 }}
				/>
				How to install Ollama and download a model
			</button>

			{open && (
				<div
					style={{
						marginTop: 8,
						padding: "10px 12px",
						backgroundColor:
							"var(--vscode-editorWidget-background, var(--vscode-editor-background))",
						border: "1px solid var(--vscode-widget-border)",
						borderRadius: 4,
						fontSize: 12,
						lineHeight: "1.9",
					}}>
					<ol style={{ margin: 0, paddingLeft: 18 }}>
						<li>
							Download Ollama from{" "}
							<VSCodeLink href="https://ollama.com" style={{ display: "inline", fontSize: "inherit" }}>
								ollama.com
							</VSCodeLink>{" "}
							and install it (macOS, Linux, Windows)
						</li>
						<li>
							Open a terminal and pull a coding model:
							<br />
							<code style={{ ...CODE_STYLE, display: "inline-block", marginTop: 3 }}>
								ollama run qwen2.5-coder:7b
							</code>
						</li>
						<li>
							Ollama starts a local API server at{" "}
							<code style={CODE_STYLE}>http://localhost:11434</code>
						</li>
						<li>Return here — your downloaded models will appear in the picker above</li>
					</ol>
					<p style={{ margin: "8px 0 0", color: "var(--vscode-descriptionForeground)" }}>
						<strong>Recommended coding models:</strong>{" "}
						<code style={CODE_STYLE}>qwen2.5-coder</code>, <code style={CODE_STYLE}>deepseek-coder-v2</code>,{" "}
						<code style={CODE_STYLE}>codestral</code>, <code style={CODE_STYLE}>llama3.2</code>
					</p>
				</div>
			)}
		</div>
	)
}
