# Verification

Read this before selecting checks or reporting completion.

- Metadata-only changes: format check and git diff --check.
- Source, dependency, and export changes: mise run check.
- Distribution changes: mise run check:package. This tests a packed source package in a separate consumer. The first public Git SHA still needs the real Git dependency proof.
- Composition behavior and styles: mise run test:browser. A runner exit alone is not enough. Review its report and screenshots.
- Generated changes: mise run check:generated. Keep provenance and licenses current.
- Review added abstractions and fallback branches before final checks. Remove unused mechanisms.
- Report executed commands and results. State unverified areas. Never infer browser success from a build.
