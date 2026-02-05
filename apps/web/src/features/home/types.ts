export type ViewId = "workbench" | "contexta-ai" | "settings";

export type Selected =
  | { kind: "view"; id: ViewId }
