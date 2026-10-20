"use client";

import {
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type KeyboardEventHandler,
  type ReactNode,
  type Ref,
} from "react";
import { LoaderCircleIcon, PaperclipIcon, SendIcon, SquareIcon } from "lucide-react";
import { Input } from "../ui/input";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupTextarea } from "../ui/input-group";
import { AgentFiles } from "./files";
import { defaultAgentLabels, type AgentFile, type AgentLabels } from "./types";

const emptyFiles: AgentFile[] = [];

export type AgentComposerProps = {
  ref?: Ref<AgentComposerHandle>;
  value: string;
  onValueChange: (value: string) => void;
  onSubmit: (value: string) => void;
  canSend: boolean;
  placeholder: string;
  inputLabel?: string;
  submitLabel?: string;
  onStop?: () => void;
  stopLabel?: string;
  stopDisabled?: boolean;
  disabled?: boolean;
  filesDisabled?: boolean;
  attachLabel?: string;
  removeFileLabel?: (name: string) => string;
  submitting?: boolean;
  stopping?: boolean;
  files?: AgentFile[];
  onFiles?: (files: File[]) => void;
  onRemoveFile?: (id: string) => void;
  accept?: string;
  maxLength?: number;
  autoFocus?: boolean;
  controls?: ReactNode;
  notice?: ReactNode;
  footer?: ReactNode;
  menu?: ReactNode;
  labels?: Partial<AgentLabels>;
  onKeyDown?: KeyboardEventHandler<HTMLTextAreaElement>;
  textareaProps?: Omit<
    ComponentPropsWithoutRef<"textarea">,
    "value" | "defaultValue" | "onChange" | "onKeyDown" | "disabled" | "placeholder" | "maxLength"
  >;
};

export type AgentComposerHandle = { focus: () => void; openFilePicker: () => void };

