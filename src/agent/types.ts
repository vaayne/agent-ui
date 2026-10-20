import type { ReactNode } from "react";

export type AgentTool = {
  id: string;
  name: string;
  title: string;
  target?: string;
  icon?: ReactNode;
  status: "running" | "done" | "error";
  input?: string;
  output?: string;
  details?: ReactNode;
  duration?: string;
};

export type AgentTurnBlock =
  | { key: string; type: "text"; text: string }
  | { key: string; type: "reasoning"; text: string }
  | { key: string; type: "tools"; tools: AgentTool[] };

export type AgentFile = {
  id: string;
  name: string;
  mimeType: string;
  size?: number;
  previewUrl?: string;
  href?: string;
  uploading?: boolean;
  error?: string;
};

export type AgentLabels = {
  input: string;
  output: string;
  running: string;
  done: string;
  error: string;
  reasoning: string;
  thinking: string;
  queued: string;
  stopped: string;
  files: string;
  uploading: string;
  removeFile: string;
  attachFiles: string;
  copy: string;
};

export const defaultAgentLabels: AgentLabels = {
  input: "Input",
  output: "Output",
  running: "Running",
  done: "Done",
  error: "Error",
  reasoning: "Reasoning",
  thinking: "Thinking",
  queued: "Queued",
  stopped: "Stopped",
  files: "Files",
  uploading: "Uploading",
  removeFile: "Remove file",
  attachFiles: "Attach files",
  copy: "Copy",
};
