export type SlateEditorInlineAiConfig = {
  enabled: boolean;
  allowReadOnly?: boolean;
  pageId?: string;
  spaceId?: string;
};

export type InlineAiMode = "off" | "edit" | "readonly";

export function resolveInlineAiMode(params: {
  config?: SlateEditorInlineAiConfig;
  editorReadOnly: boolean;
}): InlineAiMode {
  if (!params.config?.enabled) return "off";
  if (!params.editorReadOnly) return "edit";
  return params.config.allowReadOnly ? "readonly" : "off";
}

export function truncateInlineAiSelectedText(
  input: string,
  maxLength = 200,
): { text: string; truncated: boolean } {
  const normalized = input.trim();
  if (!normalized) return { text: "", truncated: false };

  if (maxLength <= 0) {
    return {
      text: "",
      truncated: normalized.length > 0,
    };
  }

  if (normalized.length <= maxLength) {
    return { text: normalized, truncated: false };
  }

  return {
    text: `${normalized.slice(0, maxLength)}...`,
    truncated: true,
  };
}
