# Implementation

Read this for source, dependencies, or API changes.

- This is a source React library. Root exports src/index.ts. UI subpaths export src/ui/*.tsx. CSS exports src/styles/theme.css.
- Keep runtime packages in peerDependencies and install exact versions in devDependencies for the demo. Do not add install-time builds.
- src/agent owns transport-independent compositions. Callers own transport, authentication, uploads, routing, translations, drafts, and scroll policy.
- Treat src/ui, src/hooks/use-mobile.ts, src/hooks/use-highlighted-code.ts, src/lib/highlighter.tsx, and src/styles/shadcn.css as generated external source. Change only package import paths. See licenses/shadcn-files.json and docs/dev/provenance.md.
- Use the pinned [shadcn skill](../skills/shadcn/SKILL.md) for component changes. The explicit base-lyra preset and shared reference palette take precedence over skill style defaults. Do not add Beautiful UI.
- src/styles/theme.css owns the shared scales and semantic mapping. Consumers import this file once. The stock preset supplies Tailwind, fonts, and radius.
- Use cn from the cn package. Do not import application utilities.
- Use TypeScript 7, Vite+, Tailwind 4, and Base UI. Keep lint/fmt configuration in vite.config.ts. Do not add a router, server state library, or service without a concrete need.
- Validate untrusted input at its owner. Fix violated internal contracts at the source. Search all entry points for the same failure mechanism.
