# Source and license attribution

The UI, mobile and highlighted-code hooks, highlighter, and stock CSS are official shadcn CLI 4.22.1 output with the base-lyra preset. The original output uses the taupe preset, JetBrains Mono Variable, and Merriweather Variable. Only internal source import paths change for packaging.

Upstream: https://github.com/shadcn-ui/ui/tree/shadcn%404.22.1

The shadcn MIT notice is in licenses/shadcn-MIT.txt. licenses/shadcn-files.json records each original source hash and its packaged hash. Run mise run check:generated to detect changes. To import reviewed official output again, run node tools/stock-ui.mjs import PATH_TO_OFFICIAL_OUTPUT_SRC. This command copies only controls, hooks, highlighter, and stock CSS. It does not copy application utilities or theme overrides.

The shared reference palette uses Radix Colors conventions and custom aqua/gray scales. The Radix Colors MIT notice is in licenses/radix-colors-MIT.txt. src/styles/theme.css owns this generic mapping. It omits application navigation and page-title behavior.

The generic anti-slop lint plugin is vendored under tools/oxlint/anti-slop. Its UPSTREAM.md pins the source commit. Its MIT license and vendor notices remain with the source. Only generic rules are enabled.
