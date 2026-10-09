# Nexus web visual foundation

The shared visual contract now lives in the internal
[`@nexus/ui`](../../../../../sdk/packages/ui/README.md) workspace package
instead of beside the desktop app.

The desktop imports the complete `@nexus/ui/theme/index.css` entry point. Other
Nexus surfaces can import `@nexus/ui/theme/tokens.css` without React or
Tailwind, or compose the Tailwind adapter and optional base styles in order.
Consuming apps still own their font files and shell-specific layout.
