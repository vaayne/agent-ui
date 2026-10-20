# Testing scope

mise run check validates prek configuration, formatting, stock source hashes, import paths, lint, strict TypeScript, and the demo build. TypeScript enables strict, verbatimModuleSyntax, noUnusedLocals, noUnusedParameters, and noUncheckedSideEffectImports.

mise run check:package installs a packed source archive in an isolated Vite consumer. It checks root and stock subpath imports, a package-only class, the consumer class probe, and emitted font URLs. This does not prove a remote Git SHA install before that public SHA exists.

mise run test:browser builds the demo and runs node tools/browser.mjs in real Chrome. The runner owns scenario selection and artifacts. Review the report before claiming a pass. It does not test application transports, authentication, or production backends.

No coverage threshold is enforced. Generated stock components are excluded from lint and format checks, not type checks. The owned compositions receive browser behavior checks. There is no duplicate unit suite for stock markup.
