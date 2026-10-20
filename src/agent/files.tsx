import type { ComponentProps } from "react";
import { FileIcon, LoaderCircleIcon, XIcon } from "lucide-react";
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
} from "../ui/attachment";
import { defaultAgentLabels, type AgentFile, type AgentLabels } from "./types";

export type AgentFilesProps = ComponentProps<"div"> & {
  files: AgentFile[];
  onRemoveFile?: (id: string) => void;
  labels?: Partial<AgentLabels>;
  removeFileLabel?: (name: string) => string;
};

export function AgentFiles({ files, onRemoveFile, labels, removeFileLabel, ...props }: AgentFilesProps) {
  const l = { ...defaultAgentLabels, ...labels };

  return (
    <AttachmentGroup aria-label={l.files} {...props}>
      {files.map((file) => (
        <Attachment key={file.id} state={file.error ? "error" : file.uploading ? "uploading" : "done"}>
          <AttachmentMedia variant={file.previewUrl ? "image" : "icon"}>
            {file.previewUrl ? (
              <img src={file.previewUrl} alt="" />
            ) : file.uploading ? (
              <LoaderCircleIcon className="animate-spin motion-reduce:animate-none" />
            ) : (
              <FileIcon />
            )}
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>{file.name}</AttachmentTitle>
            <AttachmentDescription>
              {file.error ??
                (file.uploading
                  ? l.uploading
                  : file.size === undefined
                    ? file.mimeType
                    : `${file.size.toLocaleString()} B`)}
            </AttachmentDescription>
          </AttachmentContent>
          {file.href && <AttachmentTrigger render={<a href={file.href} />} aria-label={file.name} />}
          {onRemoveFile && (
            <AttachmentActions>
              <AttachmentAction
                type="button"
                aria-label={removeFileLabel?.(file.name) ?? `${l.removeFile}: ${file.name}`}
                onClick={() => onRemoveFile(file.id)}
              >
                <XIcon />
              </AttachmentAction>
            </AttachmentActions>
          )}
        </Attachment>
      ))}
    </AttachmentGroup>
  );
}
