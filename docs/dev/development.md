# Development

Run mise install, then mise run install. The repository pins Bun 1.4.3, Node 26.11.1, dprint 0.63.0, and prek 0.5.5. The package locks React 19.3.0, TypeScript 7.0.2, and Vite+ 1.1.0 for development.

Run mise run skills:install to install the shadcn skill at shadcn@4.22.1. Run mise run hooks:install for the pre-commit hook.

Use mise run dev for the demo. Use mise run format before mise run check. Use mise run build for the demo bundle. All generated files are excluded from lint and formatting, but remain in strict type checks.

Run mise run check:package for a separate source-package consumer build. Run mise run test:browser for real Chrome behavior checks. Reports and build output stay in .local/.

No task needs production credentials. No task publishes a repository, package, tag, or release.
