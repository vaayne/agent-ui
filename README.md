# @vaayne/agent-ui

React components for agent conversations. Compose messages, tool traces, reasoning, attachments, and a controlled composer without a transport or application state layer.

This package exports TypeScript source. Your bundler must compile TSX and process Tailwind CSS 4. React and React DOM must be >=19.2 and <20. Install the peer packages listed in package.json with versions that match your application.

## Use

Pin the verified public commit `7420853321359dc26a61a2403bbe22c3f5ff646d` across consumers:

```sh
bun add 'github:vaayne/agent-ui#7420853321359dc26a61a2403bbe22c3f5ff646d'
```

```tsx
import "@vaayne/agent-ui/theme.css";
import { AgentTurn } from "@vaayne/agent-ui";
import { Button } from "@vaayne/agent-ui/ui/button";

export function Conversation() {
  return (
    <>
      <AgentTurn blocks={[{ key: "reply", type: "text", text: "Ready." }]} live={false} />
      <Button>Continue</Button>
    </>
  );
}
```

Use the Tailwind Vite plugin in the consuming app. The theme imports Tailwind, the stock preset, animations, and fonts. It scans package UI and agent source explicitly. Add the dark class to your theme root for dark mode.

The package has no install-time build and no npm release. Pin the same full public Git SHA across consumers.

## Develop

```sh
mise install
mise run install
mise run dev
```

See [development](docs/dev/development.md), [architecture](docs/dev/architecture.md), [testing](docs/dev/testing.md), and [source attribution](docs/dev/provenance.md).

MIT. Third-party source retains its own notices in [licenses](licenses/).
