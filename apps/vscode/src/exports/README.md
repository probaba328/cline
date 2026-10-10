# Nexus API

The Nexus extension exposes an API that can be used by other extensions. To use this API in your extension:

1. Copy `src/extension-api/nexus.d.ts` to your extension's source directory.
2. Include `nexus.d.ts` in your extension's compilation.
3. Get access to the API with the following code:

    ```ts
    const nexusExtension = vscode.extensions.getExtension<NexusAPI>("saoudrizwan.claude-dev")

    if (!nexusExtension?.isActive) {
    	throw new Error("Nexus extension is not activated")
    }

    const nexus = nexusExtension.exports

    if (nexus) {
    	// Now you can use the API

    	// Start a new task with an initial message
    	await nexus.startNewTask("Hello, Nexus! Let's make a new project...")

    	// Start a new task with an initial message and images
    	await nexus.startNewTask("Use this design language", ["data:image/webp;base64,..."])

    	// Send a message to the current task
    	await nexus.sendMessage("Can you fix the @problems?")

    	// Simulate pressing the primary button in the chat interface (e.g. 'Save' or 'Proceed While Running')
    	await nexus.pressPrimaryButton()

    	// Simulate pressing the secondary button in the chat interface (e.g. 'Reject')
    	await nexus.pressSecondaryButton()
    } else {
    	console.error("Nexus API is not available")
    }
    ```

    **Note:** To ensure that the `saoudrizwan.claude-dev` extension is activated before your extension, add it to the `extensionDependencies` in your `package.json`:

    ```json
    "extensionDependencies": [
        "saoudrizwan.claude-dev"
    ]
    ```

For detailed information on the available methods and their usage, refer to the `nexus.d.ts` file.
