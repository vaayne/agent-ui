// CDP actions and readiness observations must run in order.
/* eslint-disable no-await-in-loop */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createWriteStream } from "node:fs";
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const artifacts = resolve(process.argv[2] ?? join(root, ".local/browser"));

await mkdir(artifacts, { recursive: true });

const isolated = await mkdtemp(join(tmpdir(), "agent-ui-browser-"));
const profile = join(isolated, "chrome");
const fixture = join(isolated, "public-notes.txt");

await writeFile(fixture, "Public browser upload example.\n");

const port = await freePort();
const base = `http://127.0.0.1:${port}`;

const environment = {
  PATH: process.env.PATH,
  HOME: isolated,
  TMPDIR: isolated,
  LANG: "en_US.UTF-8",
  NODE_ENV: "production",
};

const logs = [];
const children = [];
const pending = new Map();
const results = [];
const exceptions = [];
const requests = [];
let socket;
let serial = 0;
let chooser;
const startedAt = new Date().toISOString();
const consumer = '[data-consumer="terminal"]';
const input = `${consumer} textarea`;
const report = { startedAt, command: "mise run test:browser", results, exceptions, requests };

try {
  launch("preview", "bunx", [
    "--no-install",
    "vp",
    "preview",
    "--host",
    "127.0.0.1",
    "--port",
    String(port),
    "--strictPort",
  ]);
  await poll("preview ready", async () => (await fetch(base)).ok);
  const chrome = await chromePath();
  launch("chrome", chrome, [
    "--headless=new",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-background-networking",
    "--disable-features=BackForwardCache",
    "--no-sandbox",
    "--remote-debugging-port=0",
    `--user-data-dir=${profile}`,
    "about:blank",
  ]);

  const debugPort = await poll(
    "Chrome ready",
    async () => (await readFile(join(profile, "DevToolsActivePort"), "utf8")).split("\n")[0],
  );

  const targets = await (await fetch(`http://127.0.0.1:${debugPort}/json/list`)).json();
  const page = targets.find((target) => target.type === "page" && target.url === "about:blank");
  assert.ok(page, "Chrome has a page");
  socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((accept, reject) => {
    socket.addEventListener("open", accept, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });
  socket.addEventListener("message", ({ data }) => {
    const message = JSON.parse(String(data));

    if (message.id) {
      const task = pending.get(message.id);

      if (!task) return;
      pending.delete(message.id);

      if (message.error) task.reject(new Error(JSON.stringify(message.error)));
      else task.accept(message.result);
    } else if (message.method === "Runtime.exceptionThrown") exceptions.push(message.params.exceptionDetails);
    else if (message.method === "Page.fileChooserOpened") chooser = message.params;
    else if (message.method === "Network.requestWillBeSent") requests.push(message.params.request.url);
  });
  await call("Page.enable");
  await call("Runtime.enable");
  await call("Network.enable");
  await viewport(1280, 1000);
  socket.send(JSON.stringify({ id: ++serial, method: "Page.navigate", params: { url: base } }));
  await poll("demo root", async () => {
    const snapshot = await evaluate(
      `({ href: location.href, readyState: document.readyState, title: document.title, consumers: document.querySelectorAll("[data-consumer]").length, scripts: [...document.scripts].map((script) => script.src), body: document.body.innerText.slice(0, 200) })`,
    );

    report.debug = snapshot;

    return snapshot.consumers === 2;
  });
  await ui("two consumer views", 'document.querySelectorAll("[data-consumer]").length === 2');
  await ui("fonts ready", 'document.fonts.status === "loaded"');
  await check(
    "normalized tool identifiers",
    `document.querySelector(${JSON.stringify(`${consumer} [data-tool="read"][data-tool-name="read_file"]`)}) !== null`,
  );
  await click(`${consumer} [data-tool="read"] button`);
  await ui(
    "trace input and output",
    `(() => { const row = document.querySelector(${JSON.stringify(`${consumer} [data-tool="read"]`)}); return row.innerText.includes('"path"') && row.innerText.includes('Three public examples found.'); })()`,
  );
  await check(
    "running input without output",
    `document.querySelector(${JSON.stringify(`${consumer} [data-tool="search"]`)}).innerText.includes('Search the local index')`,
  );
  await click(`${consumer} [data-tool="search"] button`);
  await ui(
    "running input visible",
    `document.querySelector(${JSON.stringify(`${consumer} [data-tool="search"]`)}).innerText.includes('shared components')`,
  );
  await check(
    "error opens output",
    `document.querySelector(${JSON.stringify(`${consumer} [data-tool="export"]`)}).innerText.includes('selected format is unavailable')`,
  );
  await check(
    "default and Chinese labels",
    'document.body.innerText.includes("正在思考") && document.body.innerText.includes("Thinking") && document.body.innerText.includes("等待中")',
  );
  await check(
    "safe default plain text",
    'document.body.innerText.includes("<tags>") && !document.querySelector("tags")',
  );
  await check(
    "empty Send keeps input opacity",
    `getComputedStyle(document.querySelector(${JSON.stringify(`${consumer} [data-slot="input-group"]`)})).opacity === "1"`,
  );
  await check(
    "notice descriptions resolve",
    `(() => { const input = document.querySelector(${JSON.stringify(input)}); return input.getAttribute('aria-describedby').split(' ').every(id => !!document.getElementById(id)); })()`,
  );

  await focus();
  await call("Input.insertText", { text: "First line" });
  await key("Enter", 8);
  await ui(
    "Shift+Enter inserts newline",
    `document.querySelector(${JSON.stringify(input)}).value.includes("\\n")`,
  );
  await check(
    "Shift+Enter does not submit",
    `document.querySelectorAll(${JSON.stringify(`${consumer} [data-origin="demo-submit"]`)}).length === 0`,
  );
  await call("Input.insertText", { text: "Second line" });
  await key("Enter");
  await ui(
    "Enter submits controlled draft",
    `document.querySelectorAll(${JSON.stringify(`${consumer} [data-origin="demo-submit"]`)}).length === 1 && document.querySelector(${JSON.stringify(input)}).value === ""`,
  );

  await focus();
  await call("Input.imeSetComposition", { text: "测试", selectionStart: 2, selectionEnd: 2 });
  await key("Enter");
  await check(
    "IME Enter does not submit",
    `document.querySelectorAll(${JSON.stringify(`${consumer} [data-origin="demo-submit"]`)}).length === 1`,
  );
  await call("Input.insertText", { text: "测试" });
  await key("Enter");
  await ui(
    "Enter after IME commit submits",
    `document.querySelectorAll(${JSON.stringify(`${consumer} [data-origin="demo-submit"]`)}).length === 2`,
  );

  await click(`${consumer} [data-action="intercept"]`);
  await focus();
  await call("Input.insertText", { text: "App command" });
  await key("Enter");
  await ui(
    "app key handler prevents default send",
    `document.querySelector(${JSON.stringify(`${consumer} output`)}).getAttribute('data-events').includes('intercept') && document.querySelectorAll(${JSON.stringify(`${consumer} [data-origin="demo-submit"]`)}).length === 2`,
  );
  await click(`${consumer} [data-action="intercept"]`);
  await key("Enter");
  await ui(
    "app releases Enter",
    `document.querySelectorAll(${JSON.stringify(`${consumer} [data-origin="demo-submit"]`)}).length === 3`,
  );

  await call("Page.setInterceptFileChooserDialog", { enabled: true });
  await click(`${consumer} button[aria-label="Attach files"]`);
  await poll("native file picker opened", () => chooser);
  await call("DOM.setFileInputFiles", { files: [fixture], backendNodeId: chooser.backendNodeId });
  await ui(
    "native upload callback",
    `document.querySelector(${JSON.stringify(`${consumer} form`)}).innerText.includes('public-notes.txt')`,
  );
  await click(`${consumer} button[aria-label="Remove file: public-notes.txt"]`);
  await ui(
    "attachment removal callback",
    `!document.querySelector(${JSON.stringify(`${consumer} form`)}).innerText.includes('public-notes.txt')`,
  );

  for (const kind of ["paste", "drop"]) {
    await evaluate(
      `(() => { const transfer = new DataTransfer(); transfer.items.add(new File(['Public example'], '${kind}.txt', {type:'text/plain'})); const target = document.querySelector(${JSON.stringify(kind === "paste" ? input : `${consumer} form`)}); target.dispatchEvent(${kind === "paste" ? "new ClipboardEvent('paste', {clipboardData:transfer, bubbles:true, cancelable:true})" : "new DragEvent('drop', {dataTransfer:transfer, bubbles:true, cancelable:true})"}); })()`,
    );
    await ui(
      `${kind} file callback`,
      `document.querySelector(${JSON.stringify(`${consumer} form`)}).innerText.includes('${kind}.txt')`,
    );
    await click(`${consumer} button[aria-label="Remove file: ${kind}.txt"]`);
  }

  await click(`${consumer} [data-action="toggle-disabled"]`);
  await check(
    "input disabled independently",
    `document.querySelector(${JSON.stringify(input)}).disabled && document.querySelector(${JSON.stringify(`${consumer} input[type="file"]`)}).disabled && !document.querySelector(${JSON.stringify(`${consumer} button[aria-label="Stop"]`)}).disabled`,
  );
  await click(`${consumer} button[aria-label="Stop"]`);
  await ui(
    "Stop while input disabled",
    `document.querySelector(${JSON.stringify(`${consumer} output`)}).getAttribute('data-stops') === '1'`,
  );
  await click(`${consumer} [data-action="toggle-disabled"]`);

  for (const width of [1280, 390]) {
    await viewport(width, 1000);

    for (const theme of ["light", "dark"]) {
      await evaluate(`document.documentElement.classList.toggle('dark', ${theme === "dark"})`);
      await check(
        `${width}px ${theme} no horizontal overflow`,
        "document.documentElement.scrollWidth <= innerWidth",
      );
      await call("Runtime.evaluate", {
        expression: "new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))",
        awaitPromise: true,
      });
      const shot = await call("Page.captureScreenshot", { format: "png", captureBeyondViewport: true });
      const name = `${width}-${theme}.png`;
      await writeFile(join(artifacts, name), Buffer.from(shot.data, "base64"));
      results.push({ name: `${width}px ${theme} screenshot`, file: name });
    }
  }

  assert.deepEqual(exceptions, [], "No runtime exceptions");
  assert.ok(
    requests.every((url) => url.startsWith(base) || url.startsWith("data:")),
    "No external requests",
  );
  report.status = "passed";
} catch (error) {
  report.status = "failed";
  report.error = error.stack;
  process.exitCode = 1;
} finally {
  socket?.close();

  for (const task of pending.values()) task.reject(new Error("Browser closed"));
  await Promise.all(children.map(stop));
  await Promise.all(logs.map((log) => new Promise((accept) => log.end(accept))));
  await rm(isolated, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
  report.finishedAt = new Date().toISOString();
  await writeFile(join(artifacts, "results.json"), `${JSON.stringify(report, null, 2)}\n`);
}

console.log(`${report.status}: ${join(artifacts, "results.json")}`);

if (report.error) console.error(report.error);

function launch(name, executable, args) {
  const log = createWriteStream(join(artifacts, `${name}.log`));
  logs.push(log);
  const child = spawn(executable, args, { cwd: root, env: environment, stdio: ["ignore", "pipe", "pipe"] });
  child.on("error", (error) => exceptions.push({ process: name, error: error.message }));
  child.stdout.pipe(log, { end: false });
  child.stderr.pipe(log, { end: false });
  children.push(child);

  return child;
}

async function chromePath() {
  const paths = [
    process.env.CHROME_PATH,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ];

  for (const path of paths) {
    if (!path) continue;

    try {
      await access(path);

      return path;
    } catch {
      /* Try the next installed browser. */
    }
  }

  throw new Error("Set CHROME_PATH to an installed Chrome executable.");
}

function call(method, params = {}) {
  const id = ++serial;

  return new Promise((accept, reject) => {
    const timeout = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`CDP timeout: ${method}`));
    }, 15_000);

    pending.set(id, {
      accept: (value) => {
        clearTimeout(timeout);
        accept(value);
      },
      reject: (error) => {
        clearTimeout(timeout);
        reject(error);
      },
    });
    socket.send(JSON.stringify({ id, method, params }));
  });
}

