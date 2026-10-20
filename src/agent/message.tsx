import type { ComponentProps, ReactNode } from "react";
import { Badge } from "../ui/badge";
import { Bubble, BubbleContent } from "../ui/bubble";
import { Message, MessageContent, MessageFooter, MessageHeader } from "../ui/message";
import { AgentFiles } from "./files";
import { AgentReasoning, AgentToolTrace } from "./trace";
import { defaultAgentLabels, type AgentFile, type AgentLabels, type AgentTurnBlock } from "./types";

export type AgentUserMessageProps = ComponentProps<"div"> & {
  text: string;
  files?: AgentFile[];
  badge?: ReactNode;
  queued?: boolean;
  labels?: Partial<AgentLabels>;
};

export function AgentUserMessage({ text, files, badge, queued, labels, ...props }: AgentUserMessageProps) {
  const l = { ...defaultAgentLabels, ...labels };

  return (
    <Message align="end" {...props}>
      <MessageContent>
        {badge && <MessageHeader>{badge}</MessageHeader>}
        {files && files.length > 0 && <AgentFiles files={files} labels={labels} />}
        {text && (
          <Bubble variant="secondary">
            <BubbleContent className="whitespace-pre-wrap">{text}</BubbleContent>
          </Bubble>
        )}
        {queued && (
          <MessageFooter>
            <Badge variant="outline">{l.queued}</Badge>
          </MessageFooter>
        )}
      </MessageContent>
    </Message>
  );
}

export type AgentTurnProps = ComponentProps<"div"> & {
  blocks: AgentTurnBlock[];
  live?: boolean;
  stopped?: boolean;
  error?: string;
  labels?: Partial<AgentLabels>;
  renderText?: (text: string, live: boolean) => ReactNode;
};

export function AgentTurn({
  blocks,
  live = false,
  stopped,
  error,
  labels,
  children,
  renderText,
  ...props
}: AgentTurnProps) {
  const l = { ...defaultAgentLabels, ...labels };

  return (
    <Message {...props}>
      <MessageContent>
        {blocks.map((block, index) => {
          const blockLive = live && index === blocks.length - 1;

          return block.type === "tools" ? (
            <AgentToolTrace key={block.key} tools={block.tools} labels={labels} />
          ) : block.type === "reasoning" ? (
            <AgentReasoning key={block.key} text={block.text} live={blockLive} labels={labels} />
          ) : (
            <Bubble key={block.key} variant="ghost">
              <BubbleContent>
                {renderText ? (
                  renderText(block.text, blockLive)
                ) : (
                  <div className="whitespace-pre-wrap">{block.text}</div>
                )}
              </BubbleContent>
            </Bubble>
          );
        })}
        {stopped && <MessageFooter>{l.stopped}</MessageFooter>}
        {error && (
          <MessageFooter role="alert" className="text-destructive">
            {error}
          </MessageFooter>
        )}
        {children}
      </MessageContent>
    </Message>
  );
}
