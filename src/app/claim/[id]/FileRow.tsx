"use client";

import { useTransition } from "react";
import { Camera, FileText, File as FileIcon, Trash2 } from "lucide-react";
import { deleteFile } from "../actions";

const KIND_ICON = {
  photo: Camera,
  pdf: FileText,
  doc: FileIcon,
} as const;

export function FileRow({
  claimId,
  file,
}: {
  claimId: string;
  file: {
    id: string;
    kind: "photo" | "pdf" | "doc";
    original_name: string;
    uploaded_at: string;
    storage_path: string;
    url: string | null;
  };
}) {
  const [pending, startTransition] = useTransition();
  const Icon = KIND_ICON[file.kind] ?? FileIcon;

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 text-sm border-t border-ink/10 first:border-t-0">
      <Icon size={16} className="text-ledger shrink-0" />
      {file.url ? (
        <a
          href={file.url}
          target="_blank"
          rel="noreferrer"
          className="flex-1 truncate hover:underline"
        >
          {file.original_name}
        </a>
      ) : (
        <span className="flex-1 truncate text-ink/60">{file.original_name}</span>
      )}
      <span className="text-xs font-mono text-ink/50">
        {new Date(file.uploaded_at).toLocaleDateString()}
      </span>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!confirm(`Remove ${file.original_name} from the vault?`)) return;
          startTransition(() => {
            deleteFile(claimId, file.id, file.storage_path);
          });
        }}
        className="text-ink/40 hover:text-red-700 disabled:opacity-50"
        aria-label={`Delete ${file.original_name}`}
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
