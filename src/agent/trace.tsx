"use client";

/* eslint-disable react/set-state-in-effect */

import { useEffect, useState, type ComponentProps } from "react";
import { CheckIcon, CircleAlertIcon, LoaderCircleIcon, WrenchIcon } from "lucide-react";
import {
  CodeBlock,
  CodeBlockActions,
  CodeBlockCopyButton,
  CodeBlockContent,
  CodeBlockHeader,
  CodeBlockTitle,
} from "../ui/code-block";
import {
  Trace,
  TraceCollapsible,
  TraceCollapsibleContent,
  TraceCollapsibleTrigger,
  TraceDescription,
  TraceIcon,
  TraceLine,
  TraceTitle,
} from "../ui/trace";
import { defaultAgentLabels, type AgentLabels, type AgentTool } from "./types";

export type AgentToolRowProps = ComponentProps<"div"> & {
  tool: AgentTool;
  labels?: Partial<AgentLabels>;
};

export function AgentToolRow({ tool, labels, ...props }: AgentToolRowProps) {
  const l = { ...defaultAgentLabels, ...labels };
  const [chosenOpen, setChosenOpen] = useState<boolean>();
  // Reopen a row when a late error arrives.
  // eslint-disable-next-line react/set-state-in-effect
  useEffect(() => {
    if (tool.status === "error") setChosenOpen(undefined);
  }, [tool.status]);

  if (tool.input === undefined && tool.output === undefined)
    return (
      <div data-tool={tool.id} data-tool-name={tool.name} {...props}>
        <TraceLine status={tool.status === "done" ? undefined : tool.status}>
          <TraceTitle>{tool.title}</TraceTitle>
          {tool.target && <TraceDescription>{tool.target}</TraceDescription>}
          {tool.duration && <TraceDescription>{tool.duration}</TraceDescription>}
          <span className="sr-only">{l[tool.status]}</span>
        </TraceLine>
        {tool.details}
      </div>
    );

  return (
    <div data-tool={tool.id} data-tool-name={tool.name} {...props}>
      <TraceCollapsible open={chosenOpen ?? tool.status === "error"} onOpenChange={setChosenOpen}>
        <TraceCollapsibleTrigger>
          <TraceLine status={tool.status === "done" ? undefined : tool.status}>
            <TraceIcon>{tool.icon ?? <WrenchIcon />}</TraceIcon>
            <TraceTitle>{tool.title}</TraceTitle>
            {tool.target && (
              <TraceDescription className="min-w-0 shrink truncate">{tool.target}</TraceDescription>
            )}
            {tool.duration && <TraceDescription>{tool.duration}</TraceDescription>}
            <TraceIcon>
              {tool.status === "running" ? (
                <LoaderCircleIcon className="animate-spin motion-reduce:animate-none" />
              ) : tool.status === "error" ? (
                <CircleAlertIcon />
              ) : (
                <CheckIcon />
              )}
            </TraceIcon>
            <span className="sr-only">{l[tool.status]}</span>
          </TraceLine>
        </TraceCollapsibleTrigger>
        <TraceCollapsibleContent className="space-y-2">
          {tool.input !== undefined && <ToolCode title={l.input} text={tool.input} copy={l.copy} />}
          {tool.output !== undefined && <ToolCode title={l.output} text={tool.output} copy={l.copy} />}
          {tool.details}
        </TraceCollapsibleContent>
      </TraceCollapsible>
    </div>
  );
}

function ToolCode({ title, text, copy }: { title: string; text: string; copy: string }) {
  return (
    <CodeBlock size="sm" className="max-h-60">
      <CodeBlockHeader>
        <CodeBlockTitle>{title}</CodeBlockTitle>
        <CodeBlockActions>
          <CodeBlockCopyButton value={text} aria-label={copy} />
        </CodeBlockActions>
      </CodeBlockHeader>
      <CodeBlockContent wrap>{text}</CodeBlockContent>
    </CodeBlock>
  );
}

export type AgentToolTraceProps = Omit<ComponentProps<"div">, "title"> & {
  tools: AgentTool[];
  labels?: Partial<AgentLabels>;
  title?: { active: string; done: string };
};

export function AgentToolTrace({ tools, labels, title, ...props }: AgentToolTraceProps) {
  const [chosenOpen, setChosenOpen] = useState<boolean>();
  const active = tools.some((tool) => tool.status !== "done");
  const running = tools.some((tool) => tool.status === "running");
  // Reopen a group while work is active or when a late error arrives.
  // eslint-disable-next-line react/set-state-in-effect
  useEffect(() => {
    if (active) setChosenOpen(undefined);
  }, [active]);
  const rows = tools.map((tool) => <AgentToolRow key={tool.id} tool={tool} labels={labels} />);

  return (
    <Trace {...props}>
      {title ? (
        <TraceCollapsible open={chosenOpen ?? active} onOpenChange={setChosenOpen}>
          <TraceCollapsibleTrigger>
            <TraceLine>
              <TraceTitle>{running ? title.active : title.done}</TraceTitle>
            </TraceLine>
          </TraceCollapsibleTrigger>
          <TraceCollapsibleContent className="space-y-2">{rows}</TraceCollapsibleContent>
        </TraceCollapsible>
      ) : (
        rows
      )}
    </Trace>
  );
}

export type AgentReasoningProps = ComponentProps<"div"> & {
  text: string;
  live?: boolean;
  labels?: Partial<AgentLabels>;
};

export function AgentReasoning({ text, live = false, labels, ...props }: AgentReasoningProps) {
  const [chosenOpen, setChosenOpen] = useState<boolean>();
  const l = { ...defaultAgentLabels, ...labels };

  return (
    <Trace {...props}>
      <TraceCollapsible open={chosenOpen ?? live} onOpenChange={setChosenOpen}>
        <TraceCollapsibleTrigger>
          <TraceLine status={live ? "running" : undefined}>
            <TraceTitle>{live ? l.thinking : l.reasoning}</TraceTitle>
          </TraceLine>
        </TraceCollapsibleTrigger>
        <TraceCollapsibleContent className="max-h-60 overflow-y-auto whitespace-pre-wrap">
          {text}
        </TraceCollapsibleContent>
      </TraceCollapsible>
    </Trace>
  );
}
