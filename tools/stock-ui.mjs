import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const manifestPath = "licenses/shadcn-files.json";
const hash = (text) => createHash("sha256").update(text).digest("hex");

function packageImports(text, directory) {
  return text
    .replaceAll(/@\/components\/ui\/([^"']+)/g, (_, name) =>
      directory === "src/ui" ? `./${name}` : `../ui/${name}`,
    )
    .replaceAll(/@\/(hooks|lib)\/([^"']+)/g, (_, targetDirectory, name) => `../${targetDirectory}/${name}`);
}

const command = process.argv[2];

if (command === "import") {
  const source = process.argv[3];
  assert.ok(source, "Usage: node tools/stock-ui.mjs import <official-output-src-directory>");
  const files = [];

  for (const [input, output, extension] of [
    ["components/ui", "src/ui", ".tsx"],
    ["hooks", "src/hooks", ".ts"],
  ]) {
    for (const name of fs.readdirSync(path.join(source, input)).sort()) {
      if (!name.endsWith(extension)) continue;
      const text = fs.readFileSync(path.join(source, input, name), "utf8");
      fs.mkdirSync(output, { recursive: true });
      const target = `${output}/${name}`;
      const packaged = packageImports(text, output);
      fs.writeFileSync(target, packaged);
      files.push({
        path: target,
        source: `${input}/${name}`,
        sourceSha256: hash(text),
        sha256: hash(packaged),
      });
    }
  }

  for (const name of ["lib/highlighter.tsx", "styles/shadcn.css"]) {
    const text = fs.readFileSync(path.join(source, name), "utf8");
    const target = `src/${name}`;
    fs.mkdirSync(path.dirname(target), { recursive: true });
    const packaged = packageImports(text, path.dirname(target));
    fs.writeFileSync(target, packaged);
    files.push({ path: target, source: name, sourceSha256: hash(text), sha256: hash(packaged) });
  }

  fs.writeFileSync(manifestPath, JSON.stringify(files, null, 2) + "\n");
} else {
  assert.equal(command, "check", "Use import or check");
}

const files = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

for (const file of files) {
  const text = fs.readFileSync(file.path, "utf8");
  assert.equal(hash(text), file.sha256, `Stock file changed: ${file.path}`);
  assert.ok(!text.includes('"@/'), `Package alias remains in ${file.path}`);
}

console.log(`Verified ${files.length} stock files.`);
