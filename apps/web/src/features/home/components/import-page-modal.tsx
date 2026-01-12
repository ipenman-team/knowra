"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";

type ImportType = "markdown";

type ImportOption = {
  id: string;
  label: string;
  extensions: string;
  enabled: boolean;
  type: ImportType | null;
};

function OptionCard(props: {
  option: ImportOption;
  selected: boolean;
  onSelect?: () => void;
}) {
  const { option, selected, onSelect } = props;

  return (
    <button
      type="button"
      className={cn(
        "group flex w-full flex-col items-center gap-2 rounded-lg p-3 text-left",
        option.enabled ? "hover:bg-accent" : "opacity-40",
        selected && option.enabled ? "bg-accent" : "",
      )}
      disabled={!option.enabled}
      onClick={onSelect}
    >
      <div
        className={cn(
          "flex h-16 w-16 items-center justify-center rounded-xl border bg-background",
          selected && option.enabled ? "ring-2 ring-ring ring-offset-2 ring-offset-background" : "",
        )}
        aria-hidden
      />
      <div className="text-center">
        <div className="text-sm font-medium">{option.label}</div>
        <div className="mt-0.5 text-xs text-muted-foreground">{option.extensions}</div>
      </div>
    </button>
  );
}

export function ImportPageModal(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPickMarkdownFile: (file: File) => void;
}) {
  const [selected, setSelected] = useState<ImportType | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const options: ImportOption[] = useMemo(
    () =>
      [
        { id: "confluence", label: "Confluence", extensions: ".zip", enabled: false, type: null },
        {
          id: "markdown",
          label: "Markdown",
          extensions: ".markdown .md .mark .txt",
          enabled: true,
          type: "markdown",
        },
        { id: "markdown-zip", label: "Markdown Zip", extensions: ".zip", enabled: false, type: null },
        { id: "html-zip", label: "HTML Zip", extensions: ".zip", enabled: false, type: null },
        { id: "word", label: "Word", extensions: ".docx .doc", enabled: false, type: null },
        { id: "excel", label: "Excel", extensions: ".xlsx .csv", enabled: false, type: null },
        { id: "xmind", label: "Xmind", extensions: ".xmind .opml", enabled: false, type: null },
      ] satisfies ImportOption[],
    [],
  );

  useEffect(() => {
    if (!props.open) return;
    setSelected("markdown");
  }, [props.open]);

  return (
    <Modal
      open={props.open}
      title="导入页面"
      onOpenChange={props.onOpenChange}
      footer={null}
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {options.map((opt) => (
          <OptionCard
            key={opt.id}
            option={opt}
            selected={opt.type ? selected === opt.type : false}
            onSelect={
              opt.enabled && opt.type
                ? () => {
                    setSelected(opt.type);
                    if (opt.type === "markdown") {
                      fileInputRef.current?.click();
                    }
                  }
                : undefined
            }
          />
        ))}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="text/markdown,text/plain,.md,.markdown,.mark,.txt"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;

          props.onPickMarkdownFile(file);
          props.onOpenChange(false);
        }}
      />
    </Modal>
  );
}
