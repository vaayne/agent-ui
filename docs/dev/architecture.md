# Architecture

The package root exports the agent compositions from src/index.ts. src/agent defines view types and controlled interactions. Applications provide data and receive callbacks. A missing optional tool output leaves its input visible. A tool error remains an explicit view state.

src/ui contains official shadcn base-lyra source. UI modules use package-relative imports. Shared highlighting lives in src/hooks and src/lib. The application supplies React and all runtime peers so the package uses the same component contexts.

src/styles/theme.css imports the stock preset and maps the shared reference color scales to semantic tokens. The explicit Tailwind source paths are relative to that CSS file. The consumer owns the root dark class. Fonts and radius come from the stock preset.

The demo imports package source and builds into .local/demo-dist. The separate package check installs a source archive in an isolated consumer. Neither path adds a package compilation step at installation.
