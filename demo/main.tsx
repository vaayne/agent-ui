import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  AgentComposer,
  AgentTurn,
  AgentUserMessage,
  type AgentFile,
  type AgentLabels,
  type AgentTurnBlock,
} from "../src/index";
import { Badge } from "../src/ui/badge";
import { Button } from "../src/ui/button";
import "../src/styles/theme.css";

const chinese: Partial<AgentLabels> = {
  input: "输入",
  output: "输出",
  running: "执行中",
  done: "已完成",
  error: "出错",
  reasoning: "思考过程",
  thinking: "正在思考",
  queued: "等待中",
  stopped: "已停止",
  files: "附件",
  uploading: "上传中",
  removeFile: "移除附件",
  attachFiles: "添加附件",
};

const sampleFile: AgentFile = {
  id: "notes",
  name: "research-notes.txt",
  mimeType: "text/plain",
  size: 128,
  href: "data:text/plain,Public%20research%20notes",
};

const blocks: AgentTurnBlock[] = [
  {
    key: "reason",
    type: "reasoning",
    text: "Compare the public examples. Keep the application in control of its data.",
  },
  {
    key: "tools",
    type: "tools",
    tools: [
      {
        id: "read",
        name: "read_file",
        title: "Read project notes",
        target: "research-notes.txt",
        status: "done",
        input: '{ "path": "research-notes.txt" }',
        output: "Three public examples found.",
      },
      {
        id: "search",
        name: "search",
        title: "Search the local index",
        status: "running",
        input: '{ "query": "shared components" }',
      },
      {
        id: "export",
        name: "export",
        title: "Export report",
        status: "error",
        input: '{ "format": "pdf" }',
        output: "The selected format is unavailable.",
        details: (
          <a className="underline" href="#composer">
            Choose another format
          </a>
        ),
      },
    ],
  },
  {
    key: "answer",
    type: "text",
    text: "The examples use the same components. Each application supplies its own content, labels, and actions.",
  },
];

function Consumer({ localized }: { localized: boolean }) {
  const [value, setValue] = useState("");
  const [files, setFiles] = useState<AgentFile[]>([]);
  const [sent, setSent] = useState<{ id: string; text: string }[]>([]);
  const [disabled, setDisabled] = useState(false);
  const [stops, setStops] = useState(0);
  const [events, setEvents] = useState<string[]>([]);
  const [intercept, setIntercept] = useState(false);
  const labels = localized ? chinese : undefined;
  const record = (event: string) => setEvents((current) => [...current, event]);

  return (
    <section
      data-consumer={localized ? "workspace" : "terminal"}
      className="min-w-0 space-y-6 border p-4 sm:p-6"
    >
      <header className="space-y-2">
        <Badge variant="outline">{localized ? "工作空间助手" : "Terminal assistant"}</Badge>
        <h2 className="text-lg font-medium">
          {localized ? "同一套组件，中文界面" : "A conversation with local tools"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {localized
            ? "应用管理草稿、附件和发送状态。"
            : "The application owns the draft, files, and send state."}
        </p>
      </header>
      <AgentUserMessage
        data-origin="demo-user"
        text={localized ? "请比较这些公开示例。" : "Compare these public examples."}
        files={[sampleFile]}
        badge={localized ? "访客" : "Guest"}
        queued
        labels={labels}
      />
      <AgentTurn
        blocks={blocks}
        live
        labels={labels}
        renderText={(text) => <p className="leading-relaxed">{text}</p>}
      >
        <p className="text-xs text-muted-foreground">
          {localized ? "应用附加信息 · 公开演示" : "Application footer · public example"}
        </p>
      </AgentTurn>
      <AgentTurn
        blocks={[
          {
            key: "plain",
            type: "text",
            text: localized
              ? "默认文本保留 <标签>，不会执行 HTML。"
              : "Default text preserves <tags> without executing HTML.",
          },
        ]}
        stopped
        error={localized ? "示例错误信息" : "Example error notice"}
        labels={labels}
      />
      {sent.map(({ id, text }) => (
        <AgentUserMessage key={id} text={text} data-origin="demo-submit" />
      ))}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setDisabled(!disabled)}
          data-action="toggle-disabled"
        >
          {disabled ? "Enable input" : "Disable input"}
        </Button>
        <Button variant="outline" size="sm" onClick={() => setIntercept(!intercept)} data-action="intercept">
          {intercept ? "Release Enter" : "Intercept Enter"}
        </Button>
      </div>
      <div id={localized ? "composer-zh" : "composer"}>
        <AgentComposer
          value={value}
          onValueChange={setValue}
          canSend={value.trim().length > 0}
          placeholder={localized ? "输入消息…" : "Write a message…"}
          inputLabel={localized ? "消息" : "Message"}
          submitLabel={localized ? "发送" : "Send"}
          stopLabel={localized ? "停止" : "Stop"}
          disabled={disabled}
          maxLength={2000}
          files={files}
          labels={labels}
          onSubmit={(text) => {
            setSent((current) => [...current, { id: crypto.randomUUID(), text }]);
            record(`submit:${text}`);
            setValue("");
          }}
          onStop={() => {
            setStops((current) => current + 1);
            record("stop");
          }}
          onFiles={(selected) => {
            setFiles((current) => [
              ...current,
              ...selected.map((file) => ({
                id: crypto.randomUUID(),
                name: file.name,
                mimeType: file.type,
                size: file.size,
              })),
            ]);
            record(`files:${selected.map((file) => file.name).join(",")}`);
          }}
          onRemoveFile={(id) => {
            setFiles((current) => current.filter((file) => file.id !== id));
            record("remove");
          }}
          onKeyDown={(event) => {
            if (intercept && event.key === "Enter") {
              event.preventDefault();
              record("intercept");
            }
          }}
          textareaProps={{ "aria-describedby": localized ? "composer-help-zh" : "composer-help" }}
          controls={<Badge variant="secondary">{localized ? "本地" : "Local"}</Badge>}
          notice={
            <p className="text-xs text-muted-foreground">
              {localized ? "演示只保存在当前页面。" : "This demo stores changes in this page only."}
            </p>
          }
          footer={
            <p
              id={localized ? "composer-help-zh" : "composer-help"}
              className="text-xs text-muted-foreground"
            >
              {localized ? "Enter 发送 · Shift+Enter 换行" : "Enter to send · Shift+Enter for a new line"}
            </p>
          }
        />
      </div>
      <output
        data-events={JSON.stringify(events)}
        data-stops={stops}
        className="block text-xs text-muted-foreground"
        aria-live="polite"
      >
        {localized ? "已发送" : "Sent"}: {sent.length} · Stop: {stops} · {files.length}{" "}
        {localized ? "个附件" : "files"}
      </output>
    </section>
  );
}

function App() {
  const [dark, setDark] = useState(false);

  return (
    <main className="mx-auto max-w-6xl space-y-8 p-4 sm:p-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Shared Agent UI</p>
          <h1 className="text-2xl font-semibold">One UI. Application-owned data.</h1>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            document.documentElement.classList.toggle("dark", !dark);
            setDark(!dark);
          }}
          aria-label="Toggle theme"
        >
          {dark ? "Light theme" : "Dark theme"}
        </Button>
      </header>
      <div className="grid min-w-0 gap-6 lg:grid-cols-2">
        <Consumer localized={false} />
        <Consumer localized />
      </div>
    </main>
  );
}

const root = document.getElementById("root");

if (!root) throw new Error("The demo root is missing.");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
