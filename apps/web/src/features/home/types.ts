export type ViewId = "workbench" | "contexta-ai" | "favorites" | "settings";

export type Selected =
  | { kind: "view"; id: ViewId }