async function evaluate(expression) {
  const result = await call("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });

  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));

  return result.result.value;
}

async function poll(name, observe) {
  const deadline = Date.now() + 20_000;
  let cause;

  while (Date.now() < deadline) {
    try {
      const value = await observe();

      if (value) return value;
    } catch (error) {
      cause = error;
    }

    await delay(50);
  }

  throw new Error(`Timed out: ${name}`, { cause });
}

async function ui(name, expression) {
  await poll(name, () => evaluate(expression));
  results.push({ name, passed: true });
}

async function check(name, expression) {
  assert.ok(await evaluate(expression), name);
  results.push({ name, passed: true });
}

async function click(selector) {
  await evaluate(
    `(() => { const element = document.querySelector(${JSON.stringify(selector)}); if (!element || element.disabled) throw new Error('Control unavailable: ' + ${JSON.stringify(selector)}); element.click(); })()`,
  );
}

async function focus() {
  await evaluate(`document.querySelector(${JSON.stringify(input)}).focus()`);
}

async function key(keyName, modifiers = 0) {
  await call("Input.dispatchKeyEvent", {
    type: "keyDown",
    key: keyName,
    code: keyName,
    modifiers,
    text: modifiers === 8 ? "\n" : undefined,
  });
  await call("Input.dispatchKeyEvent", { type: "keyUp", key, code: key, modifiers });
}

async function viewport(width, height) {
  await call("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: width < 600,
  });
}

async function freePort() {
  const server = createServer();
  await new Promise((accept, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", accept);
  });
  const availablePort = server.address().port;
  await new Promise((accept, reject) => server.close((error) => (error ? reject(error) : accept())));

  return availablePort;
}

async function stop(child) {
  if (child.exitCode !== null || child.signalCode !== null) return;
  const exited = new Promise((accept) => child.once("exit", accept));
  child.kill("SIGTERM");
  let timeout;
  await Promise.race([
    exited,
    new Promise((accept) => {
      timeout = setTimeout(() => {
        child.kill("SIGKILL");
        accept();
      }, 5000);
    }),
  ]);
  clearTimeout(timeout);

  if (child.exitCode === null && child.signalCode === null) await exited;
}