export function AgentComposer({
  ref,
  value,
  onValueChange,
  onSubmit,
  canSend,
  placeholder,
  inputLabel = "Message",
  submitLabel = "Send",
  onStop,
  stopLabel = "Stop",
  stopDisabled = false,
  disabled = false,
  filesDisabled = false,
  submitting = false,
  stopping = false,
  files = emptyFiles,
  onFiles,
  onRemoveFile,
  accept,
  maxLength,
  autoFocus,
  controls,
  notice,
  footer,
  menu,
  labels,
  attachLabel,
  removeFileLabel,
  onKeyDown,
  textareaProps,
}: AgentComposerProps) {
  const textarea = useRef<HTMLTextAreaElement>(null);
  const picker = useRef<HTMLInputElement>(null);
  const composing = useRef(false);
  const dragDepth = useRef(0);
  const [dragging, setDragging] = useState(false);
  const l = { ...defaultAgentLabels, ...labels };
  const noticeId = useId();
  const attachmentDisabled = disabled || filesDisabled;
  useImperativeHandle(
    ref,
    () => ({
      focus: () => textarea.current?.focus(),
      openFilePicker: () => {
        if (!attachmentDisabled) picker.current?.click();
      },
    }),
    [attachmentDisabled],
  );

  useLayoutEffect(() => {
    const input = textarea.current;

    if (!input) return;
    input.style.height = "0px";
    input.style.height = `${input.scrollHeight}px`;
  });

  return (
    <form
      className="flex min-w-0 flex-col gap-2"
      onSubmit={(event) => {
        event.preventDefault();

        if (canSend) onSubmit(value);
      }}
      onDragEnter={(event) => {
        if (attachmentDisabled || !onFiles || !event.dataTransfer.types.includes("Files")) return;
        event.preventDefault();
        dragDepth.current += 1;
        setDragging(true);
      }}
      onDragOver={(event) => {
        if (attachmentDisabled || !onFiles || !event.dataTransfer.types.includes("Files")) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
      }}
      onDragLeave={() => {
        dragDepth.current = Math.max(0, dragDepth.current - 1);

        if (dragDepth.current === 0) setDragging(false);
      }}
      onDrop={(event) => {
        dragDepth.current = 0;
        setDragging(false);

        if (attachmentDisabled || !onFiles || event.dataTransfer.files.length === 0) return;
        event.preventDefault();
        onFiles(Array.from(event.dataTransfer.files));
      }}
    >
      {notice && <div id={noticeId}>{notice}</div>}
      {menu}
      {/* A disabled Send button must not dim the input or an available Stop action. */}
      <InputGroup className={`has-disabled:opacity-100 ${dragging ? "ring-1 ring-ring" : ""}`}>
        {files.length > 0 && (
          <InputGroupAddon align="block-start">
            <AgentFiles
              className="max-h-40 w-full"
              files={files}
              labels={labels}
              removeFileLabel={removeFileLabel}
              onRemoveFile={disabled ? undefined : onRemoveFile}
            />
          </InputGroupAddon>
        )}
        <InputGroupTextarea
          {...textareaProps}
          ref={textarea}
          value={value}
          aria-label={textareaProps?.["aria-label"] ?? inputLabel}
          aria-describedby={
            [textareaProps?.["aria-describedby"], notice ? noticeId : undefined].filter(Boolean).join(" ") ||
            undefined
          }
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          autoFocus={autoFocus}
          rows={textareaProps?.rows ?? 1}
          className={`min-h-12 max-h-48 overflow-y-auto ${textareaProps?.className ?? ""}`}
          onChange={(event) => onValueChange(event.target.value)}
          onCompositionStart={(event) => {
            composing.current = true;
            textareaProps?.onCompositionStart?.(event);
          }}
          onCompositionEnd={(event) => {
            composing.current = false;
            textareaProps?.onCompositionEnd?.(event);
          }}
          onKeyDown={(event) => {
            onKeyDown?.(event);

            if (event.defaultPrevented) return;

            if (
              event.key !== "Enter" ||
              event.shiftKey ||
              composing.current ||
              event.nativeEvent.isComposing ||
              event.keyCode === 229
            )
              return;
            event.preventDefault();

            if (canSend) onSubmit(value);
          }}
          onPaste={(event) => {
            textareaProps?.onPaste?.(event);

            if (event.defaultPrevented) return;

            if (attachmentDisabled || !onFiles || event.clipboardData.files.length === 0) return;
            event.preventDefault();
            onFiles(Array.from(event.clipboardData.files));
          }}
        />
        <InputGroupAddon align="block-end" className="flex-wrap">
          <Input
            ref={picker}
            className="hidden"
            type="file"
            multiple
            accept={accept}
            disabled={attachmentDisabled}
            tabIndex={-1}
            aria-label={attachLabel ?? l.attachFiles}
            onChange={(event) => {
              const selected = Array.from(event.currentTarget.files ?? []);

              if (selected.length > 0) onFiles?.(selected);
              event.currentTarget.value = "";
            }}
          />
          {onFiles && (
            <InputGroupButton
              disabled={attachmentDisabled}
              aria-label={attachLabel ?? l.attachFiles}
              title={attachLabel ?? l.attachFiles}
              onClick={() => picker.current?.click()}
            >
              <PaperclipIcon />
            </InputGroupButton>
          )}
          {controls}
          <div className="ml-auto flex items-center gap-2">
            {onStop && (
              <InputGroupButton aria-label={stopLabel} disabled={stopDisabled} onClick={onStop}>
                {stopping ? (
                  <LoaderCircleIcon className="animate-spin motion-reduce:animate-none" />
                ) : (
                  <SquareIcon />
                )}
                {stopLabel}
              </InputGroupButton>
            )}
            <InputGroupButton type="submit" variant="default" aria-label={submitLabel} disabled={!canSend}>
              {submitting ? (
                <LoaderCircleIcon className="animate-spin motion-reduce:animate-none" />
              ) : (
                <SendIcon />
              )}
              {submitLabel}
            </InputGroupButton>
          </div>
        </InputGroupAddon>
      </InputGroup>
      {footer}
    </form>
  );
}
