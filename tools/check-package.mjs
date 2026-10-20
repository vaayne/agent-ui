import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const root = process.cwd();
const output = path.join(root, ".local/package-proof");
const fixture = path.join(output, "consumer");

fs.rmSync(output, { recursive: true, force: true });

fs.mkdirSync(fixture, { recursive: true });

const log = [];

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, encoding: "utf8" });
  log.push({
    command: [command, ...args],
    cwd,
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
  });
  fs.writeFileSync(path.join(output, "commands.json"), JSON.stringify(log, null, 2));
  assert.equal(result.status, 0, `${command} failed:\n${result.stdout}\n${result.stderr}`);

  return result.stdout;
}

const manifest = JSON.parse(fs.readFileSync("package.json", "utf8"));

assert.equal(manifest.exports["."], "./src/index.ts");

assert.equal(manifest.exports["./ui/*"], "./src/ui/*.tsx");

assert.equal(manifest.exports["./theme.css"], "./src/styles/theme.css");

assert.ok(!manifest.scripts.prepare && !manifest.scripts.postinstall && !manifest.scripts.install);

assert.ok(!manifest.dependencies, "Runtime dependencies belong in peerDependencies");

run("bun", ["pm", "pack", "--destination", output], root);

const archives = fs.readdirSync(output).filter((name) => name.endsWith(".tgz"));

assert.equal(archives.length, 1, "Expected one source archive");

const archive = path.join(output, archives[0]);
const deps = { "@vaayne/agent-ui": `file:${archive}` };

for (const name of Object.keys(manifest.peerDependencies)) deps[name] = manifest.devDependencies[name];

for (const name of [
  "vite-plus",
  "@tailwindcss/vite",
  "@vitejs/plugin-react",
  "@types/react",
  "@types/react-dom",
  "@types/node",
  "@typescript/native",
]) {
  deps[name] = manifest.devDependencies[name];
}

const iconVersion = process.env.AGENT_UI_LUCIDE_VERSION;

if (iconVersion) deps["lucide-react"] = iconVersion;

fs.writeFileSync(
  path.join(fixture, "package.json"),
  JSON.stringify(
    { private: true, type: "module", dependencies: deps, overrides: manifest.overrides },
    null,
    2,
  ),
);

fs.writeFileSync(
  path.join(fixture, "index.html"),
  '<div id="root"></div><script type="module" src="/main.tsx"></script>',
);

const uiFiles = fs
  .readdirSync("src/ui")
  .filter((name) => name.endsWith(".tsx"))
  .sort();

const stockImports = uiFiles
  .map((name, index) => `import * as stock${index} from "@vaayne/agent-ui/ui/${name.slice(0, -4)}";`)
  .join("\n");

fs.writeFileSync(
  path.join(fixture, "stock-subpaths.ts"),
  stockImports +
    "\nexport const stockSubpaths = [" +
    uiFiles.map((_, index) => `stock${index}`).join(",") +
    "];\n",
);

fs.writeFileSync(
  path.join(fixture, "main.tsx"),
  `import { createRoot } from "react-dom/client";
import { AgentTurn } from "@vaayne/agent-ui";
import { Button } from "@vaayne/agent-ui/ui/button";
import { ScrollArea } from "@vaayne/agent-ui/ui/scroll-area";
import "@vaayne/agent-ui/theme.css";
import { stockSubpaths } from "./stock-subpaths";
console.log("Stock subpaths:", stockSubpaths.length);

createRoot(document.getElementById("root")!).render(
  <ScrollArea><main className="z-[114]"><AgentTurn blocks={[{ key: "reply", type: "text", text: "Ready." }]} live={false} /><Button>Continue</Button></main></ScrollArea>,
);
`,
);

fs.writeFileSync(
  path.join(fixture, "vite.config.ts"),
  `import { defineConfig } from "vite-plus";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
export default defineConfig({ plugins: [react(), tailwindcss()] });
`,
);

const tsconfig = JSON.parse(fs.readFileSync("tsconfig.json", "utf8"));

delete tsconfig.compilerOptions.paths;

tsconfig.include = ["main.tsx", "vite.config.ts"];

fs.writeFileSync(path.join(fixture, "tsconfig.json"), JSON.stringify(tsconfig, null, 2));

run("bun", ["install"], fixture);

const consumerRequire = createRequire(path.join(fixture, "package.json"));
const packageRequire = createRequire(path.join(fixture, "node_modules/@vaayne/agent-ui/package.json"));

for (const name of ["react", "react-dom", "@base-ui/react"]) {
  assert.equal(
    fs.realpathSync(consumerRequire.resolve(name)),
    fs.realpathSync(packageRequire.resolve(name)),
    `Duplicate runtime context: ${name}`,
  );
}

run("bunx", ["--no-install", "tsc", "--noEmit"], fixture);

run("bunx", ["--no-install", "vp", "build"], fixture);

const assets = path.join(fixture, "dist/assets");
const cssNames = fs.readdirSync(assets).filter((name) => name.endsWith(".css"));

assert.ok(cssNames.length > 0, "No emitted CSS");

const css = cssNames.map((name) => fs.readFileSync(path.join(assets, name), "utf8")).join("\n");

assert.match(css, /z-index:\s*114/, "Consumer probe class was not generated");

assert.match(css, /max-width:\s*80%/, "Package-only Bubble class was not generated");

assert.ok(css.includes("--brand-9"), "Shared theme is missing");

const fontURLs = [...css.matchAll(/url\((?:["'])?([^\s)"']+\.woff2)(?:["'])?\)/g)];

assert.ok(fontURLs.length >= 2, "Variable font URLs are missing");

for (const match of fontURLs) {
  const name = path.basename(match[1]);
  assert.ok(fs.existsSync(path.join(assets, name)), `Missing emitted font: ${name}`);
}

assert.ok(
  fs.readdirSync(assets).some((name) => name.startsWith("jetbrains-mono") && name.endsWith(".woff2")),
);

assert.ok(fs.readdirSync(assets).some((name) => name.startsWith("merriweather") && name.endsWith(".woff2")));

fs.writeFileSync(
  path.join(output, "report.json"),
  JSON.stringify(
    {
      passed: true,
      package: manifest.name,
      version: manifest.version,
      lucide: deps["lucide-react"],
      checks: [
        "source archive install",
        "strict source TSX and stock subpaths",
        "Vite bundle",
        "consumer class",
        "package class",
        "shared theme",
        "both variable font assets",
      ],
      stockSubpaths: uiFiles.length,
      fontURLs: fontURLs.length,
      archive: path.basename(archive),
    },
    null,
    2,
  ),
);

console.log(
  `Source package proof passed with lucide-react ${deps["lucide-react"]}. Report: .local/package-proof/report.json`,
);
